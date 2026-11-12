"""
World Peace Pagoda (Shanti Stupa), Lumbini: modelled in Blender by Sakshi.

    blender -b --factory-startup -noaudio --python tools/models/blender/world-peace-pagoda.py -- OUT.glb [--render PREFIX]

A model, not a scan. Built from scratch in Blender (no scan geometry used).
Sources, and how much each one decides:
  - OpenStreetMap way 844764523 ("Shanti Stupa (World Peace Pagoda)"):
    footprint about 62 m across, so the lowest terrace is 62 m. The only
    measured size.
  - Wikipedia "World Peace Pagoda, Lumbini": three levels of stairs, four
    golden Buddhas facing the four directions, whitewash and stone floors.
  - Photos on Wikimedia Commons (CC BY / CC BY-SA, credited in LICENCES.md)
    and the poster of Bhugol Tour's Sketchfab scan, as visual references
    only. Heights and the shapes of the drum, harmika, rings and finial
    were judged by eye from them against the 62 m footprint, so every height
    here is an estimate.

Axes: Blender Z up, +Y north, +X east (exported glTF: Y up, -Z north), metres,
ground at Z=0, centred on the stupa. Main stairs face south, as the entrance
path does on the map; the other three sides have stairs too, smaller.
"""
import math
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "/tmp/world-peace-pagoda.glb"
RENDER = argv[argv.index("--render") + 1] if "--render" in argv else None

bpy.ops.wm.read_factory_settings(use_empty=True)

