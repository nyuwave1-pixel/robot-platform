"""
MEDIDERMA AI — 사실적인 얼굴(합성 인체) 렌더 파이프라인 (Blender 4.x, 헤드리스).

  blender -b -P scripts/blender/build_head.py -- --mpfb-data <dir> [--frames 36] [--size 480] [--samples 96] [--still 1]

  --mpfb-data : MPFB(MakeHuman) 확장 압축을 푼 뒤의 data/ 폴더 (3dobjs/base.obj, targets/, textures/ 가 있는 곳).
                기본 메시·타깃·마스크 텍스처는 CC0 이며 저장소에는 넣지 않는다.

만드는 것: <out>/frame_XXX.png — Cycles 로 렌더링한 스윙 턴테이블(투명 배경). pack_sequence.py 가 스프라이트 시트로 묶는다.

얼굴 출처: MakeHuman 기본 메시에 매크로 타깃(동아시아·여성·청년)을 적용한 "합성" 얼굴이다.
실존 인물을 스캔하거나 본뜬 것이 아니므로 초상권 문제가 없다. 피부·눈·눈썹·속눈썹은 모두 절차적(procedural) 셰이더와 헤어 파티클로 만든다.
"""
import bpy, gzip, math, os, sys, random
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(name, default):
    return type(default)(argv[argv.index(name) + 1]) if name in argv else default
FRAMES, SIZE, SAMPLES, STILL = arg("--frames", 36), arg("--size", 480), arg("--samples", 96), arg("--still", 0)
DATA = arg("--mpfb-data", "")
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = arg("--out", os.path.join(ROOT, ".blender-out"))
os.makedirs(OUT, exist_ok=True)
assert os.path.exists(os.path.join(DATA, "3dobjs/base.obj")), "--mpfb-data 가 필요합니다"
random.seed(7)

# ── 1. 기본 메시 읽기 + 타깃 적용 ─────────────────────────────────────────
V, VT, F = [], [], []  # F: (group, [v...], [vt...])
grp = "body"
for line in open(os.path.join(DATA, "3dobjs/base.obj")):
    p = line.split()
    if not p: continue
    if p[0] == "v": V.append([float(p[1]), float(p[2]), float(p[3])])
    elif p[0] == "vt": VT.append((float(p[1]), float(p[2])))
    elif p[0] == "g": grp = p[1]
    elif p[0] == "f":
        vi, ti = [], []
        for c in p[1:]:
            a = c.split("/"); vi.append(int(a[0]) - 1); ti.append(int(a[1]) - 1 if len(a) > 1 and a[1] else 0)
        F.append((grp, vi, ti))

def read_target(rel):
    out = {}
    with gzip.open(os.path.join(DATA, "targets", rel), "rt") as fh:
        for line in fh:
            p = line.split()
            if len(p) == 4 and not p[0].startswith("#"): out[int(p[0])] = (float(p[1]), float(p[2]), float(p[3]))
    return out
def apply(rel, w=1.0):
    for i, d in read_target(rel).items():
        V[i][0] += d[0] * w; V[i][1] += d[1] * w; V[i][2] += d[2] * w

apply("macrodetails/asian-female-young.target.gz")
apply("macrodetails/universal-female-young-averagemuscle-averageweight.target.gz")
for side in ("l", "r"):
    apply(f"eyes/{side}-eye-bag-decr.target.gz", 0.6)
apply("head/head-oval.target.gz", 0.5)
for side in ("l", "r"):
    apply(f"eyes/{side}-eye-scale-incr.target.gz", 0.55)
    apply(f"eyes/{side}-eye-height2-incr.target.gz", 0.5)

S = 0.1  # MakeHuman 단위(dm) → m.  (x, y위, z앞) → Blender (x, -z, y)
def conv(p): return Vector((p[0] * S, -p[2] * S, p[1] * S))

def group_center(name):
    idx = {i for g, vi, _ in F if g == name for i in vi}
    c = Vector((0, 0, 0))
    for i in idx: c += conv(V[i])
    return c / len(idx)
neck = group_center("joint-neck")
eyeL, eyeR = group_center("helper-l-eye"), group_center("helper-r-eye")
CUT_Z = neck.z - 0.035

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
root = bpy.data.objects.new("Root", None); scene.collection.objects.link(root)

