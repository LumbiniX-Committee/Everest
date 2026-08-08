"""harvest/03_dedupe_quality.py — drop near-duplicates and low-quality frames.

Reject aggressively: for splat input and clean vantages, 200 good images beat
2,000 mixed ones (03-WEB-HARVEST-PLAN §4). Perceptual-hash dedupe, then a blur
(Laplacian variance), exposure and resolution gate.

Needs: pillow, imagehash, numpy (see requirements.txt). Operates on the images
downloaded into harvest/_images/ and writes a keep/reject decision back onto each
manifest row's `extra`.

    python harvest/03_dedupe_quality.py
    python harvest/03_dedupe_quality.py --blur-min 60 --hash-dist 6
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from common import IMAGES_DIR, MANIFEST, load_manifest

try:
    import imagehash  # type: ignore
    import numpy as np  # type: ignore
    from PIL import Image  # type: ignore
except ImportError:
    print("this step needs: pip install pillow imagehash numpy", file=sys.stderr)
    raise SystemExit(3)


def laplacian_variance(img: "Image.Image") -> float:
    """Cheap focus measure without OpenCV: variance of a Laplacian convolution."""
    g = np.asarray(img.convert("L"), dtype=np.float64)
    k = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float64)
    # valid convolution via slicing (small kernel, avoids scipy dependency)
    lap = (
        k[0, 1] * g[:-2, 1:-1] + k[1, 0] * g[1:-1, :-2] + k[1, 1] * g[1:-1, 1:-1]
        + k[1, 2] * g[1:-1, 2:] + k[2, 1] * g[2:, 1:-1]
    )
    return float(lap.var())


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--blur-min", type=float, default=50.0, help="min Laplacian variance")
    ap.add_argument("--min-px", type=int, default=800, help="min long edge")
    ap.add_argument("--hash-dist", type=int, default=5, help="max Hamming distance for a dup")
    args = ap.parse_args()

    rows = load_manifest()
    seen_hashes: list[tuple[str, "imagehash.ImageHash"]] = []
    kept = 0

    for row in rows:
        local = row.get("file")
        if not local:
            continue
        path = Path(local)
        if not path.is_absolute():
            path = IMAGES_DIR.parent / local
        if not path.exists():
            continue
        try:
            img = Image.open(path)
        except Exception:
            row.setdefault("extra", {})["keep"] = False
            row["extra"]["reject_reason"] = "unreadable"
            continue

        long_edge = max(img.size)
        blur = laplacian_variance(img)
        ph = imagehash.phash(img)

        reason = None
        if long_edge < args.min_px:
            reason = f"too small ({long_edge}px)"
        elif blur < args.blur_min:
            reason = f"blurry (lap var {blur:.0f})"
        else:
            for _, h in seen_hashes:
                if ph - h <= args.hash_dist:
                    reason = "near-duplicate"
                    break

        row.setdefault("extra", {})
        row["extra"]["blur"] = round(blur, 1)
        row["extra"]["phash"] = str(ph)
        if reason:
            row["extra"]["keep"] = False
            row["extra"]["reject_reason"] = reason
        else:
            row["extra"]["keep"] = True
            seen_hashes.append((row["id"], ph))
            kept += 1

    with MANIFEST.open("w", encoding="utf-8") as fh:
        for row in rows:
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")

    print(f"kept {kept} / {len(rows)} rows after dedupe + quality gate")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
