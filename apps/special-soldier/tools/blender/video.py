# Renders a pre-rendered mission intro with Blender Cycles from the game's own Blender assets (free, no AI service).
#   python3 tools/blender/video.py            → public/video/m5-intro.mp4  (COMMANDER VIPER reveal, airfield at dusk)
#   FRAMES=1 python3 tools/blender/video.py   → single test frame
# Env: SECONDS (7), FPS (24), SAMPLES (12), RES (960x540), OUT.
import os, sys, math, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); sys.path.insert(0, HERE)
import bpy
from mathutils import Vector
import lib, models, weapons

FPS = int(os.environ.get('FPS', 24)); SECS = float(os.environ.get('SECONDS', 7)); N = int(os.environ.get('FRAMES', round(FPS * SECS)))
W_, H_ = [int(v) for v in os.environ.get('RES', '960x540').split('x')]
TMP = os.environ.get('VIDEO_TMP', os.path.join(HERE, '.cache', 'm5')); os.makedirs(TMP, exist_ok=True)
OUT = os.environ.get('OUT', os.path.join(ROOT, 'public', 'video', 'm5-intro.mp4'))

bpy.ops.wm.read_factory_settings(use_empty=True); scene = bpy.context.scene
KIT = {'boss': ['acc_beret', 'acc_visor', 'acc_heavy', 'acc_boss', 'acc_cigar'], 'elite': ['acc_helmet', 'acc_visor', 'acc_gasmask', 'acc_elite'], 'heavy': ['acc_helmet', 'acc_heavy', 'acc_shield', 'acc_jugg']}
COL = {'boss': dict(cloth=(0.025, 0.008, 0.008), vest=(0.07, 0.008, 0.008), helmet=(0.06, 0.005, 0.005), accent=(0.25, 0.01, 0.01)), 'elite': dict(cloth=(0.012, 0.014, 0.02), vest=(0.008, 0.009, 0.012), helmet=(0.004, 0.004, 0.005)),
       'heavy': dict(cloth=(0.02, 0.02, 0.022), vest=(0.1, 0.012, 0.01), helmet=(0.005, 0.005, 0.005))}


def tree(o):
    yield o
    for c in o.children:
        yield from tree(c)


def soldier(kind, loc, yaw, gun, scale=1.0):
    a = models.soldier(); root = a.build(loc, ao=False); root.rotation_euler.z = yaw; root.scale = (scale,) * 3; cache = {}
    for o in tree(root):
        base = o.name.split('.')[0].replace('__d', '')
        if base.startswith('acc_') and base not in KIT[kind]:
            o.hide_render = True
        if o.type == 'MESH':
            for s in o.material_slots:  # per-type uniform colours on private material copies
                nm = s.material.name.split('.')[0]
                if nm in COL[kind]:
                    if nm not in cache:
                        m = s.material.copy(); m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*COL[kind][nm], 1); cache[nm] = m
                    s.material = cache[nm]
        if o.name.split('.')[0] == 'gun':
            g = [w for w in weapons.all_weapons() if w.name == 'W_' + gun][0].build((0, 0, 0), ao=False); g.parent = o; g.location = (0, 0, 0)
    return root


# ---- set: airfield apron at dusk ----
conc = lib.mat('apron', (0.02, 0.02, 0.022), 0.6)  # damp tarmac
me = bpy.data.meshes.new('apron'); me.from_pydata([(-300, -300, 0), (300, -300, 0), (300, 300, 0), (-300, 300, 0)], [], [(0, 1, 2, 3)]); me.materials.append(conc)
scene.collection.objects.link(bpy.data.objects.new('Apron', me))
heli = models.heli().build((2.5, 9.0, 0.0), ao=False); heli.rotation_euler.z = math.radians(205)
rotor = next((o for o in tree(heli) if o.name.split('.')[0] == 'rotor'), None)
ship = models.cargo_ship().build((-30, 140, -6), ao=False); ship.rotation_euler.z = math.radians(80)
models.truck().build((-11, 7, 0), ao=False).rotation_euler.z = math.radians(-60)
for i, (x, y) in enumerate(((9, 4), (10.4, 4.6), (9.6, 5.6))):
    c = [u for u in models.unit_props() if u.name == 'P_crate'][0].build((x, y, 0.5 + (0.0 if i < 2 else 1.0)), ao=False)
soldier('boss', (0, 0, 0), math.radians(8), 'lmg', 1.2)
soldier('elite', (-2.2, 1.5, 0), math.radians(-14), 'arx'); soldier('elite', (2.3, 1.3, 0), math.radians(20), 'arx')
soldier('heavy', (-4.6, 3.2, 0), math.radians(-25), 'lmg', 1.14); soldier('heavy', (4.8, 3.0, 0), math.radians(30), 'lmg', 1.14)

