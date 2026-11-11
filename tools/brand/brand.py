"""Generates the Saksi brand kit: logos, app icons, store art and the brand board.

The mark is an eye whose upper lid is a Himalayan ridge, whose iris is the morning
sun in sayapatri marigold, and whose lower lid is the lotus of the Buddha's first
steps in the jade of the Puskarini pond.

Wordmarks are real outlines shaped through HarfBuzz from the bundled fonts, so
they render identically without the fonts installed, and the conjunct in the
Devanagari name is the true ligature. PNGs are rendered by headless Chrome.

    python3 -m venv .venv && .venv/bin/pip install fonttools uharfbuzz
    .venv/bin/python tools/brand/brand.py
"""
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "brand"
ASSETS = ROOT / "assets"
STORE = ROOT / "docs" / "store-assets"
LANDING = ROOT / "landing"

# Kept in step with theme/colors.ts by hand. tests/native/theme-contrast.test.ts
# guards the UI pairs; the logo only ever uses these values.
JADE, JADE_DEEP, MINT, PALE_JADE = "#0E6E62", "#0A564C", "#62D3B4", "#BFE7DA"
MARIGOLD, MIST, PINE, DUSK = "#F7A823", "#F5F8F3", "#12302B", "#0B2024"
MAROON = "#8C3B3F"
FLAGS = ["#2F6FD0", "#FFFFFF", "#D8412F", "#1F9D6B", "#F7C325"]

FONTS = ROOT / "node_modules/@expo-google-fonts"
BALOO = FONTS / "baloo-2/600SemiBold/Baloo2_600SemiBold.ttf"
MUKTA = FONTS / "mukta/400Regular/Mukta_400Regular.ttf"
MUKTA_M = FONTS / "mukta/600SemiBold/Mukta_600SemiBold.ttf"

_fonts = {}


def text_path(text, font_path, size, fill, x=0, baseline=0, anchor="start"):
    """Returns (svg, width) for `text` as filled outlines, so no font is needed to view it."""
    if font_path not in _fonts:
        blob = hb.Blob.from_file_path(str(font_path))
        tt = TTFont(str(font_path))
        _fonts[font_path] = (hb.Font(hb.Face(blob)), tt.getGlyphSet(), tt.getGlyphOrder(), tt["head"].unitsPerEm)
    font, glyphs, order, upm = _fonts[font_path]
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": True})
    scale = size / upm
    width = sum(p.x_advance for p in buf.glyph_positions) * scale
    cx = x - width if anchor == "end" else x - width / 2 if anchor == "middle" else x
    parts = []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        pen = SVGPathPen(glyphs)
        glyphs[order[info.codepoint]].draw(
            TransformPen(pen, (scale, 0, 0, -scale, cx + pos.x_offset * scale, baseline - pos.y_offset * scale))
        )
        commands = pen.getCommands()
        if commands:
            parts.append(commands)
        cx += pos.x_advance * scale
    return f'<path fill="{fill}" d="{" ".join(parts)}"/>', width


def petal(angle, length, width, fill, base=(128, 214)):
    w, l = width, length
    d = (f"M0 0C{w:.1f} {-l * .3:.1f} {w * .8:.1f} {-l * .74:.1f} 0 {-l:.1f}"
         f"C{-w * .8:.1f} {-l * .74:.1f} {-w:.1f} {-l * .3:.1f} 0 0Z")
    return f'<path fill="{fill}" d="{d}" transform="translate({base[0]} {base[1]}) rotate({angle})"/>'


def mark(lid, sun, outer, inner, center):
    """256-unit mark. Drawn back to front so the lotus cradles the sun."""
    return "".join([
        f'<circle cx="128" cy="100" r="37" fill="{sun}"/>',
        f'<path d="M22 138C62 40 194 40 234 138" fill="none" stroke="{lid}" stroke-width="15" stroke-linecap="round"/>',
        petal(-74, 106, 25, outer), petal(74, 106, 25, outer),
        petal(-40, 102, 28, inner), petal(40, 102, 28, inner),
        petal(0, 88, 29, center),
    ])


COLOR = (JADE, MARIGOLD, JADE_DEEP, JADE, JADE)
DARK = (MIST, MARIGOLD, MINT, MINT, MINT)
ON_JADE = (MIST, MARIGOLD, PALE_JADE, MIST, MIST)
ON_MARIGOLD = (PINE, "#FFFFFF", PINE, PINE, PINE)
MONO = ("currentColor",) * 5
WHITE = ("#FFFFFF",) * 5


