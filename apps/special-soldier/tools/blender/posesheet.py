# Pose sheet: the game's knee/hip/arm poses applied to the Blender soldier, rendered with Cycles.
#   python3 tools/blender/posesheet.py   → docs/screenshots/blender-poses.jpg
# Angles mirror poseSoldier() in src/game/models.js (Blender X rotation has the same sign as three.js after export).
import os, sys, math
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); sys.path.insert(0, HERE)
import bpy
from mathutils import Vector
import lib, models, weapons

bpy.ops.wm.read_factory_settings(use_empty=True); scene = bpy.context.scene


def pose(walk=0.0, moveK=0.0, crouch=0.0, sit=False):
    """Same maths as poseSoldier(); returns {node: x-rotation} plus body drop."""
    if sit:
        return {'legL': -1.45, 'legR': -1.45, 'shinL': 1.45, 'shinR': 1.45, 'upper': 0.12, 'arms': 0.35}, -0.52
    sw, c, lift = math.sin(walk) * 0.55 * moveK, math.cos(walk), 0.95 * moveK
    k = lambda v: min(2.3, v)
    return {'legL': sw - crouch * 1.1, 'legR': -sw + crouch * 0.5,
            'shinL': k(crouch * 2.0 + (max(0, -c) * lift + 0.08 * moveK) * (1 - crouch * 0.6)),
            'shinR': k(crouch * 1.05 + (max(0, c) * lift + 0.08 * moveK) * (1 - crouch * 0.6)),
            'upper': crouch * 0.25 + moveK * 0.1, 'arms': 0.25 - crouch * 0.2}, -crouch * 0.42 - 0.93 * (1 - math.cos(sw))


POSES = [('STAND', pose()), ('WALK A', pose(math.pi / 2, 1)), ('PASSING', pose(math.pi, 1)), ('WALK B', pose(math.pi * 1.5, 1)), ('KNEEL', pose(crouch=1)), ('SEATED', pose(sit=True))]
KEEP = {'acc_helmet', 'acc_nvg', 'acc_pack'}
gun = lambda: [w for w in weapons.all_weapons() if w.name == 'W_m4'][0]  # an Asm can be built once
for i, (name, (rot, drop)) in enumerate(POSES):
    root = models.soldier().build(((i - 2.5) * 1.15, 0, 0), ao=True); root.rotation_euler.z = math.radians(-90)
    for o in list(root.children_recursive):
        b = o.name.split('.')[0].replace('__d', '')
        if b.startswith('acc_') and b not in KEEP:
            o.hide_render = True
        if b in rot and not o.name.split('.')[0].endswith('__d'):
            o.rotation_euler.x = rot[b]
        if b == 'body':
            o.location.z += drop + (0.45 if name == 'SEATED' else 0)
        if o.name.split('.')[0] == 'gun':
            g = gun().build((0, 0, 0), ao=False); g.parent = o; g.location = (0, 0, 0)
    if name == 'SEATED':  # crate to sit on
        [u for u in models.unit_props() if u.name == 'P_crate'][0].build(((i - 2.5) * 1.15 + 0.12, 0, 0.22), ao=False).scale = (0.6, 0.6, 0.45)

fl = bpy.data.meshes.new('floor'); fl.from_pydata([(-30, -30, 0), (30, -30, 0), (30, 30, 0), (-30, 30, 0)], [], [(0, 1, 2, 3)]); fl.materials.append(lib.mat('studio_floor', (0.25, 0.25, 0.26), 0.7))
scene.collection.objects.link(bpy.data.objects.new('Floor', fl))
world = bpy.data.worlds.new('W'); scene.world = world; world.use_nodes = True; world.node_tree.nodes['Background'].inputs[0].default_value = (0.5, 0.55, 0.6, 1); world.node_tree.nodes['Background'].inputs[1].default_value = 0.6


def light(loc, e, size, col=(1, 1, 1)):
    d = bpy.data.lights.new('L', 'AREA'); d.energy = e; d.size = size; d.color = col; o = bpy.data.objects.new('L', d); scene.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector((0, 0, 0.9)) - o.location).to_track_quat('-Z', 'Y').to_euler()


light((2, -8, 6), 2600, 8, (1, 0.95, 0.88)); light((-6, -4, 2), 700, 6, (0.75, 0.85, 1)); light((0, 6, 4), 900, 6)
cam = bpy.data.objects.new('C', bpy.data.cameras.new('C')); scene.collection.objects.link(cam); scene.camera = cam; cam.data.lens = 38
cam.location = (0, -9.0, 1.6); cam.rotation_euler = (Vector((0, 0, 0.85)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
r = scene.render; r.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = int(os.environ.get('SAMPLES', 32)); scene.cycles.use_denoising = True
r.resolution_x, r.resolution_y = 1600, 600; r.image_settings.file_format = 'JPEG'; r.image_settings.quality = 90
try:
    scene.view_settings.view_transform = 'Filmic'
except Exception:
    pass
out = os.path.join(ROOT, 'docs', 'screenshots', 'blender-poses.jpg'); r.filepath = out; bpy.ops.render.render(write_still=True); print('POSES', out)
