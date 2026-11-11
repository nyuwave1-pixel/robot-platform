# Builds every SPECIAL SOLDIER 3D asset with Blender and exports them for the game.
#   Headless:     python3 tools/blender/build.py            (pip install bpy==5.3.0)
#   Blender app:  blender --background --python tools/blender/build.py     (Blender 5.3)
# Outputs: src/assets/assets.glb (loaded by the game), blender/special_soldier_assets.blend (open in Blender),
#          docs/screenshots/blender-*.jpg (Cycles renders, skipped with --no-render).
import os, sys, math
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); sys.path.insert(0, HERE)
import bpy
from mathutils import Vector
import lib, weapons, models

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
asms = [models.soldier(), *weapons.all_weapons(), models.boat(), models.heli(), models.apc(), models.tree(), models.palm(), models.rock(), *models.unit_props(),
        models.truck(), models.watchtower(), models.comms_tower(), models.radar(), models.lamp_post(), *models.wall_panels()]
x = 0.0; roots = {}
for a in asms:  # lay the assets out in a row so the .blend is browsable
    w = 14 if a.name in ('Heli',) else 9 if a.name in ('Boat', 'APC', 'Tree', 'Palm', 'Truck', 'Watchtower', 'CommsTower', 'Radar') else 2.2
    r = a.build((x + w / 2, 0, 0)); x += w + 0.6; roots[a.name] = r
    print(f'{a.name:14s} {lib.tris(r):6d} tris')
print('TOTAL', sum(lib.tris(r) for r in roots.values()), 'tris,', len(roots), 'assets')

os.makedirs(os.path.join(ROOT, 'src', 'assets'), exist_ok=True); os.makedirs(os.path.join(ROOT, 'blender'), exist_ok=True)
glb = os.path.join(ROOT, 'src', 'assets', 'assets.glb')
bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB', export_yup=True, export_apply=False, export_cameras=False, export_lights=False, export_animations=False, export_vertex_color='ACTIVE', export_all_vertex_colors=False)
print('GLB', os.path.getsize(glb) // 1024, 'kB')

# ---- studio for renders / the saved .blend ----
world = bpy.data.worlds.new('World'); scene.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (0.05, 0.06, 0.08, 1); world.node_tree.nodes['Background'].inputs[1].default_value = 0.35
def light(name, loc, energy, size, color=(1, 1, 1)):
    d = bpy.data.lights.new(name, 'AREA'); d.energy = energy; d.size = size; d.color = color
    o = bpy.data.objects.new(name, d); scene.collection.objects.link(o); o.location = loc; return o
key, fill, rim = light('Key', (0, 0, 0), 900, 4, (1, 0.95, 0.88)), light('Fill', (0, 0, 0), 300, 6, (0.7, 0.8, 1)), light('Rim', (0, 0, 0), 700, 3, (0.8, 0.9, 1))
gm = lib.mat('studio_floor', (0.09, 0.095, 0.1), 0.6)
fl = bpy.data.meshes.new('floor'); fl.from_pydata([(-200, -200, 0), (600, -200, 0), (600, 200, 0), (-200, 200, 0)], [], [(0, 1, 2, 3)]); fl.materials.append(gm)
floor = bpy.data.objects.new('StudioFloor', fl); scene.collection.objects.link(floor)
cam = bpy.data.objects.new('Camera', bpy.data.cameras.new('Camera')); scene.collection.objects.link(cam); scene.camera = cam; cam.data.lens = 60
def aim(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()
def frame(name, size, height, zoff=0.0, yaw=0.6, floor_z=0.0):
    c = roots[name].location + Vector((0, 0, height / 2 + zoff)); d = size * 4.2
    cam.location = c + Vector((math.sin(yaw) * d, -math.cos(yaw) * d, size * 0.45)); aim(cam, c)
    key.location = c + Vector((size, -size * 1.4, size * 1.6)); aim(key, c); fill.location = c + Vector((-size * 1.6, -size, size * 0.6)); aim(fill, c); rim.location = c + Vector((-size, size * 1.5, size * 1.3)); aim(rim, c)
    for l, k in ((key, 900), (fill, 300), (rim, 700)):
        l.data.energy = k * size * size * 0.09; l.data.size = size * 1.5
    floor.location.z = floor_z
blend = os.path.join(ROOT, 'blender', 'special_soldier_assets.blend')
frame('Soldier', 1.3, 1.8)
bpy.ops.wm.save_as_mainfile(filepath=blend)
print('BLEND', os.path.getsize(blend) // 1024, 'kB')

if '--no-render' not in sys.argv:
    scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = int(os.environ.get('SAMPLES', 48)); scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = 1280, 720; scene.render.image_settings.file_format = 'JPEG'; scene.render.image_settings.quality = 88
    scene.view_settings.view_transform = 'Filmic' if 'Filmic' in [v.name for v in scene.view_settings.bl_rna.properties['view_transform'].enum_items] else scene.view_settings.view_transform
    out = os.path.join(ROOT, 'docs', 'screenshots'); os.makedirs(out, exist_ok=True)
    # hide the gun-less soldier's unused headgear for the beauty shot, attach a rifle
    shots = [('Soldier', 1.25, 1.85, 0, 0.55), ('W_m4', 0.42, 0.1, -0.02, 0.9), ('W_bolt', 0.6, 0.1, 0, 0.9), ('W_lmg', 0.55, 0.1, 0, 0.9), ('Boat', 4.6, 1.6, 0, 0.75), ('Heli', 7.5, 4.0, 0, 0.8), ('APC', 3.8, 2.6, 0, 0.75), ('Tree', 7.5, 11, 0, 0.5), ('Palm', 6, 9, 0, 0.5), ('P_crate', 0.9, 0.2, 0, 0.7), ('Truck', 4.2, 3.0, 0, 0.75), ('Watchtower', 6.5, 9.5, 0, 0.6), ('CommsTower', 20, 36, 0, 0.5), ('Radar', 6.5, 10, 0, 0.6)]
    only = os.environ.get('ONLY')
    for o in bpy.data.objects:
        if o.name.startswith('acc_') and o.name not in ('acc_helmet', 'acc_nvg'):
            o.hide_render = True
    for name, size, h, zoff, yaw in shots:
        if only and name not in only.split(','):
            continue
        frame(name, size, h, zoff, yaw, floor_z=-0.5 if name.startswith('P_') else (-0.25 if name.startswith('W_') else 0))
        scene.render.filepath = os.path.join(out, f'blender-{name.lower()}.jpg'); bpy.ops.render.render(write_still=True); print('RENDER', name)