def svg(w, h, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{body}</svg>\n'


def placed(colours, x, y, size):
    return f'<g transform="translate({x} {y}) scale({size / 256})">{mark(*colours)}</g>'


def lockup(colours, ink):
    name, width = text_path("Sākṣī", BALOO, 150, ink, x=250, baseline=172)
    return svg(round(250 + width + 20), 256, placed(colours, 0, 0, 240) + name)


def stacked(colours, ink):
    name, _ = text_path("Sākṣī", BALOO, 104, ink, x=180, baseline=348, anchor="middle")
    return svg(360, 380, placed(colours, 40, 0, 280) + name)


def bilingual(colours, ink, sub):
    latin, lw = text_path("Sākṣī", BALOO, 130, ink, x=250, baseline=124)
    deva, dw = text_path("साक्षी", BALOO, 76, sub, x=252, baseline=224)
    return svg(round(250 + max(lw, dw) + 20), 256, placed(colours, 0, 8, 240) + latin + deva)


def flag_band(x, y, w, h):
    step = w / 5
    return "".join(
        f'<rect x="{x + i * step:.1f}" y="{y}" width="{step:.1f}" height="{h}" fill="{c}"/>'
        for i, c in enumerate(FLAGS)
    )


def horizon_card(w, h, tagline):
    """Store and social art: a large sun rising over a lotus horizon on jade."""
    sun_r = h * .56
    cx, cy = w * .9, h * .72
    body = f'<rect width="{w}" height="{h}" fill="{JADE}"/>'
    body += f'<circle cx="{cx}" cy="{cy}" r="{sun_r * 1.34:.0f}" fill="{JADE_DEEP}"/>'
    body += f'<circle cx="{cx}" cy="{cy}" r="{sun_r:.0f}" fill="{MARIGOLD}"/>'
    petals = [(-74, h * .9, h * .22, PALE_JADE), (74, h * .9, h * .22, PALE_JADE),
              (-40, h * .86, h * .25, MIST), (40, h * .86, h * .25, MIST), (0, h * .7, h * .26, MIST)]
    for angle, length, width, fill in petals:
        body += petal(angle, length, width, fill, base=(cx, h * 1.22))
    m = h * .1
    logo = h * .36
    body += placed(ON_JADE, m, m, logo)
    title, _ = text_path("Sākṣī", BALOO, h * .3, MIST, x=m, baseline=m + logo + h * .29)
    line, _ = text_path(tagline, MUKTA_M, h * .072, MIST, x=m, baseline=m + logo + h * .47)
    return svg(w, h, body + title + line)


def board():
    """The one-page brand sheet."""
    w, h = 1600, 1000

    def t(s, x, y, size=26, fill=PINE, font=MUKTA, anchor="start"):
        return text_path(s, font, size, fill, x=x, baseline=y, anchor=anchor)[0]

    body = f'<rect width="{w}" height="{h}" fill="{MIST}"/><rect width="620" height="{h}" fill="{JADE}"/>'
    body += placed(ON_JADE, 150, 130, 320)
    body += t("Sākṣī", 310, 590, 130, MIST, BALOO, "middle")
    body += t("साक्षी", 310, 690, 76, PALE_JADE, BALOO, "middle")
    body += t("Witness Lumbini at first light.", 310, 790, 34, MIST, MUKTA_M, "middle")
    body += flag_band(0, h - 28, 620, 28)
    swatches = [("Pond Jade", JADE, MIST), ("Marigold", MARIGOLD, PINE), ("Morning Mist", MIST, PINE),
                ("Pine Ink", PINE, MIST), ("Himalayan Dusk", DUSK, MIST), ("Robe Maroon", MAROON, MIST)]
    body += t("Colour", 680, 90, 42, PINE, BALOO)
    for i, (name, hex_, ink) in enumerate(swatches):
        x, y = 680 + i % 3 * 290, 120 + i // 3 * 190
        stroke = ' stroke="#CFDBD3"' if hex_ == MIST else ""
        body += f'<rect x="{x}" y="{y}" width="270" height="170" rx="22" fill="{hex_}"{stroke}/>'
        body += t(name, x + 22, y + 118, 28, ink, MUKTA_M) + t(hex_, x + 22, y + 150, 24, ink)
    body += t("Prayer flag accents", 680, 545, 28, PINE, MUKTA_M)
    body += '<rect x="680" y="565" width="850" height="34" fill="#CFDBD3"/>' + flag_band(681, 566, 848, 32)
    body += t("Type", 680, 680, 42, PINE, BALOO)
    body += t("Baloo 2 बालु", 680, 750, 58, JADE, BALOO)
    body += t("Headings and place names", 680, 790, 25, PINE)
    body += t("Mukta मुक्ता", 1130, 750, 54, PINE, MUKTA_M)
    body += t("Reading, navigation, buttons", 1130, 790, 25, PINE)
    body += placed(COLOR, 680, 825, 130)
    for x, bg, colours in [(860, DUSK, DARK), (1040, JADE, ON_JADE), (1220, MARIGOLD, ON_MARIGOLD)]:
        body += f'<rect x="{x}" y="825" width="130" height="130" rx="30" fill="{bg}"/>' + placed(colours, x + 10, 835, 110)
    return svg(w, h, body)


def tile(size=1024, inset=.12, bg=JADE, colours=ON_JADE):
    """Full-bleed square icon. App stores round the corners themselves."""
    s = size * (1 - 2 * inset)
    offset = size * inset
    return svg(size, size, f'<rect width="{size}" height="{size}" fill="{bg}"/>' + placed(colours, offset, offset * .9, s))


def transparent(colours, size=1024, zone=.62):
    """A mark centred in Android's adaptive-icon safe zone, or on the splash."""
    s = size * zone
    return svg(size, size, placed(colours, (size - s) / 2, (size - s) / 2, s))


def render(svg_text, out, w, h, opaque=False):
    """Rasterises through headless Chrome, which matches what browsers show."""
    with tempfile.TemporaryDirectory() as d:
        page = Path(d) / "p.html"
        page.write_text(
            '<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}'
            f"svg{{display:block;width:{w}px;height:{h}px}}</style>{svg_text}"
        )
        args = ["google-chrome", "--headless=new", "--disable-gpu", "--hide-scrollbars",
                "--force-device-scale-factor=1", f"--user-data-dir={d}/profile",
                f"--window-size={w},{h}", f"--screenshot={out}", page.as_uri()]
        if not opaque:
            args.insert(3, "--default-background-color=00000000")
        subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def size_of(svg_text, scale=2):
    w, h = re.search(r'width="(\d+)" height="(\d+)"', svg_text).groups()
    return int(w) * scale, int(h) * scale


def main():
    OUT.mkdir(exist_ok=True)
    for old in OUT.iterdir():
        if old.suffix in {".svg", ".png"}:
            old.unlink()
    tagline = "Your real-time guide to Nepal"
    vectors = {
        "saksi-mark": svg(256, 256, mark(*COLOR)),
        "saksi-mark-dark": svg(256, 256, mark(*DARK)),
        "saksi-mark-on-jade": svg(256, 256, mark(*ON_JADE)),
        "saksi-mark-mono": svg(256, 256, mark(*MONO)),
        "saksi-icon-tile": tile(),
        "saksi-lockup": lockup(COLOR, PINE),
        "saksi-lockup-dark": lockup(DARK, MIST),
        "saksi-stacked": stacked(COLOR, PINE),
        "saksi-bilingual": bilingual(COLOR, PINE, JADE),
        "saksi-bilingual-dark": bilingual(DARK, MIST, MINT),
        "saksi-prayer-flag-band": svg(500, 20, flag_band(0, 0, 500, 20)),
        "saksi-brand-board": board(),
    }
    word, ww = text_path("Sākṣī", BALOO, 120, PINE, baseline=110)
    vectors["saksi-wordmark"] = svg(round(ww), 150, word)
    deva, dw = text_path("साक्षी", BALOO, 120, PINE, baseline=125)
    vectors["saksi-wordmark-devanagari"] = svg(round(dw), 170, deva)
    for name, content in vectors.items():
        (OUT / f"{name}.svg").write_text(content)

    render(vectors["saksi-mark"], OUT / "saksi-mark-512.png", 512, 512)
    for name, px in [("saksi-icon-1024", 1024), ("saksi-icon-512", 512), ("saksi-social-avatar-400", 400)]:
        render(tile(), OUT / f"{name}.png", px, px, opaque=True)
    for name in ["saksi-lockup", "saksi-lockup-dark", "saksi-stacked", "saksi-bilingual"]:
        render(vectors[name], OUT / f"{name}@2x.png", *size_of(vectors[name]))
    render(vectors["saksi-brand-board"], OUT / "saksi-brand-board.png", 1600, 1000, opaque=True)
    render(horizon_card(1200, 630, tagline), OUT / "saksi-og-1200x630.png", 1200, 630, opaque=True)
    render(horizon_card(1024, 500, tagline), STORE / "feature-graphic.png", 1024, 500, opaque=True)

    render(tile(), ASSETS / "icon.png", 1024, 1024, opaque=True)
    render(transparent(ON_JADE), ASSETS / "android-icon-foreground.png", 1024, 1024)
    render(svg(1024, 1024, f'<rect width="1024" height="1024" fill="{JADE}"/>'),
           ASSETS / "android-icon-background.png", 1024, 1024, opaque=True)
    render(transparent(WHITE), ASSETS / "android-icon-monochrome.png", 1024, 1024)
    render(transparent(COLOR, zone=.8), ASSETS / "splash-icon.png", 1024, 1024)
    render(transparent(DARK, zone=.8), ASSETS / "splash-icon-dark.png", 1024, 1024)
    render(tile(), ASSETS / "favicon.png", 48, 48, opaque=True)

    (LANDING / "app" / "icon.svg").write_text(tile(256))
    shutil.copy(OUT / "saksi-og-1200x630.png", LANDING / "public" / "og.png")
    shutil.copy(OUT / "saksi-lockup.svg", LANDING / "public" / "saksi-lockup.svg")
    shutil.copy(OUT / "saksi-lockup-dark.svg", LANDING / "public" / "saksi-lockup-dark.svg")
    print("generated", len(list(OUT.glob("*"))), "files")


if __name__ == "__main__":
    main()
