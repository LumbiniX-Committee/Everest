"""
Newar pagoda temples of the three Durbar Squares (Kathmandu, Patan, Bhaktapur),
from one parametric builder: a stepped brick plinth, a brick sanctum with
carved wooden doors, tiered tile roofs on angled wooden struts, and a gilt
finial. Modelled in Blender by Sakshi.

    blender -b --factory-startup -noaudio --python tools/models/blender/newar-temple.py -- OUT.glb --temple ID [--render PREFIX]

A model, not a scan. Each temple's footprint (plinth size and position) is
its OpenStreetMap building; the number of roofs and plinth steps follow
Wikipedia and recent photos on Wikimedia Commons; every height is judged by
eye. The parameters below are the whole of what is known or estimated about
each one, and the comment beside each says where it comes from.
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

OUT, RENDER = kit.args()
ID = sys.argv[sys.argv.index("--temple") + 1]

# plinth: [(width, height)] bottom to top; storeys: [(wall width, wall height, eave half-width, roof height)]
# face: the side the stairs and main door face. aspect: depth / width for oblong temples.
TEMPLES = {
    # Bhaktapur, Taumadhi: five plinth terraces and five roofs, about 30 m (Wikipedia). OSM way 85470341.
    "nyatapola": dict(plinth=[(26, 1.8), (22.5, 1.8), (19, 1.8), (15.5, 1.8), (12, 1.8)],
                      storeys=[(8.0, 3.2, 7.0, 2.0), (6.6, 1.7, 6.0, 1.8), (5.4, 1.5, 5.0, 1.7), (4.3, 1.4, 4.0, 1.6), (3.2, 1.3, 3.0, 1.5)],
                      face="south", colonnade=True, finial=2.6),
    # Bhaktapur, Taumadhi: oblong, three roofs, a low plinth. OSM way 185746728.
    "bhairavnath": dict(plinth=[(17.5, 0.9)], storeys=[(15.0, 4.5, 9.0, 2.6), (11.5, 2.4, 7.0, 2.2), (8.0, 2.0, 5.2, 2.0)],
                        face="west", aspect=1.1, finial=2.2, many_finials=True),
    # Kathmandu: nine plinth steps, three roofs (Wikipedia: Maju Deval). OSM way 183562980.
    "maju-dega": dict(plinth=[(27.5 - i * 1.7, 0.95) for i in range(9)],
                      storeys=[(9.0, 3.8, 7.6, 2.4), (7.0, 2.0, 6.0, 2.0), (5.2, 1.7, 4.4, 1.8)],
                      face="east", finial=2.4),
    # Kathmandu: the rebuilt (2021) three-roofed rest house; open on the ground floor. OSM way 183558418.
    "kasthamandap": dict(plinth=[(25.0, 1.1)], storeys=[(20.0, 4.0, 12.0, 2.8), (15.5, 3.2, 9.5, 2.4), (10.0, 2.6, 6.5, 2.4)],
                         face="east", colonnade=True, open_ground=True, finial=2.4),
    # Kathmandu: Narayan temple, five-step plinth, three roofs. OSM way 111984927.
    "narayan-mandir": dict(plinth=[(16.0 - i * 1.4, 0.8) for i in range(5)],
                           storeys=[(7.0, 3.2, 6.0, 2.0), (5.5, 1.7, 4.8, 1.8), (4.0, 1.5, 3.6, 1.6)], face="west", finial=2.0),
    # Kathmandu: Trailokya Mohan Narayan, five-step plinth, three roofs. OSM way 1414593331.
    "trailokya-mohan": dict(plinth=[(15.0 - i * 1.3, 0.8) for i in range(5)],
                            storeys=[(6.6, 3.0, 5.6, 1.9), (5.2, 1.6, 4.5, 1.7), (3.8, 1.4, 3.4, 1.5)], face="west", finial=2.0),
    # Kathmandu: Jagannath, two roofs on a three-step plinth. OSM way 169429518.
    "jagannath": dict(plinth=[(17.0 - i * 1.6, 0.9) for i in range(3)],
                      storeys=[(10.0, 3.6, 7.2, 2.2), (7.0, 2.2, 5.4, 2.0)], face="west", colonnade=True, finial=2.2),
    # Patan: Hari Shankar, three roofs. OSM way 120443315.
    "hari-shankar": dict(plinth=[(11.9 - i * 1.2, 0.8) for i in range(3)],
                         storeys=[(6.6, 3.2, 5.4, 1.9), (5.0, 1.7, 4.3, 1.7), (3.6, 1.4, 3.2, 1.5)], face="east", finial=2.0),
}
T = TEMPLES[ID]
k = kit.Kit()
FACES = {"south": -math.pi / 2, "east": 0.0, "north": math.pi / 2, "west": math.pi}
ASPECT = T.get("aspect", 1.0)


def box(mat, z0, h, w, d=None, rot=0.0, centre=(0, 0)):
    d = w * ASPECT if d is None else d
    k.cube(mat, (centre[0], centre[1], z0 + h / 2), (w, d, h), rot)


def hip_roof(z, eave, top_half, h, wall_half):
    """A hipped tile roof from its eaves up to the wall above, with a timber fascia and struts under it."""
    e, t = eave, top_half
    pts = lambda hw, zz: [(-hw, -hw * ASPECT, zz), (hw, -hw * ASPECT, zz), (hw, hw * ASPECT, zz), (-hw, hw * ASPECT, zz)]
    k.prism("tile", pts(e, z), pts(t, z + h))
    k.prism("tile", pts(e + 0.05, z - 0.18), pts(e, z))  # thick eave edge
    # angled struts from the wall to under the eave, on each side
    for side in range(4):
        a = side * math.pi / 2
        n = Vector((math.cos(a), math.sin(a), 0))
        tang = Vector((-n.y, n.x, 0))
        half_wall = wall_half * (ASPECT if side % 2 else 1.0)
        half_span = wall_half * (1.0 if side % 2 else ASPECT)
        count = max(2, int(2 * half_span / 1.1))
        for i in range(count):
            s = -half_span + (i + 0.5) * (2 * half_span / count)
            base = n * half_wall + tang * s + Vector((0, 0, z - 1.6))
            tip = n * (half_wall + (e - wall_half) * 0.8) + tang * s + Vector((0, 0, z - 0.1))
            d = tip - base
            rot = d.to_track_quat("Z", "Y").to_matrix().to_4x4()
            m = Matrix.Translation((base + tip) / 2) @ rot @ Matrix.Diagonal((0.18, 0.26, d.length, 1))
            kit.bmesh.ops.create_cube(k.bm("wood"), size=1.0, matrix=m)


# plinth terraces, brick with stone coping, stairs on the main side
z = 0.0
face = FACES[T["face"]]
out = Vector((math.cos(face), math.sin(face), 0))
for i, (w, h) in enumerate(T["plinth"]):
    box("brick", z, h - 0.12, w)
    box("stone", z + h - 0.12, 0.12, w + 0.1)
    # flight of steps up this terrace on the main side
    nxt = T["plinth"][i + 1][0] if i + 1 < len(T["plinth"]) else T["storeys"][0][0]
    steps = max(3, round(h / 0.22))
    run = min((w - nxt) / 2 + 0.6, steps * 0.3)
    half_depth = (w * (ASPECT if abs(out.y) > 0.5 else 1.0)) / 2 if False else (w / 2 if abs(out.x) > 0.5 else w * ASPECT / 2)
    for sidx in range(steps):
        top = z + h * (sidx + 1) / steps
        dist = half_depth + run - (sidx + 0.5) * (run / steps)
        c = out * dist
        k.cube("stone", (c.x, c.y, (z + top) / 2), (run / steps, max(2.4, nxt * 0.3), top - z), face)
    z += h

# storeys and roofs
storeys = T["storeys"]
for i, (w, h, eave, roof_h) in enumerate(storeys):
    open_ground = i == 0 and T.get("open_ground")
    if open_ground:
        box("brick", z, 0.3, w)  # floor
        box("brick", z, h, w * 0.45)  # inner core
    else:
        box("brick", z, h, w)
    if i == 0 and T.get("colonnade") or open_ground:
        # carved wooden posts of the ambulatory round the ground floor
        hw, hd = w / 2 + 0.6, w * ASPECT / 2 + 0.6
        box("stone", z, 0.25, w + 1.6, w * ASPECT + 1.6)
        n = max(3, int(w / 1.4))
        for j in range(n + 1):
            f = -1 + 2 * j / n
            for (px, py) in ((f * hw, -hd), (f * hw, hd), (-hw, f * hd), (hw, f * hd)):
                k.cube("wood", (px, py, z + 0.25 + (h - 0.25) / 2), (0.28, 0.28, h - 0.25))
        box("wood", z + h - 0.35, 0.35, w + 1.5, w * ASPECT + 1.5)
    # doors on each side of the lower storeys, windows above
    for side in range(4):
        a = side * math.pi / 2
        n = Vector((math.cos(a), math.sin(a), 0))
        tang = Vector((-n.y, n.x, 0))
        half = (w / 2) * (ASPECT if side % 2 else 1.0)
        span = (w / 2) * (1.0 if side % 2 else ASPECT)
        if open_ground:
            continue
        count = 3 if (i == 0 and span > 2.5) else 1
        for j in range(count):
            s = (j - (count - 1) / 2) * min(1.6, span * 0.5)
            c = n * (half + 0.03) + tang * s
            dh = h * (0.62 if i == 0 else 0.5)
            k.cube("wood", (c.x, c.y, z + (0.1 if i == 0 else h * 0.25) + dh / 2), (0.1, 0.9 if i == 0 else 1.1, dh), a)
            k.cube("wood", (c.x, c.y, z + (0.1 if i == 0 else h * 0.25) + dh + 0.15), (0.16, 1.3 if i == 0 else 1.5, 0.3), a)
        if i == 0 and abs(a - face) % (2 * math.pi) < 0.01:
            c = n * (half + 0.08)
            frame = Matrix.Translation((c.x, c.y, z + h * 0.62 + 0.45)) @ Matrix.Rotation(a - math.pi / 2, 4, "Z")
            k.plate("gold", [(-0.9, 0), (0.9, 0), (0.7, 0.5), (0.25, 0.95), (0, 1.1), (-0.25, 0.95), (-0.7, 0.5)], frame, depth=0.08)
    z += h
    nxt_w = storeys[i + 1][0] if i + 1 < len(storeys) else w * 0.35
    hip_roof(z, eave, nxt_w / 2, roof_h, w / 2)
    z += roof_h

# gilt finial (gajur), one or a row along the ridge of an oblong roof
xs = [0.0]
if T.get("many_finials"):
    span = storeys[-1][0] * ASPECT * 0.35
    xs = [-span, 0.0, span]
fz = z
for y in xs:
    m = Matrix.Translation((0, y, 0))
    f = T["finial"]
    k.lathe("gold", [(0.0, fz - 0.1), (0.75, fz - 0.1), (0.85, fz + 0.15), (0.5, fz + f * 0.35), (0.62, fz + f * 0.45),
                     (0.28, fz + f * 0.6), (0.2, fz + f * 0.85), (0.0, fz + f)], segs=20, matrix=m)

k.finish(OUT, RENDER, look_at=(0, 0, z * 0.45),
         views=(("front", (out.x * 55, out.y * 55, 8), 40), ("aerial", (out.x * 35 + 25, out.y * 35 - 15, 30), 35)))
