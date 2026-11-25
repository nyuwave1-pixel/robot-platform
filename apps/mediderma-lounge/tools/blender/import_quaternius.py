"""
Quaternius "Ultimate Stylized Nature"(CC0) 에서 광장에 쓸 모델만 골라 게임용 GLB 로 만든다.
    .bl/bin/python tools/blender/import_quaternius.py
원본: tools/assets/incoming/quaternius_nature/ (tools/assets/fetch_free_assets.py 로 받는다)
- 텍스처를 라운지 파스텔 팔레트로 보정하고 512px 로 줄여 GLB 에 넣는다.
- 원점은 바닥 중앙, 1 unit = 1 m. 잎·꽃 재질 이름(Bush_Leaves · Flowers · Grass)은 게임이 알파 컷을 켤 때 쓴다.
- 여러 덤불을 한데 모은 꽃밭(flowerpatch)처럼 광장에 바로 놓을 수 있는 묶음으로 만든다.
"""
import importlib.util, math, os, sys
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "assets", "incoming", "quaternius_nature")
OUT = os.path.join(HERE, "..", "..", "public", "models")
TMP = os.path.join(SRC, "_tinted")

spec = importlib.util.spec_from_file_location("bfa", os.path.join(HERE, "..", "assets", "build_free_assets.py"))
bfa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bfa)

TINT = {  # 원본 형광 연두·짙은 꽃색을 라운지 팔레트(민트 #8cc592 · 파스텔 꽃)로. 청록 꽃은 분홍으로 바꾼다
    "Bush_Leaves.png": dict(hue=0.36, sat=0.42, val=0.92, lift=0.22),
    "Flowers.png": dict(sat=0.75, val=1.12, lift=0.22, remap=[(0.42, 0.62, 0.95), (0.1, 0.2, 0.12)]),
    "Grass.png": dict(hue=0.34, sat=0.42, val=1.0, lift=0.25),
}


def tinted():
    from PIL import Image
    os.makedirs(TMP, exist_ok=True)
    for name, t in TINT.items():
        im = Image.open(os.path.join(SRC, name)).convert("RGBA").resize((384, 384), Image.LANCZOS)
        bfa.pastel(im, **t).save(os.path.join(TMP, name))


def relink():
    """.blend 안에 묶인(packed) 원본 대신 보정한 텍스처를 재질 노드에 직접 연결한다."""
    loaded = {n.split(".")[0]: bpy.data.images.load(os.path.join(TMP, n)) for n in TINT}
    for m in bpy.data.materials:
        m.use_backface_culling = False
        if not m.use_nodes:
            continue
        for node in m.node_tree.nodes:
            if node.type == "TEX_IMAGE" and node.image and node.image.name.split(".")[0] in loaded:
                node.image = loaded[node.image.name.split(".")[0]]


def ground(o):
    """원점을 바닥 중앙으로, 회전·크기를 적용한다."""
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    ws = [o.matrix_world @ v.co for v in o.data.vertices]
    cx = (min(v.x for v in ws) + max(v.x for v in ws)) / 2
    cy = (min(v.y for v in ws) + max(v.y for v in ws)) / 2
    mz = min(v.z for v in ws)
    for v in o.data.vertices:
        v.co.x -= cx - o.location.x
        v.co.y -= cy - o.location.y
        v.co.z -= mz - o.location.z
    o.location = (0, 0, 0)


def export(name, parts, scale=1.0):
    """parts: [(원본 객체 이름, (x, y), 회전 z, 크기)] 를 복제해 한 GLB 로 묶는다."""
    bpy.ops.object.select_all(action="DESELECT")
    made = []
    for src, (x, y), rz, s in parts:
        o = bpy.data.objects[src].copy()
        o.data = o.data.copy()
        bpy.context.collection.objects.link(o)
        o.parent = None
        o.matrix_world.identity()
        ground(o)
        o.location = (x, y, 0)
        o.rotation_euler = (0, 0, rz)
        o.scale = (s * scale,) * 3
        made.append(o)
    bpy.ops.object.select_all(action="DESELECT")
    for o in made:
        o.select_set(True)
    bpy.context.view_layer.objects.active = made[0]
    if len(made) > 1:
        bpy.ops.object.join()
    path = os.path.abspath(os.path.join(OUT, name + ".glb"))
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_apply=True, export_yup=True, export_image_format="WEBP", export_image_quality=82)
    o = bpy.context.view_layer.objects.active
    o.data.calc_loop_triangles()
    print(f"ASSET {name}: {len(o.data.loop_triangles)} tris, {os.path.getsize(path) / 1024:.1f} KB")
    bpy.data.objects.remove(o)


def main():
    tinted()
    bpy.ops.wm.open_mainfile(filepath=os.path.join(SRC, "AllModels.blend"))
    relink()
    # 광장 둘레에 놓을 꽃 덤불 3종
    export("qn_bush_large", [("Bush_Large_Flowers", (0, 0), 0, 1.0)])
    export("qn_bush", [("Bush_Flowers", (0, 0), 0, 1.0)])
    export("qn_bush_small", [("Bush_Small_Flowers", (0, 0), 0, 1.0)])
    # 꽃밭 묶음: 꽃무리 5종 + 풀 (지름 약 1.8 m)
    rnd = [(0.0, 0.0), (0.45, 0.2), (-0.4, 0.25), (0.2, -0.45), (-0.3, -0.35), (0.65, -0.2), (-0.65, -0.05), (0.05, 0.6)]
    clumps = ["Flower_1_Clump", "Flower_2_Clump", "Flower_3_Clump", "Flower_4_Clump", "Flower_5_Clump", "Flower_2_Clump", "Flower_4_Clump", "Flower_3_Clump"]
    export("qn_flowerpatch", [(c, p, i * 1.3, 1.0 + (i % 3) * 0.12) for i, (c, p) in enumerate(zip(clumps, rnd))]
           + [("Grass_Large", (0.75, 0.45), 0.4, 0.9), ("Grass_Small", (-0.7, 0.55), 1.1, 1.0), ("Grass_Large", (-0.2, -0.75), 2.0, 0.8)])
    # 잔디 위 풀 무더기
    export("qn_grass", [("Grass_Large", (0, 0), 0, 1.0), ("Grass_Small", (0.35, 0.2), 1.2, 1.0), ("Grass_Large", (-0.3, 0.25), 2.4, 0.8), ("Grass_Small", (0.1, -0.35), 0.7, 1.1)])
    # 꽃잎 잡기 미니게임의 꽃잎
    export("qn_petal", [("Petals_1", (0, 0), 0, 1.0)])


main()
