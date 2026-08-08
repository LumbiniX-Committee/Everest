"""harvest/04_classify.py — CLIP zero-shot: which monument is this?

A "Lumbini" search returns the World Peace Pagoda, the Myanmar temple, random
monasteries, hotel lobbies and holiday portraits. CLIP zero-shot against the 12
site names plus a "not a monument" class cleans this in minutes
(03-WEB-HARVEST-PLAN §4). Writes the predicted site_id onto each kept manifest
row.

Needs: open_clip_torch, torch, pillow (see requirements.txt). CPU is fine for a
few hundred images.

    python harvest/04_classify.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from common import IMAGES_DIR, MANIFEST, SITE_IDS, load_manifest

try:
    import open_clip  # type: ignore
    import torch  # type: ignore
    from PIL import Image  # type: ignore
except ImportError:
    print("this step needs: pip install open_clip_torch torch pillow", file=sys.stderr)
    raise SystemExit(3)

# Human-readable prompts per site id, plus the reject class.
PROMPTS: dict[str, str] = {
    "maya-devi-temple": "the white Maya Devi Temple building at Lumbini",
    "ashokan-pillar": "the Ashokan sandstone pillar at Lumbini",
    "marker-stone": "an ancient marker stone under glass inside a temple",
    "puskarini": "a rectangular sacred pond with brick steps",
    "vihara-remains": "excavated ancient brick monastery foundations",
    "myanmar-temple": "a gold and white Burmese pagoda",
    "china-temple": "a Chinese-style Buddhist temple with tiled roofs",
    "korean-temple": "a Korean Buddhist monastery building",
    "gautami-nuns-temple": "a white stupa modelled on Swayambhu",
    "world-peace-pagoda": "a large white domed peace pagoda",
    "tilaurakot": "ancient earthen ramparts and excavated ruins",
    "ramagrama": "a grassy ancient earthen stupa mound",
    "_not_monument": "a person, a hotel lobby, food, or an unrelated snapshot",
}


def main() -> int:
    model, _, preprocess = open_clip.create_model_and_transforms("ViT-B-32", pretrained="laion2b_s34b_b79k")
    tokenizer = open_clip.get_tokenizer("ViT-B-32")
    model.eval()

    labels = list(PROMPTS.keys())
    text = tokenizer([PROMPTS[k] for k in labels])
    with torch.no_grad():
        text_features = model.encode_text(text)
        text_features /= text_features.norm(dim=-1, keepdim=True)

    rows = load_manifest()
    classified = 0
    for row in rows:
        if row.get("extra", {}).get("keep") is False:
            continue
        local = row.get("file")
        if not local:
            continue
        path = Path(local)
        if not path.is_absolute():
            path = IMAGES_DIR.parent / local
        if not path.exists():
            continue
        try:
            image = preprocess(Image.open(path)).unsqueeze(0)
        except Exception:
            continue
        with torch.no_grad():
            feat = model.encode_image(image)
            feat /= feat.norm(dim=-1, keepdim=True)
            sims = (feat @ text_features.T).squeeze(0)
        best = int(sims.argmax())
        label = labels[best]
        row.setdefault("extra", {})["clip_label"] = label
        row["extra"]["clip_score"] = round(float(sims[best]), 3)
        if label != "_not_monument" and label in SITE_IDS:
            row["site_id"] = label
            classified += 1
        else:
            row["extra"]["keep"] = False
            row["extra"]["reject_reason"] = "not a monument"

    with MANIFEST.open("w", encoding="utf-8") as fh:
        for row in rows:
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")

    print(f"classified {classified} images to a site; rejected non-monuments")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
