/**
 * 프로시저럴 3D 캐릭터.
 * 하나의 공통 리그(다리·팔·몸통·머리 피벗)를 쓰고, 성장값 growth(1.0~5.0)에 따라
 * 프로포션 키프레임(STAGES[].body)을 보간한다 → 단계가 바뀌어도 헤어·의상·액세서리가 그대로 유지된다.
 * 외부 모델·텍스처를 쓰지 않으므로 라이선스 이슈가 없고, 추후 GLB(공통 스켈레톤)로 교체할 수 있게
 * look / growth / anim 인터페이스만 노출한다.
 */
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { Model } from "./Model";
import { FASHION_MAP, STAGES, RANKS } from "../data/game";
import type { Look } from "../store/game";

export type Anim = "idle" | "walk" | "sit" | "lie" | "wave" | "pose" | "pay" | "photo";

const lerp = THREE.MathUtils.lerp;
export function bodyDims(growth: number) {
  const g = THREE.MathUtils.clamp(growth, 1, 5);
  const i = Math.min(4, Math.floor(g) - 1);
  const j = Math.min(4, i + 1);
  const f = g - (i + 1);
  const a = STAGES[i].body, b = STAGES[j].body;
  const d = {
    head: lerp(a.head, b.head, f), torso: lerp(a.torso, b.torso, f), leg: lerp(a.leg, b.leg, f), arm: lerp(a.arm, b.arm, f),
    shoulder: lerp(a.shoulder, b.shoulder, f), eye: lerp(a.eye, b.eye, f), limb: lerp(a.limb, b.limb, f), neck: lerp(a.neck, b.neck, f),
  };
  const k = (g - 1) / 4; // 0(아기) → 1(아이콘)
  const headY = d.leg + d.torso + d.neck + d.head * 0.92;
  return { ...d, k, headY, height: headY + d.head };
}

interface Props {
  look: Look;
  growth: number;
  anim?: Anim;
  mood?: "smile" | "happy" | "relaxed";
  /** 피부 광채 연출 0..1 (게임 EXP 기반 판타지 연출) */
  glow?: number;
  sparkle?: boolean;
  seed?: number;
  /** 걷기 여부를 프레임마다 읽는 함수 (플레이어용) */
  movingRef?: { current: boolean };
  /** 라운지 등급 (0 = 없음). 등급이 오를수록 브로치 → 케이프릿 → 망토 → 티아라 → 왕관이 더해진다 */
  rank?: number;
}

