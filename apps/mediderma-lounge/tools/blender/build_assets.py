"""
MEDIDERMA LOUNGE — Blender 에셋 빌드 스크립트.

Blender(bpy)로 모델을 만들고 public/models/*.glb 로 내보낸다. 손으로 만든 .blend 파일 없이
이 스크립트가 원본이므로, 치수를 바꾸면 다시 실행해 GLB 를 재생성한다.

    python -m venv .bl && .bl/bin/pip install bpy==5.3.0
    .bl/bin/python tools/blender/build_assets.py            # GLB 내보내기
    .bl/bin/python tools/blender/build_assets.py --preview  # + Cycles 미리보기 PNG (tools/blender/preview/)

규칙: 1 unit = 1 m, 원점은 바닥 중앙, 정면은 Blender -Y (glTF +Z). 재질 이름은 게임 코드가
색을 바꿀 때 쓰는 키다 (accent, fabric, glow).
DERMA HOME 은 공식 제품 사진을 보고 만든 형상이며 로고·스크린 글자는 게임 코드가 덧그린다.
"""
import bpy, math, os, sys

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "models")
PREVIEW = "--preview" in sys.argv


def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mat(name, color, metallic=0.0, rough=0.5, emission=0.0, alpha=1.0):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*srgb(color), 1)
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = rough
    if emission:
        b.inputs["Emission Color"].default_value = (*srgb(color), 1)
        b.inputs["Emission Strength"].default_value = emission
    if alpha < 1:
        b.inputs["Alpha"].default_value = alpha
        m.blend_method = "BLEND" if hasattr(m, "blend_method") else m.blend_method
    return m


def finish(o, material, bevel=0.0, segs=3, subsurf=0):
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = o.modifiers.new("bevel", "BEVEL")
        mod.width = bevel; mod.segments = segs; mod.limit_method = "ANGLE"; mod.angle_limit = math.radians(40)
        bpy.ops.object.modifier_apply(modifier=mod.name)
    if subsurf:
        mod = o.modifiers.new("sub", "SUBSURF")
        mod.levels = subsurf
        bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.ops.object.shade_smooth()
    o.data.materials.append(material)
    return o


def box(size, loc, material, bevel=0.01, segs=3, rot=(0, 0, 0), subsurf=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object
    o.scale = size
    return finish(o, material, bevel, segs, subsurf)


def cyl(r, h, loc, material, rot=(0, 0, 0), verts=32, bevel=0.0, r2=None):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=verts, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=h, vertices=verts, location=loc, rotation=rot)
    return finish(bpy.context.object, material, bevel, 2)


def ball(r, loc, material, scale=(1, 1, 1), seg=24):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=seg // 2, location=loc)
    o = bpy.context.object
    o.scale = scale
    return finish(o, material)


def torus(R, r, loc, material, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=40, minor_segments=10, location=loc, rotation=rot)
    return finish(bpy.context.object, material)


def export(name):
    tris = 0
    for o in bpy.data.objects:
        if o.type == "MESH":
            o.data.calc_loop_triangles()
            tris += len(o.data.loop_triangles)
    path = os.path.abspath(os.path.join(OUT, name + ".glb"))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.context.view_layer.objects.active = [o for o in bpy.data.objects if o.type == "MESH"][0]
    bpy.ops.object.join()
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_apply=True, export_yup=True)
    print(f"ASSET {name}: {tris} tris, {os.path.getsize(path) / 1024:.1f} KB")
    if PREVIEW:
        preview(name)


def preview(name):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.samples = 24
    sc.cycles.device = "CPU"
    sc.render.resolution_x, sc.render.resolution_y = 640, 480
    obj = [o for o in bpy.data.objects if o.type == "MESH"][0]
    d = max(obj.dimensions) * 1.9 + 0.3
    bpy.ops.object.camera_add(location=(d * 0.75, -d, d * 0.62))
    cam = bpy.context.object
    bpy.ops.object.empty_add(location=(0, 0, obj.dimensions.z * 0.45))
    tgt = bpy.context.object
    con = cam.constraints.new("TRACK_TO"); con.target = tgt
    sc.camera = cam
    bpy.ops.object.light_add(type="AREA", location=(d, -d, d * 1.5)); bpy.context.object.data.energy = 60 * d * d; bpy.context.object.data.size = d
    bpy.context.object.constraints.new("TRACK_TO").target = tgt
    bpy.ops.object.light_add(type="AREA", location=(-d, -d * 0.5, d)); bpy.context.object.data.energy = 25 * d * d; bpy.context.object.data.size = d
    bpy.context.object.constraints.new("TRACK_TO").target = tgt
    bpy.ops.mesh.primitive_plane_add(size=20)
    bpy.context.object.data.materials.append(mat("floor_preview", "#f6e3e8", rough=0.6))
    w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.9, 0.8, 0.82, 1)
    sc.render.filepath = os.path.abspath(os.path.join(os.path.dirname(__file__), "preview", name + ".png"))
    bpy.ops.render.render(write_still=True)


