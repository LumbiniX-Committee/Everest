import os, subprocess, tempfile
from wordmark import build
from deva import shape as shape_deva

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "brand")
os.makedirs(OUT, exist_ok=True)

SAND, SAND_DEEP = "#B79B72", "#8E7657"
INK, CREAM, TILE, PARCH = "#252A27", "#F5F3EE", "#F3E4CB", "#DFCCA8"

# ---------------------------------------------------------------- the mark
# An eye (sākṣī — witness) whose iris doubles as an alignment reticle: the two
# things the app asks of you, look at the place and line the frame up with it.
def mark(eye, iris, pupil):
    p = [f'<path d="M 54 108 C 84 58 172 58 202 108 C 172 158 84 158 54 108 Z" '
         f'fill="none" stroke="{eye}" stroke-width="11" stroke-linejoin="round"/>',
         f'<circle cx="128" cy="108" r="30" fill="none" stroke="{iris}" stroke-width="11"/>',
         f'<circle cx="128" cy="108" r="12" fill="{pupil}"/>']
    for x1, y1, x2, y2 in [(128, 26, 128, 48), (128, 168, 128, 190),
                           (18, 108, 40, 108), (216, 108, 238, 108)]:
        p.append(f'<path d="M {x1} {y1} L {x2} {y2}" stroke="{eye}" '
                 f'stroke-width="11" stroke-linecap="round"/>')
    return "\n  ".join(p)

MARK_BOX = (18, 26, 238, 190)          # what the mark actually inks

# The stepped plinth every Newar temple stands on — the thing being witnessed.
PLINTH = ('M 0 256 L 0 236 L 36 236 L 36 218 L 74 218 L 74 200 L 182 200 '
          'L 182 218 L 220 218 L 220 236 L 256 236 L 256 256 Z')

def svg(w, h, body, vb=None):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb or f"0 0 {w} {h}"}" '
            f'width="{w}" height="{h}" role="img" aria-label="Sākṣī">\n  {body}\n</svg>\n')

def write(name, content):
    open(os.path.join(OUT, name), "w").write(content)
    return name

# ------------------------------------------------------------ the wordmark
d, adv, upem = build("600SemiBold", 30)
CAP = 1400.0                            # Anek Devanagari cap height

def wordmark(size, fill, x=0, baseline=0):
    s = size / CAP
    return (f'<g transform="translate({x} {baseline}) scale({s:.6f} {-s:.6f})" fill="{fill}">'
            f'<path d="{d}"/></g>'), adv * s

# ----------------------------------------------------------------- lockups
def lockup(ink, eye, iris, pupil):
    ms, gap, size = 92 / 256.0, 30, 60
    dy = 48 - (MARK_BOX[1] + MARK_BOX[3]) / 2 * ms      # mark's own centre on 48
    wm, ww = wordmark(size, ink, x=92 + gap, baseline=48 + size * 0.36)
    w = 92 + gap + ww
    body = f'<g transform="translate(0 {dy:.2f}) scale({ms:.6f})">{mark(eye, iris, pupil)}</g>\n  {wm}'
    return svg(round(w), 96, body, vb=f"0 0 {w:.0f} 96")

def stacked(ink, eye, iris, pupil):
    ms, size = 120 / 256.0, 54
    wm, ww = wordmark(size, ink, x=0, baseline=0)
    w = max(120, ww)
    body = (f'<g transform="translate({(w - 120) / 2:.2f} 0) scale({ms:.6f})">{mark(eye, iris, pupil)}</g>\n  '
            f'<g transform="translate({(w - ww) / 2:.2f} 0)">{wm}</g>')
    # mark inks y 12..89 at this scale; sit the baseline 44 below its foot
    body = body.replace('translate(0 0) scale', 'translate(0 0) scale')
    return svg(round(w), 150, body.replace('translate(%.2f 0)' % ((w - ww) / 2),
               'translate(%.2f 133)' % ((w - ww) / 2)), vb=f"0 4 {w:.0f} 146")

files = [
    write("sakshi-mark.svg",        svg(256, 256, mark(SAND_DEEP, SAND, SAND_DEEP))),
    write("sakshi-mark-dark.svg",   svg(256, 256, mark(SAND, CREAM, CREAM))),
    write("sakshi-mark-mono.svg",   svg(256, 256, mark("currentColor", "currentColor", "currentColor"))),
    write("sakshi-icon-tile.svg",   svg(256, 256,
          f'<rect width="256" height="256" rx="56" fill="{TILE}"/>\n  '
          f'<clipPath id="tile"><rect width="256" height="256" rx="56"/></clipPath>\n  '
          f'<path d="{PLINTH}" fill="{PARCH}" clip-path="url(#tile)"/>\n  '
          f'<g transform="translate(0 -4)">{mark(SAND_DEEP, SAND_DEEP, SAND_DEEP)}</g>')),
    write("sakshi-lockup.svg",      lockup(INK, SAND_DEEP, SAND, SAND_DEEP)),
    write("sakshi-lockup-dark.svg", lockup(CREAM, SAND, CREAM, CREAM)),
    write("sakshi-stacked.svg",     stacked(INK, SAND_DEEP, SAND, SAND_DEEP)),
]
wm, ww = wordmark(60, INK, baseline=60)
files.append(write("sakshi-wordmark.svg", svg(round(ww), 92, wm, vb=f"0 0 {ww:.0f} 92")))
for f in files:
    print(f)

