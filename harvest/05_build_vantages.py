"""harvest/05_build_vantages.py — the vantage set builds itself.

Cluster kept, classified, geotagged images by position (geohash, ~10 m cells)
and heading (15 degree bins). Any cell+bin with several images from different
dates is a naturally recurring vantage — a spot people actually stand and a
direction they actually face (03-WEB-HARVEST-PLAN §3).

Writes seed/vantages.candidates.json — a separate file, so the hand-authored
seed/vantages.json is never clobbered. A human picks the top clusters and the
reference frame, then promotes them.

Stdlib only.

    python harvest/05_build_vantages.py --min-cluster 2
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path

from common import HARVEST_DIR, load_manifest

SEED_DIR = HARVEST_DIR.parent / "seed"
GEOHASH_B32 = "0123456789bcdefghjkmnpqrstuvwxyz"


def geohash(lat: float, lon: float, precision: int = 8) -> str:
    lat_min, lat_max, lon_min, lon_max = -90.0, 90.0, -180.0, 180.0
    h, bit, ch, even = [], 0, 0, True
    while len(h) < precision:
        if even:
            mid = (lon_min + lon_max) / 2
            if lon >= mid:
                ch = (ch << 1) | 1; lon_min = mid
            else:
                ch = ch << 1; lon_max = mid
        else:
            mid = (lat_min + lat_max) / 2
            if lat >= mid:
                ch = (ch << 1) | 1; lat_min = mid
            else:
                ch = ch << 1; lat_max = mid
        even = not even
        bit += 1
        if bit == 5:
            h.append(GEOHASH_B32[ch]); bit = 0; ch = 0
    return "".join(h)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--min-cluster", type=int, default=2)
    ap.add_argument("--precision", type=int, default=8, help="geohash precision (~19 m at 8)")
    args = ap.parse_args()

    rows = load_manifest()
    clusters: dict[tuple[str, int, str], list[dict]] = defaultdict(list)
    for row in rows:
        if row.get("extra", {}).get("keep") is False:
            continue
        lat, lon, hd, site = row.get("lat"), row.get("lon"), row.get("heading_deg"), row.get("site_id")
        if lat is None or lon is None or hd is None or not site:
            continue
        key = (geohash(lat, lon, args.precision), int(hd // 15), site)
        clusters[key].append(row)

    candidates = []
    for (gh, hbin, site), members in clusters.items():
        if len(members) < args.min_cluster:
            continue
        lat = sum(m["lat"] for m in members) / len(members)
        lon = sum(m["lon"] for m in members) / len(members)
        heading = sum(m["heading_deg"] for m in members) / len(members)
        sharpest = max(members, key=lambda m: m.get("extra", {}).get("blur", 0))
        dates = {m.get("captured_at", "")[:10] for m in members if m.get("captured_at")}
        candidates.append({
            "id": f"{site}.auto-{gh}-{hbin}",
            "site_id": site,
            "label": {"en": f"Recurring view ({len(members)} images, {len(dates)} dates)", "ne": ""},
            "coords": {"lat": round(lat, 6), "lon": round(lon, 6)},
            "heading_deg": round(heading, 1),
            "pitch_deg": 0, "hfov_deg": 65, "tol_pos_m": 8, "tol_heading_deg": 12,
            "reference_url": sharpest.get("url"),
            "reference_year": None,
            "reference_src": sharpest.get("id"),
            "reference_lic": sharpest.get("licence"),
            "cluster_n": len(members),
            "distinct_dates": len(dates),
            "active": True,
            "ne_review": "pending",
        })

    candidates.sort(key=lambda c: (c["cluster_n"], c["distinct_dates"]), reverse=True)
    out = SEED_DIR / "vantages.candidates.json"
    out.write_text(json.dumps(candidates, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(candidates)} candidate vantages to {out.name} — human picks the top clusters")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