# ---------------------------------------------------------------- materials
def material(name, color, rough, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    return m

MATS = {
    "plaster": material("Whitewash", (0.80, 0.80, 0.78), 0.85),
    "stone": material("Stone paving", (0.58, 0.55, 0.50), 0.9),
    "gold": material("Gilt", (1.0, 0.74, 0.32), 0.4, 0.35),  # half-metallic: the map has no reflections for full metal
    "niche": material("Niche, gilt and ochre", (0.42, 0.26, 0.09), 0.5, 0.3),
    "dark": material("Doorways", (0.10, 0.10, 0.10), 0.9),
}
BMS = {k: bmesh.new() for k in MATS}


def cube(mat, centre, size, rot_z=0.0):
    M = Matrix.Translation(Vector(centre)) @ Matrix.Rotation(rot_z, 4, "Z") @ Matrix.Diagonal((*size, 1))
    bmesh.ops.create_cube(BMS[mat], size=1.0, matrix=M)


def prism(mat, a_pts, b_pts):
    """Closed solid from two matching outlines; normals made to face outward."""
    tmp = bmesh.new()
    a_ = [tmp.verts.new(v) for v in a_pts]
    b_ = [tmp.verts.new(v) for v in b_pts]
    tmp.faces.new(a_)
    tmp.faces.new(list(reversed(b_)))
    n = len(a_)
    for i in range(n):
        j = (i + 1) % n
        tmp.faces.new((a_[i], a_[j], b_[j], b_[i]))
    bmesh.ops.recalc_face_normals(tmp, faces=tmp.faces)
    me = bpy.data.meshes.new("tmp")
    tmp.to_mesh(me)
    tmp.free()
    BMS[mat].from_mesh(me)
    bpy.data.meshes.remove(me)


def lathe(mat, profile, segs=96, cap_top=False, cap_bottom=False, scale_y=1.0, matrix=None):
    """Revolve [(radius, z), ...] about Z."""
    bm = BMS[mat]
    rings = []
    for r, z in profile:
        ring = []
        for i in range(segs):
            a = 2 * math.pi * i / segs
            v = Vector((r * math.cos(a), r * math.sin(a) * scale_y, z))
            if matrix is not None:
                v = matrix @ v
            ring.append(bm.verts.new(v))
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for i in range(segs):
            j = (i + 1) % segs
            bm.faces.new((a[i], a[j], b[j], b[i]))
    if cap_bottom:
        bm.faces.new(list(reversed(rings[0])))
    if cap_top:
        bm.faces.new(rings[-1])


def ring_band(mat, r_in, r_out, z0, z1, segs=128):
    """A solid annulus (terrace, rail)."""
    lathe(mat, [(r_in, z0), (r_out, z0), (r_out, z1), (r_in, z1), (r_in, z0)], segs)


# Cardinal stairs: (angle of the outward direction from +X, half width per level)
DIRS = {"south": -math.pi / 2, "east": 0.0, "north": math.pi / 2, "west": math.pi}
MAIN = "south"


def stair_half(level, d):
    return {1: 8.0 if d == MAIN else 4.5, 2: 4.0 if d == MAIN else 3.0, 3: 4.0 if d == MAIN else 3.0}[level]


def in_gap(angle, r, level, pad=0.35):
    for d, a in DIRS.items():
        da = math.atan2(math.sin(angle - a), math.cos(angle - a))
        if abs(da) < math.pi / 2 and abs(r * math.sin(da)) < stair_half(level, d) + pad:
            return True
    return False


def balustrade(r, z, level, height=1.1):
    """Pierced railing as seen on site: posts, top and bottom rails, balusters."""
    circ = 2 * math.pi * r
    n = int(circ / 0.45)
    for i in range(n):
        a = 2 * math.pi * i / n
        if in_gap(a, r, level):
            continue
        post = i % 4 == 0
        w = 0.26 if post else 0.11
        h = height if post else height - 0.1
        c = (r * math.cos(a), r * math.sin(a), z + h / 2)
        cube("plaster", c, (w, w * (1.0 if post else 1.6), h), a)
    # rails as short straight pieces between the gaps
    seg = int(circ / 0.9)
    for i in range(seg):
        a0 = 2 * math.pi * i / seg
        a1 = 2 * math.pi * (i + 1) / seg
        am = (a0 + a1) / 2
        if in_gap(a0, r, level) or in_gap(a1, r, level):
            continue
        L = 2 * r * math.sin((a1 - a0) / 2) + 0.02
        for zz, th, wd in ((z + height - 0.08, 0.16, 0.30), (z + 0.12, 0.24, 0.24)):
            cube("plaster", (r * math.cos(am), r * math.sin(am), zz), (wd, L, th), am)


def stairs(d, z0, z1, r_start, half, level, cheek=True):
    """Straight flight running outward from r_start (top) down to z0."""
    a = DIRS[d]
    out = Vector((math.cos(a), math.sin(a), 0))
    side = Vector((-math.sin(a), math.cos(a), 0))
    rise, tread = 0.16, 0.32
    n = max(1, round((z1 - z0) / rise))
    rise = (z1 - z0) / n
    for k in range(n):
        top = z0 + rise * (k + 1)
        dist = r_start + (n - 1 - k) * tread
        c = out * (dist + tread / 2)
        # each step is a block down to the ground of the flight
        cube("stone", (c.x, c.y, (z0 + top) / 2), (tread, 2 * half, top - z0), a)
    run = n * tread
    if cheek:
        # sloped cheek walls following the steps, about a metre above them
        for s in (-1, 1):
            off = side * (s * (half + 0.2))
            prof = [(r_start + run, z0), (r_start, z0), (r_start, z1 + 1.0), (r_start + run, z0 + 1.0)]
            prism("plaster", *[[out * d + off + side * w + Vector((0, 0, zz)) for d, zz in prof] for w in (-0.2, 0.2)])
    return run


# ---------------------------------------------------------------- terraces
T = [  # (level, radius, deck height)
    (1, 31.0, 4.8),
    (2, 23.0, 7.6),
    (3, 17.5, 10.0),
]

# paved ring around the base, where the walking path goes
ring_band("stone", 0.0, 34.0, 0.0, 0.06, segs=128)

prev_z = 0.0
for level, r, z in T:
    # solid drum of the terrace with a plinth moulding and a coping
    lathe("plaster", [(0.0, prev_z), (r + 0.25, prev_z), (r + 0.25, prev_z + 0.5), (r, prev_z + 0.5),
                      (r, z - 0.35), (r + 0.3, z - 0.35), (r + 0.3, z - 0.15), (r, z - 0.15), (r, z)], segs=160)
    # stone deck, in rings so baked shading has vertices to live on
    lathe("stone", [(r * f, z + 0.02) for f in (1.0, 0.97, 0.9, 0.75, 0.55)] + [(0.0, z + 0.02)], segs=160)
    balustrade(r - 0.35, z, level)
    prev_z = z

# doorways into the rooms under the first terrace, as seen in photos
for i in range(16):
    a = 2 * math.pi * (i + 0.5) / 16
    if in_gap(a, 31.0, 1, pad=3.0):
        continue
    cube("dark", (31.02 * math.cos(a), 31.02 * math.sin(a), 1.4), (0.1, 1.2, 2.2), a)

# stairs: ground -> 1, 1 -> 2, 2 -> 3, on all four sides
for d in DIRS:
    stairs(d, 0.0, T[0][2], T[0][1], stair_half(1, d), 1)
    stairs(d, T[0][2], T[1][2], T[1][1], stair_half(2, d), 2)
    stairs(d, T[1][2], T[2][2], T[2][1], stair_half(3, d), 3)

# ---------------------------------------------------------------- stupa body
Z0 = T[2][2]
R_DRUM = 11.6
# plinth, drum and cornice
lathe("plaster", [(0.0, Z0), (13.0, Z0), (13.0, Z0 + 0.5), (12.4, Z0 + 0.5), (12.4, Z0 + 1.0),
                  (R_DRUM, Z0 + 1.0), (R_DRUM, Z0 + 5.3), (12.0, Z0 + 5.3), (12.0, Z0 + 5.6),
                  (11.2, Z0 + 5.6)], segs=160)
# two bands of relief panels round the drum
for zc in (Z0 + 2.1, Z0 + 3.9):
    n = 80
    for i in range(n):
        a = 2 * math.pi * (i + 0.5) / n
        if any(abs(math.atan2(math.sin(a - da), math.cos(a - da))) < 0.22 for da in DIRS.values()):
            continue
        cube("plaster", ((R_DRUM + 0.05) * math.cos(a), (R_DRUM + 0.05) * math.sin(a), zc), (0.16, 0.62, 1.2), a)
    lathe("plaster", [(R_DRUM + 0.12, zc - 0.85), (R_DRUM + 0.12, zc - 0.7)], segs=160)

# dome: a slightly flattened half sphere
ZD = Z0 + 5.6
RD, HD = 11.1, 9.0
lathe("plaster", [(RD * math.cos(t), ZD + HD * math.sin(t))
                  for t in [i * (math.pi / 2) / 24 for i in range(24)]] + [(0.0, ZD + HD)], segs=128)

# four niches with gilt Buddhas, one to each direction
for d, a in DIRS.items():
    out = Vector((math.cos(a), math.sin(a), 0))
    side = Vector((-math.sin(a), math.cos(a), 0))
    zb = Z0 + 1.0
    w_open, h_open = 3.2, 6.2
    face = R_DRUM + 0.9
    # back of the niche, in front of drum and dome
    back = out * (face - 0.7)
    cube("niche", (back.x, back.y, zb + h_open / 2 + 0.3), (0.2, w_open, h_open + 0.6), a)
    # frame: two piers and a lintel with a pointed (ogee) crown
    for s in (-1, 1):
        p = out * face + side * (s * (w_open / 2 + 0.35))
        cube("plaster", (p.x, p.y, zb + (h_open + 1.0) / 2), (1.6, 0.7, h_open + 1.0), a)
    top = out * face
    cube("plaster", (top.x, top.y, zb + h_open + 0.5), (1.6, w_open + 1.4, 1.0), a)
    crown = Matrix.Translation(Vector((top.x, top.y, zb + h_open + 1.0))) @ Matrix.Rotation(a, 4, "Z")
    hw = (w_open + 1.4) / 2
    pts = [(-hw, 0), (hw, 0), (hw * 0.55, 0.7), (0.18, 1.5), (0, 1.9), (-0.18, 1.5), (-hw * 0.55, 0.7)]
    prism("plaster", [crown @ Vector((0.8, x, z)) for x, z in pts], [crown @ Vector((-0.8, x, z)) for x, z in pts])
    # sill and the statue on a lotus seat
    sill = out * (face - 0.1)
    cube("plaster", (sill.x, sill.y, zb + 0.25), (1.6, w_open, 0.5), a)
    sm = Matrix.Translation(out * (face - 0.25) + Vector((0, 0, zb + 0.5))) @ Matrix.Rotation(a + math.pi / 2, 4, "Z")
    lathe("gold", [(0.0, 0.0), (0.75, 0.0), (0.95, 0.25), (0.7, 0.45), (0.0, 0.45)], segs=24, matrix=sm)
    lathe("gold", [(0.0, 0.45), (0.42, 0.45), (0.5, 1.4), (0.46, 2.5), (0.36, 3.0), (0.0, 3.05)],
          segs=24, scale_y=0.6, matrix=sm)
    lathe("gold", [(0.0, 3.0), (0.22, 3.05), (0.3, 3.3), (0.26, 3.55), (0.16, 3.7), (0.1, 3.85), (0.0, 3.9)],
          segs=20, matrix=sm)
    # mandorla behind the figure
    mm = sm @ Matrix.Translation((0, 0.3, 2.2)) @ Matrix.Rotation(math.pi / 2, 4, "X") @ Matrix.Diagonal((1.25, 2.0, 1, 1))
    bmesh.ops.create_cone(BMS["gold"], cap_ends=True, segments=32, radius1=1.0, radius2=0.9, depth=0.08, matrix=mm)

# ---------------------------------------------------------------- harmika, rings, finial
ZH = ZD + HD - 0.4
cube("plaster", (0, 0, ZH + 0.3), (7.4, 7.4, 0.6))
cube("plaster", (0, 0, ZH + 1.9), (6.0, 6.0, 2.6))
for s in (-1, 1):  # the lattice on each face
    for k in range(5):
        x = -2.2 + k * 1.1
        cube("plaster", (x, s * 3.04, ZH + 1.9), (0.22, 0.12, 2.2))
        cube("plaster", (s * 3.04, x, ZH + 1.9), (0.12, 0.22, 2.2))
cube("gold", (0, -3.08, ZH + 1.9), (0.7, 0.08, 0.7))  # the dharma wheel on the front face
cube("plaster", (0, 0, ZH + 3.4), (7.4, 7.4, 0.4))
cube("plaster", (0, 0, ZH + 3.8), (8.4, 8.4, 0.45))
ZR = ZH + 4.0
lathe("plaster", [(0.0, ZR), (1.7, ZR), (1.7, ZR + 0.7), (0.0, ZR + 0.7)], segs=48)
z = ZR + 0.7
for k, r in enumerate((3.3, 2.95, 2.6, 2.25, 1.9)):
    t = 0.75
    lathe("plaster", [(0.0, z), (r * 0.82, z), (r, z + t * 0.3), (r, z + t * 0.65), (r * 0.85, z + t), (0.0, z + t)], segs=64)
    z += t
    lathe("plaster", [(0.0, z), (r * 0.5, z), (r * 0.5, z + 0.5), (0.0, z + 0.5)], segs=32)
    z += 0.5
lathe("gold", [(0.0, z), (1.1, z), (1.35, z + 0.35), (0.9, z + 0.6), (0.0, z + 0.6)], segs=32)
z += 0.6
for rot in (0.0, math.pi / 2):  # flame finial, flat, crossed so it reads from every side
    fm = Matrix.Translation((0, 0, z)) @ Matrix.Rotation(rot, 4, "Z")
    lathe("gold", [(0.0, 0.0), (0.9, 0.3), (1.3, 1.0), (1.2, 1.9), (0.8, 2.7), (0.35, 3.2), (0.0, 3.5)],
          segs=24, scale_y=0.22, matrix=fm)
TOP = z + 3.5

# ---------------------------------------------------------------- objects
objs = []
for k, bm in BMS.items():
    if not bm.verts:
        continue
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.001)
    me = bpy.data.meshes.new(k)
    bm.to_mesh(me)
    ob = bpy.data.objects.new(f"pagoda-{k}", me)
    ob.data.materials.append(MATS[k])
    bpy.context.scene.collection.objects.link(ob)
    for p in me.polygons:
        p.use_smooth = k in ("gold",)
    objs.append(ob)

