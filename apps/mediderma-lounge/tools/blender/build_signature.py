"""
Higgsfield 디자인 캐릭터 (이미지 → Meshy 이미지-3D·자동 리깅) → 게임용 GLB.
    .bl/bin/python tools/blender/build_signature.py              # 전부
    .bl/bin/python tools/blender/build_signature.py guest_mint   # 하나만
    npm run optimize:models
원본: tools/assets/source/higgsfield_<이름>/ (저장소에 포함 — 다시 내려받을 수 없는 자체 생성물)
  signature: 플레이어가 고르는 시그니처 / guest_*: 손님·광장 NPC
  base.glb  : 메시 + 텍스처 + 24개 뼈 리그 + Idle
  walk.glb · sit.glb · wave.glb · dance.glb : 같은 모델을 같은 리거로 리깅한 동작 (뼈 이름이 같다)

하는 일 (웹 최적화)
- 동작 GLB 들의 액션을 이름을 바꿔 기본 뼈대에 NLA 트랙으로 모은다 (메시는 한 번만)
- 텍스처 2048 JPEG(2.9MB) → 1024 WebP
- 바닥 중앙 원점, 키 1.65m, 정면이 게임과 같은 방향
"""
import os
import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
import sys
CLIPS = {"base": "Idle", "walk": "Walk", "sit": "Sit", "wave": "Wave", "dance": "Dance"}
# 이름 → 키(m)
CHARACTERS = {"signature": 1.65, "guest_mint": 1.65, "guest_lavender": 1.63, "guest_coral": 1.62, "guest_gentle": 1.76}


def imported(path):
    before = set(bpy.data.objects)
    acts = set(bpy.data.actions)
    bpy.ops.import_scene.gltf(filepath=path)
    return [o for o in bpy.data.objects if o not in before], [a for a in bpy.data.actions if a not in acts]


def build(name):
    HEIGHT = CHARACTERS[name]
    SRC = os.path.join(HERE, "..", "assets", "source", f"higgsfield_{name}")
    OUT = os.path.abspath(os.path.join(HERE, "..", "..", "public", "models", f"{name}.glb"))
    bpy.ops.wm.read_factory_settings(use_empty=True)
    objs, acts = imported(os.path.join(SRC, "base.glb"))
    for o in list(objs):  # 가져오기가 만드는 뼈 표시용 구(Icosphere)는 버린다 — 남기면 키 계산·내보내기에 섞인다
        if o.name.startswith("Icosphere"):
            objs.remove(o)
            bpy.data.objects.remove(o)
    arm = next(o for o in objs if o.type == "ARMATURE")
    for a in acts:
        a.name = CLIPS["base"]
    for key, clip in CLIPS.items():
        if key == "base":
            continue
        p = os.path.join(SRC, key + ".glb")
        if not os.path.exists(p):
            print("   missing", p)
            continue
        o2, a2 = imported(p)
        for a in a2:
            a.name = clip
            a.use_fake_user = True
        for o in o2:
            if o in list(bpy.data.objects):
                bpy.data.objects.remove(o)
    # 액션마다 NLA 트랙 하나 (glTF 에서 클립 이름이 된다)
    arm.animation_data_create()
    for t in list(arm.animation_data.nla_tracks):
        arm.animation_data.nla_tracks.remove(t)
    arm.animation_data.action = None
    for clip in CLIPS.values():
        a = bpy.data.actions.get(clip)
        if not a:
            continue
        tr = arm.animation_data.nla_tracks.new()
        tr.name = clip
        st = tr.strips.new(clip, 0, a)
        try:  # Blender 4.4+ 슬롯 액션
            st.action_slot = a.slots[0]
        except Exception:
            pass
    for a in list(bpy.data.actions):
        if a.name not in CLIPS.values():
            bpy.data.actions.remove(a)
    # 키·원점 맞추기 (휴지 자세 기준)
    bpy.context.scene.frame_set(0)
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    zs = [(o.matrix_world @ v.co).z for o in meshes for v in o.data.vertices]
    h = max(zs) - min(zs)
    root = arm
    while root.parent:
        root = root.parent
    k = HEIGHT / h
    root.scale = root.scale * k
    bpy.context.view_layer.update()
    ws = [o.matrix_world @ v.co for o in meshes for v in o.data.vertices]
    root.location.z -= min(w.z for w in ws)
    # 발밑 가운데를 원점으로 (바닥 근처 정점의 가운데 = 두 발 사이)
    feet = [w for w in ws if w.z < min(x.z for x in ws) + 0.12]
    root.location.x -= sum(w.x for w in feet) / len(feet)
    root.location.y -= sum(w.y for w in feet) / len(feet)
    # 텍스처 1024 로
    for img in bpy.data.images:
        if img.size[0] > 1024:
            img.scale(1024, 1024)
    for m in bpy.data.materials:
        m.name = name
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_animations=True, export_animation_mode="NLA_TRACKS",
                              export_image_format="WEBP", export_image_quality=85, export_skins=True, export_yup=True)
    tris = 0
    for o in meshes:
        o.data.calc_loop_triangles()
        tris += len(o.data.loop_triangles)
    print(f"ASSET {name}: {tris} tris, clips={sorted(a.name for a in bpy.data.actions)}, scale x{k:.3f}, {os.path.getsize(OUT) / 1024:.0f} KB")


def main():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    for name in args or list(CHARACTERS):
        build(name)


if __name__ == "__main__":
    main()
