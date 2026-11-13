"""
MEDIDERMA AI — 얼굴 3D 에셋 파이프라인 (Blender 4.x, 헤드리스).

  blender -b -P scripts/blender/build_face.py -- [--frames 36] [--size 480] [--samples 64] [--skip-render]

만드는 것
  1) public/3d/face.glb          — 서브디비전으로 매끈하게 다듬은 얼굴 셸. 법선 · UV · 영역 ID(두 번째 UV 채널) 포함.
                                    웹(Three.js)에서 실시간 렌더링에 사용한다.
  2) <out>/frame_XXX.png          — Cycles 로 렌더링한 스윙 턴테이블(투명 배경). pack_sequence.py 가 스프라이트 시트로 묶는다.
                                    WebGL 을 쓰지 않는 기기에서 '가짜 3D(이미지 시퀀스)'로 사용한다.

지오메트리 출처: MediaPipe canonical face model (Apache-2.0) — src/lib/analysis/facedata.json. 실제 인물의 얼굴이 아니다.
"""
import bpy, bmesh, json, math, os, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(name, default):
    return type(default)(argv[argv.index(name) + 1]) if name in argv else default
FRAMES, SIZE, SAMPLES = arg("--frames", 36), arg("--size", 480), arg("--samples", 64)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = arg("--out", os.path.join(ROOT, ".blender-out"))
os.makedirs(OUT, exist_ok=True)
data = json.load(open(os.path.join(ROOT, "src/lib/analysis/facedata.json")))
C, TRI, ZONES = data["canonical"], data["triangles"], data["zones"]
ZONE_ORDER = ["forehead", "glabella", "left_eye_corner", "right_eye_corner", "left_under_eye", "right_under_eye", "left_cheek", "right_cheek",
              "nose", "mouth_area", "left_jawline", "right_jawline", "chin"]  # src/lib/analysis/zones.ts FACE_ZONES 와 같은 순서

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# canonical (x 오른쪽, y 위, z 카메라 쪽) → Blender (Z-up). glTF 내보내기(+Y up)에서 다시 canonical 축으로 돌아온다.
verts = [(C[3 * i], -C[3 * i + 2], C[3 * i + 1]) for i in range(len(C) // 3)]
faces = [tuple(TRI[i:i + 3]) for i in range(0, len(TRI), 3)]

def make(name):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    return ob

def apply_modifier(ob, mod):
    bpy.context.view_layer.objects.active = ob
    for o in scene.objects: o.select_set(o == ob)
    bpy.ops.object.modifier_apply(modifier=mod.name)

# ── 1. 매끈한 얼굴 셸 ─────────────────────────────────────
shell = make("FaceShell")
sub = shell.modifiers.new("subdiv", "SUBSURF"); sub.levels = 2; sub.render_levels = 2; sub.subdivision_type = "CATMULL_CLARK"
apply_modifier(shell, sub)
me = shell.data
for p in me.polygons: p.use_smooth = True

# 영역 ID: 조밀해진 각 면의 중심(정면 투영)이 어느 영역 폴리곤 안에 있는지 → 두 번째 UV 의 u = (index+1)/16
# (버텍스 컬러는 내보낼 때 색공간 변환이 들어가 값이 틀어지므로 UV 채널에 담는다)
def inside(px, py, poly):
    c = False
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]; x2, y2 = poly[(i + 1) % n]
        if (y1 > py) != (y2 > py) and px < (x2 - x1) * (py - y1) / (y2 - y1) + x1: c = not c
    return c
zone_polys = [[(C[3 * i], C[3 * i + 1]) for i in ZONES[z]] for z in ZONE_ORDER]
uv = me.uv_layers.new(name="UVMap")
zuv = me.uv_layers.new(name="ZoneUV")
xs = [v.co.x for v in me.vertices]; zs = [v.co.z for v in me.vertices]
minx, maxx, minz, maxz = min(xs), max(xs), min(zs), max(zs)
counts = [0] * 14
for p in me.polygons:
    cx, cz = p.center.x, p.center.z
    zid = 0
    for k, poly in enumerate(zone_polys):
        if inside(cx, cz, poly): zid = k + 1; break
    counts[zid] += 1
    for li in p.loop_indices:
        zuv.data[li].uv = (zid / 16.0, 0.5)
        v = me.vertices[me.loops[li].vertex_index].co
        uv.data[li].uv = ((v.x - minx) / (maxx - minx), (v.z - minz) / (maxz - minz))
print("ZONE_FACE_COUNTS", counts, "tris/quads:", len(me.polygons), "verts:", len(me.vertices))


bpy.context.view_layer.objects.active = shell
for o in scene.objects: o.select_set(o == shell)
glb = os.path.join(ROOT, "public/3d/face.glb")
bpy.ops.export_scene.gltf(filepath=glb, export_format="GLB", use_selection=True, export_apply=True, export_normals=True,
                          export_texcoords=True, export_colors=False, export_yup=True, export_materials="NONE")
print("GLB", glb, os.path.getsize(glb))
if "--skip-render" in argv: sys.exit(0)

# ── 2. Cycles 렌더용 씬 ───────────────────────────────────
solid = shell.modifiers.new("solid", "SOLIDIFY"); solid.thickness = 0.28; solid.offset = -1.0
bev = shell.modifiers.new("bevel", "BEVEL"); bev.width = 0.05; bev.segments = 2

def emission(name, color, strength):
    m = bpy.data.materials.new(name); m.use_nodes = True
    n = m.node_tree; n.nodes.clear()
    e = n.nodes.new("ShaderNodeEmission"); e.inputs["Color"].default_value = (*color, 1); e.inputs["Strength"].default_value = strength
    o = n.nodes.new("ShaderNodeOutputMaterial"); n.links.new(e.outputs[0], o.inputs["Surface"])
    return m

# 셸: 어두운 금속 + 프레넬 가장자리 발광 (홀로그램 느낌)
m = bpy.data.materials.new("HoloShell"); m.use_nodes = True
n = m.node_tree; b = n.nodes["Principled BSDF"]
b.inputs["Base Color"].default_value = (0.07, 0.14, 0.24, 1); b.inputs["Metallic"].default_value = 0.9; b.inputs["Roughness"].default_value = 0.28
lw = n.nodes.new("ShaderNodeLayerWeight"); lw.inputs["Blend"].default_value = 0.32
ramp = n.nodes.new("ShaderNodeValToRGB"); ramp.color_ramp.elements[0].position = 0.35; ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
ramp.color_ramp.elements[1].position = 1.0; ramp.color_ramp.elements[1].color = (0.18, 0.62, 1.0, 1)
em = n.nodes.new("ShaderNodeEmission"); em.inputs["Strength"].default_value = 2.6
add = n.nodes.new("ShaderNodeAddShader")
n.links.new(lw.outputs["Facing"], ramp.inputs["Fac"]); n.links.new(ramp.outputs["Color"], em.inputs["Color"])
n.links.new(b.outputs["BSDF"], add.inputs[0]); n.links.new(em.outputs[0], add.inputs[1])
n.links.new(add.outputs[0], n.nodes["Material Output"].inputs["Surface"])
me.materials.clear(); me.materials.append(m)

# 랜드마크 와이어(원본 저해상도 토폴로지)를 얇은 발광 튜브로
wire = make("LandmarkWire")
wire.scale = (1.006, 1.006, 1.006); wire.location = (0, -0.06, 0)
wm = wire.modifiers.new("wire", "WIREFRAME"); wm.thickness = 0.017; wm.use_replace = True
wire.data.materials.append(emission("WireGlow", (0.25, 0.75, 1.0), 1.3))

# 랜드마크 점: 468개 꼭짓점 위치에 작은 발광 구
bm = bmesh.new()
for v in verts:
    mat = __import__("mathutils").Matrix.Translation(Vector(v) + Vector((0, -0.08, 0)))
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.06, matrix=mat)
dots_me = bpy.data.meshes.new("LandmarkDots"); bm.to_mesh(dots_me); bm.free()
dots = bpy.data.objects.new("LandmarkDots", dots_me); scene.collection.objects.link(dots)
dots_me.materials.append(emission("DotGlow", (0.75, 0.93, 1.0), 6.0))