def build(name, groups, keep=lambda vi: True, uv=True):
    faces = [(vi, ti) for g, vi, ti in F if g in groups and keep(vi)]
    used = sorted({i for vi, _ in faces for i in vi}); remap = {o: n for n, o in enumerate(used)}
    me = bpy.data.meshes.new(name)
    me.from_pydata([conv(V[i]) for i in used], [], [[remap[i] for i in vi] for vi, _ in faces])
    if uv:
        layer = me.uv_layers.new(name="UVMap")
        k = 0
        for _, ti in faces:
            for t in ti:
                layer.data[k].uv = VT[t]; k += 1
    me.update()
    for poly in me.polygons: poly.use_smooth = True
    ob = bpy.data.objects.new(name, me); scene.collection.objects.link(ob); ob.parent = root
    return ob, used

head, head_idx = build("Head", {"body"}, keep=lambda vi: all(conv(V[i]).z > CUT_Z and abs(conv(V[i]).x) < 0.085 for i in vi))
# 서브디비전을 실제로 적용해 정점 간격을 ~1mm 로 만든 뒤, 눈썹·헤어라인을 정점 단위로 정한다
bpy.context.view_layer.objects.active = head
sub = head.modifiers.new("Subsurf", "SUBSURF"); sub.levels = 2
bpy.ops.object.modifier_apply(modifier=sub.name)
eye_mid = (eyeL + eyeR) / 2
def smooth(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t)
def brow_weight(p):
    ax = abs(p.x)
    if ax < 0.011 or ax > 0.062 or p.y > eye_mid.y + 0.03: return 0.0
    t = (ax - 0.011) / 0.051
    zc = eye_mid.z + 0.0175 + 0.0055 * math.sin(math.pi * min(1.0, t * 1.15)) - 0.004 * t   # 아치
    half = 0.0044 * (1.0 - 0.5 * t)                                                       # 꼬리로 갈수록 가늘게
    return (1 - smooth(half * 0.6, half * 1.25, abs(p.z - zc))) * smooth(0.0, 0.12, t) * (1 - smooth(0.9, 1.0, t))
def hair_weight(p):
    d = p.y - eye_mid.y
    line = eye_mid.z + 0.056 - 1.05 * max(0.0, min(0.125, d - 0.012)) - 0.006 * math.cos(min(1.0, abs(p.x) / 0.06) * math.pi / 2)
    if abs(p.x) > 0.066 and p.z < eye_mid.z + 0.035 and d < 0.12: return 0.0   # 귀는 덮지 않는다
    return smooth(-0.002, 0.004, p.z - line)
head.data.color_attributes.new(name="brow", type="FLOAT_COLOR", domain="POINT")
head.data.color_attributes.new(name="hair", type="FLOAT_COLOR", domain="POINT")
vgl, vgr = head.vertex_groups.new(name="BrowL"), head.vertex_groups.new(name="BrowR")
bw = [brow_weight(v.co) for v in head.data.vertices]; hw_ = [hair_weight(v.co) for v in head.data.vertices]
cb = head.data.color_attributes["brow"]   # 속성을 모두 만든 뒤에 다시 가져온다 (추가 시 포인터가 바뀜)
for i, w in enumerate(bw): cb.data[i].color = (w, w, w, 1)
ch = head.data.color_attributes["hair"]
for i, w in enumerate(hw_): ch.data[i].color = (w, w, w, 1)
for i, w in enumerate(bw):
    if w > 0.05: (vgl if head.data.vertices[i].co.x > 0 else vgr).add([i], w, "REPLACE")

# ── 2. 피부 셰이더 (절차적: 톤 얼룩 + 모공 범프 + SSS, 입술·눈꺼풀은 UV 마스크) ───────────
def img(name):
    im = bpy.data.images.load(os.path.join(DATA, "textures", name)); im.colorspace_settings.name = "Non-Color"; return im

