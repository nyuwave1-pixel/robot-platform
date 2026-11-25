"""
사진 한 장 → 3D 얼굴 회전 렌더 (Blender 4.x, 헤드리스).

  1) node scripts/blender/extract_landmarks.mjs <photo.jpg> <dir>      # landmarks.json + texture.jpg
  2) blender -b -P scripts/blender/photo_face.py -- --in <dir> --out <frames> [--frames 36] [--size 480] [--yaw 30]
  3) python3 scripts/blender/pack_sequence.py <frames> public/3d/face-sequence.webp 6

방법: MediaPipe 얼굴 메시(468점, 삼각형 위상은 src/lib/analysis/facedata.json)를 사진의 랜드마크 위치·깊이로 세우고,
사진 자체를 UV 텍스처로 입힌다. 얼굴 윤곽 밖(머리카락·귀·목)은 메시가 없어 가장자리를 부드럽게 투명 처리한다.
정면 사진 한 장 기준으로 좌우 약 ±30° 까지 자연스럽다.

⚠ 실존 인물의 사진을 넣는 경우, 사진 저작권과 별개로 본인의 초상권 동의를 받은 사진만 사용한다.
"""
import bpy, bmesh, json, math, os, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(name, default):
    return type(default)(argv[argv.index(name) + 1]) if name in argv else default
IN, OUT = arg("--in", ""), arg("--out", "")
FRAMES, SIZE, YAW, SAMPLES, STILL = arg("--frames", 36), arg("--size", 480), arg("--yaw", 30.0), arg("--samples", 48), arg("--still", 0)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
os.makedirs(OUT, exist_ok=True)

data = json.load(open(os.path.join(IN, "landmarks.json")))
W, H, P = data["width"], data["height"], data["landmarksPx"]
fd = json.load(open(os.path.join(ROOT, "src/lib/analysis/facedata.json")))
TRI = fd["triangles"]
OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150,
        136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
N = 468
# 얼굴 폭으로 정규화 (좌우 광대 234 ↔ 454)
fw = math.dist(P[3 * 234:3 * 234 + 2], P[3 * 454:3 * 454 + 2])
cx = sum(P[3 * i] for i in range(N)) / N
cy = sum(P[3 * i + 1] for i in range(N)) / N
S = 0.14 / fw   # 얼굴 폭 ≈ 14 cm
verts = [((P[3 * i] - cx) * S, P[3 * i + 2] * S, -(P[3 * i + 1] - cy) * S) for i in range(N)]   # Blender: x 오른쪽, -y 카메라, z 위

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
me = bpy.data.meshes.new("Face")
me.from_pydata(verts, [], [tuple(TRI[i:i + 3]) for i in range(0, len(TRI), 3)])
me.update()
# 삼각형 방향을 카메라(-Y) 쪽으로 통일
bm = bmesh.new(); bm.from_mesh(me)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
if sum(f.normal.y for f in bm.faces) > 0:
    bmesh.ops.reverse_faces(bm, faces=bm.faces)
bm.to_mesh(me); bm.free()
uv = me.uv_layers.new(name="UVMap")
for poly in me.polygons:
    poly.use_smooth = True
    for li in poly.loop_indices:
        vi = me.loops[li].vertex_index
        uv.data[li].uv = (P[3 * vi] / W, 1 - P[3 * vi + 1] / H)
# 가장자리 투명도: 윤곽선까지의 (UV 공간) 거리
oval_uv = [(P[3 * i] / W, P[3 * i + 1] / H) for i in OVAL]
me.color_attributes.new(name="edge", type="FLOAT_COLOR", domain="POINT")
edge = me.color_attributes["edge"]
face_w_uv = fw / W
for i in range(N):
    u, v = P[3 * i] / W, P[3 * i + 1] / H
    d = min(math.hypot(u - a, v - b) for a, b in oval_uv) / face_w_uv
    a = max(0.0, min(1.0, d / 0.09))
    a = a * a * (3 - 2 * a)
    edge.data[i].color = (a, a, a, 1)
ob = bpy.data.objects.new("Face", me); scene.collection.objects.link(ob)
sub = ob.modifiers.new("Subsurf", "SUBSURF"); sub.levels = 2; sub.render_levels = 3

# 재질: 사진 색은 그대로(발광) + 약한 반사광으로 입체감
m = bpy.data.materials.new("Photo"); m.use_nodes = True; m.blend_method = "BLEND"
nt = m.node_tree; Nn, L = nt.nodes, nt.links
for n in list(Nn): Nn.remove(n)
out = Nn.new("ShaderNodeOutputMaterial")
tex = Nn.new("ShaderNodeTexImage"); tex.image = bpy.data.images.load(os.path.join(IN, "texture.jpg")); tex.interpolation = "Cubic"
emi = Nn.new("ShaderNodeEmission"); L.new(tex.outputs["Color"], emi.inputs["Color"]); emi.inputs["Strength"].default_value = 1.0
gl = Nn.new("ShaderNodeBsdfGlossy"); gl.inputs["Roughness"].default_value = 0.38
add = Nn.new("ShaderNodeMixShader"); add.inputs["Fac"].default_value = 0.06
L.new(emi.outputs[0], add.inputs[1]); L.new(gl.outputs[0], add.inputs[2])
at = Nn.new("ShaderNodeAttribute"); at.attribute_name = "edge"
tr = Nn.new("ShaderNodeBsdfTransparent")
mix = Nn.new("ShaderNodeMixShader"); L.new(at.outputs["Fac"], mix.inputs["Fac"]); L.new(tr.outputs[0], mix.inputs[1]); L.new(add.outputs[0], mix.inputs[2])
L.new(mix.outputs[0], out.inputs["Surface"])
me.materials.append(m)

# 조명 (반사광용) · 카메라
key = bpy.data.lights.new("Key", "AREA"); key.energy = 6; key.size = 0.6
ko = bpy.data.objects.new("Key", key); scene.collection.objects.link(ko); ko.location = (-0.35, -0.6, 0.3); ko.rotation_euler = (math.radians(60), 0, math.radians(-30))
world = bpy.data.worlds.new("W"); scene.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.0
target = bpy.data.objects.new("T", None); scene.collection.objects.link(target)
cam_d = bpy.data.cameras.new("Cam"); cam_d.lens = 85; cam_d.sensor_width = 36
cam = bpy.data.objects.new("Cam", cam_d); scene.collection.objects.link(cam); scene.camera = cam
tc = cam.constraints.new("TRACK_TO"); tc.target = target; tc.track_axis = "TRACK_NEGATIVE_Z"; tc.up_axis = "UP_Y"
R = 0.62
for f in range(FRAMES):
    t = f / max(1, FRAMES - 1)
    yaw = math.radians(-YAW + 2 * YAW * t)
    cam.location = (R * math.sin(yaw), -R * math.cos(yaw), 0.0)
    cam.keyframe_insert("location", frame=f + 1)

scene.render.engine = "CYCLES"; scene.cycles.device = "CPU"; scene.cycles.samples = SAMPLES; scene.cycles.use_denoising = False
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = SIZE
scene.render.image_settings.file_format = "PNG"; scene.render.image_settings.color_mode = "RGBA"
scene.view_settings.view_transform = "Standard"
scene.frame_start, scene.frame_end = 1, FRAMES
if STILL:
    scene.frame_set(STILL); scene.render.filepath = os.path.join(OUT, f"still_{STILL:03d}.png"); bpy.ops.render.render(write_still=True)
else:
    scene.render.filepath = os.path.join(OUT, "frame_"); bpy.ops.render.render(animation=True)
print("RENDER_DONE", OUT)