# smooth the curved plaster but keep crisp edges
for ob in objs:
    ob.data.set_sharp_from_angle(angle=math.radians(35)) if hasattr(ob.data, "set_sharp_from_angle") else None
    if ob.name == "pagoda-plaster":
        for p in ob.data.polygons:
            p.use_smooth = True
        mod = ob.modifiers.new("autosmooth", "EDGE_SPLIT")
        mod.split_angle = math.radians(35)
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.modifier_apply(modifier=mod.name)

# ---------------------------------------------------------------- baked ambient occlusion
# Soft contact shadows into vertex colours, so the white reads in flat map light.
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 64
world = bpy.data.worlds.new("sky")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.75, 0.82, 0.95, 1)
world.light_settings.distance = 2.5
for ob in objs:
    me = ob.data
    # more vertices on big flat faces so the shading has somewhere to go
    bm = bmesh.new()
    bm.from_mesh(me)
    long_edges = [e for e in bm.edges if e.calc_length() > 1.5]
    if long_edges:
        bmesh.ops.subdivide_edges(bm, edges=long_edges, cuts=2, use_grid_fill=True)
    bm.to_mesh(me)
    bm.free()
    me.color_attributes.new("ao", "BYTE_COLOR", "POINT")
    me.color_attributes.active_color = me.color_attributes["ao"]
    me.color_attributes.render_color_index = list(me.color_attributes).index(me.color_attributes["ao"])
    mat = me.materials[0]
    nt = mat.node_tree
    if "ao" not in nt.nodes:
        attr = nt.nodes.new("ShaderNodeVertexColor")
        attr.name = "ao"
        attr.layer_name = "ao"
        mix = nt.nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.blend_type = "MULTIPLY"
        mix.inputs["Factor"].default_value = 1.0
        p = nt.nodes["Principled BSDF"]
        mix.inputs[6].default_value = p.inputs["Base Color"].default_value
        nt.links.new(attr.outputs["Color"], mix.inputs[7])
        nt.links.new(mix.outputs[2], p.inputs["Base Color"])
