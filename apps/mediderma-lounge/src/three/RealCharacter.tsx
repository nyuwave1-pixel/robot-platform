/**
 * 실사형 캐릭터 — Quaternius Universal Base Characters + Universal Animation Library (CC0).
 * 모델은 tools/blender/build_real_character.py 가 만든다: 몸 · 헤어 여러 종 · 몸에 맞춘 옷(상의·소매·짧은/긴 치마·바지·구두).
 * 이 컴포넌트는 룩에 맞게 헤어·옷을 골라 보이고, 재질 이름(skin · hair* · outfit · shoe)으로 색을 입히고, 동작 클립을 섞는다.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { makeGLTFLoader } from "./gltf";
import { BASE_FX, DESIGNED_FACE, FACE_PATCH } from "../data/makeup";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { FASHION_MAP } from "../data/game";
import { DESIGNED_BODIES, type Look } from "../store/game";
import type { Anim } from "./Character";

const cache = new Map<string, Promise<GLTF | null>>();
function load(url: string) {
  let p = cache.get(url);
  if (!p) {
    p = new Promise((res) => makeGLTFLoader().load(url, res, undefined, (e) => { console.error("real model load failed", url, e); res(null); }));
    cache.set(url, p);
  }
  return p;
}

/** 게임 헤어 → 실사 헤어 메시 */
export function realHair(hair: string, male: boolean) {
  if (male) {
    if (["hair-long", "hair-wave", "hair-hime", "hair-braid"].includes(hair)) return "Hair_Long";
    if (hair === "hair-pixie") return "Hair_Buzzed";
    return "Hair_SimpleParted";
  }
  // 여성: 짧게 붙는 SimpleParted·BuzzedFemale 은 멀리서 민머리처럼 보여 기본 헤어로 쓰지 않는다
  if (["hair-bun", "hair-updo", "hair-space"].includes(hair)) return "Hair_Buns";
  return "Hair_Long"; // 보브·롱·웨이브·트윈·포니·픽시 등은 어깨 길이 헤어
}
/** 의상 컷 → 보이는 옷 메시. 남성 체형은 치마 대신 바지를 입는다 */
export function realOutfit(cut: string, male = false) {
  const skirt = !male;
  return {
    Top: true,
    Hips: true,
    Sleeves: male || cut === "puff" || cut === "aline" || cut === "pants",
    SkirtShort: skirt && (cut === "puff" || cut === "aline" || cut === "sheath"),
    SkirtLong: skirt && cut === "gown",
    Pants: male || cut === "pants",
    Shoes: true,
  } as Record<string, boolean>;
}
/** 시그니처 캐릭터(Higgsfield 디자인 · 자체 리그)의 동작 이름 */
const SIG_CLIP: Record<Anim, string> = { idle: "Idle", walk: "Walk", sit: "Sit", lie: "Idle", wave: "Wave", pose: "Dance", pay: "Wave", photo: "Idle" };
const CLIP: Record<Anim, string> = {
  idle: "Idle_Loop", walk: "Walk_Loop", sit: "Sitting_Idle_Loop", lie: "Idle_Loop", wave: "Idle_Talking_Loop", pose: "Dance_Loop", pay: "Interact", photo: "Idle_Loop",
};
/** 피부 텍스처 평균색(선형). 이 값으로 나눠 룩의 피부색이 그대로 나오게 한다 */
const SKIN_AVG = new THREE.Color(0.398, 0.195, 0.1);
/** 성장 단계에 따른 키 배율 (1단계 1.53m → 5단계 1.78m) */
/**
 * 침대에 누운 실사 캐릭터의 머리·목 뼈 월드 위치 (케어 시술 부위를 실제 얼굴에 맞추는 데 쓴다).
 * 모델마다 키·머리 위치가 달라 공식(bodyDims)으로는 어긋나므로, 누워 있는 동안 매 프레임 기록한다.
 */
export const lieRig = { head: new THREE.Vector3(), neck: new THREE.Vector3(), scale: 1, at: 0 };

export const realScale = (growth: number) => 0.86 + 0.035 * (THREE.MathUtils.clamp(growth, 1, 5) - 1);

function crown(rank: number) {
  const g = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: "#d8b468", metalness: 0.85, roughness: 0.22, emissive: "#b8893a", emissiveIntensity: 0.3 });
  const big = rank >= 9;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.08, big ? 0.04 : 0.02, 24, 1, true), gold);
  gold.side = THREE.DoubleSide;
  g.add(band);
  const n = big ? 8 : 5;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.013, big ? 0.05 : 0.035, 6), gold);
    c.position.set(Math.sin(a) * 0.083, big ? 0.04 : 0.025, Math.cos(a) * 0.083);
    g.add(c);
  }
  return g;
}