WHITE = lambda: mat("plastic_white", "#f5f5f4", rough=0.32)
METAL = lambda: mat("metal_silver", "#c9ccd0", metallic=0.9, rough=0.26)
GOLD = lambda: mat("gold", "#c9a66b", metallic=0.92, rough=0.28)
DARK = lambda: mat("rubber_dark", "#1d1b1c", rough=0.7)


def derma_home():
    """화이트 본체 + 기울어진 스크린 하우징 + 실버 힌지 바 + 하단 라이트 스트립 (스크린·로고는 코드에서 덧그림)"""
    reset()
    box((0.52, 0.42, 0.022), (0, 0, 0.011), mat("glow", "#9fd8ff", rough=0.3, emission=2.0), bevel=0.006)
    box((0.5, 0.4, 0.18), (0, 0, 0.115), WHITE(), bevel=0.022, segs=4)
    # 전면 플레이트 자리(얕은 턱)와 하단 틈
    box((0.13, 0.006, 0.085), (0, -0.2, 0.115), METAL(), bevel=0.004)
    box((0.46, 0.012, 0.01), (0, -0.196, 0.036), DARK(), bevel=0.003)
    # 힌지 바 + 양 끝 캡
    cyl(0.03, 0.5, (0, -0.13, 0.225), METAL(), rot=(0, math.pi / 2, 0), verts=40, bevel=0.004)
    for s in (-1, 1):
        cyl(0.034, 0.035, (s * 0.235, -0.13, 0.225), METAL(), rot=(0, math.pi / 2, 0), verts=40, bevel=0.005)
    # 스크린 하우징 (뒤로 0.42rad 기울어짐)
    box((0.5, 0.05, 0.4), (0, -0.0002, 0.409), WHITE(), bevel=0.02, segs=4, rot=(-0.42, 0, 0))
    # 스크린 베젤(유리)
    box((0.35, 0.006, 0.22), (0, -0.0185, 0.4315), mat("screen_glass", "#0b0b0d", rough=0.08, metallic=0.2), bevel=0.004, rot=(-0.42, 0, 0))
    # 후면 방열 슬릿, 측면 포트, 고무 발
    for i in range(6):
        box((0.3, 0.006, 0.008), (0, 0.2, 0.07 + i * 0.022), DARK(), bevel=0.002)
    for s in (-1, 1):
        cyl(0.012, 0.012, (s * 0.251, 0.08, 0.1), METAL(), rot=(0, math.pi / 2, 0), verts=16)
        cyl(0.012, 0.012, (s * 0.251, 0.12, 0.1), METAL(), rot=(0, math.pi / 2, 0), verts=16)
        for y in (-0.15, 0.15):
            cyl(0.022, 0.012, (s * 0.2, y, 0.004), DARK(), verts=20)
    # 상단 전원 버튼 링
    torus(0.018, 0.004, (0.19, 0.12, 0.206), METAL())
    cyl(0.014, 0.006, (0.19, 0.12, 0.206), mat("button", "#e9ecef", rough=0.3), verts=20)
    export("derma_home")


