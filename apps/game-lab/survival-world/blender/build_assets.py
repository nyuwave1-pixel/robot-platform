# SURVIVAL WORLD — Blender asset build (bpy 5.x). Every model here is built from primitives in code (no imported art),
# low-poly with flat shading, and exported as one GLB whose top-level node names are what the games look up:
#   Tree, TreeTall, Rock, Bush, Wolf (+ legFL legFR legBL legBR head tail), Campfire (+ flame), Wall, Axe, Pickaxe, Spear
# Run:  python3 apps/game-lab/survival-world/blender/build_assets.py        (Python with the bpy module)
#   or: blender -b -P apps/game-lab/survival-world/blender/build_assets.py
# Writes apps/game-lab/survival-world/assets/survival.glb (+ survival.blend next to it, and a preview PNG with --render).
import math, os, sys
import bpy, bmesh
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', 'assets'))
os.makedirs(OUT, exist_ok=True)
RENDER = '--render' in sys.argv

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

_mats = {}
def mat(name, rgb, rough=0.85, metal=0.0, emit=0.0):
    if name in _mats: return _mats[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*rgb, 1); b.inputs['Emission Strength'].default_value = emit
    _mats[name] = m; return m

def mesh_obj(name, build, material, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), jitter=0.0, seed=1):
    """build(bm) fills a bmesh; the object is flat shaded; optional vertex jitter for a hand-made look."""
    bm = bmesh.new(); build(bm)
    if jitter:
        import random; r = random.Random(seed)
        for v in bm.verts: v.co += Vector((r.uniform(-jitter, jitter), r.uniform(-jitter, jitter), r.uniform(-jitter, jitter)))
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = False
    me.materials.append(material)
    o = bpy.data.objects.new(name, me); scene.collection.objects.link(o)
    o.location = loc; o.rotation_euler = rot
    if parent: o.parent = parent
    return o

def empty(name, loc=(0, 0, 0)):
    o = bpy.data.objects.new(name, None); scene.collection.objects.link(o); o.location = loc; return o

def cone(r1, r2, h, seg, z0=0.0):
    def f(bm): bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r1, radius2=r2, depth=h, matrix=Matrix.Translation((0, 0, z0 + h / 2)))
    return f
def ico(r, sub=1, z=0.0, sx=1, sy=1, sz=1):
    def f(bm):
        bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
        bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=bm.verts); bmesh.ops.translate(bm, vec=(0, 0, z), verts=bm.verts)
    return f
def box(x, y, z, cz=None):
    def f(bm):
        bmesh.ops.create_cube(bm, size=1); bmesh.ops.scale(bm, vec=(x, y, z), verts=bm.verts)
        bmesh.ops.translate(bm, vec=(0, 0, z / 2 if cz is None else cz), verts=bm.verts)
    return f

BARK, LEAF, LEAF2 = mat('Bark', (0.30, 0.19, 0.10)), mat('Leaf', (0.13, 0.32, 0.12)), mat('LeafLight', (0.22, 0.42, 0.15))
STONE, BUSH, BERRY = mat('Stone', (0.42, 0.41, 0.39), 0.9), mat('Bush', (0.20, 0.38, 0.14)), mat('Berry', (0.62, 0.06, 0.12), 0.5)
FUR, FUR2, EYE = mat('Fur', (0.20, 0.20, 0.23)), mat('FurLight', (0.42, 0.41, 0.44)), mat('WolfEye', (1.0, 0.78, 0.2), 0.4, 0, 3.0)
WOOD, PLANK, FLAME, IRON = mat('Wood', (0.40, 0.26, 0.14)), mat('Plank', (0.52, 0.36, 0.20)), mat('Flame', (1.0, 0.55, 0.12), 0.5, 0, 6.0), mat('ToolStone', (0.36, 0.35, 0.34), 0.7)
FIBER = mat('Fiber', (0.62, 0.55, 0.30))

