#!/usr/bin/env python3
"""Turn the rendered monk clip into the landing page's greeting figure.

    python3 tools/build-greeting-monk.py <source.webm>

Writes `landing/public/greeting-monk.webp` (animated) and
`landing/public/greeting-monk-still.webp` (one frame, served to anyone who has
asked their system for reduced motion). Committing both means the site builds
without this script; committing the script means the assets are not a mystery
binary someone later has to reverse-engineer.

Three things about the source drive every decision here.

**It is opaque, not transparent.** The clip was background-removed and then
exported over black, so there is no alpha channel to read -- every pixel is
already premultiplied, `obs = fg * a`. Recovering the figure is therefore a
division rather than a guess, which is what removes the dark halo instead of
merely hiding it. The landing ground is cream (#f4f1e8); a halo that is
invisible against a dark editor preview is glaring there.

**A luma threshold cannot cut the matte.** The character's hair sits at luma
8..144 -- well inside any threshold wide enough to catch the antialiased rim.
So the matte comes from a flood fill seeded at the frame border: black that
reaches the outside is background, black that does not is hair. Only a 2px rim
gets fractional alpha.

**The motion does not loop.** It is a continuous drift; the closest matching
pair of frames in the whole clip still differs by ~17 (mean abs luma), so any
cut point visibly snaps. The fix is to ping-pong a window instead, which is
seamless by construction. `WINDOW` is the window whose first and last frames are
closest together, i.e. the one stretch of the clip that is a cyclic sway rather
than part of the drift -- so playing it backwards reads as breathing rather than
as rewinding.
"""

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / 'landing' / 'public'

# --- matte ---
BG_LUMA = 6.0     # the background is exactly 0; leave room for codec ringing
RIM = 2           # width of the fractional-alpha band, px
MIN_REF = 12.0    # too dark to divide by; keep those edges hard instead
PAD = 6           # transparent margin around the union bounding box, px

# --- animation ---
WINDOW = (82, 112)  # cyclic sway; see the module docstring
STEP = 3            # 30fps source -> 10fps, which a slow sway carries fine
HEIGHT = 560        # ~2x the largest size the page displays
QUALITY = 70
STILL = 97          # a frame with the head level, for the reduced-motion still

LUMA = np.array([0.299, 0.587, 0.114], dtype=np.float32)


def key_frame(rgb: np.ndarray) -> np.ndarray:
    """RGB uint8 (H,W,3) composited over black -> straight-alpha RGBA uint8."""
    obs = rgb.astype(np.float32)
    luma = obs @ LUMA

    # Black that reaches the border is background. Black that does not is hair.
    dark = luma <= BG_LUMA
    labels, count = ndimage.label(dark)
    if count:
        edges = np.concatenate([labels[0, :], labels[-1, :], labels[:, 0], labels[:, -1]])
        touching = np.unique(edges)
        background = np.isin(labels, touching[touching > 0])
    else:
        background = np.zeros_like(dark)

    foreground = ~background
    alpha = foreground.astype(np.float32)

    # Antialiasing lives within RIM px of the background; deeper than that is solid.
    rim = ndimage.binary_dilation(background, iterations=RIM) & foreground
    interior = foreground & ~rim
    if rim.any() and interior.any():
        # Measure each rim pixel against the colour it is fading *from*, not
        # against a constant — the rim around dark hair and the rim around a
        # lit orange robe are nowhere near the same brightness.
        _, index = ndimage.distance_transform_edt(~interior, return_indices=True)
        reference = luma[index[0][rim], index[1][rim]]
        alpha[rim] = np.where(
            reference >= MIN_REF,
            np.clip(luma[rim] / np.maximum(reference, 1e-6), 0.0, 1.0),
            1.0,
        )

    # Un-premultiply. Compositing over black *was* the premultiply.
    a3 = alpha[..., None]
    straight = np.where(a3 > 0.004, obs / np.maximum(a3, 1e-6), 0.0)

    out = np.empty(rgb.shape[:2] + (4,), dtype=np.uint8)
    out[..., :3] = np.clip(straight + 0.5, 0, 255).astype(np.uint8)
    out[..., 3] = np.clip(alpha * 255.0 + 0.5, 0, 255).astype(np.uint8)
    return out


def main(source: Path) -> None:
    for tool in ('ffmpeg',):
        if shutil.which(tool) is None:
            sys.exit(f'{tool} is required and was not found on PATH')

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        raw, cut = tmp / 'raw', tmp / 'cut'
        raw.mkdir()
        cut.mkdir()

        subprocess.run(
            ['ffmpeg', '-y', '-v', 'error', '-i', str(source), '-an', str(raw / '%04d.png')],
            check=True,
        )
        sources = sorted(raw.glob('*.png'))
        if not sources:
            sys.exit(f'no frames decoded from {source}')

        keyed = [key_frame(np.asarray(Image.open(f).convert('RGB'))) for f in sources]

        # One bounding box for every frame, so the figure does not jitter
        # against its own crop as the robe swings.
        covered = np.zeros(keyed[0].shape[:2], dtype=bool)
        for frame in keyed:
            covered |= frame[..., 3] > 2
        rows, cols = np.where(covered)
        box = (cols.min() - PAD, rows.min() - PAD, cols.max() + 1 + PAD, rows.max() + 1 + PAD)

        def prepare(frame: np.ndarray) -> Image.Image:
            image = Image.fromarray(frame, 'RGBA').crop(box)
            width = round(image.width * HEIGHT / image.height)
            return image.resize((width, HEIGHT), Image.LANCZOS)

        first, last = WINDOW
        window = [prepare(frame) for frame in keyed[first:last + 1:STEP]]
        # Ping-pong. The two turning frames are not repeated, so the reversal
        # does not read as a pause at each end.
        loop = window + window[-2:0:-1]
        for i, image in enumerate(loop):
            image.save(cut / f'{i:04d}.png')

        OUT_DIR.mkdir(parents=True, exist_ok=True)
        animated = OUT_DIR / 'greeting-monk.webp'
        subprocess.run(
            [
                'ffmpeg', '-y', '-v', 'error',
                '-framerate', f'{30 / STEP:.6f}',
                '-i', str(cut / '%04d.png'),
                '-c:v', 'libwebp_anim', '-lossless', '0',
                '-q:v', str(QUALITY), '-compression_level', '6',
                '-preset', 'drawing', '-loop', '0',
                str(animated),
            ],
            check=True,
        )
        prepare(keyed[STILL]).save(
            OUT_DIR / 'greeting-monk-still.webp', 'WEBP', quality=QUALITY, method=6
        )

        size = loop[0].size
        print(f'frames    {len(loop)} ({len(loop) / (30 / STEP):.2f}s cycle at {30 / STEP:.0f}fps)')
        print(f'dimensions {size[0]}x{size[1]}')
        for path in (animated, OUT_DIR / 'greeting-monk-still.webp'):
            print(f'{path.relative_to(ROOT)}  {path.stat().st_size / 1024:.0f} KB')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__.strip().splitlines()[2].strip())
    main(Path(sys.argv[1]).expanduser())