def care_bed():
    """케어 베드: 베이스 + 둥근 매트리스 + 시트 + 베개 + 접은 타월 + 골드 다리. accent 재질은 코드에서 테마색으로 바꾼다"""
    reset()
    base = mat("bed_base", "#fffaf4", rough=0.55)
    box((2.3, 0.9, 0.34), (0, 0, 0.25), base, bevel=0.04, segs=4)
    box((2.2, 0.8, 0.02), (0, 0, 0.09), DARK(), bevel=0.004)
    box((2.36, 0.96, 0.16), (0, 0, 0.5), mat("accent", "#f9d5dc", rough=0.85), bevel=0.06, segs=5)
    box((2.22, 0.84, 0.05), (0, 0, 0.598), mat("sheet", "#ffffff", rough=0.9), bevel=0.022, segs=4)
    # 베개: 눌린 타원체 + 가운데 홈
    ball(0.25, (-0.92, 0, 0.66), mat("sheet", "#ffffff"), scale=(1.0, 1.25, 0.34))
    # 접은 타월 2장
    box((0.36, 0.5, 0.03), (0.86, 0, 0.638), mat("towel", "#fdeef1", rough=0.95), bevel=0.012)
    box((0.34, 0.46, 0.028), (0.86, 0, 0.666), mat("towel", "#fdeef1"), bevel=0.012)
    for x in (-1.05, 1.05):
        for y in (-0.36, 0.36):
            cyl(0.045, 0.08, (x, y, 0.04), GOLD(), verts=20, r2=0.036)
    # 헤드 쪽 골드 손잡이 레일
    cyl(0.012, 0.7, (-1.17, 0, 0.3), GOLD(), rot=(math.pi / 2, 0, 0), verts=16)
    export("care_bed")


def sofa(seats):
    """벨벳 소파 (좌석 수 1~3). fabric 재질은 코드에서 테마색으로 바꾼다. 정면은 -Y, 등받이는 +Y"""
    reset()
    fab = mat("fabric", "#f6bccb", rough=0.92)
    w = seats * 0.8 + 0.3
    box((w, 0.8, 0.2), (0, 0, 0.19), fab, bevel=0.05, segs=4)
    # 좌석 쿠션: 한 칸씩 볼록하게
    for i in range(seats):
        x = -w / 2 + 0.15 + 0.4 + i * 0.8
        box((0.76, 0.6, 0.15), (x, -0.07, 0.35), fab, bevel=0.06, segs=5)
        box((0.74, 0.16, 0.44), (x, 0.24, 0.62), fab, bevel=0.07, segs=5, rot=(-0.12, 0, 0))
    box((w, 0.14, 0.6), (0, 0.34, 0.56), fab, bevel=0.06, segs=4)
    for s in (-1, 1):
        box((0.17, 0.8, 0.4), (s * (w / 2 - 0.085), 0, 0.46), fab, bevel=0.075, segs=5)
        for y in (-0.3, 0.3):
            cyl(0.03, 0.09, (s * (w / 2 - 0.12), y, 0.045), GOLD(), verts=16, r2=0.02)
    # 쿠션 단추
    for i in range(seats):
        x = -w / 2 + 0.15 + 0.4 + i * 0.8
        ball(0.018, (x, 0.155, 0.66), GOLD(), scale=(1, 0.5, 1), seg=12)
    export(f"sofa_{seats}")


# ───────────── 캐릭터 파츠 ─────────────
# 게임의 캐릭터는 체형·성장·의상을 코드로 조합하므로 통짜 모델이 아니라 "단위 크기 파츠"로 만든다.
# 게임이 각 파츠를 체형 치수로 스케일하고 재질(skin · shoe · accent)을 캐릭터 색으로 바꾼다.
SKIN = lambda: mat("skin", "#f6d2c0", rough=0.55)


def deform(o, fn):
    for v in o.data.vertices:
        v.co.x, v.co.y, v.co.z = fn(v.co.x, v.co.y, v.co.z)


def char_head():
    """반지름 1 머리. 위쪽은 구 그대로(눈·볼 데칼이 얹히는 면), 아래로 갈수록 턱선이 갸름해지고 귀가 붙는다."""
    reset()
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=48, ring_count=32)
    o = bpy.context.object

    def chin(x, y, z):
        if z > -0.35:
            return x, y, z
        t = (-0.35 - z) / 0.65
        return x * (1 - 0.24 * t ** 1.3), y * (1 - 0.1 * t), z - 0.05 * t * t
    deform(o, chin)
    finish(o, SKIN())
    for s in (-1, 1):
        ear = ball(0.2, (s * 0.96, 0.06, -0.08), SKIN(), scale=(0.4, 0.75, 1), seg=16)
        ear.rotation_euler = (0, 0, s * 0.25)
    export("char_head")


