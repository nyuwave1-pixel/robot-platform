# Modelling helpers for the SPECIAL SOLDIER asset build (Blender 5.3, headless or interactive).
# Every asset is an "assembly": named groups of meshes with pivots, exported as a glTF node hierarchy
# the game animates by node name (legL, rotor, turret, mag ...).
import math
import bpy
import bmesh
from mathutils import Vector, Matrix, Euler
from mathutils.bvhtree import BVHTree

# cosine-weighted hemisphere sample directions (tangent, bitangent, normal)
AO_DIRS = [(math.cos(a) * math.sin(e), math.sin(a) * math.sin(e), math.cos(e)) for e, n in ((0.25, 4), (0.7, 8), (1.15, 10)) for a in [(i + 0.5 * (n % 3)) * 2 * math.pi / n for i in range(n)]]

MATS = {}


def mat(name, color, rough=0.7, metal=0.0, emit=None, alpha=1.0):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*emit[:3], 1)
        b.inputs['Emission Strength'].default_value = emit[3]
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
        m.surface_render_method = 'BLENDED'
    m.diffuse_color = (*color, alpha)
    MATS[name] = m
    return m


def _bake(bm, bevel=0.0, seg=2, subsurf=0, smooth=0.6, displace=None, decimate=None):
    """bmesh → evaluated mesh datablock with modifiers applied."""
    me = bpy.data.meshes.new('tmp')
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new('tmp', me)
    bpy.context.scene.collection.objects.link(ob)
    if bevel > 0:
        m = ob.modifiers.new('bevel', 'BEVEL'); m.width = bevel; m.segments = seg; m.limit_method = 'ANGLE'; m.angle_limit = 0.6
    if subsurf:
        m = ob.modifiers.new('sub', 'SUBSURF'); m.levels = subsurf; m.render_levels = subsurf
    if displace:
        tex = bpy.data.textures.new('noise', 'CLOUDS'); tex.noise_scale = displace[1]; tex.noise_depth = 2
        m = ob.modifiers.new('disp', 'DISPLACE'); m.texture = tex; m.strength = displace[0]; m.texture_coords = 'GLOBAL'
    if decimate:
        m = ob.modifiers.new('dec', 'DECIMATE'); m.ratio = decimate
    dg = bpy.context.evaluated_depsgraph_get()
    out = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    bpy.data.objects.remove(ob)
    bpy.data.meshes.remove(me)
    for p in out.polygons:
        p.use_smooth = True
    if smooth:
        try:
            out.set_sharp_from_angle(angle=smooth)
        except Exception:
            pass
    return out


