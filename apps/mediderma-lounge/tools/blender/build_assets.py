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


# ───────────── 헤어 ─────────────
# 반지름 1 머리 기준(원점 = 머리 중심). 재질 "hair" 를 게임이 머리색 재질로 바꿔 끼운다.
# hair_<스타일>.glb 는 머리에 고정된 부분, hair_<스타일>_sway.glb 는 걸을 때 흔들리는 부분이다.
# 긴 머리(long · wave · hime)의 sway 는 세로 길이 1 로 만들고 게임이 체형에 맞춰 세로로 늘린다.
HAIR = lambda: mat("hair", "#6b4630", rough=0.42)
TIE = lambda: mat("tie", "#ef86a8", rough=0.4)


def G(x, y, z):
    """게임 좌표(x 오른쪽, y 위, z 정면) → Blender 좌표."""
    return (x, -z, y)


def lock(pts, radii, material=None, res=2):
    """머리카락 한 가닥: 게임 좌표 점들을 지나는 굵기가 변하는 튜브."""
    cu = bpy.data.curves.new("lock", "CURVE")
    cu.dimensions = "3D"; cu.bevel_depth = 1.0; cu.bevel_resolution = res; cu.resolution_u = 4; cu.use_fill_caps = True
    sp = cu.splines.new("BEZIER")
    sp.bezier_points.add(len(pts) - 1)
    for bp, p, r in zip(sp.bezier_points, pts, radii):
        bp.co = G(*p); bp.radius = max(r, 0.025)
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    o = bpy.data.objects.new("lock", cu)
    bpy.context.collection.objects.link(o)
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.convert(target="MESH")
    bpy.ops.object.shade_smooth()
    o.data.materials.append(material or HAIR())
    return o


def scalp(cut, hairline=lambda gx: 0.6 - 0.32 * gx * gx):
    """얼굴 쪽이 열린 두피 쉘. cut 아래와 헤어라인 아래 정면을 잘라낸다."""
    import bmesh
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.085, segments=32, ring_count=20)
    o = bpy.context.object
    bm = bmesh.new(); bm.from_mesh(o.data)
    dead = [v for v in bm.verts if v.co.z < cut or (-v.co.y > 0.2 and v.co.z < hairline(v.co.x))]
    bmesh.ops.delete(bm, geom=dead, context="VERTS")
    bm.to_mesh(o.data); bm.free()
    mod = o.modifiers.new("solid", "SOLIDIFY"); mod.thickness = 0.07; mod.offset = 1
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(o, HAIR())


def bangs(xs=(-0.62, -0.36, -0.12, 0.12, 0.36, 0.62), low=0.4, sweep=0.0, r=0.2):
    for x in xs:
        lock([(x * 0.55, 1.0, 0.3), (x * 0.9 + sweep * 0.2, 0.82, 0.8), (x + sweep * 0.45, low + abs(x) * 0.12, 1.0 - abs(x) * 0.2)], [r, r * 1.05, 0.04])


def sides(length, r=0.2):
    for s in (-1, 1):
        lock([(s * 0.7, 0.8, 0.45), (s * 1.0, 0.25, 0.35), (s * 1.0, -length, 0.28)], [r, r * 1.1, 0.05])


def curtain(y0, y1, n=11, r=0.24, wave=0.0, curl=0.0, spread=1.0):
    """뒤통수를 감싸는 가닥들 (귀 뒤에서 귀 뒤까지). y0 → y1 로 내려온다."""
    for i in range(n):
        a = math.radians(-100 + 200 * i / (n - 1))  # 0 = 정후방
        sx, sz = math.sin(a), -math.cos(a)
        pts, rad = [], []
        for j in range(6):
            t = j / 5
            y = y0 + (y1 - y0) * t
            w = wave * math.sin(t * 9 + i * 1.7) * (0.3 + t)
            # 머리 위쪽에서는 두피 곡면을 따라 흐르고, 아래에서는 늘어진다
            surf = math.sqrt(max(1.1 ** 2 - max(y, 0) ** 2, 0.04))
            rr = min(surf, 1.02 + 0.1 * spread * t) - curl * max(0, t - 0.7) * 1.2 + w
            pts.append((sx * rr, y, sz * rr * 0.96))
            rad.append(0.06 if j == 5 else r * (0.45 + 0.55 * min(1, t * 3)) * (1 - 0.15 * t))
        lock(pts, rad)


