"""
Swayambhu: the great stupa, a shikhara (used for both Pratappur and
Anantapur) and the great vajra, as they stand after the post-2015 restoration.
Modelled in Blender by Sakshi; three files, each placed on the map at its own
OpenStreetMap position so nothing else on the hilltop is covered.

    blender -b --factory-startup -noaudio --python tools/models/blender/swayambhu.py -- OUT.glb --part stupa|shikhara|vajra [--render PREFIX]

A model, not a scan. Sources:
  - OpenStreetMap: the stupa (way 201223707, about 26.8 m across), Pratappur
    and Anantapur Shikhara (ways 115376623 and 255752871, height 17 m as
    tagged, about 8 m across) and the vajra ("Dorje", way 1179993484).
  - Photos on Wikimedia Commons from 2017 to 2023 (CC BY-SA 4.0 and CC0,
    credited in LICENCES.md), for the current look: the whitewashed dome with
    saffron petal lines, the gilt harmika with the eyes on four sides, the red
    cloth band, the gilt toranas, the thirteen gilt rings, the umbrella with
    its orange cloth and the finial; the gilt shrines of the five Buddhas and
    the four Taras round the base; the dark railing with the prayer wheels.
The stupa's heights (about 27 m to the top) are judged by eye; only the
footprints, and the shikharas' 17 m, come from the map.
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

OUT, RENDER = kit.args()
PART = sys.argv[sys.argv.index("--part") + 1] if "--part" in sys.argv else "stupa"
k = kit.Kit()

# ------------------------------------------------------------------ stupa
DOME_R, DOME_H, Z_DOME = 11.0, 8.8, 1.6


def eye(frame, cx, flip):
    """One painted eye with its brow, in (x, z) on the harmika face."""
    w, h = 1.5, 0.6
    up = [(cx + flip * (-w / 2 + w * i / 10), 0.0 + h * math.sin(math.pi * i / 10) * 0.9) for i in range(11)]
    low = [(cx + flip * (w / 2 - w * i / 10), -h * 0.35 * math.sin(math.pi * i / 10)) for i in range(1, 10)]
    k.plate("white", up + low, frame, depth=0.05)
    k.plate("blue", [(cx + 0.3 * math.cos(t), -0.03 + 0.3 * math.sin(t)) for t in [i * 2 * math.pi / 16 for i in range(16)]], frame, depth=0.07)
    k.plate("dark", [(cx + 0.12 * math.cos(t), -0.03 + 0.12 * math.sin(t)) for t in [i * 2 * math.pi / 12 for i in range(12)]], frame, depth=0.09)
    brow_top = [(cx + flip * (-0.85 + 1.7 * i / 10), 0.85 + 0.25 * math.sin(math.pi * i / 10)) for i in range(11)]
    brow_low = [(x, z - 0.1) for x, z in reversed(brow_top)]
    k.plate("dark", brow_top + brow_low, frame, depth=0.05)


def shrine(angle, r, width, body, tiers, door_mat="dark"):
    """A gilt shrine against the dome, door facing out."""
    out = Vector((math.cos(angle), math.sin(angle), 0))
    c = out * r
    z = Z_DOME
    k.cube("gold", (c.x, c.y, z + body / 2), (width * 0.75, width, body), angle)
    door = out * (r + width * 0.375 + 0.02)
    k.cube(door_mat, (door.x, door.y, z + body * 0.42), (0.06, width * 0.42, body * 0.6), angle)
    frame = Matrix.Translation((door.x, door.y, z + body * 0.72)) @ Matrix.Rotation(angle - math.pi / 2, 4, "Z")
    hw = width * 0.38
    k.plate("gold", [(-hw, 0), (hw, 0), (hw * 0.8, 0.35), (0.25, 0.75), (0, 0.9), (-0.25, 0.75), (-hw * 0.8, 0.35)], frame, depth=0.12)
    zt = z + body
    w = width * 1.12
    for t in range(tiers):
        k.cube("gold", (c.x, c.y, zt + 0.12), (w * 0.8, w, 0.24), angle)
        k.cube("gold", (c.x, c.y, zt + 0.42), (w * 0.55, w * 0.7, 0.36), angle)
        zt += 0.6
        w *= 0.78
    for dx in (-0.3, 0.0, 0.3):
        p = c + Vector((-math.sin(angle), math.cos(angle), 0)) * dx * width
        k.lathe("gold", [(0.0, zt), (0.16, zt), (0.12, zt + 0.3), (0.05, zt + 0.7 if dx else zt + 0.95), (0.0, zt + (0.8 if dx else 1.05))],
                segs=12, matrix=Matrix.Translation((p.x, p.y, 0)))


def stupa():
    # base: stone ring, whitewashed plinth
    k.lathe("stone", [(13.4, 0.0), (13.4, 0.6), (0.0, 0.6)], segs=128)
    k.lathe("plaster", [(12.3, 0.6), (12.3, Z_DOME), (0.0, Z_DOME)], segs=128)
    # dome, slightly flattened; saffron petal lines are painted on by colorize()
    k.lathe("dome", [(DOME_R * math.cos(t), Z_DOME + DOME_H * math.sin(t))
                     for t in [i * (math.pi / 2) / 40 for i in range(41)]], segs=192)

    shrines = [(0.0, 2.6, 3.0, 3), (-math.radians(24), 2.6, 3.0, 3), (-math.pi / 2, 2.6, 3.0, 3),
               (math.pi, 2.6, 3.0, 3), (math.pi / 2, 2.6, 3.0, 3)]
    taras = [(math.radians(a), 1.6, 2.1, 2) for a in (45, 135, 225, 315)]
    for a, w, body, tiers in shrines + taras:
        shrine(a, DOME_R + 0.4, w, body, tiers)

    # dark railing with prayer wheels round the base, broken by the shrines
    R_RAIL = 12.45
    gaps = [(a, (w / 2 + 0.4) / R_RAIL) for a, w, _, _ in shrines + taras]

    def free(a):
        return all(abs(math.atan2(math.sin(a - g), math.cos(a - g))) > half for g, half in gaps)

    n = int(2 * math.pi * R_RAIL / 0.42)
    for i in range(n):
        a = 2 * math.pi * i / n
        if not free(a):
            continue
        p = Vector((math.cos(a), math.sin(a), 0))
        w = p * 12.05
        k.cylinder("bronze", (w.x, w.y, Z_DOME - 0.55 + 0.6), 0.15, 0.42, segs=10)
        if i % 3 == 0:
            q = p * R_RAIL
            k.cube("iron", (q.x, q.y, 0.6 + 0.7), (0.08, 0.08, 1.4), a)
    seg = int(2 * math.pi * R_RAIL / 0.8)
    for i in range(seg):
        a0, a1 = 2 * math.pi * i / seg, 2 * math.pi * (i + 1) / seg
        if not (free(a0) and free(a1)):
            continue
        am = (a0 + a1) / 2
        q = Vector((math.cos(am), math.sin(am), 0)) * R_RAIL
        L = 2 * R_RAIL * math.sin((a1 - a0) / 2) + 0.02
        for z, th in ((0.6 + 1.38, 0.1), (0.6 + 0.12, 0.12), (0.6 + 0.95, 0.05)):
            k.cube("iron", (q.x, q.y, z), (0.08, L, th), am)

    # harmika with the eyes; the "nose" sign below them
    zh = Z_DOME + DOME_H - 0.5
    k.cube("gold", (0, 0, zh + 0.25), (6.6, 6.6, 0.5))
    k.cube("gold", (0, 0, zh + 0.5 + 1.75), (6.0, 6.0, 3.5))
    for f in range(4):
        a = f * math.pi / 2 - math.pi / 2  # south, east, north, west
        frame = Matrix.Rotation(a + math.pi / 2, 4, "Z") @ Matrix.Translation((0, 0, zh + 2.6)) @ Matrix.Rotation(math.pi, 4, "Z") @ Matrix.Translation((0, 3.0, 0))
        for cx, flip in ((-1.35, 1), (1.35, -1)):
            eye(frame, cx, flip)
        nose = [(0.12, -0.35), (0.22, -0.55), (0.16, -0.85), (-0.05, -1.05), (-0.18, -1.25), (-0.06, -1.32),
                (0.08, -1.2), (0.30, -0.95), (0.38, -0.6), (0.26, -0.33)]
        k.plate("blue", nose, frame, depth=0.06)
    z = zh + 4.0
    k.cube("gold", (0, 0, z + 0.15), (6.6, 6.6, 0.3))
    z += 0.3
    k.cube("red", (0, 0, z + 0.6), (6.9, 6.9, 1.2))
    z += 1.2
    for mat in ("green", "yellow", "blue"):
        k.cube(mat, (0, 0, z + 0.07), (6.95, 6.95, 0.14))
        z += 0.14
    k.cube("gold", (0, 0, z + 0.2), (6.4, 6.4, 0.4))
    z += 0.4
    # toranas: gilt plaques of the five Buddhas, one to each side
    for f in range(4):
        a = f * math.pi / 2
        frame = Matrix.Rotation(a, 4, "Z") @ Matrix.Translation((0, -3.25, z)) @ Matrix.Rotation(math.pi, 4, "Z")
        pts = [(-2.5, 0), (2.5, 0), (2.4, 1.0), (1.2, 2.2), (0.0, 3.3), (-1.2, 2.2), (-2.4, 1.0)]
        k.plate("gold", pts, frame, depth=0.25)
        for bx, bz in ((-1.5, 0.9), (-0.75, 0.9), (0, 0.9), (0.75, 0.9), (1.5, 0.9), (0, 2.1)):
            k.plate("niche", [(bx + 0.24 * math.cos(t), bz + 0.34 * math.sin(t)) for t in [i * 2 * math.pi / 10 for i in range(10)]], frame @ Matrix.Translation((0, 0.25, 0)), depth=0.04)
    # thirteen gilt rings
    for i in range(13):
        r = 3.0 - i * (1.75 / 12)
        k.lathe("gold", [(0.0, z), (r, z), (r, z + 0.3), (r * 0.94, z + 0.36), (0.0, z + 0.36)], segs=64)
        k.lathe("bronze", [(r * 0.88, z + 0.36), (r * 0.88, z + 0.52)], segs=48)
        z += 0.52
    # umbrella with its orange cloth, and the finial
    k.lathe("gold", [(0.0, z), (1.3, z), (1.3, z + 0.3), (0.0, z + 0.3)], segs=48)
    z += 0.3
    k.lathe("saffron", [(1.55, z), (1.55, z + 0.8), (1.4, z + 0.8)], segs=48)
    k.lathe("gold", [(1.4, z + 0.8), (2.0, z + 0.8), (1.9, z + 1.1), (1.1, z + 1.6), (0.6, z + 1.8), (0.0, z + 1.85)], segs=48)
    z += 1.8
    k.lathe("gold", [(0.0, z), (0.5, z), (0.55, z + 0.3), (0.3, z + 0.6), (0.22, z + 1.2), (0.36, z + 1.35), (0.16, z + 1.6),
                     (0.12, z + 2.3), (0.0, z + 2.8)], segs=24)


def dome_paint(mat, co):
    """Saffron petal lines and drips on the whitewash, as in recent photos."""
    if mat != "dome":
        return None
    r = math.hypot(co.x, co.y)
    t = (co.z - Z_DOME) / DOME_H
    if t < 0.02:
        return None
    a = math.atan2(co.y, co.x)
    petal = 0.45 + 0.4 * abs(math.cos(8 * a))  # scalloped petal outline
    line = abs(t - petal) < 0.035
    drip = t > 0.35 and (math.sin(a * 37) * math.sin(a * 11 + 1.3)) > 0.82 and t < 0.95
    if line or drip:
        return (1.0, 0.72, 0.30)
    return None


# ------------------------------------------------------------------ shikhara
def shikhara():
    """Pratappur / Anantapur: whitewashed shikhara, 17 m as tagged on the map."""
    k.cube("plaster", (0, 0, 0.5), (8.0, 8.0, 1.0))
    k.cube("plaster", (0, 0, 1.0 + 2.0), (6.4, 6.4, 4.0))
    for f in range(4):
        a = f * math.pi / 2
        n = Vector((math.cos(a), math.sin(a), 0))
        d = n * 3.22
        k.cube("dark", (d.x, d.y, 1.0 + 1.2), (0.06, 1.1, 2.0), a)
        for s in (-1, 1):
            p = n * 3.3 + Vector((-n.y, n.x, 0)) * s * 2.9
            k.cube("plaster", (p.x, p.y, 3.0), (0.4, 0.6, 4.0), a)
    k.cube("plaster", (0, 0, 5.15), (7.0, 7.0, 0.3))
    z = 5.3
    tiers = 14
    for i in range(tiers):
        t = i / (tiers - 1)
        w = 6.0 - 3.6 * t ** 1.5
        h = 0.62
        k.cube("plaster", (0, 0, z + h / 2), (w, w, h))
        k.cube("plaster", (0, 0, z + h - 0.06), (w + 0.25, w + 0.25, 0.12))
        z += h
    k.lathe("plaster", [(1.6, z), (1.7, z + 0.25), (1.2, z + 0.55), (0.0, z + 0.6)], segs=32)
    z += 0.55
    k.lathe("gold", [(0.0, z), (0.9, z), (1.0, z + 0.35), (0.6, z + 0.8), (0.35, z + 0.95), (0.3, z + 1.4), (0.45, z + 1.55),
                     (0.2, z + 1.75), (0.12, z + 2.4), (0.0, z + 2.6)], segs=24)


# ------------------------------------------------------------------ vajra
def vajra():
    k.lathe("stone", [(2.4, 0.0), (2.4, 0.35), (0.0, 0.35)], segs=48)
    k.lathe("bronze", [(1.9, 0.35), (1.9, 1.2), (2.05, 1.3), (2.05, 1.45), (0.0, 1.45)], segs=48)
    for i in range(12):  # relief panels round the drum
        a = 2 * math.pi * i / 12
        k.cube("gold", (1.92 * math.cos(a), 1.92 * math.sin(a), 0.8), (0.05, 0.6, 0.55), a)
    k.lathe("gold", [(0.5, 1.45), (0.35, 1.7), (0.0, 1.75)], segs=24)
    axis = Matrix.Translation((0, 0, 2.05)) @ Matrix.Rotation(math.pi / 2, 4, "Y")  # lies east-west
    k.lathe("gold", [(0.0, -0.25), (0.22, -0.25), (0.3, -0.12), (0.3, 0.12), (0.22, 0.25), (0.0, 0.25)], segs=24, matrix=axis)
    for turn in (0.0, math.pi):  # the two ends, turned rather than mirrored so faces stay outward
        end = axis @ Matrix.Rotation(turn, 4, "X")
        k.lathe("gold", [(0.12, 0.25), (0.4, 0.32), (0.44, 0.42), (0.18, 0.5), (0.0, 0.5)], segs=24, matrix=end)  # lotus collar
        k.lathe("gold", [(0.08, 0.45), (0.1, 1.2), (0.0, 1.45)], segs=12, matrix=end)  # central prong
        for q in range(4):  # four curved prongs meeting at the tip
            a = q * math.pi / 2 + math.pi / 4
            path = [(0.36, 0.45), (0.5, 0.65), (0.56, 0.85), (0.5, 1.05), (0.34, 1.22), (0.12, 1.38), (0.02, 1.45)]
            for (r0, z0), (r1, z1) in zip(path, path[1:]):
                p0 = end @ Vector((r0 * math.cos(a), r0 * math.sin(a), z0))
                p1 = end @ Vector((r1 * math.cos(a), r1 * math.sin(a), z1))
                d = p1 - p0
                rot = d.to_track_quat("Z", "Y").to_matrix().to_4x4()
                m = Matrix.Translation((p0 + p1) / 2) @ rot @ Matrix.Diagonal((0.11, 0.11, d.length + 0.04, 1))
                kit.bmesh.ops.create_cube(k.bm("gold"), size=1.0, matrix=m)


kit.PALETTE["dome"] = kit.PALETTE["plaster"]  # its own object, so the painted lines can be found
{"stupa": stupa, "shikhara": shikhara, "vajra": vajra}[PART]()
views = {
    "stupa": ((0, 0, 12), (("front", (0, -60, 10), 40), ("aerial", (40, -45, 40), 35))),
    "shikhara": ((0, 0, 8), (("front", (0, -30, 6), 40), ("aerial", (20, -24, 20), 35))),
    "vajra": ((0, 0, 1.5), (("front", (0, -9, 2.2), 40), ("aerial", (6, -7, 6), 35))),
}[PART]
k.finish(OUT, RENDER, look_at=views[0], views=views[1], colorize=dome_paint)