BLUSH_Z = eye_mid.z - 0.038
def skin_material():
    m = bpy.data.materials.new("Skin"); m.use_nodes = True
    nt = m.node_tree; N, L = nt.nodes, nt.links
    bsdf = N["Principled BSDF"]
    tc = N.new("ShaderNodeTexCoord")
    lips = N.new("ShaderNodeTexImage"); lips.image = img("mpfb_lips.jpg"); L.new(tc.outputs["UV"], lips.inputs["Vector"])
    lids = N.new("ShaderNodeTexImage"); lids.image = img("mpfb_eyelids.jpg"); L.new(tc.outputs["UV"], lids.inputs["Vector"])
    # 큰 톤 얼룩
    n1 = N.new("ShaderNodeTexNoise"); n1.inputs["Scale"].default_value = 28; n1.inputs["Detail"].default_value = 6
    L.new(tc.outputs["Object"], n1.inputs["Vector"])
    ramp = N.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.32; ramp.color_ramp.elements[0].color = (0.50, 0.275, 0.20, 1)
    ramp.color_ramp.elements[1].position = 0.72; ramp.color_ramp.elements[1].color = (0.60, 0.36, 0.27, 1)
    L.new(n1.outputs["Fac"], ramp.inputs["Fac"])
    # 미세한 붉은 점·잡티 느낌
    n2 = N.new("ShaderNodeTexNoise"); n2.inputs["Scale"].default_value = 420; n2.inputs["Detail"].default_value = 3
    L.new(tc.outputs["Object"], n2.inputs["Vector"])
    fleck = N.new("ShaderNodeMapRange"); fleck.inputs["From Min"].default_value = 0.62; fleck.inputs["From Max"].default_value = 0.8
    fleck.inputs["To Max"].default_value = 0.22; L.new(n2.outputs["Fac"], fleck.inputs["Value"])
    mix1 = N.new("ShaderNodeMixRGB"); mix1.inputs["Color2"].default_value = (0.56, 0.27, 0.21, 1)
    L.new(fleck.outputs["Result"], mix1.inputs["Fac"]); L.new(ramp.outputs["Color"], mix1.inputs["Color1"])
    # 볼 홍조: 눈 아래·바깥쪽 볼 위치에 넓고 옅게
    geo = N.new("ShaderNodeNewGeometry"); sepb = N.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["Object"], sepb.inputs[0])
    ax = N.new("ShaderNodeMath"); ax.operation = "ABSOLUTE"; L.new(sepb.outputs["X"], ax.inputs[0])
    dx = N.new("ShaderNodeMath"); dx.operation = "SUBTRACT"; dx.inputs[1].default_value = 0.043; L.new(ax.outputs[0], dx.inputs[0])
    dz = N.new("ShaderNodeMath"); dz.operation = "SUBTRACT"; dz.inputs[1].default_value = BLUSH_Z; L.new(sepb.outputs["Z"], dz.inputs[0])
    dv = N.new("ShaderNodeCombineXYZ"); L.new(dx.outputs[0], dv.inputs["X"]); L.new(dz.outputs[0], dv.inputs["Y"])
    dl = N.new("ShaderNodeVectorMath"); dl.operation = "LENGTH"; L.new(dv.outputs[0], dl.inputs[0])
    bl = N.new("ShaderNodeMapRange"); bl.inputs["From Min"].default_value = 0.034; bl.inputs["From Max"].default_value = 0.006
    bl.inputs["To Min"].default_value = 0.0; bl.inputs["To Max"].default_value = 0.34; bl.interpolation_type = "SMOOTHSTEP"
    L.new(dl.outputs["Value"], bl.inputs["Value"])
    mixb = N.new("ShaderNodeMixRGB"); mixb.inputs["Color2"].default_value = (0.60, 0.25, 0.21, 1)
    L.new(bl.outputs["Result"], mixb.inputs["Fac"]); L.new(mix1.outputs["Color"], mixb.inputs["Color1"])
    # 눈꺼풀: 살짝 어둡고 붉게
    mix2 = N.new("ShaderNodeMixRGB"); mix2.inputs["Color2"].default_value = (0.52, 0.29, 0.23, 1)
    lidf = N.new("ShaderNodeMath"); lidf.operation = "MULTIPLY"; lidf.inputs[1].default_value = 0.5
    L.new(lids.outputs["Color"], lidf.inputs[0]); L.new(lidf.outputs[0], mix2.inputs["Fac"]); L.new(mixb.outputs["Color"], mix2.inputs["Color1"])
    # 입술
    mix3 = N.new("ShaderNodeMixRGB"); mix3.inputs["Color2"].default_value = (0.50, 0.165, 0.165, 1)
    lipf = N.new("ShaderNodeMath"); lipf.operation = "MULTIPLY"; lipf.inputs[1].default_value = 0.85
    L.new(lips.outputs["Color"], lipf.inputs[0]); L.new(lipf.outputs[0], mix3.inputs["Fac"]); L.new(mix2.outputs["Color"], mix3.inputs["Color1"])
    # 눈썹 밑색 (헤어 파티클 아래에 깔리는 어두운 톤)
    ba = N.new("ShaderNodeAttribute"); ba.attribute_name = "brow"
    bn = N.new("ShaderNodeTexNoise"); bn.inputs["Scale"].default_value = 700; L.new(tc.outputs["Object"], bn.inputs["Vector"])
    bf = N.new("ShaderNodeMath"); bf.operation = "MULTIPLY"; L.new(ba.outputs["Fac"], bf.inputs[0]); L.new(bn.outputs["Fac"], bf.inputs[1])
    bf2 = N.new("ShaderNodeMath"); bf2.operation = "MULTIPLY"; bf2.inputs[1].default_value = 1.9; bf2.use_clamp = True; L.new(bf.outputs[0], bf2.inputs[0])
    mix4 = N.new("ShaderNodeMixRGB"); mix4.inputs["Color2"].default_value = (0.05, 0.032, 0.024, 1)
    L.new(bf2.outputs[0], mix4.inputs["Fac"]); L.new(mix3.outputs["Color"], mix4.inputs["Color1"])
    ha = N.new("ShaderNodeAttribute"); ha.attribute_name = "hair"
    mix5 = N.new("ShaderNodeMixRGB"); mix5.inputs["Color2"].default_value = (0.02, 0.014, 0.011, 1)
    L.new(ha.outputs["Fac"], mix5.inputs["Fac"]); L.new(mix4.outputs["Color"], mix5.inputs["Color1"])
    L.new(mix5.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Subsurface Weight"].default_value = 1.0
    bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.36, 0.2)
    bsdf.inputs["Subsurface Scale"].default_value = 0.0042
    bsdf.subsurface_method = "RANDOM_WALK"
    # 거칠기: 기본 0.44 ± 얼룩, 입술은 더 매끈
    rr = N.new("ShaderNodeMapRange"); rr.inputs["To Min"].default_value = 0.38; rr.inputs["To Max"].default_value = 0.52
    L.new(n1.outputs["Fac"], rr.inputs["Value"])
    rl = N.new("ShaderNodeMixRGB"); rl.inputs["Color2"].default_value = (0.26, 0.26, 0.26, 1)
    L.new(lipf.outputs[0], rl.inputs["Fac"]); L.new(rr.outputs["Result"], rl.inputs["Color1"]); L.new(rl.outputs["Color"], bsdf.inputs["Roughness"])
    bsdf.inputs["Specular IOR Level"].default_value = 0.42
    # 모공·잔결 범프
    vor = N.new("ShaderNodeTexVoronoi"); vor.inputs["Scale"].default_value = 1500; L.new(tc.outputs["Object"], vor.inputs["Vector"])
    n3 = N.new("ShaderNodeTexNoise"); n3.inputs["Scale"].default_value = 260; n3.inputs["Detail"].default_value = 8
    L.new(tc.outputs["Object"], n3.inputs["Vector"])
    hsum = N.new("ShaderNodeMath"); hsum.operation = "ADD"; L.new(vor.outputs["Distance"], hsum.inputs[0]); L.new(n3.outputs["Fac"], hsum.inputs[1])
    bump = N.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.22; bump.inputs["Distance"].default_value = 0.00025
    L.new(hsum.outputs[0], bump.inputs["Height"]); L.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return m