def hair_bob():
    reset(); scalp(-0.25); bangs()
    curtain(1.085, -0.78, n=15, r=0.25, curl=0.45, spread=0.3)
    export("hair_bob")


def hair_pixie():
    reset(); scalp(-0.2); bangs(xs=(-0.6, -0.3, 0.0, 0.3, 0.6), low=0.5, sweep=0.5, r=0.18)
    curtain(1.085, -0.42, n=13, r=0.22, curl=0.3, spread=0.2)
    for s in (-1, 1):
        lock([(s * 0.85, 0.5, 0.5), (s * 1.02, 0.1, 0.45), (s * 0.98, -0.3, 0.5)], [0.16, 0.14, 0.03])
    export("hair_pixie")


def hair_twin():
    reset(); scalp(-0.3); bangs(); sides(0.35, 0.17)
    for s in (-1, 1):
        ball(0.17, G(s * 1.12, 0.38, -0.1), TIE(), seg=12)
    export("hair_twin")
    reset()
    for s in (-1, 1):
        lock([(s * 1.05, 0.4, -0.1), (s * 1.45, 0.25, -0.12), (s * 1.6, -0.6, -0.08), (s * 1.5, -1.5, -0.02), (s * 1.62, -1.85, 0.05)], [0.14, 0.36, 0.34, 0.24, 0.04])
        lock([(s * 1.1, 0.35, -0.2), (s * 1.3, -0.2, -0.3), (s * 1.38, -1.3, -0.22)], [0.12, 0.26, 0.04])
    export("hair_twin_sway")


def hair_bun():
    reset(); scalp(-0.3); bangs(); sides(0.3, 0.15)
    ball(0.46, G(0, 1.14, -0.2), HAIR(), scale=(1, 1, 0.9), seg=20)
    torus(0.34, 0.09, G(0, 1.2, -0.2), HAIR())
    torus(0.3, 0.05, G(0, 0.95, -0.2), TIE())
    export("hair_bun")


def hair_space():
    reset(); scalp(-0.3); bangs(); sides(0.3, 0.15)
    for s in (-1, 1):
        ball(0.36, G(s * 0.62, 1.0, -0.05), HAIR(), seg=18)
        torus(0.24, 0.045, G(s * 0.55, 0.8, -0.05), TIE(), rot=(0, s * 0.5, 0))
    export("hair_space")


def hair_pony():
    reset(); scalp(-0.3); bangs(); sides(0.3, 0.15)
    torus(0.2, 0.07, G(0, 0.72, -0.98), TIE(), rot=(0.9, 0, 0))
    export("hair_pony")
    reset()
    lock([(0, 0.75, -0.95), (0, 0.8, -1.45), (0, 0.1, -1.6), (0, -0.9, -1.4), (0, -1.3, -1.2)], [0.18, 0.36, 0.34, 0.22, 0.04])
    for s in (-1, 1):
        lock([(s * 0.05, 0.75, -1.0), (s * 0.25, 0.4, -1.5), (s * 0.28, -0.7, -1.38)], [0.12, 0.24, 0.04])
    export("hair_pony_sway")


def hair_updo():
    reset(); scalp(-0.3); bangs(xs=(-0.6, -0.3, 0.0, 0.3, 0.6), low=0.52, sweep=0.35); sides(0.75, 0.15)
    ball(0.5, G(0, 0.55, -0.98), HAIR(), scale=(1.15, 0.9, 0.95), seg=20)
    for a in (0.5, 1.2, 1.9):
        torus(0.36, 0.085, G(0, 0.55, -1.02), HAIR(), rot=(0.9, a, 0))
    torus(0.52, 0.025, G(0, 0.55, -0.9), GOLD(), rot=(0.9, 0, 0))
    export("hair_updo")


def hair_braid():
    reset(); scalp(-0.3); bangs(sweep=-0.25); sides(0.3, 0.15)
    export("hair_braid")
    reset()
    for i in range(8):
        y = -0.2 - i * 0.33
        r = 0.27 * (1 - i * 0.055)
        for s in (-1, 1):
            ball(r, G(0.95 + s * r * 0.42 * (1 if i % 2 else -1), y, 0.25), HAIR(), scale=(0.85, 0.85, 1.1), seg=14)
    ball(0.13, G(0.95, -2.85, 0.27), TIE(), seg=12)
    lock([(0.95, -2.85, 0.27), (0.98, -3.1, 0.3), (0.9, -3.35, 0.34)], [0.14, 0.16, 0.03])
    export("hair_braid_sway")


