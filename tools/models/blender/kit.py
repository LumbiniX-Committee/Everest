"""
Shared building blocks for Sakshi's own Blender models (see the scripts beside
this file). Each model script does:

    import kit
    k = kit.Kit()
    k.cube("plaster", centre, size)        # boxes
    k.lathe("gold", [(r, z), ...])         # turned shapes
    k.prism("dark", outline_a, outline_b)  # closed solids from two outlines
    k.finish(out_glb, render_prefix)       # bake soft shadows, export, render

Conventions: metres, Z up, +Y north, +X east, ground at Z=0 (the exported glTF
is Y up with north toward -Z, which is what the map expects). Materials are
plain PBR colours; ambient occlusion is baked into vertex colours so a white
building keeps its shape in the map's flat light, without any texture files.
"""
import math

import bmesh
import bpy
from mathutils import Matrix, Vector

PALETTE = {
    "plaster": ((0.80, 0.80, 0.78), 0.85, 0.0),
    "stone": ((0.58, 0.55, 0.50), 0.9, 0.0),
    "brick": ((0.34, 0.11, 0.06), 0.9, 0.0),
    "red": ((0.55, 0.06, 0.05), 0.8, 0.0),
    "gold": ((1.0, 0.74, 0.32), 0.4, 0.35),  # half-metallic: the map has no reflections for full metal to show
    "bronze": ((0.42, 0.29, 0.16), 0.5, 0.3),
    "niche": ((0.42, 0.26, 0.09), 0.5, 0.3),
    "dark": ((0.10, 0.10, 0.10), 0.9, 0.0),
    "iron": ((0.06, 0.06, 0.07), 0.55, 0.7),
    "glass": ((0.05, 0.07, 0.08), 0.2, 0.0),
    "white": ((0.92, 0.92, 0.90), 0.6, 0.0),
    "blue": ((0.08, 0.20, 0.55), 0.6, 0.0),
    "green": ((0.05, 0.40, 0.18), 0.8, 0.0),
    "yellow": ((0.85, 0.62, 0.05), 0.8, 0.0),
    "saffron": ((0.85, 0.35, 0.03), 0.8, 0.0),
    "tile": ((0.17, 0.09, 0.06), 0.85, 0.0),
    "wood": ((0.20, 0.11, 0.06), 0.75, 0.0),
}