head.data.materials.append(skin_material())

# ── 3. 눈 (헬퍼 구 + 절차적 홍채) ────────────────────────────────────────────
def eye_material(radius):
    m = bpy.data.materials.new("Eye"); m.use_nodes = True
    nt = m.node_tree; N, L = nt.nodes, nt.links
    bsdf = N["Principled BSDF"]
    tc = N.new("ShaderNodeTexCoord"); sep = N.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["Object"], sep.inputs[0])
    # 정면(-Y)에서 본 반지름 r = sqrt(x²+z²)/R
    xz = N.new("ShaderNodeCombineXYZ"); L.new(sep.outputs["X"], xz.inputs["X"]); L.new(sep.outputs["Z"], xz.inputs["Y"])
    ln = N.new("ShaderNodeVectorMath"); ln.operation = "LENGTH"; L.new(xz.outputs[0], ln.inputs[0])
    r = N.new("ShaderNodeMath"); r.operation = "DIVIDE"; r.inputs[1].default_value = radius; L.new(ln.outputs["Value"], r.inputs[0])
    front = N.new("ShaderNodeMath"); front.operation = "LESS_THAN"; front.inputs[1].default_value = 0.0; L.new(sep.outputs["Y"], front.inputs[0])
    ramp = N.new("ShaderNodeValToRGB"); cr = ramp.color_ramp
    cr.elements[0].position = 0.0; cr.elements[0].color = (0.004, 0.003, 0.003, 1)          # 동공
    e = cr.elements.new(0.19); e.color = (0.004, 0.003, 0.003, 1)
    e = cr.elements.new(0.215); e.color = (0.115, 0.05, 0.022, 1)                            # 홍채 안쪽
    e = cr.elements.new(0.40); e.color = (0.058, 0.026, 0.012, 1)                            # 홍채 바깥
    e = cr.elements.new(0.455); e.color = (0.012, 0.007, 0.005, 1)                           # 윤부(어두운 테)
    e = cr.elements.new(0.50); e.color = (0.80, 0.76, 0.73, 1)                               # 흰자
    cr.elements[-1].position = 1.0; cr.elements[-1].color = (0.74, 0.60, 0.57, 1)            # 가장자리 살짝 붉게
    # 홍채 결(방사형 무늬)
    ang = N.new("ShaderNodeMath"); ang.operation = "ARCTAN2"; L.new(sep.outputs["X"], ang.inputs[0]); L.new(sep.outputs["Z"], ang.inputs[1])
    wob = N.new("ShaderNodeTexNoise"); wob.noise_dimensions = "1D"; wob.inputs["Scale"].default_value = 26; L.new(ang.outputs[0], wob.inputs["W"])
    jit = N.new("ShaderNodeMath"); jit.operation = "MULTIPLY_ADD"; jit.inputs[1].default_value = 0.05; L.new(wob.outputs["Fac"], jit.inputs[0]); L.new(r.outputs[0], jit.inputs[2])
    rr = N.new("ShaderNodeMath"); rr.operation = "SUBTRACT"; rr.inputs[1].default_value = 0.025; L.new(jit.outputs[0], rr.inputs[0])
    # 뒤쪽 반구는 흰자
    sel = N.new("ShaderNodeMix"); sel.data_type = "FLOAT"; sel.inputs[2].default_value = 0.8
    L.new(front.outputs[0], sel.inputs[0]); L.new(rr.outputs[0], sel.inputs[3]); L.new(sel.outputs[0], ramp.inputs["Fac"])
    L.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.06
    bsdf.inputs["Coat Weight"].default_value = 1.0; bsdf.inputs["Coat Roughness"].default_value = 0.02
    bsdf.inputs["Subsurface Weight"].default_value = 0.25; bsdf.inputs["Subsurface Scale"].default_value = 0.002
    return m
