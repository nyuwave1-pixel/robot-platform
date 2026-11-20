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
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { FASHION_MAP } from "../data/game";
import type { Look } from "../store/game";
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
  if (["hair-long", "hair-wave", "hair-hime", "hair-braid"].includes(hair)) return "Hair_Long";
  if (["hair-bun", "hair-updo", "hair-space", "hair-pony", "hair-twin"].includes(hair)) return male ? "Hair_SimpleParted" : "Hair_Buns";
  if (hair === "hair-pixie") return male ? "Hair_Buzzed" : "Hair_BuzzedFemale";
  return "Hair_SimpleParted";
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
const CLIP: Record<Anim, string> = {
  idle: "Idle_Loop", walk: "Walk_Loop", sit: "Sitting_Idle_Loop", lie: "Idle_Loop", wave: "Idle_Talking_Loop", pose: "Dance_Loop", pay: "Interact", photo: "Idle_Loop",
};
/** 피부 텍스처 평균색(선형). 이 값으로 나눠 룩의 피부색이 그대로 나오게 한다 */
const SKIN_AVG = new THREE.Color(0.398, 0.195, 0.1);
/** 성장 단계에 따른 키 배율 (1단계 1.53m → 5단계 1.78m) */
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
  const [src, setSrc] = useState<{ scene: THREE.Group; clips: THREE.AnimationClip[] } | null>(null);
  useEffect(() => {
    let on = true;
    Promise.all([load(`./models/real_${male ? "male" : "female"}.glb`), load("./models/real_anims.glb")]).then(([c, a]) => {
      if (on && c && a) setSrc({ scene: c.scene, clips: a.animations });
    });
    return () => { on = false; };
  }, [male]);

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
    if (!obj) return;
    const hair = realHair(look.hair, male);
    const wear = realOutfit(cut, male);
    const skin = new THREE.Color(look.skin);
    const tint = new THREE.Color(skin.r / SKIN_AVG.r, skin.g / SKIN_AVG.g, skin.b / SKIN_AVG.b);
    // 입술: 피부색 위에 룩의 립 컬러를 60% 섞는다 (밝기는 텍스처가 맡도록 가장 밝은 채널을 1로 맞춘다)
    const lip = new THREE.Color(look.lipColor ?? "#e98c9a");
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
      if (mn === "skin") mt.color.copy(tint);
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
  }, [obj, look.hair, look.hairColor, look.skin, look.lipColor, look.outfit, look.shoes, male, cut, col, acc, shoe, outfit.id]);

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
  const actions = useMemo(() => {
    const out: Record<string, THREE.AnimationAction> = {};
    if (mixer && src) for (const clip of src.clips) out[clip.name] = mixer.clipAction(clip);
    return out;
  }, [mixer, src]);
  const cur = useRef<THREE.AnimationAction | null>(null);
  useFrame((_, dt) => {
    if (!mixer) return;
    const moving = !!movingRef?.current && anim !== "lie" && anim !== "sit";
    const want = actions[moving ? "Walk_Loop" : CLIP[anim]] ?? actions.Idle_Loop;
    if (want && cur.current !== want) {
      want.reset().fadeIn(0.25).play();
      cur.current?.fadeOut(0.25);
      cur.current = want;
    }
    mixer.update(Math.min(dt, 0.1));
  });

  if (!obj) return null;
  return (
    <group scale={realScale(growth) * (look.height ?? 1)}>
      <primitive object={obj} />
    </group>
  );
}
