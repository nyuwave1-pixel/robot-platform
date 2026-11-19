"""
실사형 캐릭터 (Quaternius Universal Base Characters + Universal Animation Library, 둘 다 CC0) → 게임용 GLB.
    .bl/bin/python tools/blender/build_real_character.py
원본: tools/assets/incoming/quaternius_ubc · quaternius_ual (tools/assets/fetch_free_assets.py 가 itch.io 무료 버전을 받는다)

결과
- public/models/real_female.glb · real_male.glb : 몸 + 헤어(여러 종, 게임이 하나만 보이게 한다) + 몸에 맞춰 만든 옷
- public/models/real_anims.glb : 뼈대와 동작 클립만 (두 캐릭터가 같은 65개 뼈대를 쓴다)

원본 몸은 속옷 차림이라, 몸 메시를 부위(뼈 가중치)별로 복제·부풀려 상의·바지·구두를 만들고
허리~무릎/발목의 치마는 몸 단면을 재서 새로 만든다. 게임이 재질 이름으로 색을 입힌다:
  skin · hair(눈썹 포함) · outfit · shoe · eyes
메시 이름(게임이 찾는다): Hair_* · Top · Hips · Sleeves · SkirtShort · SkirtLong · Pants · Shoes
"""
import math, os, sys
import bpy
import bmesh
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
INC = os.path.join(HERE, "..", "assets", "incoming")
UBC = os.path.join(INC, "quaternius_ubc", "UBC", "Universal Base Characters[Standard]")
UAL = os.path.join(INC, "quaternius_ual", "UAL", "Universal Animation Library[Standard]", "Unreal-Godot", "UAL1_Standard.glb")
OUT = os.path.join(HERE, "..", "..", "public", "models")
TMP = os.path.join(INC, "_real_tex")

HAIRS = {
    "female": ["Hair_Long", "Hair_Buns", "Hair_SimpleParted", "Hair_BuzzedFemale"],
    "male": ["Hair_SimpleParted", "Hair_Buzzed", "Hair_Long", "Hair_Beard"],
}
# 동작: 게임 이름 ← 원본 클립
ANIMS = ["Idle_Loop", "Walk_Loop", "Jog_Fwd_Loop", "Sitting_Idle_Loop", "Idle_Talking_Loop", "Interact", "Dance_Loop", "Walk_Formal_Loop"]

TORSO = {"spine_01", "spine_02", "spine_03", "clavicle_l", "clavicle_r"}
LEGS = {"pelvis", "thigh_l", "thigh_r", "calf_l", "calf_r", "thigh_twist_01_l", "thigh_twist_01_r", "calf_twist_01_l", "calf_twist_01_r", "calf_twist_02_l", "calf_twist_02_r", "thigh_twist_02_l", "thigh_twist_02_r"}
FEET = {"foot_l", "foot_r", "ball_l", "ball_r"}


def mat(name, color=(1, 1, 1), rough=0.6):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    return m


def prep_textures():
    """피부: 밝은 피부 텍스처(게임이 피부색을 곱한다) · 머리: 회색조로 바꿔 머리색을 곱할 수 있게."""
    from PIL import Image, ImageOps
    os.makedirs(TMP, exist_ok=True)
    tx = os.path.join(UBC, "Base Characters", "Textures")
    for g, src in (("female", "T_Superhero_Female_Light_BaseColor.png"), ("male", "T_Superhero_Male_Ligh.png")):
        im = Image.open(os.path.join(tx, src)).convert("RGB").resize((1024, 1024), Image.LANCZOS)
        im.save(os.path.join(TMP, f"skin_{g}.png"))
        Image.open(os.path.join(tx, f"T_Superhero_{g.title()}_Normal.png")).convert("RGB").resize((1024, 1024), Image.LANCZOS).save(os.path.join(TMP, f"skin_{g}_n.png"))
    for h in ("T_Hair_1_BaseColor", "T_Hair_2_BaseColor"):
        im = Image.open(os.path.join(tx, h + ".png")).convert("RGBA").resize((512, 512), Image.LANCZOS)
        g = ImageOps.autocontrast(ImageOps.grayscale(im.convert("RGB")), cutoff=1)
        g = g.point(lambda v: int(150 + v * 105 / 255))  # 밝은 회색 → 머리색을 곱해도 결은 남는다
        out = Image.merge("RGBA", (g, g, g, im.split()[3]))
        out.save(os.path.join(TMP, h + ".png"))