def long_tail(name, wave=0.0, n=11):
    """세로 길이 1 로 만든 긴 뒷머리 (게임이 세로로 늘린다)."""
    reset()
    curtain(0.0, -1.0, n=n, r=0.27, wave=wave, spread=0.6)
    for i in range(6):  # 안쪽을 메우는 가닥
        x = -0.6 + i * 0.24
        lock([(x, 0.0, -0.85), (x * 1.05, -0.5, -0.95), (x * 1.1, -0.97, -0.9)], [0.3, 0.3, 0.06])
    export(name)


def hair_long():
    reset(); scalp(-0.3); bangs(); sides(0.95, 0.18)
    export("hair_long")
    long_tail("hair_long_sway")


def hair_wave():
    reset(); scalp(-0.3); bangs(xs=(-0.6, -0.3, 0.0, 0.3, 0.6), low=0.5, sweep=0.4)
    for s in (-1, 1):
        lock([(s * 0.7, 0.8, 0.45), (s * 1.08, 0.2, 0.35), (s * 0.95, -0.4, 0.4), (s * 1.12, -0.9, 0.3), (s * 0.98, -1.3, 0.36)], [0.2, 0.24, 0.22, 0.2, 0.05])
    export("hair_wave")
    long_tail("hair_wave_sway", wave=0.09)


def hair_hime():
    reset(); scalp(-0.3)
    for i in range(9):  # 일자 앞머리
        x = -0.68 + i * 0.17
        lock([(x * 0.6, 1.0, 0.3), (x * 0.95, 0.8, 0.82), (x, 0.36, 1.0 - abs(x) * 0.22)], [0.15, 0.15, 0.12])
    for s in (-1, 1):  # 볼 옆 단발 가닥
        for dz in (0.2, 0.42):
            lock([(s * 0.75, 0.75, dz + 0.1), (s * 1.0, 0.2, dz), (s * 1.0, -0.72, dz)], [0.16, 0.17, 0.15])
    export("hair_hime")
    long_tail("hair_hime_sway", n=13)


# ───────────── 라운지 가구 ─────────────
# 게임 치수(미터) 그대로, 바닥 중앙이 원점. 조명과 글자, 반투명 유리는 게임 코드가 덧붙인다.
CREAM = lambda: mat("cream", "#fffaf4", rough=0.5)
LEAF = lambda i=0: mat(f"leaf{i % 2}", "#6fae7b" if i % 2 else "#8cc592", rough=0.6)
PINK = lambda: mat("pink", "#f6bccb", rough=0.85)
LAV = lambda: mat("lav", "#e3d8f6", rough=0.85)


def leaf(pos, size, yaw, pitch, material, notch=True):
    """몬스테라 잎: 납작한 타원 + 끝이 뾰족하고 가장자리에 홈이 있다. pos 는 게임 좌표."""
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=20, ring_count=10)
    o = bpy.context.object

    def shape(x, y, z):
        r = math.hypot(x, y)
        k = 1 - 0.45 * max(0, y) ** 2  # 끝으로 갈수록 좁아진다
        cut = 0.82 + 0.18 * math.cos(math.atan2(y, x) * 7) if notch and r > 0.6 else 1
        return x * k * cut, y * 1.25 * cut, z * 0.05 + 0.12 * (x * x)
    deform(o, shape)
    o.scale = (size, size, size)
    o.location = G(*pos)
    o.rotation_euler = (pitch, 0, yaw)
    return finish(o, material)


def furn_plant():
    reset()
    cyl(0.15, 0.4, (0, 0, 0.2), CREAM(), r2=0.2, bevel=0.01)
    torus(0.2, 0.018, (0, 0, 0.4), GOLD())
    cyl(0.185, 0.02, (0, 0, 0.385), mat("soil", "#5a4636", rough=1))
    for i in range(9):
        a = i * 2.4
        h = 0.62 + (i % 4) * 0.19
        r = 0.2 + (i % 3) * 0.06
        tip = (math.cos(a) * r, h, math.sin(a) * r)
        lock([(0, 0.38, 0), (math.cos(a) * r * 0.4, h * 0.75, math.sin(a) * r * 0.4), tip], [0.012, 0.01, 0.008], material=LEAF(1))
        leaf(tip, 0.2 + (i % 3) * 0.03, -a + math.pi / 2, 0.6 + (i % 2) * 0.3, LEAF(i))
    export("furn_plant")