for nm, g in (("EyeL", "helper-l-eye"), ("EyeR", "helper-r-eye")):
    ob, _ = build(nm, {g}, uv=False)
    c = sum((v.co for v in ob.data.vertices), Vector()) / len(ob.data.vertices)
    for v in ob.data.vertices: v.co -= c
    ob.location = c
    rad = max((v.co.length for v in ob.data.vertices))
    s = ob.modifiers.new("Subsurf", "SUBSURF"); s.levels = 2; s.render_levels = 3
    ob.data.materials.append(eye_material(rad))

# ── 4. 눈썹 · 속눈썹 (헤어 파티클) ──────────────────────────────────────────
def hair_material(name, col):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial"); h = nt.nodes.new("ShaderNodeBsdfHairPrincipled")
    h.inputs["Color"].default_value = col; h.inputs["Roughness"].default_value = 0.45
    nt.links.new(h.outputs[0], out.inputs["Surface"])
    return m
head.data.materials.append(hair_material("Brow", (0.018, 0.012, 0.009, 1)))
bpy.context.view_layer.objects.active = head
for nm, sx in (("BrowL", 1), ("BrowR", -1)):
    ps = head.modifiers.new(nm, "PARTICLE_SYSTEM").particle_system
    ps.vertex_group_density = nm
    st = ps.settings; st.type = "HAIR"; st.count = 1700; st.hair_length = 0.0085; st.hair_step = 4
    st.emit_from = "FACE"; st.use_emit_random = True; st.distribution = "RAND"
    st.normal_factor = 0.0004; st.object_align_factor = (0.0013 * sx, 0.0, 0.0005); st.factor_random = 0.0003
    st.root_radius = 0.035; st.tip_radius = 0.008; st.radius_scale = 0.0016
    st.material = 2; st.use_hair_bspline = True; st.display_step = 3; st.render_step = 4
    st.length_random = 0.35