def char_hand():
    """손목이 원점, 아래(-Z)로 늘어진 손. 손바닥 + 엄지 + 손가락 마디 홈."""
    reset()
    palm = ball(1, (0, 0, -0.55), SKIN(), scale=(0.9, 0.58, 1.15), seg=20)
    ball(0.42, (0.62, -0.28, -0.3), SKIN(), scale=(0.75, 0.75, 1.35), seg=14).rotation_euler = (0.2, -0.5, 0)
    for i in range(4):  # 손가락 끝
        ball(0.26, (-0.5 + i * 0.33, -0.02, -1.5 - (0.12 if i in (1, 2) else 0)), SKIN(), scale=(0.85, 0.9, 1.5), seg=12)
    export("char_hand")


def char_shoe():
    """발목 아래 바닥 중앙이 원점. 메리제인: 둥근 앞코 + 밑창 + 발등 스트랩 + 단추. 단위 = 팔다리 반지름."""
    reset()
    shoe = mat("shoe", "#ef9ab0", rough=0.3)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.15, segments=28, ring_count=16, location=(0, -0.45, 0.52))
    o = bpy.context.object
    o.scale = (1, 1.55, 0.72)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=True)
    # 바닥을 평평하게, 앞코를 살짝 올린다
    deform(o, lambda x, y, z: (x * (1 - 0.12 * max(0, -y - 0.9)), y, max(z, 0.1)))
    finish(o, shoe)
    bpy.ops.mesh.primitive_cylinder_add(radius=1.19, depth=0.14, vertices=32, location=(0, -0.45, 0.07))
    sole = bpy.context.object
    sole.scale = (1, 1.55, 1)
    finish(sole, mat("sole", "#fff6f0", rough=0.5), bevel=0.04, segs=2)
    bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=0.11, major_segments=28, minor_segments=8, location=(0, -0.05, 0.98))
    finish(bpy.context.object, shoe)
    ball(0.16, (1.02, -0.1, 0.98), GOLD(), seg=10)
    export("char_shoe")


def char_hem():
    """반지름 1 치맛단 러플. 12개의 물결 주름이 있는 띠."""
    reset()
    import bmesh
    bm = bmesh.new()
    n, waves = 144, 12
    top, bot = [], []
    for i in range(n):
        a = i / n * math.tau
        w = math.sin(a * waves)
        top.append(bm.verts.new((math.cos(a) * 0.985, math.sin(a) * 0.985, 0.05)))
        r = 1.03 + 0.05 * w
        bot.append(bm.verts.new((math.cos(a) * r, math.sin(a) * r, -0.05 - 0.012 * w)))
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((top[i], top[j], bot[j], bot[i]))
    me = bpy.data.meshes.new("hem")
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new("hem", me)
    bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    mod = o.modifiers.new("solid", "SOLIDIFY"); mod.thickness = 0.03
    bpy.ops.object.modifier_apply(modifier=mod.name)
    finish(o, mat("accent", "#ffffff", rough=0.45))
    export("char_hem")


def char_bow():
    """가슴 리본. 폭 약 2 단위, 중심이 원점, 정면은 -Y."""
    reset()
    acc = mat("accent", "#ffffff", rough=0.45)
    for s in (-1, 1):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, segments=20, ring_count=12, location=(s * 0.55, 0, 0))
        o = bpy.context.object
        o.scale = (1, 0.38, 0.8)
        bpy.ops.object.transform_apply(location=True, rotation=False, scale=True)
        deform(o, lambda x, y, z: (x, y, z * (0.3 + 0.7 * min(1, abs(x) / 0.8))))
        finish(o, acc)
        bpy.ops.mesh.primitive_cone_add(radius1=0.2, radius2=0.06, depth=0.7, vertices=12, location=(s * 0.22, 0, -0.42), rotation=(0, s * 0.45, 0))
        t = bpy.context.object
        t.scale = (1, 0.35, 1)
        finish(t, acc)
    ball(0.2, (0, -0.05, 0), acc, scale=(1, 0.8, 1), seg=14)
    export("char_bow")


if __name__ == "__main__":
    derma_home()
    care_bed()
    for n in (1, 2, 3):
        sofa(n)
    for f in (char_head, char_hand, char_shoe, char_hem, char_bow):
        f()