def furn_flower():
    reset()
    cyl(0.2, 0.72, (0, 0, 0.36), CREAM(), r2=0.16, bevel=0.012)
    torus(0.17, 0.012, (0, 0, 0.72), GOLD())
    ball(0.11, (0, 0, 0.82), mat("vase", "#e9f3ff", rough=0.12), scale=(1, 1, 1.15), seg=20)
    cyl(0.06, 0.1, (0, 0, 0.95), mat("vase", "#e9f3ff", rough=0.12), r2=0.08)
    cols = ["#f29bb1", "#ffd0dc", "#fff0b8", "#f2a7b8", "#d9cff2", "#ff9db5", "#ffe6a8"]
    for i, c in enumerate(cols):
        a = i * 0.9
        r = 0.05 + (i % 3) * 0.045
        top = (math.cos(a) * r, 1.16 + (i % 3) * 0.08, math.sin(a) * r)
        lock([(0, 0.9, 0), (top[0] * 0.5, 1.05, top[2] * 0.5), top], [0.008, 0.007, 0.006], material=LEAF(1))
        ball(0.055, G(top[0], top[1] + 0.05, top[2]), mat(f"tulip{i}", c, rough=0.5), scale=(1, 1, 1.45), seg=14)
        leaf((top[0] * 0.6, 1.02, top[2] * 0.6), 0.09, -a, 1.1, LEAF(i), notch=False)
    export("furn_flower")


def furn_mirror():
    reset()
    glass = mat("mirror", "#dfeaf5", metallic=0.96, rough=0.05)
    box((0.8, 0.06, 1.5), (0, 0, 0.75), GOLD(), bevel=0.012)
    cyl(0.4, 0.06, (0, 0, 1.5), GOLD(), rot=(math.pi / 2, 0, 0), verts=48, bevel=0.01)
    box((0.68, 0.02, 1.42), (0, -0.026, 0.77), glass, bevel=0.0)
    cyl(0.34, 0.02, (0, -0.023, 1.48), glass, rot=(math.pi / 2, 0, 0), verts=48)
    for s in (-1, 1):
        box((0.06, 0.34, 0.04), (s * 0.3, 0, 0.02), GOLD(), bevel=0.01)
    export("furn_mirror")


def furn_lamp():
    reset()
    cyl(0.2, 0.035, (0, 0, 0.018), GOLD(), bevel=0.008)
    cyl(0.014, 1.5, (0, 0, 0.78), GOLD(), verts=12)
    ball(0.035, (0, 0, 1.52), GOLD(), seg=12)
    shade = mat("shade", "#fff3df", rough=0.8, emission=1.2)
    cyl(0.27, 0.34, (0, 0, 1.66), shade, r2=0.15, verts=36)
    torus(0.27, 0.008, (0, 0, 1.49), GOLD())
    torus(0.15, 0.008, (0, 0, 1.83), GOLD())
    export("furn_lamp")


def furn_coffeetable():
    reset()
    cyl(0.55, 0.045, (0, 0, 0.4), mat("marble", "#fffdfb", rough=0.12), verts=48, bevel=0.012)
    torus(0.55, 0.012, (0, 0, 0.378), GOLD())
    for i in range(3):
        a = i * math.tau / 3
        cyl(0.016, 0.42, (math.cos(a) * 0.36, math.sin(a) * 0.36, 0.19), GOLD(), rot=(math.sin(a) * 0.18, -math.cos(a) * 0.18, 0), verts=12)
    torus(0.3, 0.008, (0, 0, 0.12), GOLD())
    box((0.3, 0.22, 0.03), (0.12, -0.05, 0.44), PINK(), bevel=0.006)
    box((0.26, 0.19, 0.025), (0.13, -0.04, 0.468), LAV(), bevel=0.006, rot=(0, 0, 0.3))
    ball(0.05, (-0.2, 0.08, 0.47), CREAM(), scale=(1, 1, 1.2), seg=14)
    ball(0.03, (-0.2, 0.08, 0.56), mat("tulip0", "#f29bb1", rough=0.5), seg=10)
    export("furn_coffeetable")