# ------------------------------------------------------- Devanagari name
# साक्षी, shaped through HarfBuzz so the क्ष conjunct is the real ligature.
dd, dadv, dupem, dbb = shape_deva("साक्षी")

def devanagari(height, fill, x=0, top=0):
    """Place the shaped name so its ink box is `height` tall, starting at `top`."""
    s = height / (dbb[3] - dbb[1])
    return (f'<g transform="translate({x - dbb[0] * s:.2f} {top + dbb[3] * s:.2f}) '
            f'scale({s:.6f} {-s:.6f})" fill="{fill}"><path d="{dd}"/></g>'), (dbb[2] - dbb[0]) * s

dw, dww = devanagari(62, INK, x=0, top=8)
files.append(write("sakshi-wordmark-devanagari.svg", svg(round(dww), 78, dw, vb=f"0 0 {dww:.0f} 78")))

# Bilingual stack: the Latin transliteration over the name as it is written.
def bilingual(ink, sand, eye, iris, pupil):
    ms = 112 / (MARK_BOX[2] - MARK_BOX[0])           # mark inked 112px wide
    mw, mh = 112, (MARK_BOX[3] - MARK_BOX[1]) * ms
    lat_size, dev_h = 58, 42
    lat, lw = wordmark(lat_size, ink)
    w = max(mw, lw) + 16
    y = mh + 30
    dev, dvw = devanagari(dev_h, sand, x=(w - 0) / 2, top=y + lat_size + 26)
    body = (f'<g transform="translate({(w - mw) / 2:.2f} 0) scale({ms:.6f}) '
            f'translate({-MARK_BOX[0]} {-MARK_BOX[1]})">{mark(eye, iris, pupil)}</g>\n  '
            + wordmark(lat_size, ink, x=(w - lw) / 2, baseline=y + lat_size)[0] + '\n  ')
    dev, dvw = devanagari(dev_h, sand, x=0, top=y + lat_size + 24)
    dev = devanagari(dev_h, sand, x=(w - dvw) / 2, top=y + lat_size + 24)[0]
    h = y + lat_size + 24 + dev_h + 6
    return svg(round(w), round(h), body + dev, vb=f"0 0 {w:.0f} {h:.0f}")

files.append(write("sakshi-bilingual.svg", bilingual(INK, SAND_DEEP, SAND_DEEP, SAND, SAND_DEEP)))
for f in files[-2:]:
    print(f)

# ------------------------------------------------------------ PNG exports
# ImageMagick's built-in SVG renderer ignores clip-path, so the tile is
# rasterised unclipped and the rounded corners are masked back in.
noclip = svg(256, 256,
    f'<rect width="256" height="256" fill="{TILE}"/>\n  '
    f'<path d="{PLINTH}" fill="{PARCH}"/>\n  '
    f'<g transform="translate(0 -4)">{mark(SAND_DEEP, SAND_DEEP, SAND_DEEP)}</g>')
tmp = os.path.join(tempfile.mkdtemp(), "tile-noclip.svg")
open(tmp, "w").write(noclip)

def run(*a): subprocess.run(a, check=True)

for px, name in [(1024, "sakshi-icon-1024.png"), (512, "sakshi-icon-512.png")]:
    r = px * 56 / 256
    run("convert", "-density", "600", tmp, "-resize", f"{px}x{px}", "-alpha", "set",
        "(", "+clone", "-alpha", "transparent", "-background", "none",
        "-fill", "white", "-draw", f"roundrectangle 0,0,{px-1},{px-1},{r:.0f},{r:.0f}", ")",
        "-compose", "DstIn", "-composite", os.path.join(OUT, name))

for src, name, w in [("sakshi-lockup.svg", "sakshi-lockup@2x.png", 1288),
                     ("sakshi-lockup-dark.svg", "sakshi-lockup-dark@2x.png", 1288),
                     ("sakshi-mark.svg", "sakshi-mark-512.png", 512),
                     ("sakshi-bilingual.svg", "sakshi-bilingual@2x.png", 720),
                     ("sakshi-stacked.svg", "sakshi-stacked@2x.png", 720)]:
    run("convert", "-background", "none", "-density", "600",
        os.path.join(OUT, src), "-resize", f"{w}x", os.path.join(OUT, name))
print("png exports done")
