"""Builds the visitor essentials from Overture Maps Places.

    pip install duckdb
    python3 tools/data/build_overture.py            fetch Nepal, select, write
    python3 tools/data/build_overture.py --cached   reuse the last fetch

What this keeps, and why:
- Only essentials a visitor needs: somewhere to stay, eat, get help, get money,
  book travel, or catch transport. Attractions are left to the curated sites and
  the OSM/Wikidata listings, so nothing is listed twice.
- Only confident records (Overture's own confidence >= MIN_CONFIDENCE), never
  ones marked permanently closed.
- For the four hubs, the most confident records per kind, up to a cap, so the
  app bundle stays small. Along each trek, every place to stay or eat within
  TREK_BUFFER_M of the trail, because that is where a trekker sleeps.
- Every record carries the dataset it came from and that dataset's licence.
  Overture Places is not OSM data and has no share-alike terms; Foursquare
  records are Apache-2.0 and need Foursquare's NOTICE line, which LICENCES.md
  and NOTICE carry.
- Nothing is filled in. No phone stays null. Overture has no opening hours, so
  none are invented.
"""
import json
import math
import re
import sys
from pathlib import Path

import duckdb

ROOT = Path(__file__).resolve().parents[2]
RELEASE = '2026-10-21.0'
CACHE = ROOT / 'harvest' / 'overture-cache' / f'nepal-places-{RELEASE[:10]}.parquet'
SOURCE = f"s3://overturemaps-us-west-2/release/{RELEASE}/theme=places/type=place/*"
MIN_CONFIDENCE = 0.8
TREK_BUFFER_M = 800

KINDS = {
    'stay': {'hotel', 'lodging', 'resort', 'private_lodging', 'bed_and_breakfast', 'hostel', 'guest_house', 'campground', 'inn'},
    'food': {'restaurant', 'cafe', 'coffee_shop', 'casual_eatery', 'bakery', 'fast_food_restaurant', 'vegetarian_restaurant'},
    'health': {'hospital', 'primary_care_or_general_clinic', 'pharmacy_and_drug_store', 'urgent_care_clinic'},
    'money': {'atm', 'bank_or_credit_union', 'currency_exchange'},
    'travel': {'travel_service', 'tour_operator', 'travel_agency'},
    'transport': {'airport', 'bus_station', 'taxi_or_ride_share_service'},
    'police': {'police_station'},
}
KIND_OF = {category: kind for kind, categories in KINDS.items() for category in categories}
HUB_CAPS = {'stay': 120, 'food': 120, 'health': 40, 'money': 40, 'travel': 40, 'transport': 15, 'police': 10}
HUBS = {
    'lumbini': (27.4, 83.0, 27.62, 83.36),
    'kathmandu': (27.55, 85.2, 27.82, 85.55),
    'pokhara': (28.13, 83.88, 28.32, 84.06),
    'chitwan': (27.45, 84.25, 27.66, 84.56),
}


def fetch():
    if CACHE.exists():
        return
    if '--cached' in sys.argv:
        raise SystemExit(f'no cache at {CACHE}; run without --cached')
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect()
    con.sql("INSTALL httpfs; LOAD httpfs; INSTALL spatial; LOAD spatial; SET s3_region='us-west-2';")
    con.sql(f"""copy (select id, ST_X(geometry) lon, ST_Y(geometry) lat, confidence, websites, phones,
        addresses, names, sources, operating_status, basic_category
        from read_parquet('{SOURCE}', hive_partitioning=1)
        where bbox.xmin between 80.0 and 88.25 and bbox.ymin between 26.3 and 30.5)
        to '{CACHE}' (format parquet)""")


def metres(lat1, lon1, lat2, lon2):
    r = 6371008.8
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def load_treks():
    text = (ROOT / 'data' / 'generated' / 'treks.ts').read_text()
    return json.loads(text[text.index('= ') + 2:text.rindex(';')])


def record(row, area):
    (oid, lon, lat, confidence, websites, phones, addresses, names, sources, category) = row
    # Overture lists itself on every record; the dataset that supplied the place is the other one.
    supplier = next((s for s in sources if s['dataset'] != 'Overture'), sources[0])
    name = (names or {}).get('primary') or ''
    address = addresses[0]['freeform'] if addresses and addresses[0].get('freeform') else None
    return {
        'id': f"ov-{oid}",
        'name': name.strip(),
        'kind': KIND_OF[category],
        'category': category,
        'coordinate': {'latitude': round(lat, 6), 'longitude': round(lon, 6)},
        # A blank string is a missing value, not a number: it would give a Call button that dials nothing.
        'phone': next((p.strip() for p in (phones or []) if p and re.search(r'\d{6,}', p)), None),
        'website': next((w.strip() for w in (websites or []) if w and w.strip().startswith('http')), None),
        'address': address,
        'confidence': round(confidence, 2),
        'area': area,
        'near': None,
        'source': supplier['dataset'],
        'license': supplier['license'],
    }