def furn_bookshelf():
    reset()
    w, h, d = 1.1, 1.8, 0.32
    box((w, 0.02, h), (0, d / 2 - 0.01, h / 2), mat("shelf_back", "#f3e3d3", rough=0.9), bevel=0)
    for s in (-1, 1):
        box((0.04, d, h), (s * (w / 2 - 0.02), 0, h / 2), CREAM(), bevel=0.008)
    for z in (0.02, 0.5, 0.95, 1.4, 1.78):
        box((w, d, 0.04), (0, 0, z), CREAM(), bevel=0.008)
    cols = ["#f29bb1", "#d9cff2", "#fff3d6", "#c9a66b", "#bfe8d6", "#ffffff", "#f6bccb"]
    for r, z0 in enumerate((0.54, 0.99, 1.44)):
        x = -0.47
        i = 0
        while x < 0.3:
            t = 0.05 + ((i * 7 + r * 3) % 4) * 0.012
            hh = 0.27 + ((i * 5 + r) % 4) * 0.025
            box((t, 0.2, hh), (x + t / 2, -0.03, z0 - 0.02 + hh / 2), mat(f"book{(i + r * 2) % 7}", cols[(i + r * 2) % 7], rough=0.7), bevel=0.004)
            x += t + 0.006
            i += 1
        box((0.05, 0.2, 0.3), (0.36, -0.03, z0 + 0.12), mat(f"book{r}", cols[r], rough=0.7), bevel=0.004, rot=(0, -0.35, 0))
    ball(0.07, (0.3, -0.03, 0.14), CREAM(), scale=(1, 1, 1.3), seg=14)
    box((0.3, 0.2, 0.18), (-0.25, -0.02, 0.13), PINK(), bevel=0.02)
    export("furn_bookshelf")


def furn_cattower():
    reset()
    rope = mat("rope", "#d8c3a0", rough=1)
    box((0.8, 0.8, 0.08), (0, 0, 0.04), mat("carpet", "#f3e6d0", rough=1), bevel=0.02)
    for x, hgt in ((-0.2, 0.7), (0.2, 1.25)):
        cyl(0.07, hgt, (x, 0, hgt / 2), rope, verts=20)
        for k in range(int(hgt / 0.1)):
            bpy.ops.mesh.primitive_torus_add(major_radius=0.074, minor_radius=0.016, major_segments=16, minor_segments=5, location=(x, 0, 0.12 + k * 0.1))
            finish(bpy.context.object, rope)
    for x, z, m in ((-0.2, 0.74, PINK()), (0.2, 1.29, LAV())):
        cyl(0.3, 0.06, (x, 0, z), m, verts=32, bevel=0.02)
        torus(0.27, 0.05, (x, 0, z + 0.05), m)
    box((0.36, 0.36, 0.3), (-0.2, 0, 0.23), mat("carpet", "#f3e6d0", rough=1), bevel=0.04)
    cyl(0.1, 0.02, (-0.2, -0.185, 0.23), DARK(), rot=(math.pi / 2, 0, 0), verts=20)
    cyl(0.003, 0.2, (0.2, -0.3, 1.17), mat("string", "#8a6a4a", rough=1), verts=6)
    ball(0.05, (0.2, -0.3, 1.05), mat("tulip0", "#f29bb1", rough=0.5), seg=12)
    export("furn_cattower")


def furn_petbed():
    reset()
    torus(0.36, 0.11, (0, 0, 0.1), PINK())
    ball(0.36, (0, 0, 0.07), mat("cushion", "#fff6ee", rough=1), scale=(1, 1, 0.25), seg=24)
    for i in range(12):
        a = i * math.tau / 12
        ball(0.012, (math.cos(a) * 0.36, math.sin(a) * 0.36, 0.21), GOLD(), seg=8)
    ball(0.05, (0.12, -0.05, 0.16), LAV(), scale=(1.6, 1, 0.8), seg=12)
    export("furn_petbed")


