"""harvest/common.py — shared helpers for the harvest pipeline.

Manifest handling, paths, and a polite rate limiter. Every fetched asset gets
one JSON line in manifest.jsonl; LICENCES.md is generated from that file and
never edited by hand (TEAM-CHARTER #7).
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, asdict, field
from pathlib import Path
from typing import Optional

HARVEST_DIR = Path(__file__).resolve().parent
RAW_DIR = HARVEST_DIR / "_raw"
IMAGES_DIR = HARVEST_DIR / "_images"
MANIFEST = HARVEST_DIR / "manifest.jsonl"

# The Lumbini bbox used everywhere (04-ARCHITECTURE §6, shared/geo.ts).
BBOX = {"west": 83.24, "south": 27.44, "east": 83.31, "north": 27.51}
CENTRE = {"lat": 27.469634, "lon": 83.275860}

# The twelve site ids, for CLIP classification and vantage assignment.
SITE_IDS = [
    "maya-devi-temple", "ashokan-pillar", "marker-stone", "puskarini", "vihara-remains",
    "myanmar-temple", "china-temple", "korean-temple", "gautami-nuns-temple", "world-peace-pagoda",
    "tilaurakot", "ramagrama",
]


@dataclass
class Asset:
    """One harvested file, as recorded in manifest.jsonl."""
    id: str
    source: str                     # 'wikimedia' | 'mapillary' | 'flickr' | 'ia' | ...
    url: str
    licence: str
    author: str = ""
    title: str = ""
    file: str = ""                  # local path once downloaded
    date_retrieved: str = ""
    lat: Optional[float] = None
    lon: Optional[float] = None
    heading_deg: Optional[float] = None
    captured_at: Optional[str] = None
    site_id: Optional[str] = None   # filled by 04_classify / 05_build_vantages
    extra: dict = field(default_factory=dict)


def ensure_dirs() -> None:
    RAW_DIR.mkdir(exist_ok=True)
    IMAGES_DIR.mkdir(exist_ok=True)


def load_manifest() -> list[dict]:
    if not MANIFEST.exists():
        return []
    with MANIFEST.open(encoding="utf-8") as fh:
        return [json.loads(line) for line in fh if line.strip()]


def append_manifest(assets: list[Asset]) -> None:
    """Append assets, skipping ids already present (idempotent re-runs)."""
    existing = {row["id"] for row in load_manifest()}
    with MANIFEST.open("a", encoding="utf-8") as fh:
        for a in assets:
            if a.id in existing:
                continue
            fh.write(json.dumps(asdict(a), ensure_ascii=False) + "\n")
            existing.add(a.id)


class RateLimiter:
    """A minimal courtesy delay. Getting IP-banned at hour 3 is a stupid loss."""

    def __init__(self, per_second: float = 2.0):
        self.min_interval = 1.0 / per_second
        self._last = 0.0

    def wait(self) -> None:
        dt = time.time() - self._last
        if dt < self.min_interval:
            time.sleep(self.min_interval - dt)
        self._last = time.time()
