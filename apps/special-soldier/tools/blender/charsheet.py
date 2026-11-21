# Character sheet: every soldier type with the game's kit and palette, Cycles, studio light.
#   python3 tools/blender/charsheet.py [--heads]   → docs/screenshots/blender-characters.jpg (or -heads.jpg)
import os, sys, math
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); sys.path.insert(0, HERE)
import bpy
from mathutils import Vector
import lib, models, weapons

HEADS = '--heads' in sys.argv
bpy.ops.wm.read_factory_settings(use_empty=True); scene = bpy.context.scene
# kits and colours mirror KIT / PALETTE in src/game/models.js
TYPES = [
    ('squad', ['acc_helmet', 'acc_nvg', 'acc_pack'], 'm4', dict(cloth=0x5c5c42, vest=0x45452f, skin=0x8a6a50, helmet=0x45452f)),
    ('guard', ['acc_cap', 'acc_shades', 'acc_guard'], 'kr5', dict(cloth=0x6e6448, vest=0x3e3926, skin=0x9a7458, helmet=0x26262a)),
    ('assault', ['acc_helmet', 'acc_mask', 'acc_assault', 'acc_pack'], 'm4', dict(cloth=0x4a4c52, vest=0x2a2c30, skin=0x8a6a50, helmet=0x2c2e32)),
    ('sniper', ['acc_hood', 'acc_ghillie'], 'bolt', dict(cloth=0x3f4a2c, vest=0x2c3420, skin=0x7a5a44, helmet=0x3a4428)),
    ('heavy', ['acc_helmet', 'acc_heavy', 'acc_shield', 'acc_jugg'], 'lmg', dict(cloth=0x45453f, vest=0x5c2a1e, skin=0x7e5e46, helmet=0x2a2a2e)),
    ('elite', ['acc_helmet', 'acc_visor', 'acc_gasmask', 'acc_elite'], 'arx', dict(cloth=0x3a3e46, vest=0x22242a, skin=0x8a6a50, helmet=0x1e2024)),
    ('boss', ['acc_beret', 'acc_visor', 'acc_heavy', 'acc_boss', 'acc_cigar'], 'lmg', dict(cloth=0x3a1a18, vest=0x6a1c18, skin=0x9a7a60, helmet=0x300808)),
]
TYPES = [t for t in TYPES if t[0] in os.environ.get('ONLY', ','.join(t[0] for t in TYPES)).split(',')]


def lin(h):
    c = [((h >> s) & 255) / 255 for s in (16, 8, 0)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c) + (1,)


def build(kind, kit, gun, pal, x):
    root = models.soldier().build((x, 0, 0), ao=True); root.rotation_euler.z = math.radians(-20 if not HEADS else -25); cache = {}
    for o in list(root.children_recursive):
        b = o.name.split('.')[0].replace('__d', '')
        if b.startswith('acc_') and b not in kit:
            o.hide_render = True
        if o.type == 'MESH':
            for s in o.material_slots:
                nm = s.material.name.split('.')[0]
                if nm in pal:
                    if nm not in cache:
                        m = s.material.copy(); m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = lin(pal[nm]); cache[nm] = m
                    s.material = cache[nm]
        if o.name.split('.')[0] == 'gun':
            g = [w for w in weapons.all_weapons() if w.name == 'W_' + gun][0].build((0, 0, 0), ao=False); g.parent = o; g.location = (0, 0, 0)
    return root


SP = 1.25
for i, (kind, kit, gun, pal) in enumerate(TYPES):
    build(kind, kit, gun, pal, (i - (len(TYPES) - 1) / 2) * SP)
fl = bpy.data.meshes.new('floor'); fl.from_pydata([(-30, -30, 0), (30, -30, 0), (30, 30, 0), (-30, 30, 0)], [], [(0, 1, 2, 3)]); fl.materials.append(lib.mat('studio_floor', (0.3, 0.3, 0.31), 0.7))
scene.collection.objects.link(bpy.data.objects.new('Floor', fl))
world = bpy.data.worlds.new('W'); scene.world = world; world.use_nodes = True; world.node_tree.nodes['Background'].inputs[0].default_value = (0.55, 0.6, 0.65, 1); world.node_tree.nodes['Background'].inputs[1].default_value = 0.7


def light(loc, e, size, col=(1, 1, 1), tgt=(0, 0, 1.0)):
    d = bpy.data.lights.new('L', 'AREA'); d.energy = e; d.size = size; d.color = col; o = bpy.data.objects.new('L', d); scene.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector(tgt) - o.location).to_track_quat('-Z', 'Y').to_euler()


light((3, -9, 7), 3600, 10, (1, 0.95, 0.88)); light((-8, -5, 2.5), 900, 8, (0.75, 0.85, 1)); light((0, 7, 5), 1400, 8)
cam = bpy.data.objects.new('C', bpy.data.cameras.new('C')); scene.collection.objects.link(cam); scene.camera = cam
w = (len(TYPES) - 1) * SP
if HEADS:
    cam.data.lens = 85; cam.location = (0, -12.5, 1.72); tgt = (0, 0, 1.62)
else:
    cam.data.lens = 40; cam.location = (0, -6.2 - w * 0.62, 1.25); tgt = (0, 0, 0.92)
cam.rotation_euler = (Vector(tgt) - cam.location).to_track_quat('-Z', 'Y').to_euler()
r = scene.render; r.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = int(os.environ.get('SAMPLES', 32)); scene.cycles.use_denoising = True
r.resolution_x, r.resolution_y = (1800, 420) if HEADS else (1800, 760); r.image_settings.file_format = 'JPEG'; r.image_settings.quality = 90
try:
    scene.view_settings.view_transform = 'Filmic'
except Exception:
    pass
out = os.environ.get('OUT') or os.path.join(ROOT, 'docs', 'screenshots', 'blender-characters' + ('-heads' if HEADS else '') + '.jpg'); r.filepath = out; bpy.ops.render.render(write_still=True); print('SHEET', out)
