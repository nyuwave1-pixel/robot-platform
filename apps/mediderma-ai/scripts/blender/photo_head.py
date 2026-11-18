"""
깊이 맵 + 사진 → 머리·헤어·목까지 포함한 3D 회전 렌더 (Blender 4.x, 헤드리스).

  1) 사진을 초해상도로 키우고(up.png) 인물 마스크(mask.png)를 만든다
  2) node scripts/blender/extract_landmarks.mjs <dir>/up.png <dir>/lm
  3) python scripts/blender/photo_head_depth.py <dir>                 # depth.npy, texture.png
  4) blender -b -P scripts/blender/photo_head.py -- --in <dir> --out <frames> [--frames 36] [--size 640] [--yaw 26]
  5) python3 scripts/blender/pack_sequence.py <frames> public/3d/face-sequence.webp 6

⚠ 실존 인물의 사진은 본인의 초상권 동의를 받은 경우에만 사용한다.
"""
import bpy, json, math, os, sys
import numpy as np

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(name, default):
    return type(default)(argv[argv.index(name) + 1]) if name in argv else default
IN, OUT = arg("--in", ""), arg("--out", "")
FRAMES, SIZE, YAW, SAMPLES, STILL, STEP = arg("--frames", 36), arg("--size", 640), arg("--yaw", 22.0), arg("--samples", 32), arg("--still", 0), arg("--step", 3)
os.makedirs(OUT, exist_ok=True)
meta = json.load(open(os.path.join(IN, "meta.json")))
depth = np.load(os.path.join(IN, "depth.npy"))
H, W = depth.shape
fw = meta["faceWidthPx"]; cx, cy = meta["center"]
S = 0.14 / fw   # 얼굴 폭 ≈ 14 cm

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
tex_img = bpy.data.images.load(os.path.join(IN, "texture.png"))
alpha = np.array(tex_img.pixels[:], np.float32).reshape(H, W, 4)[::-1, :, 3]   # Blender 이미지는 아래→위 순서

ys = np.arange(0, H, STEP); xs = np.arange(0, W, STEP)
gy, gx = np.meshgrid(ys, xs, indexing="ij")
ny, nx = gy.shape
d = depth[gy, gx]; a = alpha[gy, gx]
verts = np.stack([(gx - cx) * S, -d * S, -(gy - cy) * S], -1).reshape(-1, 3)
uvs = np.stack([gx / (W - 1), 1 - gy / (H - 1)], -1).reshape(-1, 2)
idx = np.arange(ny * nx).reshape(ny, nx)
q = np.stack([idx[:-1, :-1], idx[1:, :-1], idx[1:, 1:], idx[:-1, 1:]], -1).reshape(-1, 4)
qa = np.minimum.reduce([a[:-1, :-1], a[1:, :-1], a[1:, 1:], a[:-1, 1:]]).reshape(-1)
q = q[qa > 0.02]
used = np.unique(q); remap = -np.ones(ny * nx, np.int64); remap[used] = np.arange(len(used))
q = remap[q]; verts = verts[used]; uvs = uvs[used]

me = bpy.data.meshes.new("Head")
me.vertices.add(len(verts)); me.vertices.foreach_set("co", verts.ravel())
me.loops.add(len(q) * 4); me.loops.foreach_set("vertex_index", q.ravel())
me.polygons.add(len(q)); me.polygons.foreach_set("loop_start", np.arange(0, len(q) * 4, 4)); me.polygons.foreach_set("loop_total", np.full(len(q), 4))
me.update(calc_edges=True)
uvl = me.uv_layers.new(name="UVMap"); uvl.data.foreach_set("uv", uvs[q.ravel()].ravel())
me.polygons.foreach_set("use_smooth", np.ones(len(q), bool))
if sum(p.normal.y for p in me.polygons[:2000]) > 0:
    for p in me.polygons: p.flip()
ob = bpy.data.objects.new("Head", me); scene.collection.objects.link(ob)

m = bpy.data.materials.new("Photo"); m.use_nodes = True; m.blend_method = "BLEND"
nt = m.node_tree; N, L = nt.nodes, nt.links
for n in list(N): N.remove(n)
out = N.new("ShaderNodeOutputMaterial")
t = N.new("ShaderNodeTexImage"); t.image = tex_img; t.interpolation = "Cubic"
emi = N.new("ShaderNodeEmission"); L.new(t.outputs["Color"], emi.inputs["Color"])
gl = N.new("ShaderNodeBsdfGlossy"); gl.inputs["Roughness"].default_value = 0.4
sh = N.new("ShaderNodeMixShader"); sh.inputs["Fac"].default_value = 0.0; L.new(emi.outputs[0], sh.inputs[1]); L.new(gl.outputs[0], sh.inputs[2])
tr = N.new("ShaderNodeBsdfTransparent")
mx = N.new("ShaderNodeMixShader"); L.new(t.outputs["Alpha"], mx.inputs["Fac"]); L.new(tr.outputs[0], mx.inputs[1]); L.new(sh.outputs[0], mx.inputs[2])
L.new(mx.outputs[0], out.inputs["Surface"])
me.materials.append(m)

key = bpy.data.lights.new("Key", "AREA"); key.energy = 6; key.size = 0.6
ko = bpy.data.objects.new("Key", key); scene.collection.objects.link(ko); ko.location = (-0.35, -0.6, 0.3); ko.rotation_euler = (math.radians(60), 0, math.radians(-30))
world = bpy.data.worlds.new("W"); scene.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.0
target = bpy.data.objects.new("T", None); scene.collection.objects.link(target); target.location = (0, -0.03, -0.02)
cam_d = bpy.data.cameras.new("Cam"); cam_d.lens = 85; cam_d.sensor_width = 36
cam = bpy.data.objects.new("Cam", cam_d); scene.collection.objects.link(cam); scene.camera = cam
tc = cam.constraints.new("TRACK_TO"); tc.target = target; tc.track_axis = "TRACK_NEGATIVE_Z"; tc.up_axis = "UP_Y"
R = 0.95
for f in range(FRAMES):
    u = f / max(1, FRAMES - 1)
    yaw = math.radians(-YAW + 2 * YAW * u)
    cam.location = (R * math.sin(yaw), -R * math.cos(yaw) - 0.03, -0.02)
    cam.keyframe_insert("location", frame=f + 1)

scene.render.engine = "CYCLES"; scene.cycles.device = "CPU"; scene.cycles.samples = SAMPLES; scene.cycles.use_denoising = False
scene.cycles.transparent_max_bounces = 16
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = SIZE
scene.render.image_settings.file_format = "PNG"; scene.render.image_settings.color_mode = "RGBA"
scene.view_settings.view_transform = "Standard"
scene.frame_start, scene.frame_end = 1, FRAMES
if STILL:
    scene.frame_set(STILL); scene.render.filepath = os.path.join(OUT, f"still_{STILL:03d}.png"); bpy.ops.render.render(write_still=True)
else:
    scene.render.filepath = os.path.join(OUT, "frame_"); bpy.ops.render.render(animation=True)
print("RENDER_DONE", OUT, len(verts), "verts")
