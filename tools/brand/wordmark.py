from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform

# Resolved from the repo root so the script survives a folder rename or a fresh clone.
from pathlib import Path
_ROOT = Path(__file__).resolve().parents[2]
FONT = str(_ROOT / "node_modules") + "/@expo-google-fonts/anek-devanagari/{w}/AnekDevanagari_{w}.ttf"

def build(weight="600SemiBold", tracking=0):
    f=TTFont(FONT.format(w=weight))
    gs=f.getGlyphSet(); hmtx=f["hmtx"]
    def path(name, t=None):
        pen=SVGPathPen(gs)
        p = TransformPen(pen, t) if t else pen
        gs[name].draw(p)
        return pen.getCommands()
    def bounds(name):
        bp=BoundsPen(gs); gs[name].draw(bp); return bp.bounds
    def adv(name): return hmtx[name][0]

    parts=[]; x=0
    def place(name, t=None):
        nonlocal x
        tr = Transform().translate(x,0)
        if t: tr = tr.transform(t)
        d = path(name, tr)
        if d: parts.append(d)

    def base_with_macron(base):
        nonlocal x
        place(base)
        bb=bounds(base); mb=bounds("macroncomb")
        cx=(bb[0]+bb[2])/2; mcx=(mb[0]+mb[2])/2
        place("macroncomb", Transform().translate(cx-mcx,0))
        x+=adv(base)+tracking

    def base_with_dot(base):
        nonlocal x
        place(base)
        bb=bounds(base); db=bounds("period")
        cx=(bb[0]+bb[2])/2; dcx=(db[0]+db[2])/2
        # dot below baseline: top of dot ~ -150 units
        k = 0.62                      # the period is a text dot; a diacritic wants less
        dy = -(db[3] * k) - 95
        place("period", Transform().translate(cx - dcx * k, dy).scale(k, k))
        x+=adv(base)+tracking

    def plain(name):
        nonlocal x
        place(name); x+=adv(name)+tracking

    plain("S"); base_with_macron("a"); plain("k"); base_with_dot("s"); base_with_macron("idotless")
    total = x - tracking
    return " ".join(parts), total, f["head"].unitsPerEm

if __name__=="__main__":
    import sys
    d,w,upem=build(sys.argv[1] if len(sys.argv)>1 else "600SemiBold", int(sys.argv[2]) if len(sys.argv)>2 else 0)
    open("wordmark_raw.txt","w").write(f"{w} {upem}\n{d}\n")
    print("advance",w,"upem",upem,"len",len(d))
