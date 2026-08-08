"""harvest/02_fetch_mapillary.py — Mapillary, which solves the vantage problem.

Each Mapillary image carries position AND compass_angle — and position plus
heading is exactly the definition of a vantage (03-WEB-HARVEST-PLAN §3). Cluster
these and the vantage set builds itself; "we didn't choose the vantages, the
visitors did" is a genuinely good pitch line.

Needs MAPILLARY_TOKEN (free). The FIRST thing to check is coverage — if Lumbini
is thin, that is itself a finding, and it becomes the line about contributing
imagery back (task 3.1). This script reports the count before anything else.

    MAPILLARY_TOKEN=... python harvest/02_fetch_mapillary.py --coverage
    MAPILLARY_TOKEN=... python harvest/02_fetch_mapillary.py

Stdlib only.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

from common import Asset, BBOX, RateLimiter, append_manifest, ensure_dirs

GRAPH = "https://graph.mapillary.com/images"
FIELDS = "id,thumb_2048_url,geometry,compass_angle,captured_at,camera_type"


def fetch(token: str, limit: int) -> list[dict]:
    bbox = f"{BBOX['west']},{BBOX['south']},{BBOX['east']},{BBOX['north']}"
    q = urllib.parse.urlencode({
        "access_token": token, "fields": FIELDS, "bbox": bbox, "limit": limit,
    })
    req = urllib.request.Request(f"{GRAPH}?{q}")
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8")).get("data", [])


def to_assets(rows: list[dict]) -> list[Asset]:
    out: list[Asset] = []
    for r in rows:
        coords = (r.get("geometry") or {}).get("coordinates") or [None, None]
        ms = r.get("captured_at")
        out.append(Asset(
            id=f"mapillary:{r['id']}",
            source="mapillary",
            url=r.get("thumb_2048_url", ""),
            licence="CC-BY-SA-4.0",
            author="Mapillary contributors",
            date_retrieved=datetime.now(timezone.utc).isoformat(),
            lon=coords[0], lat=coords[1],
            heading_deg=r.get("compass_angle"),
            captured_at=datetime.fromtimestamp(ms / 1000, timezone.utc).isoformat() if ms else None,
            extra={"camera_type": r.get("camera_type")},
        ))
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--coverage", action="store_true", help="report count only")
    ap.add_argument("--limit", type=int, default=2000)
    args = ap.parse_args()

    token = os.environ.get("MAPILLARY_TOKEN")
    if not token:
        print("MAPILLARY_TOKEN not set — get a free token at mapillary.com/dashboard/developers", file=sys.stderr)
        return 2

    ensure_dirs()
    RateLimiter(per_second=2.0).wait()
    try:
        rows = fetch(token, args.limit)
    except Exception as exc:
        print(f"error contacting Mapillary: {exc}", file=sys.stderr)
        return 2

    with_heading = sum(1 for r in rows if r.get("compass_angle") is not None)
    print(f"Mapillary coverage in Lumbini bbox: {len(rows)} images, {with_heading} with heading")
    if len(rows) < 50:
        print("  COVERAGE IS THIN — say so on stage; it becomes the 'contribute imagery back' line (task 3.1).")

    if args.coverage:
        return 0

    assets = to_assets(rows)
    append_manifest(assets)
    print(f"appended {len(assets)} rows to manifest.jsonl — feed 05_build_vantages.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