export function Character({ look, growth, anim = "idle", mood = "smile", glow = 0, sparkle, seed = 0, movingRef, rank = 0 }: Props) {
  const rk = rank > 0 ? RANKS[Math.min(rank, RANKS.length) - 1] : null;
  /** 등급 뷰티 연출 강도 0..1 (게임 판타지 연출이며 제품 효능 표현이 아니다) */
  const beauty = Math.sqrt(Math.min(1, rank / 10));
  const rankCol = rk ? (rk.n === 10 ? "#2a2226" : rk.color) : "#ffffff";
  const d = bodyDims(growth);
  const stage = Math.round(growth);
  const outfit = FASHION_MAP[look.outfit] ?? FASHION_MAP["fit-pastel"];
  const cut = outfit.cut ?? "puff";
  const col = outfit.color ?? "#f9c6d3";
  const acc = outfit.accent ?? "#ffffff";

  const root = useRef<THREE.Group>(null!);
  const upper = useRef<THREE.Group>(null!);
  const headG = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const eyes = useRef<THREE.Group>(null!);
  const sway = useRef<THREE.Group>(null!);

  const skinMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.55 }), []);
  // 가짜 SSS: 따뜻한 에미시브를 살짝 섞어 부드러운 피부 톤을 만든다.
  skinMat.color.set(look.skin);
  skinMat.emissive.set(look.skin).lerp(new THREE.Color("#ff9f9f"), 0.35);
  skinMat.emissiveIntensity = 0.16 + glow * 0.22 + beauty * 0.08;
  skinMat.roughness = 0.55 - beauty * 0.15;
  const skinMats = useMemo(() => ({ skin: skinMat }), [skinMat]);
  const hairMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.05, side: THREE.DoubleSide }), []);
  hairMat.color.set(look.hairColor);
  hairMat.emissive.set(look.hairColor);
  hairMat.emissiveIntensity = 0.08;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed * 1.7;
    const moving = movingRef ? movingRef.current : anim === "walk";
    const a: Anim = moving ? "walk" : anim === "walk" ? "idle" : anim;
    const ease = 0.18;
    let lL = 0, lR = 0, aLx = 0, aRx = 0, aLz = 0.14 + d.k * 0.02, aRz = -(0.14 + d.k * 0.02), bob = 0, tilt = 0, y = 0, lean = 0;
    if (a === "walk") {
      const s = Math.sin(t * 9);
      lL = s * 0.7; lR = -s * 0.7; aLx = -s * 0.6; aRx = s * 0.6; bob = Math.abs(Math.cos(t * 9)) * 0.04 * (1.4 - d.k);
    } else if (a === "sit") {
      lL = lR = -Math.PI / 2 + 0.05; y = 0.46 - d.leg; aLx = aRx = -0.5; tilt = Math.sin(t * 0.8) * 0.04;
    } else if (a === "lie") {
      aLz = 0.08; aRz = -0.08;
    } else if (a === "wave") {
      aRz = -2.5 + Math.sin(t * 9) * 0.35; tilt = 0.08; bob = Math.sin(t * 4) * 0.01;
    } else if (a === "pay") {
      aRx = -1.2 + Math.sin(t * 5) * 0.1;
    } else if (a === "photo") {
      aRx = -1.9; aRz = -0.5; aLz = 0.5; tilt = 0.06;
    } else if (a === "pose") {
      if (look.pose === "cute") { aLx = aRx = -2.3; aLz = -0.35; aRz = 0.35; tilt = 0.12; }
      else if (look.pose === "model") { aLz = 0.75; aRz = -0.2; lean = 0.06; tilt = -0.08; }
      else if (look.pose === "heart") { aLz = 2.75; aRz = -2.75; bob = Math.sin(t * 3) * 0.015; }
      else { tilt = Math.sin(t) * 0.05; }
    } else {
      bob = Math.sin(t * 2.2) * 0.008; tilt = Math.sin(t * 0.9) * 0.05 * (1.2 - d.k * 0.6);
    }
    const L = (r: THREE.Group, x: number, z = 0) => { if (!r) return; r.rotation.x = lerp(r.rotation.x, x, ease); r.rotation.z = lerp(r.rotation.z, z, ease); };
    L(legL.current, lL); L(legR.current, lR); L(armL.current, aLx, aLz); L(armR.current, aRx, aRz);
    if (root.current) root.current.position.y = lerp(root.current.position.y, y + bob, 0.25);
    if (upper.current) {
      upper.current.scale.y = 1 + (a === "lie" ? Math.sin(t * 1.4) * 0.012 : Math.sin(t * 2.2) * 0.008);
      upper.current.rotation.z = lerp(upper.current.rotation.z, lean, ease);
    }
    if (headG.current) {
      headG.current.rotation.z = lerp(headG.current.rotation.z, tilt, 0.08);
      headG.current.rotation.y = a === "idle" ? Math.sin(t * 0.5) * 0.12 : lerp(headG.current.rotation.y, 0, 0.1);
    }
    if (eyes.current) {
      const closed = mood !== "smile" || a === "lie";
      const blink = closed ? 0.12 : (t % 3.6) < 0.12 ? 0.1 : 1;
      eyes.current.scale.y = lerp(eyes.current.scale.y, blink, 0.5);
    }
    // 헤어 2차 모션(간이 물리): 이동·시간에 따라 꼬리 머리가 흔들린다.
    if (sway.current) {
      sway.current.rotation.x = lerp(sway.current.rotation.x, moving ? 0.28 + Math.sin(t * 9) * 0.08 : Math.sin(t * 1.6) * 0.04, 0.1);
      sway.current.rotation.z = Math.sin(t * 1.9) * 0.035;
    }
  });

  const hip = d.shoulder * (0.42 + d.k * 0.1);
  const waistY = d.leg + d.torso * (0.42 + d.k * 0.08);
  const waistR = d.shoulder * lerp(0.95, 0.6, d.k);
  const chestR = d.shoulder * lerp(0.98, 0.86, d.k);
  const skirt = {
    puff: { len: (waistY - d.leg) + d.leg * 0.45, r: d.shoulder * 1.95 },
    aline: { len: (waistY - d.leg) + d.leg * 0.5, r: d.shoulder * 1.6 },
    sheath: { len: (waistY - d.leg) + d.leg * 0.52, r: d.shoulder * 1.02 },
    gown: { len: waistY - 0.06, r: d.shoulder * 1.9 },
    pants: { len: (waistY - d.leg) + d.leg * 0.06, r: waistR * 1.18 },
  }[cut];
  const pantsColor = cut === "pants" ? (outfit.id === "fit-suit" ? col : acc) : null;
  const topY = d.leg + d.torso;
  const R = d.head;
  const faceW = (look.face === "oval" ? 0.94 : look.face === "soft" ? 1.0 : 1.06) * (1 - beauty * 0.05);
  const faceH = look.face === "oval" ? 1.06 : look.face === "soft" ? 1.02 : 0.98;
  const eyeR = R * 0.2 * d.eye * (1 + beauty * 0.3);
  const eyeY = -R * lerp(0.08, 0.0, d.k);
  const eyeX = R * lerp(0.4, 0.34, d.k);
  const eyeSx = look.eyes === "almond" ? 1.2 : 1;
  const eyeSy = look.eyes === "almond" ? 0.86 : look.eyes === "smile" ? 0.95 : 1.15;
  const shoe = look.shoes ? FASHION_MAP[look.shoes]?.color ?? "#ef9ab0" : "#ef9ab0";
  const makeup = look.makeup ? FASHION_MAP[look.makeup]?.color ?? "#f7b3bd" : "#f7b3bd";
  const nail = look.nail ? FASHION_MAP[look.nail]?.color : null;
  const gold = "#d8b468";

  return (
    <group ref={root} scale={look.height ?? 1}>
      {/* ── 다리 ── */}
      {[-1, 1].map((s) => (
        <group key={s} ref={s < 0 ? legL : legR} position={[s * hip, d.leg, 0]}>
          {pantsColor ? (
            <mesh position={[0, -d.leg / 2, 0]} castShadow>
              <cylinderGeometry args={[d.limb * 1.25, d.limb * 1.0, d.leg, 12]} />
              <meshStandardMaterial color={pantsColor} roughness={0.7} />
            </mesh>
          ) : (
            <mesh position={[0, -d.leg / 2, 0]} castShadow material={skinMat}>
              <cylinderGeometry args={[d.limb * 1.05, d.limb * 0.8, d.leg, 12]} />
            </mesh>
          )}
          <Model url="./models/char_shoe.glb" position={[0, -d.leg, 0]} scale={[s * d.limb, d.limb, d.limb]} tint={{ shoe: { color: shoe } }}
            fallback={
              <mesh position={[0, 0.5, 0.45]} scale={[1, 0.7, 1.55]} castShadow>
                <sphereGeometry args={[1.15, 14, 10]} />
                <meshStandardMaterial color={shoe} roughness={0.35} metalness={shoe === gold ? 0.6 : 0} />
              </mesh>
            } />
        </group>
      ))}

      <group ref={upper}>
        {/* ── 의상: 스커트 + 보디스 ── */}
        <mesh position={[0, waistY - skirt.len / 2, 0]} castShadow>
          <cylinderGeometry args={[waistR, skirt.r, skirt.len, 28, 1, cut !== "sheath"]} />
          <meshStandardMaterial color={col} roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
        {(cut === "puff" || cut === "aline" || cut === "gown") && (
          <Model url="./models/char_hem.glb" position={[0, waistY - skirt.len + 0.012, 0]} scale={[skirt.r, skirt.r * 1.3, skirt.r]} tint={{ accent: { color: acc } }}
            fallback={
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.995, 0.05, 8, 40]} />
                <meshStandardMaterial color={acc} roughness={0.4} />
              </mesh>
            } />
        )}
        <mesh position={[0, (waistY + topY) / 2, 0]} castShadow>
          <cylinderGeometry args={[chestR, waistR, topY - waistY, 24]} />
          <meshStandardMaterial color={col} roughness={0.6} />
        </mesh>
        <mesh position={[0, topY, 0]} scale={[1, 0.5, 0.92]}>
          <sphereGeometry args={[chestR, 20, 12]} />
          <meshStandardMaterial color={cut === "gown" ? look.skin : col} roughness={0.6} />
        </mesh>
        {/* 벨트 / 리본 포인트 */}
        <mesh position={[0, waistY, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[waistR * 1.02, 0.014 + d.k * 0.004, 8, 28]} />
          <meshStandardMaterial color={stage >= 4 ? gold : acc} metalness={stage >= 4 ? 0.75 : 0} roughness={0.3} />
        </mesh>
        {cut !== "gown" && cut !== "sheath" && (
          <Model url="./models/char_bow.glb" position={[0, topY - 0.035, chestR * 0.98]} scale={0.05 + d.k * 0.008} tint={{ accent: { color: acc } }}
            fallback={
              <mesh scale={[1, 0.6, 0.3]}>
                <sphereGeometry args={[0.9, 10, 8]} />
                <meshStandardMaterial color={acc} />
              </mesh>
            } />
        )}

        {/* ── 팔 ── */}
        {[-1, 1].map((s) => (
          <group key={s} ref={s < 0 ? armL : armR} position={[s * (chestR + d.limb * 0.55), topY - 0.02, 0]}>
            {(cut === "puff" || cut === "aline") && (
              <mesh castShadow scale={[1, 0.85, 1]}>
                <sphereGeometry args={[d.limb * 1.55, 14, 10]} />
                <meshStandardMaterial color={col} roughness={0.6} />
              </mesh>
            )}
            {(cut === "sheath" || cut === "pants") && (
              <mesh position={[0, -d.arm * 0.22, 0]} castShadow>
                <cylinderGeometry args={[d.limb * 0.98, d.limb * 0.9, d.arm * 0.5, 10]} />
                <meshStandardMaterial color={col} roughness={0.6} />
              </mesh>
            )}
            <mesh position={[0, -d.arm / 2, 0]} castShadow material={skinMat}>
              <cylinderGeometry args={[d.limb * 0.86, d.limb * 0.7, d.arm, 10]} />
            </mesh>
            <Model url="./models/char_hand.glb" position={[0, -d.arm + d.limb * 0.5, 0]} scale={[-s * d.limb * 0.8, d.limb * 0.8, d.limb * 0.8]} materials={skinMats}
              fallback={
                <mesh position={[0, -0.6, 0]} castShadow material={skinMat}>
                  <sphereGeometry args={[1.2, 12, 10]} />
                </mesh>
              } />
            {nail && (
              <mesh position={[0, -d.arm - d.limb * 0.7, d.limb * 0.3]}>
                <sphereGeometry args={[d.limb * 0.42, 8, 6]} />
                <meshStandardMaterial color={nail} metalness={nail === gold ? 0.7 : 0.1} roughness={0.25} />
              </mesh>
            )}
            {look.bag && s > 0 && (
              <group position={[0.02, -d.arm - 0.06, 0]}>
                <mesh castShadow>
                  <boxGeometry args={[0.05, 0.11 + d.k * 0.05, 0.16 + d.k * 0.05]} />
                  <meshStandardMaterial color={FASHION_MAP[look.bag]?.color ?? "#f29bb1"} roughness={0.4} />
                </mesh>
                <mesh position={[0, 0.08, 0]} rotation={[0, Math.PI / 2, 0]}>
                  <torusGeometry args={[0.05, 0.008, 6, 16, Math.PI]} />
                  <meshStandardMaterial color={gold} metalness={0.7} roughness={0.3} />
                </mesh>
              </group>
            )}
          </group>
        ))}

        {/* ── 목 ── */}
        {d.neck > 0.005 && (
          <mesh position={[0, topY + d.neck / 2, 0]} material={skinMat}>
            <cylinderGeometry args={[d.limb * 0.85, d.limb * 0.95, d.neck + 0.06, 12]} />
          </mesh>
        )}
        {look.necklace && (
          <mesh position={[0, topY + 0.012, 0.01]} rotation={[Math.PI / 2 - 0.25, 0, 0]}>
            <torusGeometry args={[d.limb * 1.5, 0.008, 6, 24]} />
            <meshStandardMaterial color={FASHION_MAP[look.necklace]?.color ?? gold} metalness={0.6} roughness={0.25} />
          </mesh>
        )}

        {/* ── 등급 장식 (게임 연출) ── */}
        {rk && (
          <group position={[d.shoulder * 0.45, waistY + (topY - waistY) * (rank >= 3 ? 0.38 : 0.72), chestR * 0.98]}>
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <octahedronGeometry args={[0.03 + rank * 0.0015]} />
              <meshStandardMaterial color={rankCol} metalness={0.5} roughness={0.15} emissive={rk.color} emissiveIntensity={0.45} />
            </mesh>
            <mesh>
              <torusGeometry args={[0.042 + rank * 0.0015, 0.007, 6, 20]} />
              <meshStandardMaterial color={gold} metalness={0.8} roughness={0.25} />
            </mesh>
          </group>
        )}
        {rank >= 3 && (
          <group position={[0, topY - d.torso * 0.11, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[d.shoulder * 0.9, d.shoulder * 1.34, d.torso * 0.3, 24, 1, true]} />
              <meshStandardMaterial color={rankCol} roughness={0.55} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, -d.torso * 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[d.shoulder * 1.34, 0.008, 6, 32]} />
              <meshStandardMaterial color={gold} metalness={0.8} roughness={0.25} />
            </mesh>
          </group>
        )}
        {rank >= 5 && anim !== "lie" && (() => {
          const len = rank >= 9 ? topY - 0.05 : topY - d.leg * 0.55;
          return (
            <mesh castShadow position={[0, topY - d.torso * 0.08 - len / 2, -d.shoulder * 0.3]} rotation={[0.1, 0, 0]}>
              <cylinderGeometry args={[d.shoulder * 1.1, d.shoulder * (rank >= 9 ? 2.1 : 1.6), len, 20, 1, true, Math.PI / 2, Math.PI]} />
              <meshStandardMaterial color={rankCol} roughness={0.6} side={THREE.DoubleSide} emissive={rk!.color} emissiveIntensity={0.06} />
            </mesh>
          );
        })()}

        {/* ── 머리 ── */}
        <group ref={headG} position={[0, d.headY, 0]}>
          <Model url="./models/char_head.glb" scale={[R * faceW, R * faceH, R * 0.98]} materials={skinMats}
            fallback={<mesh castShadow material={skinMat}><sphereGeometry args={[1, 36, 28]} /></mesh>} />
          <mesh visible={false}>
            <sphereGeometry args={[R, 4, 4]} />
          </mesh>
          {/* 귀 + 귀걸이 */}
          {[-1, 1].map((s) => (
            <group key={s} position={[s * R * faceW * 0.97, -R * 0.08, 0]}>
              <mesh material={skinMat} scale={[0.5, 1, 0.8]}>
                <sphereGeometry args={[R * 0.15, 10, 8]} />
              </mesh>
              {look.earring && (
                <mesh position={[s * 0.01, -R * 0.24, 0]}>
                  <sphereGeometry args={[R * 0.075, 10, 8]} />
                  <meshStandardMaterial color={FASHION_MAP[look.earring]?.color ?? gold} metalness={0.6} roughness={0.2} />
                </mesh>
              )}
            </group>
          ))}
          {/* 눈: 구면에 접하는 원판 레이어 (아웃라인 → 흰자 → 홍채 → 동공 → 하이라이트) */}
          <group ref={eyes} position={[0, eyeY, 0]}>
            {[-1, 1].map((s) => (
              <group key={s} position={[s * eyeX, 0, R * 0.925]} rotation={[0.06, s * 0.4, look.eyes === "almond" ? -s * 0.14 : 0]} scale={[eyeSx, eyeSy, 1]}>
                <mesh position={[0, eyeR * 0.06, 0]} scale={[1.07 + d.k * 0.12, 1.07, 1]}>
                  <circleGeometry args={[eyeR, 28]} />
                  <meshBasicMaterial color="#2a1c18" />
                </mesh>
                <mesh position={[0, 0, 0.002]} scale={[1 + d.k * 0.12, 1, 1]}>
                  <circleGeometry args={[eyeR * 0.97, 28]} />
                  <meshBasicMaterial color="#fffaf6" />
                </mesh>
                <mesh position={[0, -eyeR * 0.02, 0.004]}>
                  <circleGeometry args={[eyeR * lerp(0.95, 0.74, d.k), 28]} />
                  <meshBasicMaterial color={look.eyeColor} />
                </mesh>
                <mesh position={[0, -eyeR * 0.18, 0.005]}>
                  <circleGeometry args={[eyeR * lerp(0.7, 0.5, d.k), 24, Math.PI, Math.PI]} />
                  <meshBasicMaterial color="#ffffff" transparent opacity={0.28} />
                </mesh>
                <mesh position={[0, 0, 0.006]}>
                  <circleGeometry args={[eyeR * lerp(0.44, 0.34, d.k), 20]} />
                  <meshBasicMaterial color="#17100e" />
                </mesh>
                <mesh position={[eyeR * 0.3, eyeR * 0.34, 0.008]}>
                  <circleGeometry args={[eyeR * 0.24, 14]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
                <mesh position={[-eyeR * 0.32, -eyeR * 0.36, 0.008]}>
                  <circleGeometry args={[eyeR * 0.11, 12]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
                {/* 등급 뷰티 연출: 아이섀도 → 속눈썹 → 홍채 광채 → 별빛 하이라이트 */}
                {rank >= 1 && (
                  <mesh position={[0, eyeR * 0.5, -0.001]} scale={[1.3, 1.15, 1]}>
                    <circleGeometry args={[eyeR * 1.02, 24, 0, Math.PI]} />
                    <meshBasicMaterial color={rk!.n === 10 ? "#c9a66b" : rk!.color} transparent opacity={0.35 + beauty * 0.45} depthWrite={false} />
                  </mesh>
                )}
                {rank >= 1 && (
                  <mesh position={[0, eyeR * 0.1, 0.007]} scale={[1.1 + d.k * 0.12, 1.08, 1]}>
                    <ringGeometry args={[eyeR * 0.97, eyeR * (1.1 + beauty * 0.2), 28, 1, 0.1, Math.PI - 0.2]} />
                    <meshBasicMaterial color="#1c1210" />
                  </mesh>
                )}
                {rank >= 1 && Array.from({ length: rank >= 6 ? 5 : rank >= 3 ? 4 : 2 }, (_, i) => {
                  const a = (s > 0 ? 0.25 : Math.PI - 0.25) + (s > 0 ? 1 : -1) * i * 0.28;
                  return (
                    <mesh key={i} position={[Math.cos(a) * eyeR * 1.2, Math.sin(a) * eyeR * 1.2 + eyeR * 0.1, 0.007]} rotation={[0, 0, a - Math.PI / 2]}>
                      <coneGeometry args={[eyeR * 0.09, eyeR * (0.3 + beauty * 0.4), 4]} />
                      <meshBasicMaterial color="#1c1210" />
                    </mesh>
                  );
                })}
                {rank >= 3 && (
                  <mesh position={[0, -eyeR * 0.3, 0.0055]}>
                    <ringGeometry args={[eyeR * 0.38, eyeR * 0.6, 24, 1, Math.PI * 1.15, Math.PI * 0.7]} />
                    <meshBasicMaterial color="#fff6d8" transparent opacity={0.5 + beauty * 0.4} />
                  </mesh>
                )}
                {rank >= 5 && (
                  <mesh position={[-eyeR * 0.05, eyeR * 0.05, 0.009]} rotation={[0, 0, Math.PI / 4]}>
                    <circleGeometry args={[eyeR * (0.12 + beauty * 0.08), 4]} />
                    <meshBasicMaterial color="#fffbe6" />
                  </mesh>
                )}
              </group>
            ))}
          </group>
          {/* 눈썹 */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * eyeX, eyeY + eyeR * (1.75 + d.k * 0.2), R * 0.9]} rotation={[0, s * 0.3, s * (look.brows === "arch" ? -0.22 : look.brows === "straight" ? 0 : 0.12)]}>
              <boxGeometry args={[eyeR * 1.5, eyeR * 0.16, 0.008]} />
              <meshStandardMaterial color={look.hairColor} roughness={0.8} />
            </mesh>
          ))}
          {/* 코 (성장할수록 또렷) */}
          <mesh position={[0, -R * 0.2, R * (0.97 + d.k * 0.03)]} scale={[1, 1, 0.7 + d.k * 0.5]} material={skinMat}>
            <sphereGeometry args={[R * 0.04, 8, 8]} />
          </mesh>
          {/* 입 */}
          <mesh position={[0, -R * (0.36 + d.k * 0.06), R * 0.9]} rotation={[0.25, 0, Math.PI]} scale={[1, mood === "happy" ? 1.3 : 1, 1]}>
            <torusGeometry args={[R * (0.11 - d.k * 0.015), R * (0.022 + d.k * 0.012) * (1 + beauty * 0.9), 8, 16, Math.PI]} />
            <meshStandardMaterial color={look.lipColor} roughness={0.35 - beauty * 0.25} emissive={look.lipColor} emissiveIntensity={beauty * 0.25} />
          </mesh>
          {/* 윗입술 (큐피드 보우) */}
          {rank >= 2 && [-1, 1].map((s) => (
            <mesh key={s} position={[s * R * 0.035, -R * (0.345 + d.k * 0.06), R * 0.915]} scale={[1.5, 0.75, 0.6]}>
              <sphereGeometry args={[R * (0.022 + beauty * 0.014), 10, 8]} />
              <meshStandardMaterial color={look.lipColor} roughness={0.35 - beauty * 0.25} emissive={look.lipColor} emissiveIntensity={beauty * 0.25} />
            </mesh>
          ))}
          {rank >= 2 && (
            <mesh position={[R * 0.025, -R * (0.385 + d.k * 0.06), R * 0.925]}>
              <sphereGeometry args={[R * 0.012, 6, 6]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
            </mesh>
          )}
          {/* 광대 하이라이트 · 뷰티 젬 */}
          {rank >= 3 && [-1, 1].map((s) => (
            <mesh key={s} position={[s * R * 0.5, -R * 0.12, R * 0.84]} rotation={[0, s * 0.55, s * 0.5]} scale={[1.6, 0.6, 1]}>
              <circleGeometry args={[R * 0.07, 14]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.25 + beauty * 0.25} depthWrite={false} />
            </mesh>
          ))}
          {rank >= 6 && (
            <mesh position={[R * 0.5, -R * 0.02, R * 0.86]} rotation={[0, 0.5, Math.PI / 4]}>
              <octahedronGeometry args={[R * 0.028]} />
              <meshStandardMaterial color="#fff2c8" emissive="#ffd98a" emissiveIntensity={0.9} metalness={0.5} roughness={0.1} />
            </mesh>
          )}
          {/* 블러셔 */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * R * 0.56, -R * 0.24, R * 0.79]} rotation={[0.1, s * 0.62, 0]}>
              <circleGeometry args={[R * (0.17 - d.k * 0.03) * (1 + beauty * 0.25), 18]} />
              <meshBasicMaterial color={makeup} transparent opacity={0.42 + glow * 0.15 + beauty * 0.3} depthWrite={false} />
            </mesh>
          ))}

          <Hair style={look.hair} R={R} mat={hairMat} swayRef={sway} k={d.k} bodyLen={d.torso + d.neck} />
          <HeadAccessory id={look.accessory} R={R} />
          {rank >= 7 && (
            <group position={[0, R * (rank >= 9 ? 1.16 : 1.1), 0]} scale={1.25}>
              <mesh>
                <cylinderGeometry args={[R * 0.34, R * 0.3, R * (rank >= 9 ? 0.22 : 0.1), 16, 1, true]} />
                <meshStandardMaterial color={gold} metalness={0.6} roughness={0.3} emissive="#b8893a" emissiveIntensity={0.45} side={THREE.DoubleSide} />
              </mesh>
              {Array.from({ length: rank >= 9 ? 8 : 5 }, (_, i) => {
                const n = rank >= 9 ? 8 : 5, a = (i / n) * Math.PI * 2;
                return (
                  <mesh key={i} position={[Math.sin(a) * R * 0.33, R * (rank >= 9 ? 0.2 : 0.11), Math.cos(a) * R * 0.33]}>
                    <coneGeometry args={[R * 0.06, R * (rank >= 9 ? 0.2 : 0.13), 6]} />
                    <meshStandardMaterial color={i % 2 ? gold : "#fff2c8"} metalness={0.85} roughness={0.15} emissive="#ffd98a" emissiveIntensity={0.4} />
                  </mesh>
                );
              })}
              {rank >= 9 && (
                <mesh position={[0, R * 0.02, R * 0.33]}>
                  <octahedronGeometry args={[R * 0.07]} />
                  <meshStandardMaterial color={rk!.color} emissive={rk!.color} emissiveIntensity={0.8} metalness={0.4} roughness={0.1} />
                </mesh>
              )}
            </group>
          )}
        </group>
      </group>

      {rank >= 9 && anim !== "lie" && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[d.shoulder * 2.6, d.shoulder * 2.9, 40]} />
          <meshBasicMaterial color="#ffe2a0" transparent opacity={0.55} depthWrite={false} />
        </mesh>
      )}
      {rank >= 7 && !(sparkle || stage >= 5) && (
        <Sparkles count={14} scale={[d.shoulder * 5, d.height, d.shoulder * 5]} position={[0, d.height / 2, 0]} size={2} speed={0.4} color="#ffe2a0" opacity={0.8} />
      )}
      {(sparkle || stage >= 5) && (
        <Sparkles count={stage >= 5 ? 26 : 16} scale={[d.shoulder * 6, d.height * 1.05, d.shoulder * 6]} position={[0, d.height / 2, 0]} size={2.4} speed={0.5} color={stage >= 4 ? "#ffe2a0" : "#ffc7d6"} opacity={0.9} />
      )}
    </group>
  );
}