for ob in objs:
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    scene.render.bake.target = "VERTEX_COLORS"
    bpy.ops.object.bake(type="AO", target="VERTEX_COLORS")
    ca = ob.data.color_attributes["ao"].data
    print("ao", ob.name, round(sum(c.color[0] for c in ca) / max(1, len(ca)), 3))
print("verts", sum(len(o.data.vertices) for o in objs), "height", round(TOP, 1))

# ---------------------------------------------------------------- export
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_apply=True,
                          export_colors=True, export_yup=True)

# ---------------------------------------------------------------- optional check renders
if RENDER:
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 4.0
    sun.rotation_euler = (math.radians(50), 0, math.radians(35))
    scene.collection.objects.link(sun)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.8
    scene.render.resolution_x, scene.render.resolution_y = 960, 640
    scene.cycles.samples = 24
    scene.cycles.use_denoising = False
    scene.view_settings.view_transform = "AgX" if "AgX" in [i.identifier for i in scene.view_settings.bl_rna.properties["view_transform"].enum_items] else "Filmic"
    grass = bpy.data.meshes.new("grass")
    bmg = bmesh.new()
    bmesh.ops.create_grid(bmg, x_segments=1, y_segments=1, size=150)
    bmg.to_mesh(grass)
    g = bpy.data.objects.new("grass", grass)
    g.data.materials.append(material("Grass", (0.20, 0.32, 0.12), 1.0))
    scene.collection.objects.link(g)
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    scene.collection.objects.link(cam)
    scene.camera = cam
    for name, loc, lens in (("front", (0, -95, 9), 42), ("aerial", (55, -70, 55), 35)):
        cam.location = loc
        cam.data.lens = lens
        direction = Vector((0, 0, 18)) - Vector(loc)
        cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = f"{RENDER}-{name}.png"
        bpy.ops.render.render(write_still=True)