world = bpy.data.worlds.new('World'); scene.world = world; world.use_nodes = True; nt = world.node_tree; bg = nt.nodes['Background']
tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); ramp = nt.nodes.new('ShaderNodeValToRGB')  # sky colour by elevation: ember horizon → indigo zenith
mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = -0.05; mr.inputs['From Max'].default_value = 0.45
e = ramp.color_ramp.elements; e[0].position = 0.0; e[0].color = (0.55, 0.09, 0.015, 1); e[1].position = 1.0; e[1].color = (0.004, 0.004, 0.012, 1); m = ramp.color_ramp.elements.new(0.3); m.color = (0.09, 0.02, 0.03, 1)
nt.links.new(tc.outputs['Generated'], sep.inputs['Vector']); nt.links.new(sep.outputs['Z'], mr.inputs['Value']); nt.links.new(mr.outputs['Result'], ramp.inputs['Fac']); nt.links.new(ramp.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = 0.6


def light(name, kind, loc, energy, color, size=3.0, target=(0, 0, 1.4)):
    d = bpy.data.lights.new(name, kind); d.energy = energy; d.color = color
    if kind == 'AREA':
        d.size = size
    if kind == 'SPOT':
        d.spot_size = math.radians(55); d.spot_blend = 0.5; d.shadow_soft_size = 0.3
    o = bpy.data.objects.new(name, d); scene.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector(target) - o.location).to_track_quat('-Z', 'Y').to_euler(); return o


light('Sunset', 'AREA', (-18, 26, 5), 5200, (1, 0.35, 0.12), 14)          # low rim from the horizon
light('Key', 'SPOT', (5.5, -7, 6.5), 1500, (1, 0.88, 0.75))               # floodlight on the group
light('Fill', 'AREA', (-7, -6, 2.5), 160, (0.4, 0.55, 1.0), 5)
light('HeliLamp', 'SPOT', (2.5, 8, 4.2), 1200, (1, 0.2, 0.12), target=(0, 2, 0.2))

cam = bpy.data.objects.new('Camera', bpy.data.cameras.new('Camera')); scene.collection.objects.link(cam); scene.camera = cam; cam.data.lens = 34; cam.data.dof.use_dof = True; cam.data.dof.aperture_fstop = 2.2
focus = bpy.data.objects.new('Focus', None); scene.collection.objects.link(focus); focus.location = (0, 0, 1.75); cam.data.dof.focus_object = focus
scene.frame_start, scene.frame_end = 1, max(1, N); scene.render.fps = FPS
keys = [(0.0, (-5.2, -9.5, 0.55), (0.3, 1.0, 1.5)), (0.55, (-1.6, -6.2, 1.0), (0, 0.4, 1.7)), (1.0, (0.55, -2.7, 1.75), (0, 0, 1.92))]  # low dolly-in that rises to the commander's face
for t, loc, look in keys:
    f = 1 + t * (max(2, N) - 1); cam.location = loc; cam.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    cam.keyframe_insert('location', frame=f); cam.keyframe_insert('rotation_euler', frame=f)
if rotor:
    rotor.rotation_euler.z = 0; rotor.keyframe_insert('rotation_euler', frame=1); rotor.rotation_euler.z = math.radians(38 * N); rotor.keyframe_insert('rotation_euler', frame=max(2, N))
for ob in (cam, rotor):
    if ob and ob.animation_data and ob.animation_data.action:
        try:
            for fc in ob.animation_data.action.fcurves:
                for k in fc.keyframe_points:
                    k.interpolation = 'LINEAR' if ob is rotor else 'BEZIER'
        except Exception:
            pass

r = scene.render; scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = int(os.environ.get('SAMPLES', 12)); scene.cycles.use_denoising = True; scene.cycles.max_bounces = 3
r.resolution_x, r.resolution_y = W_, H_; r.use_motion_blur = False; r.image_settings.file_format = 'JPEG'; r.image_settings.quality = 92
try:
    scene.view_settings.view_transform = 'Filmic'
except Exception:
    pass
scene.view_settings.exposure = -0.2; scene.view_settings.look = 'None'
only = os.environ.get('FRAME')
for f in ([int(only)] if only else range(1, max(1, N) + 1)):
    p = os.path.join(TMP, f'f{f:04d}.jpg')
    if os.path.exists(p) and not only:
        continue
    scene.frame_set(f); r.filepath = p; bpy.ops.render.render(write_still=True); print('FRAME', f, flush=True)
if N > 1 and not only:
    os.makedirs(os.path.dirname(OUT), exist_ok=True); d = N / FPS
    vf = f"fade=t=in:st=0:d=0.6,fade=t=out:st={d - 0.5:.2f}:d=0.5"
    subprocess.check_call(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', os.path.join(TMP, 'f%04d.jpg'), '-vf', vf, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '21', '-movflags', '+faststart', OUT])
    print('VIDEO', OUT, os.path.getsize(OUT) // 1024, 'kB')