# 조명: 금속이 반사할 소프트박스(발광 면) + 림 라이트
def softbox(name, loc, rot, size, color, strength):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name; o.scale = (size[0], size[1], 1)
    o.data.materials.append(emission(name + "Mat", color, strength))
    o.visible_camera = False
    return o
softbox("KeyTop", (0, -10, 26), (math.radians(25), 0, 0), (34, 10), (1, 1, 1), 5.0)
softbox("RimL", (-26, 6, 2), (0, math.radians(-78), 0), (26, 7), (0.25, 0.6, 1.0), 9.0)
softbox("RimR", (26, 6, 2), (0, math.radians(78), 0), (26, 7), (0.35, 0.75, 1.0), 7.0)
softbox("FrontFill", (0, -40, -4), (math.radians(90), 0, 0), (46, 20), (0.75, 0.85, 1.0), 1.5)
softbox("Under", (0, -8, -22), (math.radians(-40), 0, 0), (22, 6), (0.2, 0.5, 1.0), 2.4)
world = bpy.data.worlds.new("W"); scene.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.004, 0.006, 0.01, 1)

# 카메라: 얼굴 중심을 바라보며 좌우 ±38° 스윙 + 약간의 상하 움직임
target = bpy.data.objects.new("Target", None); scene.collection.objects.link(target); target.location = (0, 0, 0.3)
cam_data = bpy.data.cameras.new("Cam"); cam_data.lens = 85; cam_data.sensor_width = 36
cam = bpy.data.objects.new("Cam", cam_data); scene.collection.objects.link(cam); scene.camera = cam
tr = cam.constraints.new("TRACK_TO"); tr.target = target; tr.track_axis = "TRACK_NEGATIVE_Z"; tr.up_axis = "UP_Y"
R = 62.0
for f in range(FRAMES):
    t = f / (FRAMES - 1)
    yaw = math.radians(-38 + 76 * t)
    pitch = math.radians(4 * math.sin(t * math.pi))
    cam.location = (R * math.sin(yaw) * math.cos(pitch), -R * math.cos(yaw) * math.cos(pitch), 0.3 + R * math.sin(pitch))
    cam.keyframe_insert("location", frame=f + 1)

scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"; scene.cycles.samples = SAMPLES
try:
    scene.cycles.use_denoising = True; scene.cycles.denoiser = "OPENIMAGEDENOISE"
except Exception as e:
    print("denoiser unavailable:", e); scene.cycles.use_denoising = False
scene.cycles.max_bounces = 6
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = SIZE; scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"; scene.render.image_settings.color_mode = "RGBA"
scene.view_settings.view_transform = "Filmic"; scene.view_settings.look = "Medium High Contrast"
scene.render.threads_mode = "AUTO"
scene.frame_start, scene.frame_end = 1, FRAMES
scene.render.filepath = os.path.join(OUT, "frame_")
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "face_scene.blend"))
bpy.ops.render.render(animation=True)
print("RENDER_DONE", OUT)