class Asm:
    def __init__(self, name):
        self.name = name
        self.groups = {'root': []}
        self.pivots = {'root': Vector((0, 0, 0))}
        self.parents = {}
        self.markers = []

    def pivot(self, group, loc, parent='root'):
        self.groups.setdefault(group, [])
        self.pivots[group] = Vector(loc)
        self.parents[group] = parent

    def marker(self, name, loc, group='root'):
        self.markers.append((name, Vector(loc), group))

    def _add(self, group, me, M, material):
        me.transform(M)
        me.materials.append(material)
        self.groups.setdefault(group, []).append(me)
        return me

    @staticmethod
    def _M(loc, rot=(0, 0, 0), scale=(1, 1, 1)):
        return Matrix.Translation(Vector(loc)) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal((*scale, 1))

    def box(self, g, size, loc, m, rot=(0, 0, 0), bevel=0.008, seg=2, taper=None, subsurf=0, shear=0.0):
        """taper=(tx,ty): scale of the +Z face relative to the base; shear: +Z face offset along Y."""
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0, calc_uvs=True)
        for v in bm.verts:
            v.co.x *= size[0]; v.co.y *= size[1]; v.co.z *= size[2]
            if v.co.z > 0:
                if taper:
                    v.co.x *= taper[0]; v.co.y *= taper[1]
                v.co.y += shear
        return self._add(g, _bake(bm, min(bevel, min(size) * 0.45), seg, subsurf), self._M(loc, rot), m)

    def cyl(self, g, r, depth, loc, m, rot=(0, 0, 0), r2=None, n=16, bevel=0.0, scale=(1, 1, 1), seg=2):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=n, radius1=r, radius2=r if r2 is None else r2, depth=depth, calc_uvs=True)
        return self._add(g, _bake(bm, bevel, seg, 0, 0.8), self._M(loc, rot, scale), m)

    def limb(self, g, p0, p1, r0, r1, m, n=12, bevel=0.0):
        p0, p1 = Vector(p0), Vector(p1)
        d = p1 - p0
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=n, radius1=r0, radius2=r1, depth=d.length, calc_uvs=True)
        M = Matrix.Translation((p0 + p1) / 2) @ Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
        return self._add(g, _bake(bm, bevel, 2, 0, 0.9), M, m)

    def sphere(self, g, r, loc, m, scale=(1, 1, 1), seg=16, rot=(0, 0, 0), cut_below=None, cut_y=None):
        """cut_below: remove everything under local z; cut_y: remove everything with local y below the value (after scale)."""
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=max(8, seg // 2 + 2), radius=r, calc_uvs=True)
        for v in bm.verts:
            v.co.x *= scale[0]; v.co.y *= scale[1]; v.co.z *= scale[2]
        if cut_below is not None:
            bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, cut_below), plane_no=(0, 0, -1), clear_outer=True)
            bmesh.ops.holes_fill(bm, edges=bm.edges[:])
        if cut_y is not None:
            bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, cut_y, 0), plane_no=(0, -1, 0), clear_inner=True)
            bmesh.ops.holes_fill(bm, edges=bm.edges[:])
        return self._add(g, _bake(bm, 0, 2, 0, 1.2), self._M(loc, rot), m)

    def ico(self, g, r, loc, m, scale=(1, 1, 1), sub=2, displace=None, decimate=None, smooth=1.2, rot=(0, 0, 0)):
        bm = bmesh.new()
        bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r, calc_uvs=True)
        return self._add(g, _bake(bm, 0, 2, 0, smooth, displace, decimate), self._M(loc, rot, scale), m)

    def tube(self, g, points, r, m, cyclic=False, res=3, bevel_res=4, taper=None):
        """Swept round tube along a smooth path (hull collars, skids, hoses, palm trunks). taper: list of radius factors."""
        cu = bpy.data.curves.new('c', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = r; cu.bevel_resolution = bevel_res; cu.resolution_u = res; cu.use_fill_caps = True
        sp = cu.splines.new('NURBS'); sp.points.add(len(points) - 1)
        for i, p in enumerate(points):
            sp.points[i].co = (*p, 1); sp.points[i].radius = taper[i] if taper else 1
        sp.use_cyclic_u = cyclic; sp.use_endpoint_u = not cyclic; sp.order_u = min(4, len(points))
        ob = bpy.data.objects.new('c', cu); bpy.context.scene.collection.objects.link(ob)
        dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
        bpy.data.objects.remove(ob); bpy.data.curves.remove(cu)
        for p in me.polygons:
            p.use_smooth = True
        return self._add(g, me, Matrix.Identity(4), m)

    def mesh(self, g, verts, faces, m, smooth=0.5, bevel=0.0, subsurf=0, solidify=0.0):
        bm = bmesh.new()
        vs = [bm.verts.new(v) for v in verts]
        for f in faces:
            bm.faces.new([vs[i] for i in f])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        if solidify:
            bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=solidify)
        return self._add(g, _bake(bm, bevel, 2, subsurf, smooth), Matrix.Identity(4), m)

    # ---- ambient occlusion: ray-cast against the whole assembly, stored as vertex colour (exported as COLOR_0) ----
    def _bvh(self):
        verts, polys = [], []
        for meshes in self.groups.values():
            for me in meshes:
                n0 = len(verts); verts += [v.co.copy() for v in me.vertices]; polys += [[n0 + i for i in p.vertices] for p in me.polygons]
        if not polys:
            return None, 1.0
        lo = Vector((min(v.x for v in verts), min(v.y for v in verts), min(v.z for v in verts))); hi = Vector((max(v.x for v in verts), max(v.y for v in verts), max(v.z for v in verts)))
        return BVHTree.FromPolygons(verts, polys), (hi - lo).length

    # ---- finish: one mesh object per group, parented by pivot ----
    def build(self, offset=(0, 0, 0), ao=True):
        bvh, size = self._bvh() if ao else (None, 1.0)
        reach = max(0.03, min(0.9, size * 0.09))
        col = bpy.data.collections.new(self.name); bpy.context.scene.collection.children.link(col)
        objs = {}
        for g, meshes in self.groups.items():
            piv = self.pivots[g]
            if meshes:
                bm = bmesh.new(); mats = []
                for me in meshes:
                    mt = me.materials[0]
                    if mt not in mats:
                        mats.append(mt)
                    idx = mats.index(mt); n0 = len(bm.faces)
                    bm.from_mesh(me); bm.faces.ensure_lookup_table()
                    for f in bm.faces[n0:]:
                        f.material_index = idx
                    bpy.data.meshes.remove(me)
                # box-projected UVs in metres (uniform texel density, so tiling camo / grunge maps line up across parts)
                bm.normal_update(); uvl = bm.loops.layers.uv.verify()
                for f in bm.faces:
                    n = f.normal; ax = max(range(3), key=lambda i: abs(n[i]))
                    for l in f.loops:
                        c = l.vert.co
                        l[uvl].uv = (c.y, c.z) if ax == 0 else (c.x, c.z) if ax == 1 else (c.x, c.y)
                occ = None
                if bvh:
                    bm.normal_update(); occ = []
                    for v in bm.verts:
                        n = v.normal if v.normal.length > 0.1 else Vector((0, 0, 1)); o = v.co + n * (reach * 0.02 + 0.001)
                        t = n.orthogonal().normalized(); b2 = n.cross(t); hit = 0.0
                        for (dx, dy, dz) in AO_DIRS:
                            d = (t * dx + b2 * dy + n * dz).normalized(); r = bvh.ray_cast(o, d, reach)
                            if r[0] is not None:
                                hit += 1.0 - r[3] / reach
                        occ.append(max(0.18, 1.0 - 1.15 * hit / len(AO_DIRS)))
                bmesh.ops.translate(bm, verts=bm.verts[:], vec=-piv)
                out = bpy.data.meshes.new(f'{self.name}_{g}'); bm.to_mesh(out); bm.free()
                if occ:
                    ca = out.color_attributes.new('AO', 'FLOAT_COLOR', 'POINT')
                    for i, k in enumerate(occ):
                        ca.data[i].color = (k, k, k, 1.0)
                    out.color_attributes.active_color = ca; out.color_attributes.render_color_index = 0
                for mt in mats:
                    out.materials.append(mt)
                ob = bpy.data.objects.new(self.name if g == 'root' else g, out)
            else:
                ob = bpy.data.objects.new(self.name if g == 'root' else g, None); ob.empty_display_size = 0.1
            col.objects.link(ob); objs[g] = ob
        for g, ob in objs.items():
            if g == 'root':
                ob.location = Vector(offset)
            else:
                p = self.parents.get(g, 'root'); ob.parent = objs[p]; ob.location = self.pivots[g] - self.pivots[p]
        for name, loc, g in self.markers:
            e = bpy.data.objects.new(name, None); e.empty_display_type = 'PLAIN_AXES'; e.empty_display_size = 0.05
            col.objects.link(e); e.parent = objs[g]; e.location = loc - self.pivots[g]
        self.root = objs['root']
        return self.root


def tris(root):
    n = 0
    for o in [root, *root.children_recursive]:
        if o.type == 'MESH':
            n += sum(len(p.vertices) - 2 for p in o.data.polygons)
    return n