# Blender is z-up; the glTF exporter turns it into y-up. Every model stands on its origin, front = −y in Blender (= +z in glTF).
def tree(name, tall=False, x=0.0):
    root = empty(name, (x, 0, 0))
    h = 3.4 if tall else 2.4
    mesh_obj(name + '_trunk', cone(0.30, 0.18, h, 7), BARK, root, jitter=0.03, seed=3)
    tiers = [(1.7, 2.2, 1.9), (1.35, 1.9, 3.0), (0.95, 1.6, 4.0)] if not tall else [(1.5, 2.4, 2.3), (1.2, 2.2, 3.6), (0.9, 2.0, 4.9), (0.6, 1.6, 6.0)]
    for i, (r, hh, z) in enumerate(tiers): mesh_obj(f'{name}_leaves{i}', cone(r, 0.05, hh, 8, z - hh * 0.35), LEAF if i % 2 == 0 else LEAF2, root, jitter=0.07, seed=10 + i)
    return root

def rock(x=0.0):
    root = empty('Rock', (x, 0, 0))
    mesh_obj('Rock_main', ico(0.95, 1, 0.45, 1.15, 0.95, 0.7), STONE, root, jitter=0.14, seed=21)
    mesh_obj('Rock_side', ico(0.45, 1, 0.22, 1, 1, 0.8), STONE, root, loc=(0.8, 0.35, 0), jitter=0.08, seed=22)
    return root

def bush(x=0.0):
    root = empty('Bush', (x, 0, 0))
    for i, (dx, dy, r) in enumerate([(0, 0, 0.65), (0.45, 0.2, 0.45), (-0.4, 0.25, 0.5), (0.1, -0.4, 0.45)]):
        mesh_obj(f'Bush_{i}', ico(r, 1, r * 0.9), BUSH, root, loc=(dx, dy, 0), jitter=0.06, seed=30 + i)
    for i in range(9):
        a = i * 2.39; mesh_obj(f'Berry_{i}', ico(0.07, 1), BERRY, root, loc=(math.cos(a) * 0.55, math.sin(a) * 0.5, 0.45 + (i % 3) * 0.18))
    return root

def wolf(x=0.0):
    # separate pivots so the game can swing the legs and turn the head (no armature needed)
    root = empty('Wolf', (x, 0, 0))
    mesh_obj('Wolf_body', box(0.42, 1.15, 0.45, 0.78), FUR, root, jitter=0.03, seed=41)
    mesh_obj('Wolf_chest', ico(0.3, 1, 0.82, 1, 1.1, 1), FUR2, root, loc=(0, -0.45, 0))
    for nm, lx, ly in [('legFL', 0.15, -0.42), ('legFR', -0.15, -0.42), ('legBL', 0.15, 0.42), ('legBR', -0.15, 0.42)]:
        piv = empty(nm, (lx, ly, 0.62)); piv.parent = root
        mesh_obj(nm + '_mesh', box(0.12, 0.12, 0.62, -0.31), FUR, piv)
    head = empty('head', (0, -0.72, 0.98)); head.parent = root
    mesh_obj('Wolf_skull', box(0.32, 0.36, 0.3, 0.02), FUR, head)
    mesh_obj('Wolf_snout', box(0.18, 0.28, 0.16, -0.04), FUR2, head, loc=(0, -0.28, 0))
    for sx in (0.1, -0.1):
        mesh_obj('Wolf_ear', cone(0.07, 0.0, 0.18, 4, 0.15), FUR, head, loc=(sx, 0.05, 0))
        mesh_obj('Wolf_eye', ico(0.035, 1), EYE, head, loc=(sx * 0.9, -0.18, 0.07))
    tail = empty('tail', (0, 0.6, 0.9)); tail.parent = root
    mesh_obj('Wolf_tail', box(0.1, 0.5, 0.1, 0), FUR2, tail, loc=(0, 0.22, -0.08), rot=(0.5, 0, 0))
    return root