def furn_diffuser():
    reset()
    cyl(0.2, 0.6, (0, 0, 0.3), CREAM(), r2=0.16, bevel=0.012)
    torus(0.165, 0.01, (0, 0, 0.6), GOLD())
    ball(0.085, (0, 0, 0.68), mat("amber", "#f6d9c2", rough=0.1), scale=(1, 1, 0.95), seg=18)
    cyl(0.035, 0.06, (0, 0, 0.77), GOLD(), verts=16)
    for i in range(6):
        a = i * math.tau / 6
        lock([(0, 0.78, 0), (math.cos(a) * 0.05, 0.95, math.sin(a) * 0.05), (math.cos(a) * 0.11, 1.12, math.sin(a) * 0.11)], [0.005, 0.005, 0.005], material=mat("reed", "#8a6a4a", rough=1))
    export("furn_diffuser")


def furn_goldtable():
    reset()
    cyl(0.32, 0.028, (0, 0, 0.5), mat("marble", "#fff6ec", rough=0.2), verts=40, bevel=0.008)
    torus(0.32, 0.012, (0, 0, 0.5), GOLD())
    cyl(0.02, 0.48, (0, 0, 0.25), GOLD(), verts=12)
    ball(0.045, (0, 0, 0.27), GOLD(), seg=12)
    cyl(0.22, 0.03, (0, 0, 0.015), GOLD(), r2=0.2, verts=32, bevel=0.006)
    export("furn_goldtable")


def furn_display():
    reset()
    cyl(0.5, 0.8, (0, 0, 0.4), CREAM(), verts=48, bevel=0.015)
    for z in (0.15, 0.65):
        torus(0.502, 0.008, (0, 0, z), GOLD())
    cyl(0.53, 0.03, (0, 0, 0.815), GOLD(), verts=48, bevel=0.006)
    cyl(0.2, 0.26, (0, 0, 0.96), mat("riser", "#ffffff", rough=0.4), verts=32, bevel=0.012)
    torus(0.2, 0.006, (0, 0, 1.09), GOLD())
    export("furn_display")


def furn_vanity():
    """화장대: 서랍 · 골드 다리 · 조명 전구가 달린 원형 거울 · 스툴 · 화장품."""
    reset()
    box((1.3, 0.5, 0.05), (0, 0, 0.725), mat("marble", "#fffaf4", rough=0.25), bevel=0.012)
    box((1.2, 0.44, 0.2), (0, 0, 0.6), mat("vanity_body", "#fbe1e6", rough=0.6), bevel=0.012)
    for x in (-0.3, 0.3):
        box((0.54, 0.012, 0.14), (x, -0.224, 0.6), CREAM(), bevel=0.006)
        ball(0.02, (x, -0.24, 0.6), GOLD(), seg=10)
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl(0.018, 0.5, (sx * 0.56, sy * 0.19, 0.25), GOLD(), r2=0.026, verts=12)
    cyl(0.44, 0.04, (0, 0.2, 1.25), GOLD(), rot=(math.pi / 2, 0, 0), verts=48, bevel=0.008)
    cyl(0.38, 0.012, (0, 0.176, 1.25), mat("mirror", "#e3eef8", metallic=0.96, rough=0.05), rot=(math.pi / 2, 0, 0), verts=48)
    cyl(0.02, 0.2, (0, 0.2, 0.83), GOLD(), verts=12)
    bulb = mat("bulb", "#fff6dc", rough=0.4, emission=2.0)
    for i in range(10):
        a = i / 10 * math.tau
        ball(0.032, (math.cos(a) * 0.47, 0.17, 1.25 + math.sin(a) * 0.47), bulb, seg=10)
    # 스툴
    cyl(0.2, 0.09, (0, -0.55, 0.42), PINK(), verts=28, bevel=0.03)
    for i in range(3):
        a = i * math.tau / 3
        cyl(0.014, 0.4, (math.cos(a) * 0.13, -0.55 + math.sin(a) * 0.13, 0.19), GOLD(), verts=10)
    # 화장품 (형태만 있는 소품, 실제 제품 아님)
    cyl(0.03, 0.12, (-0.45, 0.05, 0.81), LAV(), verts=14, bevel=0.006)
    cyl(0.04, 0.06, (-0.33, 0.1, 0.78), CREAM(), verts=16, bevel=0.008)
    cyl(0.015, 0.09, (0.42, 0.08, 0.795), GOLD(), verts=10)
    box((0.16, 0.1, 0.02), (0.3, -0.05, 0.76), PINK(), bevel=0.006)
    export("furn_vanity")