def main():
    fetch()
    con = duckdb.connect()
    categories = ','.join(f"'{c}'" for c in KIND_OF)
    rows = con.sql(f"""select id, lon, lat, confidence, websites, phones, addresses, names, sources, basic_category
        from '{CACHE}'
        where basic_category in ({categories})
          and confidence >= {MIN_CONFIDENCE}
          and coalesce(operating_status, 'open') <> 'permanently_closed'
          and names.primary is not null
        order by confidence desc, len(phones) desc""").fetchall()
    usable = [row for row in rows if re.search(r'[A-Za-zऀ-ॿ]', row[7]['primary'] or '')]
    # Overture files animal hospitals under hospital. A visitor needing help does not want a vet.
    usable = [row for row in usable if not (KIND_OF[row[9]] == 'health' and re.search(r'veterin|\bvet\b|animal|\bpets?\b', row[7]['primary'], re.I))]

    chosen = {}
    for hub, (s, w, n, e) in HUBS.items():
        taken = {kind: 0 for kind in KINDS}
        for row in usable:
            lat, lon = row[2], row[1]
            if not (s <= lat <= n and w <= lon <= e):
                continue
            kind = KIND_OF[row[9]]
            if taken[kind] >= HUB_CAPS[kind]:
                continue
            taken[kind] += 1
            chosen[row[0]] = record(row, hub)

    for trek in load_treks():
        line = [(lat, lon) for day in trek['days'] for lon, lat in day['line']][::3]
        stops = trek['stops']
        lats = [p[0] for p in line]
        lons = [p[1] for p in line]
        box = (min(lats) - 0.01, min(lons) - 0.01, max(lats) + 0.01, max(lons) + 0.01)
        for row in usable:
            kind = KIND_OF[row[9]]
            lat, lon = row[2], row[1]
            if kind not in ('stay', 'food', 'health') or row[0] in chosen:
                continue
            if not (box[0] <= lat <= box[2] and box[1] <= lon <= box[3]):
                continue
            if min(metres(lat, lon, p[0], p[1]) for p in line) > TREK_BUFFER_M:
                continue
            item = record(row, trek['id'])
            nearest = min(stops, key=lambda st: metres(lat, lon, st['coordinate']['latitude'], st['coordinate']['longitude']))
            if metres(lat, lon, nearest['coordinate']['latitude'], nearest['coordinate']['longitude']) <= 1500:
                item['near'] = nearest['id']
            chosen[row[0]] = item

    items = sorted(chosen.values(), key=lambda item: (item['area'], item['kind'], -item['confidence'], item['name']))
    seed = {
        '_about': 'Visitor essentials from Overture Maps Places. Generated by tools/data/build_overture.py; do not edit.',
        'release': RELEASE,
        'licences': 'Per record: CDLA-Permissive-2.0 (most), Apache-2.0 (Foursquare), CC0-1.0 (AllThePlaces).',
        'items': items,
    }
    (ROOT / 'seed' / 'essentials.json').write_text(json.dumps(seed, ensure_ascii=False, indent=1) + '\n')
    header = (
        '// Generated by tools/data/build_overture.py from Overture Maps Places '
        f'({RELEASE}). Do not edit.\n'
        '// Per-record licence: CDLA-Permissive-2.0, Apache-2.0 (Foursquare) or CC0-1.0.\n'
        "import type { Essential } from '../../types/essentials.ts';\n\n"
        'export const ESSENTIALS: readonly Essential[] = '
    )
    (ROOT / 'data' / 'generated' / 'essentials.ts').write_text(header + json.dumps(items, ensure_ascii=False) + ';\n')

    counts = {}
    for item in items:
        counts.setdefault(item['area'], {}).setdefault(item['kind'], 0)
        counts[item['area']][item['kind']] += 1
    licences = {}
    for item in items:
        licences[f"{item['source']} {item['license']}"] = licences.get(f"{item['source']} {item['license']}", 0) + 1
    print(f'{len(items)} essentials')
    for area, kinds in counts.items():
        print(f'  {area}: {kinds}')
    print('  licences:', licences)


if __name__ == '__main__':
    main()