def campfire(x=0.0):
    root = empty('Campfire', (x, 0, 0))
    for i in range(8):
        a = i / 8 * math.tau; mesh_obj(f'Campfire_stone{i}', ico(0.17, 1, 0.08, 1.2, 1, 0.8), STONE, root, loc=(math.cos(a) * 0.55, math.sin(a) * 0.55, 0), jitter=0.03, seed=50 + i)
    for i in range(4):
        a = i / 4 * math.tau + 0.4; mesh_obj(f'Campfire_log{i}', box(0.12, 0.8, 0.12, 0.12), WOOD, root, rot=(0.35, 0, a))
    flame = empty('flame', (0, 0, 0.1)); flame.parent = root
    mesh_obj('Campfire_flame', cone(0.28, 0.0, 0.8, 6), FLAME, flame)
    mesh_obj('Campfire_flame2', cone(0.16, 0.0, 0.55, 5), mat('FlameCore', (1.0, 0.85, 0.35), 0.4, 0, 8.0), flame, loc=(0.06, 0.04, 0))
    return root

def wall(x=0.0):
    root = empty('Wall', (x, 0, 0))
    for i in range(5):
        px = -0.8 + i * 0.4; mesh_obj(f'Wall_post{i}', cone(0.13, 0.11, 2.2 + (i % 2) * 0.15, 6), PLANK, root, loc=(px, 0, 0), jitter=0.02, seed=60 + i)
        mesh_obj(f'Wall_tip{i}', cone(0.12, 0.0, 0.3, 6, 2.2 + (i % 2) * 0.15), PLANK, root, loc=(px, 0, 0))
    for z in (0.6, 1.6): mesh_obj('Wall_rail', box(2.0, 0.12, 0.14, z), WOOD, root, loc=(0, -0.13, 0))
    return root

def tool(name, x, head):
    root = empty(name, (x, 0, 0))
    mesh_obj(name + '_handle', cone(0.035, 0.03, 0.9, 6), WOOD, root)
    if head == 'axe': mesh_obj('Axe_head', box(0.08, 0.32, 0.2, 0.78), IRON, root, loc=(0, -0.1, 0), jitter=0.01, seed=71)
    if head == 'pick': mesh_obj('Pick_head', box(0.08, 0.6, 0.09, 0.84), IRON, root, jitter=0.01, seed=72)
    if head == 'spear': mesh_obj('Spear_tip', cone(0.06, 0.0, 0.25, 4, 0.9), IRON, root)
    mesh_obj(name + '_wrap', cone(0.045, 0.045, 0.12, 6, 0.65 if head != 'spear' else 0.82), FIBER, root)
    return root

# lay them out in a row (positions only matter for the preview; the games place each one themselves)
roots = [tree('Tree', x=0), tree('TreeTall', True, x=4), rock(8), bush(11), wolf(14), campfire(17), wall(20), tool('Axe', 23, 'axe'), tool('Pickaxe', 24, 'pick'), tool('Spear', 25, 'spear')]
for r in roots: r['survival'] = 1

glb = os.path.join(OUT, 'survival.glb')
bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB', export_yup=True, export_apply=True, export_cameras=False, export_lights=False, export_animations=False)
tris = sum(len(o.data.polygons) for o in scene.objects if o.type == 'MESH')
print('GLB', os.path.getsize(glb) // 1024, 'kB ·', len(roots), 'models ·', tris, 'faces')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'survival.blend'), compress=True)

if RENDER:   # a quick Cycles (CPU) preview of the lineup
    world = bpy.data.worlds.new('W'); scene.world = world; world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = (0.55, 0.7, 0.8, 1)
    sun = bpy.data.objects.new('Sun', bpy.data.lights.new('Sun', 'SUN')); sun.data.energy = 3.5; sun.rotation_euler = (0.9, 0.2, 0.7); scene.collection.objects.link(sun)
    ground = mesh_obj('Ground', box(40, 12, 0.1, -0.05), mat('Ground', (0.25, 0.4, 0.18)))
    ground.location = (12.5, 0, 0)
    cam = bpy.data.objects.new('Cam', bpy.data.cameras.new('Cam')); scene.collection.objects.link(cam); scene.camera = cam
    cam.location = (12.5, -19, 6.5); cam.rotation_euler = (1.25, 0, 0); cam.data.lens = 30
    scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = 24; scene.cycles.use_denoising = False   # CPU: works without a GPU
    scene.render.resolution_x, scene.render.resolution_y = 1600, 560
    scene.render.filepath = os.path.join(OUT, 'survival_preview.png'); bpy.ops.render.render(write_still=True)
    print('preview', scene.render.filepath)
