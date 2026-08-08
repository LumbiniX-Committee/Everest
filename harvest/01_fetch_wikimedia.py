"""harvest/01_fetch_wikimedia.py — Wikimedia Commons harvest (keyless).

The single richest source of usable modern photographs of Lumbini, and it needs
no API key — so this script runs today. Geosearch catches uncategorised files;
the category crawls catch the rest.

    python harvest/01_fetch_wikimedia.py --dry-run     # list what would be fetched
    python harvest/01_fetch_wikimedia.py               # append to manifest.jsonl
    python harvest/01_fetch_wikimedia.py --download     # also pull image bytes

Stdlib only (urllib + json). Licence/author come from each file's extmetadata
and go straight into the manifest, so 06_export_licences.py can build LICENCES.md
without anyone touching it by hand.
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

from common import Asset, CENTRE, RateLimiter, append_manifest, ensure_dirs, IMAGES_DIR

API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "SaksiHarvest/0.1 (LumbiniX hackathon; contact: team@saksi.example)"
CATEGORIES = [
    "Category:Lumbini", "Category:Maya Devi Temple", "Category:Ashoka Pillar, Lumbini",
    "Category:World Peace Pagoda, Lumbini", "Category:Tilaurakot", "Category:Ramagrama",
]
GEO_RADIUS_M = 10000
LIMIT = 500


def _get(params: dict) -> dict:
    params = {**params, "format": "json"}
    url = f"{API}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _to_assets(pages: dict) -> list[Asset]:
    out: list[Asset] = []
    for page in pages.values():
        info = (page.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata", {}) or {}
        title = page.get("title", "")
        if not info.get("url"):
            continue
        out.append(
            Asset(
                id=f"wikimedia:{page.get('pageid', title)}",
                source="wikimedia",
                url=info["url"],
                licence=meta.get("LicenseShortName", {}).get("value", "unknown"),
                author=_strip_html(meta.get("Artist", {}).get("value", "")),
                title=title,
                date_retrieved=datetime.now(timezone.utc).isoformat(),
                lat=info.get("lat"),
                lon=info.get("lon"),
                extra={"credit": _strip_html(meta.get("Credit", {}).get("value", ""))},
            )
        )
    return out


def _strip_html(s: str) -> str:
    import re
    return re.sub(r"<[^>]+>", "", s or "").strip()


def geosearch(limiter: RateLimiter) -> list[Asset]:
    limiter.wait()
    data = _get({
        "action": "query", "generator": "geosearch",
        "ggscoord": f"{CENTRE['lat']}|{CENTRE['lon']}",
        "ggsradius": GEO_RADIUS_M, "ggslimit": LIMIT, "ggsnamespace": 6,
        "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": 2048,
    })
    return _to_assets(data.get("query", {}).get("pages", {}))


def category(cat: str, limiter: RateLimiter) -> list[Asset]:
    limiter.wait()
    data = _get({
        "action": "query", "generator": "categorymembers",
        "gcmtitle": cat, "gcmtype": "file", "gcmlimit": LIMIT,
        "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": 2048,
    })
    return _to_assets(data.get("query", {}).get("pages", {}))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="list, do not write manifest")
    ap.add_argument("--download", action="store_true", help="also download image bytes")
    args = ap.parse_args()

    ensure_dirs()
    limiter = RateLimiter(per_second=2.0)

    assets: dict[str, Asset] = {}
    try:
        for a in geosearch(limiter):
            assets[a.id] = a
        for cat in CATEGORIES:
            for a in category(cat, limiter):
                assets.setdefault(a.id, a)
    except Exception as exc:  # network is the norm to fail on at a venue
        print(f"error contacting Wikimedia: {exc}", file=sys.stderr)
        return 2

    found = list(assets.values())
    geotagged = sum(1 for a in found if a.lat is not None)
    print(f"found {len(found)} files ({geotagged} geotagged)")

    if args.dry_run:
        for a in found[:20]:
            print(f"  {a.licence:16} {a.title}")
        if len(found) > 20:
            print(f"  … and {len(found) - 20} more")
        return 0

    if args.download:
        _download(found, limiter)

    append_manifest(found)
    print(f"appended {len(found)} rows to manifest.jsonl")
    return 0


def _download(assets: list[Asset], limiter: RateLimiter) -> None:
    for a in assets:
        limiter.wait()
        ext = a.url.rsplit(".", 1)[-1][:4]
        dest = IMAGES_DIR / f"{a.id.replace(':', '_')}.{ext}"
        try:
            req = urllib.request.Request(a.url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=60) as resp, dest.open("wb") as fh:
                fh.write(resp.read())
            a.file = str(dest.relative_to(dest.parents[1]))
        except Exception as exc:
            print(f"  skip {a.id}: {exc}", file=sys.stderr)


if __name__ == "__main__":
    raise SystemExit(main())