def dominant(obj):
    names = {g.index: g.name for g in obj.vertex_groups}
    dom = []
    for v in obj.data.vertices:
        best = max(v.groups, key=lambda g: g.weight, default=None)
        dom.append(names.get(best.group) if best else None)
    return dom


def piece(body, name, keep, offset, material):
    """몸 메시를 복제해 keep(정점 → bool) 부분만 남기고 법선 방향으로 offset 만큼 부풀린다."""
    o = body.copy()
    o.data = body.data.copy()
    o.name = name
    bpy.context.collection.objects.link(o)
    o.data.materials.clear()
    o.data.materials.append(material)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bm.verts.ensure_lookup_table()
    gone = [v for v in bm.verts if not keep(v.index)]
    bmesh.ops.delete(bm, geom=gone, context="VERTS")
    bm.normal_update()
    for v in bm.verts:
        v.co += v.normal * offset
    bm.to_mesh(o.data)
    bm.free()
    for p in o.data.polygons:
        p.material_index = 0
    return o


def bone_z(arm, b):
    return (arm.matrix_world @ arm.data.bones[b].head_local).z


def skirt(body, arm, name, z_hem, flare, material):
    """허리~치마단 링을 몸 단면에 맞춰 만들고 골반·허벅지에 가중치를 준다."""
    me = body.data
    mw = body.matrix_world
    dom = dominant(body)
    # 팔·손은 빼고 잰다 (손이 허벅지 옆에 내려와 있다)
    ws = [mw @ v.co for v, d in zip(me.vertices, dom) if d and (d in LEGS or d in TORSO)]
    cx = sum(v.x for v in ws) / len(ws)
    cy = sum(v.y for v in ws) / len(ws)
    z_waist = bone_z(arm, "spine_02") - 0.02
    z_hip = bone_z(arm, "pelvis") - 0.08
    N = 40

    def section(z, band=0.025):
        r = [0.0] * N
        for v in ws:
            if abs(v.z - z) < band:
                a = math.atan2(v.y - cy, v.x - cx)
                k = int((a + math.pi) / (2 * math.pi) * N) % N
                r[k] = max(r[k], math.hypot(v.x - cx, v.y - cy))
        avg = sum(x for x in r if x) / max(1, sum(1 for x in r if x))
        return [x if x else avg for x in r]

    def smooth(r, n=3):
        return [max(r[(k + j) % N] for j in range(-n, n + 1)) for k in range(N)]

    r_w, r_h = smooth(section(z_waist)), smooth(section(z_hip))
    rows = [(z_waist, [x + 0.022 for x in r_w]), (z_hip, [x + 0.04 for x in r_h])]
    steps = 8
    prev = rows[-1][1]
    for i in range(1, steps + 1):
        t = i / steps
        z = z_hip + (z_hem - z_hip) * t
        body_r = smooth(section(z)) if t < 0.9 else [0.0] * N
        # 아래로 갈수록 좁아지지 않게(엉덩이·허벅지가 뚫고 나오지 않게) 하고 단으로 갈수록 퍼지게 한다
        cur = [max(pv, br + 0.055) * (1 + (flare - 1) / steps) for pv, br in zip(prev, body_r)]
        rows.append((z, cur))
        prev = cur
    bm = bmesh.new()
    rings = []
    for z, rr in rows:
        ring = []
        for k in range(N):
            a = -math.pi + (k + 0.5) / N * 2 * math.pi
            ring.append(bm.verts.new((cx + math.cos(a) * rr[k], cy + math.sin(a) * rr[k], z)))
        rings.append(ring)
    for r0, r1 in zip(rings, rings[1:]):
        for k in range(N):
            bm.faces.new((r0[k], r0[(k + 1) % N], r1[(k + 1) % N], r1[k]))
    # 법선을 바깥으로 (뒷면 컬링 때문에 안쪽을 향하면 앞이 비어 보인다)
    bm.normal_update()
    for f in bm.faces:
        c = f.calc_center_median()
        if f.normal.x * (c.x - cx) + f.normal.y * (c.y - cy) < 0:
            f.normal_flip()
    m = bpy.data.meshes.new(name)
    bm.to_mesh(m)
    bm.free()
    o = bpy.data.objects.new(name, m)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(material)
    sol = o.modifiers.new("t", "SOLIDIFY")
    sol.thickness = 0.006
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=sol.name)
    for p in o.data.polygons:
        p.use_smooth = True
    gp, gl, gr = (o.vertex_groups.new(name=n) for n in ("pelvis", "thigh_l", "thigh_r"))
    lx = (arm.matrix_world @ arm.data.bones["thigh_l"].head_local).x - cx
    for v in o.data.vertices:
        t = max(0.0, min(1.0, (z_hip - v.co.z) / max(0.01, z_hip - z_hem)))
        dx = v.co.x - cx
        r = max(0.01, math.hypot(dx, v.co.y - cy))
        w = 0.4 * t * min(1.0, abs(dx) / r) ** 1.5  # 가운데(앞·뒤)는 골반만, 옆은 그쪽 허벅지를 조금 따른다
        side = gl if dx * lx > 0 else gr
        gp.add([v.index], 1 - w, "REPLACE")
        if w > 0:
            side.add([v.index], w, "REPLACE")
    return o


