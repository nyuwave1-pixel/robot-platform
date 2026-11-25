"""
Kenney "Furniture Kit"(CC0, Unity 패키지도 함께 배포되는 팩)에서 라운지 가구를 골라 게임용 GLB 로 만든다.
    .bl/bin/python tools/blender/import_kenney_furniture.py
원본: tools/assets/incoming/kenney_furniture/kenney_furniturePack/Models/*.obj (tools/assets/fetch_free_assets.py 로 받는다)
- 재질 색을 라운지 팔레트로 바꾼다: 패브릭 → 핑크 벨벳, 나무 → 밝은 오크, 금속 → 샴페인 골드.
- 원점은 바닥 중앙, 1 unit = 1 m, 목표 높이에 맞춰 크기를 정한다. 그다음 optimize_models.mjs 로 압축한다.
"""
import os
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "assets", "incoming", "kenney_furniture", "kenney_furniturePack", "Models")
OUT = os.path.join(HERE, "..", "..", "public", "models")

# 게임 가구 id: (원본, 목표 높이 m). 러그처럼 납작한 것은 높이 대신 음수로 배율(-0.185 = 원본 1 unit → 0.185 m)
PICK = {
    "relaxchair": ("loungeChairRelax", 0.95),
    "cornersofa": ("loungeSofaCorner", 0.85),
    "ottoman": ("loungeSofaOttoman", 0.42),
    "squarelamp": ("lampSquareFloor", 1.6),
    "succulent": ("plantSmall2", 0.38),
    "radio": ("radio", 0.32),
    "glasstable": ("tableCoffeeGlass", 0.42),
    "coatrack": ("coatRackStanding", 1.75),
    # 2차 추가 (2026-11-25)
    "cushionbench": ("benchCushion", 0.85),
    "lowbookcase": ("bookcaseOpenLow", 0.75),
    "drawertable": ("sideTableDrawers", 0.7),
    "teatable": ("tableRound", 0.68),
    "cactus": ("plantSmall1", 0.36),
    "aloe": ("plantSmall3", 0.38),
    "pinkrug": ("rugRectangle", -0.14),
    "floorcushion": ("pillow", 0.4),
}
# 재질 이름 → (색, 거칠기, 금속성, 발광)
PALETTE = {
    "carpet": ("#f2b8c6", 0.9, 0.0, None),
    "wood": ("#f1e1cc", 0.6, 0.0, None),
    "metal": ("#c9a66b", 0.3, 0.85, None),
    "metalMedium": ("#c9a66b", 0.3, 0.85, None),
    "metalDark": ("#3a3234", 0.4, 0.2, None),
    "glass": ("#eaf6f8", 0.05, 0.0, None),
    "lamp": ("#fff3d6", 0.5, 0.0, "#ffe2a8"),
    "fur": ("#e8c7a8", 0.95, 0.0, None),
    "plant": ("#7fc28e", 0.7, 0.0, None),
    "carpetDarker": ("#e8a3b6", 0.9, 0.0, None),
    "_defaultMat": ("#fbf6f0", 0.6, 0.0, None),
}


def rgb(h):
    h = h.lstrip("#")
    return [((int(h[i:i + 2], 16) / 255) ** 2.2) for i in (0, 2, 4)]


def build(gid, src, height):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.wm.obj_import(filepath=os.path.join(SRC, src + ".obj"), forward_axis="NEGATIVE_Z", up_axis="Y")
    objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    # 바닥 중앙으로 옮기고 높이를 맞춘다 (Blender 는 Z 가 위)
    xs = [v.co.x for v in o.data.vertices]; ys = [v.co.y for v in o.data.vertices]; zs = [v.co.z for v in o.data.vertices]
    k = -height if height < 0 else height / (max(zs) - min(zs))
    for v in o.data.vertices:
        v.co.x = (v.co.x - (min(xs) + max(xs)) / 2) * k
        v.co.y = (v.co.y - (min(ys) + max(ys)) / 2) * k
        v.co.z = (v.co.z - min(zs)) * k
    for m in o.data.materials:
        base = m.name.split(".")[0]
        col, rough, metal, emis = PALETTE.get(base, ("#f6efe8", 0.7, 0.0, None))
        m.use_nodes = True
        p = m.node_tree.nodes.get("Principled BSDF")
        p.inputs["Base Color"].default_value = (*rgb(col), 1)
        p.inputs["Roughness"].default_value = rough
        p.inputs["Metallic"].default_value = metal
        if emis:
            p.inputs["Emission Color"].default_value = (*rgb(emis), 1)
            p.inputs["Emission Strength"].default_value = 1.2
        if base == "glass":
            p.inputs["Alpha"].default_value = 0.4
            m.surface_render_method = "BLENDED"
        m.name = base
    o.name = gid
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, f"furn_{gid}.glb"), export_format="GLB", use_selection=False, export_yup=True, export_apply=True)
    print("built", gid, "scale", round(k, 3), "faces", len(o.data.polygons))


if __name__ == "__main__":
    import sys
    only = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []  # 일부만: ... -- teatable pinkrug
    for gid, (src, h) in PICK.items():
        if not only or gid in only:
            build(gid, src, h)
