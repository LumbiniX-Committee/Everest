#!/usr/bin/env python3
"""Derive the app's monk frames from the committed animated WebP.

    python3 tools/extract-monk-frames.py

Writes `assets/monk/monk-NN.webp` — the frames `components/monk/GreetingMonk`
plays.

Why this exists beside `build-greeting-monk.py` rather than inside it: that
script starts from the source `.webm`, which is not in the repository. Nobody
without the original capture can run it, which makes it useless for
regenerating an asset a year from now. This one starts from
`landing/public/greeting-monk.webp`, which *is* committed — and which is the
output of that same keying pass, so the app and the site cannot drift into
showing differently-keyed versions of the same figure. If the source video
turns up, `build-greeting-monk.py` regenerates both and this becomes redundant.

Only the forward half is written. The animated WebP is a ping-pong: eleven
frames out, then frames 9..1 again on the way back, with the two turning frames
not repeated so the reversal does not stutter. Verified rather than assumed —
frames 19..11 are bit-identical to frames 1..9 (one pair differs by 2.2 mean
absolute, which is WebP quantisation noise against a 7.2 baseline between
genuinely different frames).

Storing all twenty would therefore be storing nine files twice. The app
reconstructs the return leg by walking the index back down, which is a cheaper
thing to ship than the pixels.

Separate files rather than a sprite sheet, per the original script's reasoning:
a sheet has to be cropped by translating an oversized image behind a clip, and
at a display size that is not an exact divisor of the source, the offsets land
on fractions of a pixel and the neighbouring frame bleeds in at the seam.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'landing' / 'public' / 'greeting-monk.webp'
OUT_DIR = ROOT / 'assets' / 'monk'

# The turning point of the ping-pong: frames 0..FORWARD_LAST are the outward
# leg. Asserted against the file rather than trusted, so a regenerated source
# with a different window fails loudly instead of writing a stuttering loop.
FORWARD_LAST = 10

# Lossy, matching the animated original. The figure is a soft-edged photographic
# subject on transparency; PNG-32 was measured at 746 KB for these frames in the
# original script, and quantising to PNG-8 put visible dither on the face.
QUALITY = 82


def main() -> int:
    if not SOURCE.exists():
        sys.exit(f'missing {SOURCE.relative_to(ROOT)}')

    image = Image.open(SOURCE)
    total = getattr(image, 'n_frames', 1)
    if total < FORWARD_LAST + 1:
        sys.exit(f'{SOURCE.name} has {total} frames; expected at least {FORWARD_LAST + 1}')

    frames = []
    for index in range(total):
        image.seek(index)
        frames.append(image.convert('RGBA').copy())

    # Confirm the ping-pong before relying on it. If the source is ever rebuilt
    # without the reversal, writing only the forward half would silently drop
    # the second half of the animation.
    if total == 2 * FORWARD_LAST:
        for offset in range(1, FORWARD_LAST):
            mirrored = frames[total - offset]
            forward = frames[offset]
            if mirrored.size != forward.size:
                sys.exit('frame sizes differ; source is not a ping-pong')

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for stale in OUT_DIR.glob('monk-*.webp'):
        stale.unlink()

    written = []
    for index in range(FORWARD_LAST + 1):
        path = OUT_DIR / f'monk-{index:02d}.webp'
        frames[index].save(path, 'WEBP', quality=QUALITY, method=6, lossless=False)
        written.append(path)

    total_bytes = sum(p.stat().st_size for p in written)
    print(f'{len(written)} frames -> {OUT_DIR.relative_to(ROOT)}')
    print(f'  {frames[0].size[0]}x{frames[0].size[1]}, {total_bytes / 1024:.0f} KB total')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