def furn_arch():
    """플라워 아치 포토존: 바닥 원판 · 배경 · 아치 프레임 · 겹꽃 · 잎."""
    reset()
    cyl(1.25, 0.03, (0, 0, 0.015), mat("stage", "#fff6ec", rough=0.9), verts=64, bevel=0.008)
    box((2.3, 0.03, 2.5), (0, 0.5, 1.25), mat("backdrop", "#fbe1e6", rough=1), bevel=0.01)
    cols = ["#f29bb1", "#ffd0dc", "#ffffff", "#d9cff2", "#fbe1a8"]
    n = 26
    for i in range(n):
        a = i / (n - 1) * math.pi
        x, z = math.cos(a) * 1.12, 0.3 + math.sin(a) * 1.95
        if i < n - 1:
            a2 = (i + 1) / (n - 1) * math.pi
            lock([(x, z, -0.42), (math.cos(a2) * 1.12, 0.3 + math.sin(a2) * 1.95, -0.42)], [0.03, 0.03], material=GOLD())
        y = 0.42 - ((i * 7) % 5) * 0.035
        r = 0.11 + ((i * 3) % 4) * 0.022
        m = mat(f"flower{i % 5}", cols[i % 5], rough=0.7)
        ball(r * 0.55, (x, y, z), m, seg=8)  # 꽃 중심
        for k in range(5):  # 꽃잎
            b = k * math.tau / 5 + i
            ball(r * 0.62, (x + math.cos(b) * r * 0.55, y - 0.02, z + math.sin(b) * r * 0.55), m, scale=(1, 0.5, 1), seg=8)
        if i % 2 == 0:
            leaf((x * 1.08, z + 0.02, -y + 0.06), 0.11, a, 0.9, LEAF(i), notch=False)
    export("furn_arch")


def furn_rug():
    """라운드 러그: 물결 테두리 + 고리 무늬 + 술."""
    reset()
    import bmesh
    bm = bmesh.new()
    n = 96
    c = bm.verts.new((0, 0, 0.014))
    ring = [bm.verts.new((math.cos(i / n * math.tau) * (1.2 + 0.04 * math.cos(i / n * math.tau * 16)), math.sin(i / n * math.tau) * (1.2 + 0.04 * math.cos(i / n * math.tau * 16)), 0.012)) for i in range(n)]
    for i in range(n):
        bm.faces.new((c, ring[i], ring[(i + 1) % n]))
    me = bpy.data.meshes.new("rug"); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new("rug", me); bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    mod = o.modifiers.new("solid", "SOLIDIFY"); mod.thickness = 0.014
    bpy.ops.object.modifier_apply(modifier=mod.name)
    finish(o, mat("rug", "#fbe1e6", rough=1))
    for R, m in ((1.0, CREAM()), (0.7, mat("rug_ring", "#f6bccb", rough=1)), (0.4, CREAM())):
        bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=0.02, major_segments=64, minor_segments=6, location=(0, 0, 0.012))
        bpy.context.object.scale = (1, 1, 0.35)
        finish(bpy.context.object, m)
    export("furn_rug")


def furn_partition():
    """라탄 3단 파티션: 골드 프레임 + 격자 짜임."""
    reset()
    rattan = mat("rattan", "#e9d3ae", rough=0.9)
    weave = mat("weave", "#f6e7c8", rough=1)
    for i in (-1, 0, 1):
        bpy.ops.object.empty_add(location=(i * 0.62, -abs(i) * 0.12, 0))
        pivot = bpy.context.object
        pivot.rotation_euler = (0, 0, i * 0.35)
        parts = []
        for sx in (-1, 1):
            parts.append(box((0.04, 0.04, 1.8), (sx * 0.28, 0, 0.9), rattan, bevel=0.01))
        for z in (0.06, 0.9, 1.78):
            parts.append(box((0.6, 0.04, 0.04), (0, 0, z), rattan, bevel=0.01))
        parts.append(box((0.52, 0.012, 1.68), (0, 0.004, 0.9), weave, bevel=0))
        for k in range(9):  # 격자
            x = -0.24 + k * 0.06
            parts.append(box((0.012, 0.02, 1.68), (x, 0, 0.9), rattan, bevel=0, rot=(0, 0.12 if k % 2 else -0.12, 0)))
        for k in range(12):
            parts.append(box((0.52, 0.02, 0.012), (0, 0, 0.14 + k * 0.14), rattan, bevel=0))
        for p in parts:
            p.parent = pivot
        ball(0.03, (i * 0.62 + 0.27, -abs(i) * 0.12, 1.84), GOLD(), seg=10)
    bpy.ops.object.select_all(action="DESELECT")
    for o in list(bpy.data.objects):
        if o.type == "EMPTY":
            for ch in o.children:
                m = ch.matrix_world.copy(); ch.parent = None; ch.matrix_world = m
            bpy.data.objects.remove(o)
    export("furn_partition")