class Kit:
    def __init__(self):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        self.mats = {}
        self.bms = {}

    # ------------------------------------------------------------ materials
    def bm(self, mat):
        if mat not in self.bms:
            color, rough, metal = PALETTE[mat]
            m = bpy.data.materials.new(mat)
            m.use_nodes = True
            p = m.node_tree.nodes["Principled BSDF"]
            p.inputs["Base Color"].default_value = (*color, 1)
            p.inputs["Roughness"].default_value = rough
            p.inputs["Metallic"].default_value = metal
            self.mats[mat] = m
            self.bms[mat] = bmesh.new()
        return self.bms[mat]

    # ------------------------------------------------------------ shapes
    def cube(self, mat, centre, size, rot_z=0.0):
        M = Matrix.Translation(Vector(centre)) @ Matrix.Rotation(rot_z, 4, "Z") @ Matrix.Diagonal((*size, 1))
        bmesh.ops.create_cube(self.bm(mat), size=1.0, matrix=M)

    def cylinder(self, mat, centre, radius, height, segs=24, radius_top=None, matrix=None):
        M = Matrix.Translation(Vector(centre)) if matrix is None else matrix
        bmesh.ops.create_cone(self.bm(mat), cap_ends=True, segments=segs, radius1=radius,
                              radius2=radius if radius_top is None else radius_top, depth=height, matrix=M)

    def lathe(self, mat, profile, segs=96, scale_y=1.0, matrix=None, cap_top=False):
        """Revolve [(radius, z), ...] about Z. Profile bottom/outside first, so faces point out."""
        bm = self.bm(mat)
        rings = []
        for r, z in profile:
            ring = []
            for i in range(segs):
                a = 2 * math.pi * i / segs
                v = Vector((r * math.cos(a), r * math.sin(a) * scale_y, z))
                ring.append(bm.verts.new(matrix @ v if matrix is not None else v))
            rings.append(ring)
        for a, b in zip(rings, rings[1:]):
            for i in range(segs):
                j = (i + 1) % segs
                bm.faces.new((a[i], a[j], b[j], b[i]))
        if cap_top:
            bm.faces.new(rings[-1])

    def prism(self, mat, a_pts, b_pts):
        """Closed solid from two matching outlines; normals made to face outward."""
        tmp = bmesh.new()
        a_ = [tmp.verts.new(Vector(v)) for v in a_pts]
        b_ = [tmp.verts.new(Vector(v)) for v in b_pts]
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
        self.bm(mat).from_mesh(me)
        bpy.data.meshes.remove(me)

    def plate(self, mat, outline, frame, depth=0.06):
        """A flat shape drawn in (x, z) on a wall: `frame` places it (origin on the wall, +Y out of it)."""
        a = [frame @ Vector((x, depth, z)) for x, z in outline]
        b = [frame @ Vector((x, 0.0, z)) for x, z in outline]
        self.prism(mat, a, b)

    # ------------------------------------------------------------ output
    def finish(self, out, render=None, ao_distance=2.5, look_at=(0, 0, 10), views=None, colorize=None):
        objs = []
        for k, bm in self.bms.items():
            if not bm.verts:
                continue
            bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.001)
            me = bpy.data.meshes.new(k)
            bm.to_mesh(me)
            ob = bpy.data.objects.new(f"model-{k}", me)
            ob.data.materials.append(self.mats[k])
            bpy.context.scene.collection.objects.link(ob)
            for p in me.polygons:
                p.use_smooth = True
            mod = ob.modifiers.new("crisp", "EDGE_SPLIT")
            mod.split_angle = math.radians(35)
            bpy.context.view_layer.objects.active = ob
            bpy.ops.object.modifier_apply(modifier=mod.name)
            objs.append(ob)

        scene = bpy.context.scene
        scene.render.engine = "CYCLES"
        scene.cycles.device = "CPU"
        scene.cycles.samples = 64
        world = bpy.data.worlds.new("sky")
        scene.world = world
        world.use_nodes = True
        world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.75, 0.82, 0.95, 1)
        world.light_settings.distance = ao_distance
        for ob in objs:
            me = ob.data
            bm = bmesh.new()
            bm.from_mesh(me)
            long_edges = [e for e in bm.edges if e.calc_length() > 0.45]
            if long_edges:
                bmesh.ops.subdivide_edges(bm, edges=long_edges, cuts=2, use_grid_fill=True)
            bm.to_mesh(me)
            bm.free()
            me.color_attributes.new("ao", "BYTE_COLOR", "POINT")
            me.color_attributes.active_color = me.color_attributes["ao"]
            me.color_attributes.render_color_index = list(me.color_attributes).index(me.color_attributes["ao"])
            nt = me.materials[0].node_tree
            attr = nt.nodes.new("ShaderNodeVertexColor")
            attr.layer_name = "ao"
            mix = nt.nodes.new("ShaderNodeMix")
            mix.data_type = "RGBA"
            mix.blend_type = "MULTIPLY"
            mix.inputs["Factor"].default_value = 1.0
            p = nt.nodes["Principled BSDF"]
            mix.inputs[6].default_value = p.inputs["Base Color"].default_value
            nt.links.new(attr.outputs["Color"], mix.inputs[7])
            nt.links.new(mix.outputs[2], p.inputs["Base Color"])
        scene.render.bake.target = "VERTEX_COLORS"
        for ob in objs:
            bpy.ops.object.select_all(action="DESELECT")
            ob.select_set(True)
            bpy.context.view_layer.objects.active = ob
            bpy.ops.object.bake(type="AO", target="VERTEX_COLORS")
            if colorize:
                # a model may tint its own vertices (painted patterns) on top of the shading
                ca = ob.data.color_attributes["ao"].data
                for v, c in zip(ob.data.vertices, ca):
                    tint = colorize(ob.name[len("model-"):], v.co)
                    if tint is not None:
                        c.color = (c.color[0] * tint[0], c.color[1] * tint[1], c.color[2] * tint[2], 1.0)
        verts = sum(len(o.data.vertices) for o in objs)
        top = max((o.matrix_world @ v.co).z for o in objs for v in o.data.vertices)
        print("verts", verts, "height", round(top, 1))

        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=True, export_apply=True,
                                  export_colors=True, export_yup=True)
        if render:
            self.render(render, look_at, views or (("front", (0, -70, 8), 40), ("aerial", (45, -55, 45), 35)))

    def render(self, prefix, look_at, views):
        scene = bpy.context.scene
        sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
        sun.data.energy = 4.0
        sun.rotation_euler = (math.radians(50), 0, math.radians(35))
        scene.collection.objects.link(sun)
        scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.8
        scene.render.resolution_x, scene.render.resolution_y = 960, 640
        scene.cycles.samples = 24
        scene.cycles.use_denoising = False
        grass = bpy.data.meshes.new("grass")
        bmg = bmesh.new()
        bmesh.ops.create_grid(bmg, x_segments=1, y_segments=1, size=150)
        bmg.to_mesh(grass)
        g = bpy.data.objects.new("grass", grass)
        gm = bpy.data.materials.new("grass")
        gm.use_nodes = True
        gm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.20, 0.32, 0.12, 1)
        g.data.materials.append(gm)
        g.location.z = -0.01
        scene.collection.objects.link(g)
        cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
        scene.collection.objects.link(cam)
        scene.camera = cam
        for name, loc, lens in views:
            cam.location = loc
            cam.data.lens = lens
            cam.rotation_euler = (Vector(look_at) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
            scene.render.filepath = f"{prefix}-{name}.png"
            bpy.ops.render.render(write_still=True)


def args():
    import sys
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    out = argv[0] if argv else "/tmp/model.glb"
    render = argv[argv.index("--render") + 1] if "--render" in argv else None
    return out, render