function Hair({ style, R, mat, swayRef, k, bodyLen }: { style: string; R: number; mat: THREE.Material; swayRef: React.RefObject<THREE.Group>; k: number; bodyLen: number }) {
  const mats = useMemo(() => ({ hair: mat }), [mat]);
  // 얼굴이 보이도록 앞쪽 일부가 열린 쉘
  const shell = (len: number, key = "s") => (
    <mesh key={key} material={mat} castShadow>
      <sphereGeometry args={[R * 1.09, 28, 20, Math.PI - 0.72, Math.PI + 1.44, 0, Math.PI * len]} />
    </mesh>
  );
  const cap = (
    <mesh material={mat} position={[0, R * 0.03, -R * 0.02]} castShadow>
      <sphereGeometry args={[R * 1.1, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.3]} />
    </mesh>
  );
  const bangs = [-0.5, -0.17, 0.17, 0.5].map((x, i) => (
    <mesh key={i} material={mat} position={[x * R, R * (0.62 - Math.abs(x) * 0.18), R * (0.78 - Math.abs(x) * 0.22)]} rotation={[0.5, 0, -x * 0.9]} scale={[0.9, 1.15, 0.5]}>
      <sphereGeometry args={[R * 0.34, 12, 10]} />
    </mesh>
  ));
  const side = (len: number) => [-1, 1].map((s) => (
    <mesh key={s} material={mat} position={[s * R * 0.98, -R * len * 0.5, R * 0.18]} scale={[0.5, 1, 0.75]}>
      <capsuleGeometry args={[R * 0.26, R * len, 4, 10]} />
    </mesh>
  ));
  const chain = (n: number, r0: number, step: [number, number, number], key: string | number) => (
    <group key={key}>
      {Array.from({ length: n }).map((_, i) => (
        <mesh key={i} material={mat} position={[step[0] * i, step[1] * i, step[2] * i]} castShadow>
          <sphereGeometry args={[r0 * (1 - (i / n) * 0.45), 12, 10]} />
        </mesh>
      ))}
    </group>
  );
  const longLen = R * 1.3 + bodyLen * (0.75 + k * 0.2);

  let extra: React.ReactNode = null;
  let back = shell(0.72);
  switch (style) {
    case "hair-twin":
      back = shell(0.6);
      extra = [-1, 1].map((s) => (
        <group key={s} position={[s * R * 1.05, R * 0.25, -R * 0.1]} rotation={[0, 0, s * 0.35]}>
          {chain(4, R * 0.4, [0, -R * 0.5, 0], s)}
        </group>
      ));
      break;
    case "hair-bun":
      back = shell(0.58);
      extra = (
        <mesh material={mat} position={[0, R * 1.12, -R * 0.2]} castShadow>
          <sphereGeometry args={[R * 0.44, 16, 12]} />
        </mesh>
      );
      break;
    case "hair-pony":
      back = shell(0.56);
      extra = <group position={[0, R * 0.75, -R * 0.95]} rotation={[-0.5, 0, 0]}>{chain(5, R * 0.36, [0, -R * 0.46, -R * 0.08], "p")}</group>;
      break;
    case "hair-long":
      back = shell(0.78);
      extra = (
        <>
          <mesh material={mat} position={[0, -longLen / 2, -R * 0.52]} scale={[1, 1, 0.42]} castShadow>
            <capsuleGeometry args={[R * 0.92, longLen, 4, 14]} />
          </mesh>
          {side(1.5)}
        </>
      );
      break;
    case "hair-wave":
      back = shell(0.78);
      extra = (
        <>
          <mesh material={mat} position={[0, -longLen * 0.4, -R * 0.5]} scale={[1.05, 1, 0.45]} castShadow>
            <capsuleGeometry args={[R * 0.9, longLen * 0.8, 4, 14]} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * R * 0.98, -R * 0.2, R * 0.1]}>
              {Array.from({ length: 5 }).map((_, i) => (
                <mesh key={i} material={mat} position={[s * Math.sin(i * 1.6) * R * 0.16, -i * R * 0.42, Math.cos(i * 1.6) * R * 0.1]}>
                  <sphereGeometry args={[R * (0.32 - i * 0.025), 12, 10]} />
                </mesh>
              ))}
            </group>
          ))}
        </>
      );
      break;
    case "hair-updo":
      back = shell(0.6);
      extra = (
        <>
          <mesh material={mat} position={[0, R * 0.55, -R * 0.95]} scale={[1.15, 0.95, 0.9]} castShadow>
            <sphereGeometry args={[R * 0.52, 16, 12]} />
          </mesh>
          <mesh position={[0, R * 0.55, -R * 0.95]} rotation={[0.9, 0, 0]}>
            <torusGeometry args={[R * 0.5, 0.01, 6, 24]} />
            <meshStandardMaterial color="#d8b468" metalness={0.75} roughness={0.25} />
          </mesh>
          {side(0.9)}
        </>
      );
      break;
    case "hair-pixie":
      back = shell(0.5);
      break;
    case "hair-space":
      back = shell(0.56);
      extra = [-1, 1].map((s) => (
        <mesh key={s} material={mat} position={[s * R * 0.62, R * 0.98, -R * 0.05]} castShadow>
          <sphereGeometry args={[R * 0.34, 14, 12]} />
        </mesh>
      ));
      break;
    case "hair-braid":
      back = shell(0.6);
      extra = (
        <group position={[R * 0.92, -R * 0.15, R * 0.2]} rotation={[0.15, 0, -0.08]}>
          {chain(7, R * 0.27, [0, -R * 0.36, R * 0.02], "b")}
          <mesh position={[0, -R * 2.5, R * 0.14]}><sphereGeometry args={[R * 0.1, 8, 8]} /><meshStandardMaterial color="#ef86a8" /></mesh>
        </group>
      );
      break;
    case "hair-hime":
      back = shell(0.8);
      extra = (
        <>
          <mesh material={mat} position={[0, -longLen / 2, -R * 0.52]} scale={[1.02, 1, 0.4]} castShadow>
            <capsuleGeometry args={[R * 0.94, longLen, 4, 14]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} material={mat} position={[s * R * 0.9, -R * 0.35, R * 0.42]} castShadow>
              <boxGeometry args={[R * 0.3, R * 1.1, R * 0.34]} />
            </mesh>
          ))}
        </>
      );
      break;
    default:
      back = shell(0.74);
  }
  // Blender 로 만든 헤어 (tools/blender/build_assets.py). 못 불러오면 위의 코드 형상이 대신 보인다.
  const id = HAIR_MODELS.includes(style) ? style.replace("hair-", "") : "bob";
  const swaying = HAIR_SWAY.includes(id);
  const long = id === "long" || id === "wave" || id === "hime";
  return (
    <group>
      <Model url={`./models/hair_${id}.glb`} scale={R} materials={mats} fallback={<group scale={1 / R}>{cap}{back}{bangs}{!swaying && extra}</group>} />
      <group ref={swayRef}>
        {swaying && <Model url={`./models/hair_${id}_sway.glb`} scale={long ? [R, longLen, R] : R} materials={mats} fallback={<group scale={long ? [1 / R, 1 / longLen, 1 / R] : 1 / R}>{extra}</group>} />}
      </group>
    </group>
  );
}
const HAIR_MODELS = ["hair-bob", "hair-pixie", "hair-twin", "hair-bun", "hair-space", "hair-pony", "hair-updo", "hair-braid", "hair-long", "hair-wave", "hair-hime"];
const HAIR_SWAY = ["twin", "pony", "braid", "long", "wave", "hime"];