def furn_aquarium():
    """아쿠아리움: 수납장 · 수조 프레임 · 모래 · 돌 · 수초 · 물고기. 물(반투명)과 조명은 게임 코드가 그린다."""
    reset()
    dark = mat("cabinet", "#1b1719", rough=0.4)
    box((1.2, 0.5, 0.8), (0, 0, 0.4), dark, bevel=0.015)
    for x in (-0.3, 0.3):
        box((0.54, 0.012, 0.66), (x, -0.252, 0.4), mat("cabinet_door", "#2a2527", rough=0.35), bevel=0.006)
        cyl(0.008, 0.16, (x - 0.2 * (1 if x > 0 else -1), -0.265, 0.45), GOLD(), verts=8)
    box((1.2, 0.5, 0.05), (0, 0, 1.425), dark, bevel=0.01)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box((0.025, 0.025, 0.6), (sx * 0.585, sy * 0.235, 1.1), dark, bevel=0.004)
    box((1.14, 0.44, 0.05), (0, 0, 0.825), mat("sand", "#f3e3c8", rough=1), bevel=0.01)
    for x, y, r in ((-0.35, 0.05, 0.09), (-0.22, -0.02, 0.06), (0.3, 0.06, 0.1), (0.42, -0.04, 0.05)):
        ball(r, (x, y, 0.86 + r * 0.4), mat("rock", "#9a9aa3", rough=0.9), scale=(1.2, 1, 0.7), seg=12)
    for i, x in enumerate((-0.45, -0.1, 0.12, 0.38, 0.5)):
        for k in range(3):
            lock([(x + k * 0.02, 0.85, 0.02 * k), (x + 0.03 * math.sin(i + k), 1.05, 0.03), (x + 0.05 * math.cos(i * 2 + k), 1.18 + k * 0.05, 0.0)], [0.012, 0.014, 0.004], material=LEAF(i + k))
    for i, (x, y, z, c) in enumerate(((-0.4, -0.08, 0.98, "#ff9a5c"), (-0.14, 0.08, 1.16, "#f29bb1"), (0.12, -0.08, 1.02, "#ffd95c"), (0.38, 0.08, 1.2, "#ff9a5c"), (0.0, 0.0, 1.28, "#8fd3f0"))):
        m = mat(f"fish{i}", c, rough=0.4)
        ball(0.045, (x, y, z), m, scale=(1.6, 0.5, 1), seg=12)
        cyl(0.03, 0.05, (x - 0.085, y, z), m, rot=(0, math.pi / 2, 0), verts=3, r2=0.002)
        ball(0.007, (x + 0.045, y - 0.016, z + 0.012), DARK(), seg=6)
    export("furn_aquarium")


FURNITURE = (furn_plant, furn_flower, furn_mirror, furn_lamp, furn_coffeetable, furn_bookshelf, furn_cattower, furn_petbed, furn_diffuser, furn_goldtable, furn_display, furn_vanity, furn_arch, furn_rug, furn_partition, furn_aquarium)


if __name__ == "__main__" and "--furniture" in sys.argv:
    for f in FURNITURE:
        f()
elif __name__ == "__main__" and "--hair" in sys.argv:
    for f in (hair_bob, hair_pixie, hair_twin, hair_bun, hair_space, hair_pony, hair_updo, hair_braid, hair_long, hair_wave, hair_hime):
        f()
elif __name__ == "__main__":
    derma_home()
    care_bed()
    for n in (1, 2, 3):
        sofa(n)
    for f in (char_head, char_hand, char_shoe, char_hem, char_bow):
        f()
    for f in (hair_bob, hair_pixie, hair_twin, hair_bun, hair_space, hair_pony, hair_updo, hair_braid, hair_long, hair_wave, hair_hime):
        f()
    for f in FURNITURE:
        f()