def attach(o, arm):
    o.parent = arm
    mod = o.modifiers.new("Armature", "ARMATURE")
    mod.object = arm


def build(gender):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    base = os.path.join(UBC, "Base Characters", "Godot - UE", f"Superhero_{gender.title()}_FullBody.gltf")
    bpy.ops.import_scene.gltf(filepath=base)
    for o in list(bpy.data.objects):
        if o.name.startswith("Icosphere"):
            bpy.data.objects.remove(o)
    arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    body = next(o for o in bpy.data.objects if o.type == "MESH" and o.name.lower().startswith("superhero"))
    # 헤어: 같은 뼈대에 리깅된 파일을 불러와 몸 뼈대에 붙인다
    for h in HAIRS[gender]:
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=os.path.join(UBC, "Hairstyles", "Rigged to Head Bone", "glTF (Godot -Unreal)", h + ".gltf"))
        new = [o for o in bpy.data.objects if o not in before]
        for o in new:
            if o.type == "MESH" and not o.name.startswith("Icosphere"):
                mw = o.matrix_world.copy()
                for m in list(o.modifiers):
                    o.modifiers.remove(m)
                o.parent = None
                o.matrix_world = mw
                attach(o, arm)
                o.name = h
        for o in new:
            if o.type != "MESH" or o.name.startswith("Icosphere"):
                bpy.data.objects.remove(o)
    # 재질 정리: 게임이 이름으로 색을 입힌다
    skin = body.data.materials[0]
    skin.name = "skin"
    img = bpy.data.images.load(os.path.join(TMP, f"skin_{gender}.png"))
    nimg = bpy.data.images.load(os.path.join(TMP, f"skin_{gender}_n.png"))
    for n in skin.node_tree.nodes:
        if n.type == "TEX_IMAGE" and n.image:
            if "Normal" in n.image.name:
                n.image = nimg
                nimg.colorspace_settings.name = "Non-Color"
            elif "BaseColor" in n.image.name or "Dark" in n.image.name or "Ligh" in n.image.name:
                n.image = img
            elif "Roughness" in n.image.name:
                n.image.scale(512, 512)
    hair_imgs = {k: bpy.data.images.load(os.path.join(TMP, k + ".png")) for k in ("T_Hair_1_BaseColor", "T_Hair_2_BaseColor")}
    for m in bpy.data.materials:
        if m.name.startswith("MI_Hair"):
            m.name = "hair"
            for n in m.node_tree.nodes:
                if n.type == "TEX_IMAGE" and n.image:
                    if "BaseColor" in n.image.name:
                        n.image = hair_imgs["T_Hair_2_BaseColor" if "2" in n.image.name else "T_Hair_1_BaseColor"]
                    elif n.image.size[0] > 0:
                        n.image.scale(512, 512)
                    else:  # 원본에 빠진 노멀맵 — 연결을 끊는다
                        n.image = None
        elif m.name.startswith("MI_Eyes"):
            m.name = "eyes"
    # 옷: 몸 부위별 복제
    dom = dominant(body)
    vs = body.data.vertices
    sh = {s: arm.matrix_world @ arm.data.bones[f"upperarm_{s}"].head_local for s in "lr"}
    hip_z = bone_z(arm, "pelvis")
    outfit = mat("outfit", (0.95, 0.75, 0.8), 0.75)
    shoe = mat("shoe", (0.9, 0.55, 0.65), 0.35)
    parts = [
        piece(body, "Top", lambda i: dom[i] in TORSO, 0.009, outfit),
        piece(body, "Sleeves", lambda i: (dom[i] or "").startswith("upperarm") and min((body.matrix_world @ vs[i].co - sh[s]).length for s in "lr") < (0.16 if gender == "female" else 0.26), 0.01, outfit),
        piece(body, "Pants", lambda i: dom[i] in LEGS and dom[i] != "pelvis", 0.008, outfit),
        # 속옷이 비치지 않게 허리~허벅지 윗부분을 덮는 짧은 반바지(치마 안쪽). 상의 아래쪽과 겹쳐 틈이 없게 한다
        piece(body, "Hips", lambda i: dom[i] in ("pelvis", "spine_01") or (dom[i] in LEGS and (body.matrix_world @ vs[i].co).z > hip_z - 0.13), 0.0085, outfit),
        piece(body, "Shoes", lambda i: dom[i] in FEET, 0.006, shoe),
        skirt(body, arm, "SkirtShort", bone_z(arm, "calf_l") + 0.02, 1.35, outfit),
        skirt(body, arm, "SkirtLong", 0.06, 1.75, outfit),
    ]
    for p in parts:
        if p.name.startswith("Skirt"):
            attach(p, arm)
    # 원본에서 빠진 이미지(눈·헤어 노멀맵 등, 크기 0)를 쓰는 노드는 지운다 — 남기면 빈 텍스처가 생겨 three.js 가 못 읽는다
    for m in bpy.data.materials:
        if m.use_nodes:
            for n in list(m.node_tree.nodes):
                if n.type == "TEX_IMAGE" and (n.image is None or n.image.size[0] == 0):
                    m.node_tree.nodes.remove(n)
    out = os.path.abspath(os.path.join(OUT, f"real_{gender}.glb"))
    for a in list(bpy.data.actions):
        bpy.data.actions.remove(a)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=True, export_skins=True, export_animations=False,
                              export_yup=True, export_image_format="WEBP", export_image_quality=85)
    tris = 0
    for o in bpy.data.objects:
        if o.type == "MESH":
            o.data.calc_loop_triangles()
            tris += len(o.data.loop_triangles)
            print(f"   {o.name:20s} {len(o.data.loop_triangles):6d} tris  mats={[m.name for m in o.data.materials]}")
    print(f"ASSET real_{gender}: {tris} tris, {os.path.getsize(out) / 1024:.0f} KB")


def anims():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=UAL)
    for o in list(bpy.data.objects):
        if o.type != "ARMATURE":
            bpy.data.objects.remove(o)
    arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    arm.animation_data_create()
    # 불러오기가 클립마다 NLA 트랙을 만들어 둔다 — 지우고 쓸 클립만 다시 단다
    for t in list(arm.animation_data.nla_tracks):
        arm.animation_data.nla_tracks.remove(t)
    arm.animation_data.action = None
    for a in list(bpy.data.actions):
        if a.name not in ANIMS:
            bpy.data.actions.remove(a)
    for a in bpy.data.actions:
        tr = arm.animation_data.nla_tracks.new()
        tr.name = a.name
        tr.strips.new(a.name, 0, a)
    arm.animation_data.action = None
    out = os.path.abspath(os.path.join(OUT, "real_anims.glb"))
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=True, export_animations=True,
                              export_animation_mode="NLA_TRACKS", export_skins=False, export_yup=True)
    print(f"ASSET real_anims: {sorted(a.name for a in bpy.data.actions)}, {os.path.getsize(out) / 1024:.0f} KB")


if __name__ == "__main__":
    prep_textures()
    build("female")
    build("male")
    anims()
