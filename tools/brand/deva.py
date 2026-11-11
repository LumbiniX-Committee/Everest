import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.misc.transform import Transform

# Resolved from the repo root so the script survives a folder rename or a fresh clone.
from pathlib import Path
_ROOT = Path(__file__).resolve().parents[2]
PATH = str(_ROOT / "node_modules") + "/@expo-google-fonts/anek-devanagari/600SemiBold/AnekDevanagari_600SemiBold.ttf"

def shape(text="साक्षी"):
    blob = hb.Blob.from_file_path(PATH)
    face = hb.Face(blob); font = hb.Font(face)
    buf = hb.Buffer(); buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": True})
    tt = TTFont(PATH); gs = tt.getGlyphSet(); order = tt.getGlyphOrder()
    parts, x = [], 0
    bp = BoundsPen(gs)
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = order[info.codepoint]
        pen = SVGPathPen(gs)
        gs[name].draw(TransformPen(pen, Transform().translate(x + pos.x_offset, pos.y_offset)))
        gs[name].draw(TransformPen(bp, Transform().translate(x + pos.x_offset, pos.y_offset)))
        cmds = pen.getCommands()
        if cmds: parts.append(cmds)
        x += pos.x_advance
    return " ".join(parts), x, tt["head"].unitsPerEm, bp.bounds

if __name__ == "__main__":
    d, adv, upem, bb = shape()
    print("advance", adv, "upem", upem, "bounds", bb)
    open("deva_raw.txt", "w").write(f"{adv} {upem}\n{d}\n")
