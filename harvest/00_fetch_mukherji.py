"""harvest/00_fetch_mukherji.py — the 1899 plates.

Mukherji 1901 (ASI Imperial Series XXVI/1) carries 32 public-domain plates —
the sketch plan of the Sacred Garden, "Lumbini ruins viewed from the South,
1899," and Greater Lumbini coverage (Tilaurakot, Niglihawa, Sagarhawa). This is
the "then" half of every then/now pair (03-WEB-HARVEST-PLAN §1).

This script fetches the Internet Archive item metadata for both scans and writes
a plate catalogue stub. The actual plate extraction needs poppler locally:

    pdfimages -all <downloaded>.pdf harvest/_raw/mukherji-plate

    NO generative restoration or upscaling — an AI-hallucinated 1899 photograph
    is exactly the failure mode this whole project is designed against
    (03 §1 step 3, Charter #6). Deskew, crop, gentle denoise only.

    python harvest/00_fetch_mukherji.py            # fetch IA metadata, list files
    python harvest/00_fetch_mukherji.py --download  # download the PDFs to _raw/
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.request
from datetime import datetime, timezone

from common import Asset, RateLimiter, RAW_DIR, append_manifest, ensure_dirs

IDENTIFIERS = ["bub_gb_5iYXAAAAYAAJ", "in.ernet.dli.2015.115950"]
USER_AGENT = "SaksiHarvest/0.1 (LumbiniX hackathon)"

CITATION = (
    "P.C. Mukherji, A Report on a Tour of Exploration of the Antiquities in the "
    "Tarai, Nepal, the Region of Kapilavastu; During February and March 1899. "
    "ASI Imperial Series No. XXVI, Part I. Calcutta, 1901. 32 plates."
)


def ia_metadata(identifier: str) -> dict:
    url = f"https://archive.org/metadata/{identifier}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--download", action="store_true")
    args = ap.parse_args()
    ensure_dirs()
    limiter = RateLimiter(per_second=1.0)

    assets: list[Asset] = []
    for ident in IDENTIFIERS:
        limiter.wait()
        try:
            meta = ia_metadata(ident)
        except Exception as exc:
            print(f"error fetching {ident}: {exc}", file=sys.stderr)
            continue
        files = meta.get("files", [])
        pdfs = [f for f in files if f.get("name", "").lower().endswith((".pdf", ".djvu"))]
        print(f"{ident}: {len(files)} files, {len(pdfs)} pdf/djvu")
        for f in pdfs:
            fileurl = f"https://archive.org/download/{ident}/{f['name']}"
            assets.append(Asset(
                id=f"ia:{ident}:{f['name']}",
                source="ia",
                url=fileurl,
                licence="Public Domain",
                author="P. C. Mukherji (ASI, 1901)",
                title=f["name"],
                date_retrieved=datetime.now(timezone.utc).isoformat(),
                extra={"citation": CITATION},
            ))
            if args.download:
                dest = RAW_DIR / f"{ident}__{f['name']}"
                limiter.wait()
                print(f"  downloading {f['name']} …")
                try:
                    req = urllib.request.Request(fileurl, headers={"User-Agent": USER_AGENT})
                    with urllib.request.urlopen(req, timeout=300) as resp, dest.open("wb") as fh:
                        fh.write(resp.read())
                    assets[-1].file = str(dest)
                except Exception as exc:
                    print(f"  skip: {exc}", file=sys.stderr)

    append_manifest(assets)
    print(f"appended {len(assets)} source rows. Next: pdfimages -all to extract plates.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