lash_groups = {"helper-l-eyelashes-1", "helper-l-eyelashes-2", "helper-r-eyelashes-1", "helper-r-eyelashes-2"}
lash, lash_idx = build("Lashes", lash_groups, uv=False)
# 속눈썹 헬퍼 면은 눈꺼풀 가장자리에서 바깥으로 뻗은 띠다. 띠를 숨기고 그 위에서 바깥 방향으로 털을 낸다.
lm = bpy.data.materials.new("LashCard"); lm.use_nodes = True; lash.data.materials.append(lm)
ln_ = lm.node_tree; 
for n in list(ln_.nodes): ln_.nodes.remove(n)
lo = ln_.nodes.new("ShaderNodeOutputMaterial"); ltr = ln_.nodes.new("ShaderNodeBsdfTransparent"); ldk = ln_.nodes.new("ShaderNodeBsdfPrincipled")
ldk.inputs["Base Color"].default_value = (0.006, 0.005, 0.004, 1); ldk.inputs["Roughness"].default_value = 0.5
ltc = ln_.nodes.new("ShaderNodeTexCoord"); lmp = ln_.nodes.new("ShaderNodeMapping"); lmp.inputs["Scale"].default_value = (3200, 40, 40)
lno = ln_.nodes.new("ShaderNodeTexNoise"); lno.inputs["Scale"].default_value = 1.0
ln_.links.new(ltc.outputs["Object"], lmp.inputs["Vector"]); ln_.links.new(lmp.outputs["Vector"], lno.inputs["Vector"])
lth = ln_.nodes.new("ShaderNodeMath"); lth.operation = "GREATER_THAN"; lth.inputs[1].default_value = 0.47; ln_.links.new(lno.outputs["Fac"], lth.inputs[0])
lmx = ln_.nodes.new("ShaderNodeMixShader"); ln_.links.new(lth.outputs[0], lmx.inputs["Fac"]); ln_.links.new(ltr.outputs[0], lmx.inputs[1]); ln_.links.new(ldk.outputs[0], lmx.inputs[2])
ln_.links.new(lmx.outputs[0], lo.inputs["Surface"])
lash.visible_shadow = False

# ── 5. 머리카락 (뒤로 넘겨 묶은 머리: 두피를 덮는 셸) ─────────────────────────────
hme = head.data.copy(); hair = bpy.data.objects.new("Hair", hme); scene.collection.objects.link(hair); hair.parent = root
import bmesh
bm = bmesh.new(); bm.from_mesh(hme)
bmesh.ops.delete(bm, geom=[v for v in bm.verts if hair_weight(v.co) < 0.5], context="VERTS")
bm.to_mesh(hme); bm.free(); hme.materials.clear()
for vg in list(hair.vertex_groups): hair.vertex_groups.remove(vg)
so = hair.modifiers.new("Solid", "SOLIDIFY"); so.thickness = 0.003; so.offset = 1.0
hmat = bpy.data.materials.new("HairCap"); hmat.use_nodes = True
hb = hmat.node_tree.nodes["Principled BSDF"]; hb.inputs["Base Color"].default_value = (0.022, 0.015, 0.011, 1); hb.inputs["Roughness"].default_value = 0.32
hb.inputs["Anisotropic"].default_value = 0.85
htc = hmat.node_tree.nodes.new("ShaderNodeTexCoord"); hmap = hmat.node_tree.nodes.new("ShaderNodeMapping"); hmap.inputs["Scale"].default_value = (2600, 30, 2600)
hw = hmat.node_tree.nodes.new("ShaderNodeTexNoise"); hw.inputs["Scale"].default_value = 1.0; hw.inputs["Detail"].default_value = 4
hmat.node_tree.links.new(htc.outputs["Object"], hmap.inputs["Vector"]); hmat.node_tree.links.new(hmap.outputs["Vector"], hw.inputs["Vector"])
hbp = hmat.node_tree.nodes.new("ShaderNodeBump"); hbp.inputs["Strength"].default_value = 0.9; hbp.inputs["Distance"].default_value = 0.0006
hmat.node_tree.links.new(hw.outputs["Fac"], hbp.inputs["Height"]); hmat.node_tree.links.new(hbp.outputs["Normal"], hb.inputs["Normal"])
hair.data.materials.append(hmat)