export function RealCharacter({ look, growth, anim = "idle", movingRef, rank = 0 }: { look: Look; growth: number; anim?: Anim; movingRef?: { current: boolean }; rank?: number }) {
  const male = look.body === "male";
  const sig = (DESIGNED_BODIES as readonly string[]).includes(look.body ?? ""); // 텍스처에 옷·헤어가 구워진 완성형 모델 — 색 바꾸기는 쓰지 않는다
  const [src, setSrc] = useState<{ scene: THREE.Group; clips: THREE.AnimationClip[] } | null>(null);
  useEffect(() => {
    let on = true;
    const files = sig ? [`./models/${look.body}.glb`] : [`./models/real_${male ? "male" : "female"}.glb`, "./models/real_anims.glb"];
    Promise.all(files.map(load)).then(([c, a]) => {
      const anims = sig ? c?.animations : a?.animations;
      if (on && c && anims) setSrc({ scene: c.scene, clips: anims });
    });
    return () => { on = false; };
  }, [male, sig, look.body]);

  // 인스턴스마다 뼈대·재질을 복제한다 (같은 모델을 여러 캐릭터가 쓴다)
  const obj = useMemo(() => {
    if (!src) return null;
    const o = cloneSkinned(src.scene) as THREE.Group;
    o.traverse((c) => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.frustumCulled = false; // 스킨 메시는 움직이면 경계 상자가 맞지 않는다
      m.material = (m.material as THREE.Material).clone();
    });
    return o;
  }, [src]);

  // 룩 적용: 보이는 헤어·옷, 색
  const outfit = FASHION_MAP[look.outfit] ?? FASHION_MAP["fit-pastel"];
  const cut = outfit.cut ?? "puff";
  const col = outfit.color ?? "#f9c6d3";
  const acc = outfit.accent ?? "#ffffff";
  const shoe = look.shoes ? FASHION_MAP[look.shoes]?.color ?? "#ef9ab0" : "#ef9ab0";
  useEffect(() => {
    if (!obj || sig) return;
    const hair = realHair(look.hair, male);
    const wear = realOutfit(cut, male);
    const skin = new THREE.Color(look.skin);
    const tint = new THREE.Color(skin.r / SKIN_AVG.r, skin.g / SKIN_AVG.g, skin.b / SKIN_AVG.b);
    // 입술: 피부색 위에 룩의 립 컬러를 60% 섞는다 (밝기는 텍스처가 맡도록 가장 밝은 채널을 1로 맞춘다)
    // 립 아이템을 바르면 그 색, 아니면 캐릭터 기본 입술색
    const lip = new THREE.Color((look.lip && FASHION_MAP[look.lip]?.color) || look.lipColor || "#e98c9a");
    // 베이스 메이크업: 톤을 고르게(붉은기·노란기를 평균 쪽으로) + 밝기
    // (베이스를 안 바르면 피부는 그대로)
    const fx = look.base ? BASE_FX[look.base] ?? null : null;
    if (fx) {
      // 붉은기·칙칙함을 줄이고 따뜻한 쪽으로 고르게 (회색으로 바래지 않게 원래 색의 밝기·온도는 유지)
      const lum = tint.r * 0.3 + tint.g * 0.59 + tint.b * 0.11;
      tint.lerp(new THREE.Color(lum * 1.06, lum * 0.99, lum * 0.92), fx.even * 0.18).multiplyScalar(fx.bright);
    }
    const lm = Math.max(lip.r, lip.g, lip.b, 0.001);
    const lipTint = tint.clone().multiply(new THREE.Color(1, 1, 1).lerp(new THREE.Color(lip.r / lm, lip.g / lm, lip.b / lm), 0.6));
    obj.traverse((c) => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      const name = m.name.replace(/_\d+$/, "");
      if (name.startsWith("Hair_")) m.visible = name === hair;
      else if (name in wear) m.visible = wear[name];
      const mt = m.material as THREE.MeshStandardMaterial;
      const mn = mt.name;
      if (mn === "skin") {
        mt.color.copy(tint);
        if (mt.userData.rough0 === undefined) mt.userData.rough0 = mt.roughness;
        mt.roughness = fx ? fx.rough : mt.userData.rough0;
        mt.emissive.copy(tint).multiplyScalar(fx ? fx.glow : 0);
      }
      else if (mn === "lips") mt.color.copy(lipTint);
      else if (mn.startsWith("hair")) mt.color.set(look.hairColor).multiplyScalar(1.15);
      else if (mn === "shoe") mt.color.set(shoe);
      else if (mn === "accent") mt.color.set(acc);
      else if (mn === "outfit") {
        mt.color.set((name === "Pants" || (name === "Hips" && (cut === "pants" || male))) && outfit.id !== "fit-suit" ? (male ? "#3b3f4a" : acc) : col);
        mt.roughness = cut === "gown" ? 0.45 : 0.75;
        mt.metalness = cut === "gown" ? 0.15 : 0;
      }
    });
  }, [obj, look.hair, look.hairColor, look.skin, look.lipColor, look.lip, look.base, look.outfit, look.shoes, male, cut, col, acc, shoe, outfit.id]);

  // 색조 메이크업: 블러셔 · 아이섀도(· 완성형 모델은 립도)를 머리 뼈에 붙인 부드러운 색 패치로
  const blush = look.makeup ? FASHION_MAP[look.makeup]?.color ?? null : null;
  const shadow = look.shadow ? FASHION_MAP[look.shadow]?.color ?? null : null;
  const lipPatch = sig && look.lip ? FASHION_MAP[look.lip]?.color ?? null : null;
  const face = sig ? DESIGNED_FACE[look.body ?? ""] : undefined;
  useEffect(() => {
    if (!obj || (!blush && !shadow && !lipPatch) || (sig && !face)) return;
    const head = obj.getObjectByName("Head");
    if (!head) return;
    const g = new THREE.Group();
    g.name = "makeup";
    const patch = (w: number, h: number, color: string, opacity: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: softDot(), color, transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, toneMapped: false }));
      m.renderOrder = 2;
      g.add(m);
      return m;
    };
    if (!sig) {
      // 실사 기본 모델: 머리 뼈 축 그대로 (X 옆 · Y 위 · Z 앞)
      const add = (p: typeof FACE_PATCH.blush, color: string) => {
        for (const side of [-1, 1]) {
          const m = patch(p.w, p.h, color, p.opacity);
          m.position.set(side * p.x, p.y, p.z);
          m.rotation.y = side * p.turn;
        }
      };
      if (blush) add(FACE_PATCH.blush, blush);
      if (shadow) add(FACE_PATCH.shadow, shadow);
      head.add(g);
    } else {
      // 완성형 모델: 뼈 축이 모델마다 달라서 모델 공간(Y 위 · Z 앞)에서 놓고 머리 뼈에 그대로 붙인다.
      // 얼굴 굴곡도 모델마다 달라서, 표의 위치 앞에서 얼굴 쪽으로 광선을 쏴 실제 피부 표면에 살짝 띄워 붙인다.
      obj.updateMatrixWorld(true);
      const objInv = obj.matrixWorld.clone().invert();
      const headInObj = objInv.clone().multiply(head.matrixWorld);
      const hp = new THREE.Vector3().setFromMatrixPosition(headInObj);
      const f = face!;
      const skins: THREE.Object3D[] = [];
      obj.traverse((o) => { if ((o as THREE.SkinnedMesh).isSkinnedMesh) skins.push(o); });
      const ray = new THREE.Raycaster();
      const objRot = new THREE.Matrix3().setFromMatrix4(obj.matrixWorld);
      const back = new THREE.Vector3(0, 0, -1).applyMatrix3(objRot).normalize();
      /** 모델 공간 (x, y) 앞의 피부 표면: 표의 깊이(z)에 가장 가까운 면 (앞머리 등은 건너뛴다) */
      const surface = (x: number, y: number, z: number) => {
        ray.set(new THREE.Vector3(x, y, z + 0.25).applyMatrix4(obj.matrixWorld), back);
        let best: { p: THREE.Vector3; n: THREE.Vector3 } | null = null, bd = 0.05;
        for (const h of ray.intersectObjects(skins, false)) {
          const p = h.point.clone().applyMatrix4(objInv);
          const d = Math.abs(p.z - z);
          if (d < bd && h.face) { bd = d; best = { p, n: h.face.normal.clone() }; }
        }
        return best?.p ?? null;
      };
      const put = (m: THREE.Mesh, x: number, y: number, z: number, turn: number) => {
        const p = surface(x, y, z);
        if (!p) { m.visible = false; return; } // 피부를 못 찾으면(머리카락에 가림 등) 그리지 않는다
        m.position.copy(p).add(new THREE.Vector3(Math.sin(turn), 0, Math.cos(turn)).multiplyScalar(0.003));
        m.rotation.y = turn;
      };
      const k = f.size;
      const pair = (at: [number, number, number], w: number, h: number, color: string, opacity: number, turn: number) => {
        for (const side of [-1, 1]) put(patch(w * k, h * k, color, opacity), hp.x + side * at[0], hp.y + at[1], hp.z + at[2], side * turn);
      };
      if (blush) pair(f.blush, 0.046, 0.03, blush, 0.4, f.turn);
      if (shadow) pair(f.shadow, 0.032, 0.015, shadow, 0.6, f.turn * 0.6);
      if (lipPatch) put(patch(0.03 * k, 0.012 * k, lipPatch, 0.7), hp.x, hp.y + f.lip[0], hp.z + f.lip[1], 0);
      // 모델 공간 → 머리 뼈 공간
      g.applyMatrix4(headInObj.clone().invert());
      head.add(g);
    }
    return () => {
      head.remove(g);
      g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); } });
    };
  }, [obj, sig, face, blush, shadow, lipPatch]);

  // 등급 7 이상: 머리 뼈에 티아라/왕관
  useEffect(() => {
    if (!obj || rank < 7) return;
    const head = obj.getObjectByName("Head");
    if (!head) return;
    const c = crown(rank);
    c.position.set(0, 0.2, 0.0);
    head.add(c);
    return () => { head.remove(c); };
  }, [obj, rank]);

  const mixer = useMemo(() => (obj ? new THREE.AnimationMixer(obj) : null), [obj]);
  const fingers = useMemo(() => {
    const out: [THREE.Object3D, THREE.Quaternion][] = [];
    obj?.traverse((o) => { if (/^(index|middle|ring|pinky)_0[123]_[lr]$/.test(o.name)) out.push([o, o.quaternion.clone()]); });
    return out;
  }, [obj]);
  const actions = useMemo(() => {
    const out: Record<string, THREE.AnimationAction> = {};
    if (mixer && src) for (const clip of src.clips) out[clip.name] = mixer.clipAction(clip);
    return out;
  }, [mixer, src]);
  const cur = useRef<THREE.AnimationAction | null>(null);
  const bones = useMemo(() => {
    if (!obj) return null;
    let head: THREE.Object3D | null = null, neck: THREE.Object3D | null = null;
    obj.traverse((o) => {
      if (!head && /^head$/i.test(o.name)) head = o;
      if (!neck && /^neck(_01)?$/i.test(o.name)) neck = o;
    });
    if (!head || !neck) return null;
    const h = head as THREE.Object3D, n = neck as THREE.Object3D;
    // 몸통(골반~머리) 뼈의 기본(바인드) 자세: 누워 있을 때 대기 동작이 몸·고개를 비틀지 않게 되돌린다
    const trunk: [THREE.Object3D, THREE.Quaternion][] = [];
    obj.traverse((o) => { if (/^(hips|pelvis|spine|neck|head)/i.test(o.name) && !/end$/i.test(o.name)) trunk.push([o, o.quaternion.clone()]); });
    return { head: h, neck: n, trunk };
  }, [obj]);
  useFrame((_, dt) => {
    if (!mixer) return;
    const moving = !!movingRef?.current && anim !== "lie" && anim !== "sit";
    const want = sig ? actions[moving ? "Walk" : SIG_CLIP[anim]] ?? actions.Idle : actions[moving ? "Walk_Loop" : CLIP[anim]] ?? actions.Idle_Loop;
    if (want && cur.current !== want) {
      want.reset().fadeIn(0.25).play();
      cur.current?.fadeOut(0.25);
      cur.current = want;
    }
    mixer.update(Math.min(dt, 0.1));
    if (anim === "lie" && bones) {
      // 누운 자세에서는 고개를 정면(천장)으로: 대기 동작의 머리·목 회전을 기본 자세로
      for (const [b, q] of bones.trunk) b.quaternion.copy(q);
      obj?.updateMatrixWorld(true);
      bones.head.getWorldPosition(lieRig.head);
      bones.neck.getWorldPosition(lieRig.neck);
      lieRig.scale = realScale(growth) * (look.height ?? 1);
      lieRig.at = performance.now();
    }
    // 동작 클립의 주먹 쥔 손가락을 풀어 부드러운 손으로 (손가락 뼈를 휴지 자세로 되돌림)
    if (!sig) for (const [b, q] of fingers) b.quaternion.slerp(q, 0.85);
  });

  if (!obj) return null;
  return (
    <group scale={realScale(growth) * (look.height ?? 1)}>
      <primitive object={obj} />
    </group>
  );
}

/** 가운데가 진하고 가장자리로 갈수록 사라지는 원 (블러셔·섀도 패치용, 한 번 만들어 공유) */
let dot: THREE.Texture | null = null;
function softDot() {
  if (dot) return dot;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d")!;
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.45, "rgba(255,255,255,0.6)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = gr;
  x.fillRect(0, 0, 64, 64);
  dot = new THREE.CanvasTexture(c);
  return dot;
}
