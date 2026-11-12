"""
Maya Devi Temple, Lumbini, as it stands now (the white temple of 2003 over
the excavated birthplace): modelled in Blender by Sakshi.

    blender -b --factory-startup -noaudio --python tools/models/blender/maya-devi-temple.py -- OUT.glb [--render PREFIX]

A model, not a scan. Sources:
  - OpenStreetMap way 343151593 ("Mayadevi Temple"): footprint about 30 m
    east-west by 26 m north-south. The only measured size.
  - Photos on Wikimedia Commons from 2021 to 2023 (CC BY-SA 4.0, credited in
    LICENCES.md), for the current look: a white block with one row of windows
    high up, a red cornice, a parapet of posts with red caps and rails, raised
    corner blocks, the south entrance facing the Puskarini pond, and the roof
    pavilion with its white dome and gilt spire.
Every height (walls about 7.5 m, top of the spire about 18 m) is judged by eye
against the footprint.
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402

OUT, RENDER = kit.args()
k = kit.Kit()

W, D, H = 30.0, 26.0, 7.5  # east-west, north-south, wall height
hw, hd = W / 2, D / 2

# plinth and walls
k.cube("stone", (0, 0, 0.15), (W + 1.2, D + 1.2, 0.3))
k.cube("plaster", (0, 0, 0.3 + (H - 0.3) / 2), (W, D, H - 0.3))
k.cube("plaster", (0, 0, 0.45), (W + 0.3, D + 0.3, 0.3))  # skirting
k.cube("red", (0, 0, H - 0.2), (W + 0.3, D + 0.3, 0.45))  # red cornice
k.cube("plaster", (0, 0, H + 0.05), (W, D, 0.1))  # roof


def along(face):
    """(origin, tangent, outward normal, length) for each wall face."""
    return {
        "south": ((0, -hd), (1, 0), (0, -1), W),
        "north": ((0, hd), (-1, 0), (0, 1), W),
        "east": ((hw, 0), (0, 1), (1, 0), D),
        "west": ((-hw, 0), (0, -1), (-1, 0), D),
    }[face]


# one row of windows high in each wall: dark glass, white frame and mullions
for face in ("south", "north", "east", "west"):
    (ox, oy), (tx, ty), (nx, ny), length = along(face)
    n = int((length - 6) / 3.0)
    rot = math.atan2(ny, nx)
    for i in range(n):
        s = -((n - 1) * 3.0) / 2 + i * 3.0
        cx, cy = ox + tx * s + nx * 0.02, oy + ty * s + ny * 0.02
        k.cube("glass", (cx, cy, 5.6), (0.08, 2.1, 1.2), rot)
        k.cube("plaster", (cx + nx * 0.04, cy + ny * 0.04, 5.6), (0.08, 0.12, 1.2), rot)
        for dz in (-0.62, 0.0, 0.62):
            k.cube("plaster", (cx + nx * 0.04, cy + ny * 0.04, 5.6 + dz), (0.1, 2.25, 0.1), rot)
        for ds in (-0.7, 0.7):
            px, py = cx + tx * ds + nx * 0.04, cy + ty * ds + ny * 0.04
            k.cube("plaster", (px, py, 5.6), (0.08, 0.07, 1.2), rot)

# south entrance facing the pond, and the north door
for face, wdoor in (("south", 2.4), ("north", 2.0)):
    (ox, oy), _, (nx, ny), _ = along(face)
    rot = math.atan2(ny, nx)
    k.cube("dark", (ox + nx * 0.03, oy + ny * 0.03, 0.3 + 1.6), (0.08, wdoor, 3.2), rot)
    k.cube("plaster", (ox + nx * 0.12, oy + ny * 0.12, 0.3 + 3.35), (0.25, wdoor + 0.6, 0.3), rot)
    for step in range(3):
        d = 0.6 + step * 0.45
        k.cube("stone", (ox + nx * (d - 0.2), oy + ny * (d - 0.2), (0.3 - step * 0.1) / 2), (0.45 + (2 - step) * 0.45, wdoor + 2.6, 0.3 - step * 0.1), rot)
    for s in (-1, 1):  # white handrails either side of the steps
        tx, ty = -ny, nx
        k.cube("plaster", (ox + nx * 1.1 + tx * s * (wdoor / 2 + 1.0), oy + ny * 1.1 + ty * s * (wdoor / 2 + 1.0), 0.75), (2.0, 0.08, 0.08), rot)

# parapet: posts with red caps and two rails between, raised blocks at the corners and the middle of each side
blocks = [(sx * (hw - 1.2), sy * (hd - 1.2)) for sx in (-1, 1) for sy in (-1, 1)]
blocks += [(0, -hd + 1.2), (0, hd - 1.2), (hw - 1.2, 0), (-hw + 1.2, 0)]
for bx, by in blocks:
    k.cube("plaster", (bx, by, H + 0.9), (2.4, 2.4, 1.8))
    k.cube("red", (bx, by, H + 1.85), (2.6, 2.6, 0.2))
for face in ("south", "north", "east", "west"):
    (ox, oy), (tx, ty), (nx, ny), length = along(face)
    rot = math.atan2(ny, nx)
    inset = 0.3
    n = int(length / 3.0)
    for i in range(n + 1):
        s = -length / 2 + i * (length / n)
        if any(abs((ox + tx * s - nx * inset) - bx) < 1.5 and abs((oy + ty * s - ny * inset) - by) < 1.5 for bx, by in blocks):
            continue
        px, py = ox + tx * s - nx * inset, oy + ty * s - ny * inset
        k.cube("plaster", (px, py, H + 0.65), (0.6, 0.6, 1.3), rot)
        k.cube("red", (px, py, H + 1.38), (0.75, 0.75, 0.18), rot)
    for z in (H + 0.6, H + 1.15):
        k.cube("iron", (ox - nx * inset, oy - ny * inset, z), (0.05, length - 0.6, 0.05), rot)

# roof pavilion with arched windows, a drum, the dome and a gilt spire
P = 8.0
k.cube("plaster", (0, 0, H + 1.9), (P, P, 3.8))
k.cube("plaster", (0, 0, H + 3.9), (P + 0.5, P + 0.5, 0.3))
for face_rot in range(4):
    a = face_rot * math.pi / 2
    nx, ny = math.cos(a), math.sin(a)
    for s in (-1.8, 1.8):
        cx, cy = nx * (P / 2 + 0.02) - ny * s, ny * (P / 2 + 0.02) + nx * s
        k.cube("glass", (cx, cy, H + 1.9), (0.08, 1.3, 1.8), a)
        arch = [(-0.65 + 1.3 * i / 8, 0.9 + 0.65 * math.sin(math.pi * i / 8)) for i in range(9)]
        frame = kit.Matrix.Translation((cx, cy, H + 1.9)) @ kit.Matrix.Rotation(a - math.pi / 2, 4, "Z")
        k.plate("glass", [(-0.65, 0.9)] + arch[1:-1] + [(0.65, 0.9)], frame, depth=0.04)
ZD = H + 4.05
k.lathe("plaster", [(3.2, ZD), (3.2, ZD + 0.6), (3.0, ZD + 0.6)], segs=64)
k.lathe("plaster", [(3.0 * math.cos(t), ZD + 0.6 + 2.6 * math.sin(t)) for t in [i * (math.pi / 2) / 16 for i in range(16)]] + [(0.0, ZD + 3.2)], segs=64)
z = ZD + 3.0
k.cube("gold", (0, 0, z + 0.4), (1.1, 1.1, 0.8))
k.cube("gold", (0, 0, z + 0.85), (1.3, 1.3, 0.12))
z += 0.9
for i in range(9):
    r = 0.62 - i * 0.05
    k.lathe("gold", [(0.0, z), (r, z), (r, z + 0.18), (r * 0.8, z + 0.24), (0.0, z + 0.24)], segs=24)
    z += 0.24
k.lathe("gold", [(0.0, z), (0.55, z + 0.15), (0.6, z + 0.3), (0.2, z + 0.45), (0.12, z + 1.1), (0.0, z + 1.5)], segs=24)

k.finish(OUT, RENDER, look_at=(0, 0, 7), views=(("front", (0, -62, 6), 40), ("aerial", (40, -48, 38), 35)))
