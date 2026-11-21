# Turns an image-to-3D character GLB (Higgsfield / Meshy) into a game soldier rig with the same node names as the
# Blender 'Soldier' asset, so poseSoldier() animates it: body > legL > shinL, body > legR > shinR, body > upper > head,
# upper > arms > gun. The mesh is cut by face centroid at the crotch and knees (no skinning), textures are kept.
#   python3 tools/blender/hf_soldier.py <in.glb> <out.glb> [--yaw DEG] [--tex 1024] [--render out.jpg]
import os, sys, math
import bpy, bmesh
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
src, dst = argv[0], argv[1]
opt = lambda k, d: argv[argv.index(k) + 1] if k in argv else d
YAW, TEX, RENDER = float(opt('--yaw', 0)), int(opt('--tex', 1024)), opt('--render', None)
HEIGHT, HIP, KNEE, CROTCH = 1.84, 0.93, 0.52, 0.86   # game soldier proportions (metres)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in bpy.context.scene.objects:
    o.select_set(o in meshes)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
ob = bpy.context.view_layer.objects.active
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
for o in list(bpy.context.scene.objects):
    if o is not ob:
        bpy.data.objects.remove(o)
ob.data.transform(ob.matrix_world); ob.matrix_world = Matrix.Identity(4)
# face the game's forward (-Y in Blender = +Z in three.js), feet on z=0, scaled to HEIGHT, centred on the legs
ob.data.transform(Matrix.Rotation(math.radians(YAW), 4, 'Z'))
vs = [v.co for v in ob.data.vertices]; zmin = min(v.z for v in vs); zmax = max(v.z for v in vs)
s = HEIGHT / (zmax - zmin); ob.data.transform(Matrix.Scale(s, 4) @ Matrix.Translation((0, 0, -zmin)))
low = [v.co for v in ob.data.vertices if v.co.z < 0.3]
cx = (min(v.x for v in low) + max(v.x for v in low)) / 2; cy = (min(v.y for v in low) + max(v.y for v in low)) / 2
ob.data.transform(Matrix.Translation((-cx, -cy, 0)))

# classify faces → parts
bm = bmesh.new(); bm.from_mesh(ob.data); bm.faces.ensure_lookup_table()
part_of = {}
for f in bm.faces:
    c = f.calc_center_median()
    if c.z < CROTCH:
        side = 'L' if c.x > 0 else 'R'   # +X = the character's left (it faces -Y)
        part_of[f.index] = ('shin' if c.z < KNEE else 'leg') + side
    else:
        part_of[f.index] = 'upper'
names = sorted(set(part_of.values()))
objs = {}
for n in names:
    b2 = bm.copy(); b2.faces.ensure_lookup_table()
    bmesh.ops.delete(b2, geom=[f for f in b2.faces if part_of[f.index] != n], context='FACES')
    me = bpy.data.meshes.new(n); b2.to_mesh(me); b2.free()
    for m in ob.data.materials:
        me.materials.append(m)
    objs[n] = bpy.data.objects.new(n + '_mesh', me); bpy.context.scene.collection.objects.link(objs[n])
bm.free(); bpy.data.objects.remove(ob)

# pivot hierarchy (empties), meshes re-centred on their pivot so rotations bend at hips and knees
def legx(side):
    o = objs.get('leg' + side); xs = [v.co.x for v in o.data.vertices] if o else [0.1 if side == 'L' else -0.1]
    return (min(xs) + max(xs)) / 2
P = {'body': (0, 0, 0), 'legL': (legx('L'), 0, HIP), 'legR': (legx('R'), 0, HIP), 'shinL': (legx('L'), 0, KNEE), 'shinR': (legx('R'), 0, KNEE),
     'upper': (0, 0, HIP), 'head': (0, 0, 1.6), 'arms': (0, -0.02, 1.43), 'gun': (0.075, -0.22, 1.31)}
PAR = {'legL': 'body', 'legR': 'body', 'shinL': 'legL', 'shinR': 'legR', 'upper': 'body', 'head': 'upper', 'arms': 'upper', 'gun': 'arms'}
root = bpy.data.objects.new('SoldierHF', None); bpy.context.scene.collection.objects.link(root)
emp = {}
for n, p in P.items():
    e = bpy.data.objects.new(n, None); bpy.context.scene.collection.objects.link(e); emp[n] = e
for n, e in emp.items():
    par = emp[PAR[n]] if n in PAR else root; e.parent = par
    pp = Vector(P[PAR[n]]) if n in PAR else Vector((0, 0, 0)); e.location = Vector(P[n]) - pp
for n, o in objs.items():
    o.data.transform(Matrix.Translation(-Vector(P[n]))); o.parent = emp[n]; o.location = (0, 0, 0)
    o.name = n + '_mesh'

# shrink textures for the web build
for img in bpy.data.images:
    if img.size[0] > TEX:
        img.scale(TEX, TEX)
tris = sum(len(p.vertices) - 2 for o in objs.values() for p in o.data.polygons)
print('PARTS', {n: len(o.data.polygons) for n, o in objs.items()}, 'TRIS', tris)
for o in bpy.context.scene.objects:
    o.select_set(False)
root.select_set(True)
for o in root.children_recursive:
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', use_selection=True, export_yup=True, export_image_format='JPEG', export_jpeg_quality=85, export_animations=False, export_cameras=False, export_lights=False)
print('GLB', dst, os.path.getsize(dst) // 1024, 'kB')

if RENDER:  # quick look: front and side, Eevee/Cycles studio
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.use_denoising = True; sc.render.resolution_x, sc.render.resolution_y = 1200, 900
    w = bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[1].default_value = 1.0
    for i, a in enumerate((0, 90)):
        pass
    cam = bpy.data.objects.new('C', bpy.data.cameras.new('C')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.lens = 50
    cam.location = (1.6, -4.2, 1.3); cam.rotation_euler = (Vector((0, 0, 0.95)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    d = bpy.data.lights.new('K', 'AREA'); d.energy = 900; d.size = 4; k = bpy.data.objects.new('K', d); sc.collection.objects.link(k); k.location = (2, -4, 4); k.rotation_euler = (Vector((0, 0, 1)) - k.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = RENDER; sc.render.image_settings.file_format = 'JPEG'; bpy.ops.render.render(write_still=True); print('RENDER', RENDER)
