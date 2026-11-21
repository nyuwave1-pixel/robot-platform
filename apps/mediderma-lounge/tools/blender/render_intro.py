"""
MEDIDERMA LOUNGE — 타이틀 영상 렌더 스크립트.

build_assets.py 가 만든 GLB 로 라운지 세트를 차리고 카메라가 천천히 들어가는 컷을 Cycles 로 렌더한다.
    .bl/bin/python tools/blender/render_intro.py OUT_DIR [--frames 96] [--test]
프레임 PNG 를 OUT_DIR 에 쓰고, ffmpeg 로 public/video/intro.mp4 를 만든다 (ffmpeg 는 따로 실행).
"""
import bpy, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS = os.path.join(HERE, "..", "..", "public", "models")
OUT = sys.argv[1]
FRAMES = int(sys.argv[sys.argv.index("--frames") + 1]) if "--frames" in sys.argv else 96
TEST = "--test" in sys.argv

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene


def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]


def mat(name, color, rough=0.5, metallic=0.0, emission=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*srgb(color), 1)
    b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metallic
    if emission:
        b.inputs["Emission Color"].default_value = (*srgb(color), 1); b.inputs["Emission Strength"].default_value = emission
    return m


def place(name, x, z, rot=0.0, scale=1.0):
    """게임 좌표 (x, z) 에 모델을 놓는다. 게임 +Z(정면) = Blender -Y."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(MODELS, name + ".glb"))
    new = [o for o in bpy.data.objects if o not in before]
    bpy.ops.object.empty_add(location=(x, -z, 0))
    piv = bpy.context.object
    piv.rotation_euler = (0, 0, rot); piv.scale = (scale,) * 3
    for o in new:
        if o.parent is None:
            o.parent = piv
    return piv


def plane(size, loc, rot, material):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object; o.scale = (size[0], size[1], 1); o.data.materials.append(material)
    return o


# ── 세트 ──
plane((14, 12), (0, 0, 0), (0, 0, 0), mat("floor", "#f6e9dc", rough=0.18))
plane((14, 4.2), (0, 3.2, 2.1), (math.pi / 2, 0, 0), mat("wall", "#fbe6ea", rough=0.9))
for s in (-1, 1):
    plane((12, 4.2), (s * 6, 0, 2.1), (math.pi / 2, 0, math.pi / 2), mat(f"side{s}", "#fff3ea", rough=0.9))
# 벽 몰딩과 아치 창 (빛나는 패널)
for x in (-4.2, 4.2):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.75, depth=0.05, vertices=48, location=(x, 3.17, 2.3), rotation=(math.pi / 2, 0, 0))
    bpy.context.object.data.materials.append(mat(f"win{x}", "#fff6e6", emission=6))
    plane((1.5, 1.7), (x, 3.16, 1.45), (math.pi / 2, 0, 0), mat(f"winb{x}", "#fff6e6", emission=6))
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 3.15, 0.08)); bpy.context.object.scale = (14, 0.06, 0.16)
bpy.context.object.data.materials.append(mat("skirting", "#c9a66b", rough=0.3, metallic=0.9))

place("furn_arch", 0, -2.2)
place("furn_rug", 0, 0.6, scale=1.25)
place("furn_coffeetable", 0, 0.6)
place("sofa_3", -2.9, 0.3, rot=math.radians(62))
place("sofa_1", 2.6, 1.3, rot=math.radians(-70))
place("furn_vanity", 3.6, -1.9, rot=math.radians(-18))
place("furn_plant", -4.6, -2.2, scale=1.3)
place("furn_plant", 1.9, -2.5, scale=1.1)
place("furn_lamp", -1.9, -2.4)
place("furn_bookshelf", -3.6, -2.75, rot=math.radians(8))
place("furn_flower", 4.9, -0.4)
place("furn_display", -1.6, 2.2, scale=0.8)
place("derma_home", -1.6, 2.2, scale=0.8).location.z = 0.85 * 0.8
place("furn_goldtable", 1.5, 2.0)
place("furn_diffuser", 5.2, -2.6)
place("furn_petbed", -4.6, 1.6)

# ── 조명 ──
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (1.0, 0.86, 0.84, 1)
w.node_tree.nodes["Background"].inputs[1].default_value = 0.4


def area(loc, energy, size, color):
    bpy.ops.object.light_add(type="AREA", location=loc)
    l = bpy.context.object; l.data.energy = energy; l.data.size = size; l.data.color = color
    l.rotation_euler = (0, 0, 0)
    return l


area((0, -1, 4.1), 620, 6, (1, 0.93, 0.86))
area((-4, -3, 3.6), 350, 3, (1, 0.8, 0.86))
area((4, -3, 3.6), 300, 3, (0.9, 0.86, 1))
bpy.ops.object.light_add(type="POINT", location=(0, 1.6, 1.6)); bpy.context.object.data.energy = 220; bpy.context.object.data.color = (1, 0.82, 0.86)

# ── 카메라: 입구에서 포토존 쪽으로 천천히 들어가며 살짝 내려온다 ──
bpy.ops.object.empty_add(location=(0, 1.4, 1.15)); tgt = bpy.context.object
bpy.ops.object.camera_add(); cam = bpy.context.object; sc.camera = cam
cam.data.lens = 28
cam.constraints.new("TRACK_TO").target = tgt
for f, (x, y, z) in ((1, (-1.6, -8.2, 2.5)), (FRAMES, (0.5, -4.6, 1.55))):
    cam.location = (x, y, z); cam.keyframe_insert("location", frame=f)
tgt.location = (0, 1.4, 1.3); tgt.keyframe_insert("location", frame=1)
tgt.location = (0, 2.0, 1.2); tgt.keyframe_insert("location", frame=FRAMES)
for fc in [fc for o in (cam, tgt) for fc in o.animation_data.action.fcurves] if hasattr(cam.animation_data.action, "fcurves") else []:
    for k in fc.keyframe_points:
        k.interpolation = "SINE"

# ── 렌더 ──
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"; sc.cycles.samples = 18; sc.cycles.use_denoising = True
sc.cycles.max_bounces = 4; sc.cycles.diffuse_bounces = 2; sc.cycles.glossy_bounces = 3
sc.render.resolution_x, sc.render.resolution_y = 854, 480
sc.render.threads_mode = "AUTO"
sc.view_settings.view_transform = "Filmic" if "Filmic" in [v.name for v in type(sc.view_settings).bl_rna.properties["view_transform"].enum_items] else sc.view_settings.view_transform
sc.frame_start, sc.frame_end = 1, FRAMES
sc.render.image_settings.file_format = "PNG"
os.makedirs(OUT, exist_ok=True)
if TEST:
    for f in (1, FRAMES):
        sc.frame_set(f); sc.render.filepath = os.path.join(OUT, f"test_{f:04d}.png"); bpy.ops.render.render(write_still=True)
else:
    sc.render.filepath = os.path.join(OUT, "f_")
    bpy.ops.render.render(animation=True)
print("RENDER DONE")