# ── 6. 조명 · 카메라 · 렌더 ────────────────────────────────────────────────
center = (eyeL + eyeR) / 2 + Vector((0, 0, -0.022))
def area(name, loc, energy, size, color=(1, 1, 1)):
    d = bpy.data.lights.new(name, "AREA"); d.energy = energy; d.size = size; d.color = color
    o = bpy.data.objects.new(name, d); scene.collection.objects.link(o); o.location = center + Vector(loc)
    t = o.constraints.new("TRACK_TO"); t.target = target; t.track_axis = "TRACK_NEGATIVE_Z"; t.up_axis = "UP_Y"
target = bpy.data.objects.new("Target", None); scene.collection.objects.link(target); target.location = center
area("Key", (-0.45, -0.75, 0.38), 8.5, 0.55, (1.0, 0.96, 0.92))
area("Fill", (0.6, -0.55, 0.05), 2.2, 0.9, (0.86, 0.93, 1.0))
area("RimL", (-0.5, 0.55, 0.3), 9, 0.3, (0.55, 0.85, 1.0))
area("RimR", (0.55, 0.5, 0.25), 7, 0.3, (0.75, 0.7, 1.0))
world = bpy.data.worlds.new("World"); scene.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.012, 0.016, 0.026, 1); world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0

cam_data = bpy.data.cameras.new("Cam"); cam_data.lens = 85; cam_data.sensor_width = 36
cam_data.dof.use_dof = True; cam_data.dof.focus_object = target; cam_data.dof.aperture_fstop = 5.6
cam = bpy.data.objects.new("Cam", cam_data); scene.collection.objects.link(cam); scene.camera = cam
t = cam.constraints.new("TRACK_TO"); t.target = target; t.track_axis = "TRACK_NEGATIVE_Z"; t.up_axis = "UP_Y"
R = 0.6
for f in range(FRAMES):
    u = f / max(1, FRAMES - 1)
    yaw = math.radians(-38 + 76 * u); pitch = math.radians(3 * math.sin(u * math.pi))
    cam.location = center + Vector((R * math.sin(yaw) * math.cos(pitch), -R * math.cos(yaw) * math.cos(pitch), R * math.sin(pitch)))
    cam.keyframe_insert("location", frame=f + 1)

scene.render.engine = "CYCLES"; scene.cycles.device = "CPU"; scene.cycles.samples = SAMPLES
try:
    scene.cycles.use_denoising = True; scene.cycles.denoiser = "OPENIMAGEDENOISE"
except Exception as e:
    print("denoiser unavailable:", e); scene.cycles.use_denoising = False
scene.cycles.max_bounces = 6
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = SIZE; scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"; scene.render.image_settings.color_mode = "RGBA"
scene.view_settings.view_transform = "Filmic"; scene.view_settings.look = "Medium High Contrast"
scene.frame_start, scene.frame_end = 1, FRAMES
if STILL:
    scene.frame_set(STILL); scene.render.filepath = os.path.join(OUT, f"still_{STILL:03d}.png")
    bpy.ops.render.render(write_still=True)
else:
    scene.render.filepath = os.path.join(OUT, "frame_")
    bpy.ops.render.render(animation=True)
print("RENDER_DONE", OUT)