function HeadAccessory({ id, R }: { id: string | null; R: number }) {
  if (!id) return null;
  const c = FASHION_MAP[id]?.color ?? "#ef86a8";
  if (id === "acc-ribbon")
    return (
      <group position={[R * 0.55, R * 0.98, R * 0.25]} rotation={[0, 0, -0.5]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * R * 0.2, 0, 0]} rotation={[0, 0, (s * Math.PI) / 2]} castShadow>
            <coneGeometry args={[R * 0.2, R * 0.36, 12]} />
            <meshStandardMaterial color={c} roughness={0.5} />
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[R * 0.09, 10, 8]} />
          <meshStandardMaterial color={c} roughness={0.5} />
        </mesh>
      </group>
    );
  if (id === "acc-flower")
    return (
      <group position={[R * 0.72, R * 0.72, R * 0.42]} rotation={[0.4, 0.6, 0]}>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={i} position={[Math.cos((i / 5) * Math.PI * 2) * R * 0.13, Math.sin((i / 5) * Math.PI * 2) * R * 0.13, 0]} scale={[1, 1, 0.5]}>
            <sphereGeometry args={[R * 0.1, 10, 8]} />
            <meshStandardMaterial color={c} roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 0, R * 0.03]}>
          <sphereGeometry args={[R * 0.07, 8, 8]} />
          <meshStandardMaterial color="#f4c84a" />
        </mesh>
      </group>
    );
  if (id === "acc-beret")
    return (
      <group position={[R * 0.12, R * 1.0, 0]} rotation={[0.1, 0, -0.28]}>
        <mesh scale={[1, 0.36, 1]} castShadow>
          <sphereGeometry args={[R * 0.95, 20, 12]} />
          <meshStandardMaterial color={c} roughness={0.85} />
        </mesh>
        <mesh position={[0, R * 0.36, 0]}>
          <sphereGeometry args={[R * 0.07, 8, 8]} />
          <meshStandardMaterial color={c} />
        </mesh>
      </group>
    );
  if (id === "acc-tiara")
    return (
      <group position={[0, R * 0.92, R * 0.35]} rotation={[-0.35, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, Math.PI]}>
          <torusGeometry args={[R * 0.62, R * 0.035, 8, 24, Math.PI]} />
          <meshStandardMaterial color={c} metalness={0.85} roughness={0.2} />
        </mesh>
        {[-0.3, 0, 0.3].map((x) => (
          <mesh key={x} position={[x * R, R * (0.12 - Math.abs(x) * 0.2), R * (0.6 - Math.abs(x) * 0.25)]}>
            <octahedronGeometry args={[R * (x === 0 ? 0.11 : 0.07)]} />
            <meshStandardMaterial color="#fff2c8" metalness={0.6} roughness={0.1} emissive="#ffd98a" emissiveIntensity={0.5} />
          </mesh>
        ))}
      </group>
    );
  if (id === "acc-headband")
    return (
      <mesh position={[0, R * 0.12, R * 0.12]} rotation={[0.25, 0, 0]}>
        <torusGeometry args={[R * 1.1, R * 0.06, 8, 32, Math.PI]} />
        <meshStandardMaterial color={c} roughness={0.35} />
      </mesh>
    );
  if (id === "acc-glasses")
    return (
      <group position={[0, -R * 0.04, R * 0.97]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * R * 0.37, 0, -Math.abs(s) * R * 0.03]} rotation={[0, s * 0.35, 0]}>
            <torusGeometry args={[R * 0.25, R * 0.022, 8, 24]} />
            <meshStandardMaterial color={c} metalness={0.8} roughness={0.25} />
          </mesh>
        ))}
        <mesh position={[0, R * 0.02, R * 0.02]}><boxGeometry args={[R * 0.24, R * 0.03, R * 0.03]} /><meshStandardMaterial color={c} metalness={0.8} roughness={0.25} /></mesh>
      </group>
    );
  if (id === "acc-cap")
    return (
      <group position={[0, R * 0.36, 0]} rotation={[-0.12, 0, 0]}>
        <mesh castShadow><sphereGeometry args={[R * 1.14, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.42]} /><meshStandardMaterial color={c} roughness={0.8} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, R * 0.28, R * 1.2]} rotation={[0.12, 0, 0]} scale={[1, 0.08, 0.8]} castShadow><sphereGeometry args={[R * 0.7, 16, 8]} /><meshStandardMaterial color={c} roughness={0.8} /></mesh>
      </group>
    );
  return null;
}
