/** 라운지 펫 (고양이·강아지): 프로시저럴 모델 + 배회 AI. 쓰다듬으면 하트가 올라온다. */
import { useEffect, useMemo, useRef, useState } from "react";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { makeGLTFLoader } from "./gltf";
import { createPortal, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { PET_MAP, type PetType } from "../data/game";
import { PET_ACC_MAP, type PetAcc } from "../data/pets";
import type { Pet } from "../store/game";
import { input } from "../store/ui";
import type { Layout } from "./layout";

/** 근접 판정·쓰다듬기 연출 공유 */
export const petPos: Record<string, { x: number; z: number }> = {};
export const petFx: Record<string, number> = {};

/** 펫 머리 장식 (머리 꼭대기 기준, 머리 반지름 약 0.13 크기에 맞춤) */
export function PetAccMesh({ acc }: { acc: PetAcc }) {
  const m = (c: string, metal = 0) => <meshStandardMaterial color={c} roughness={metal ? 0.3 : 0.6} metalness={metal} />;
  if (acc.shape === "ribbon") return (
    <group position={[0.06, -0.01, 0.02]} rotation={[0, 0, -0.35]}>
      <mesh>{<sphereGeometry args={[0.022, 10, 8]} />}{m(acc.color)}</mesh>
      {[-1, 1].map((k) => <mesh key={k} position={[k * 0.04, 0, 0]} rotation={[0, 0, k * Math.PI / 2]} scale={[1, 1, 0.45]}><coneGeometry args={[0.032, 0.06, 12]} />{m(acc.color)}</mesh>)}
    </group>
  );
  if (acc.shape === "star") return (
    <group position={[0.065, 0, 0.03]} rotation={[0, 0.3, -0.3]}>
      <mesh scale={[1, 1, 0.35]}><octahedronGeometry args={[0.035]} />{m(acc.color, 0.4)}</mesh>
      <mesh scale={[0.6, 0.6, 0.4]} position={[0, 0, 0.004]}><octahedronGeometry args={[0.035]} />{m(acc.accent)}</mesh>
    </group>
  );
  if (acc.shape === "party") return (
    <group position={[0.01, 0.06, 0]} rotation={[0, 0, -0.18]}>
      <mesh><coneGeometry args={[0.05, 0.14, 16]} />{m(acc.color)}</mesh>
      <mesh position={[0, -0.03, 0]}><torusGeometry args={[0.04, 0.006, 6, 16]} />{m(acc.accent)}</mesh>
      <mesh position={[0, 0.075, 0]}><sphereGeometry args={[0.018, 8, 8]} />{m(acc.accent)}</mesh>
    </group>
  );
  if (acc.shape === "flowers") return (
    <group position={[0, -0.005, 0]} rotation={[0.12, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.065, 0.009, 6, 24]} />{m(acc.color)}</mesh>
      {Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * 0.065, 0.008, Math.sin(a) * 0.065]}><sphereGeometry args={[0.016, 8, 6]} />{m(i % 2 ? "#fff3c2" : acc.accent)}</mesh>; })}
    </group>
  );
  return ( // crown
    <group position={[0, 0.02, 0]}>
      <mesh><cylinderGeometry args={[0.055, 0.05, 0.04, 16, 1, true]} /><meshStandardMaterial color={acc.color} metalness={0.8} roughness={0.25} side={THREE.DoubleSide} /></mesh>
      {Array.from({ length: 5 }, (_, i) => { const a = (i / 5) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * 0.052, 0.035, Math.sin(a) * 0.052]}><coneGeometry args={[0.012, 0.03, 6]} />{m(acc.color, 0.8)}</mesh>; })}
      <mesh position={[0, 0.005, 0.054]}><sphereGeometry args={[0.009, 8, 6]} /><meshStandardMaterial color="#e2718d" roughness={0.2} /></mesh>
    </group>
  );
}

export function PetModel({ t, walking, acc }: { t: PetType; walking?: { current: boolean }; acc?: PetAcc | null }) {
  const tail = useRef<THREE.Group>(null!);
  const legs = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const bunny = t.kind === "rabbit";
  const cat = t.kind === "cat" || bunny; // 토끼는 얼굴(분홍 코·작은 주둥이)을 고양이와 같이 쓴다
  const root = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const e = clock.elapsedTime;
    const w = walking?.current;
    if (tail.current) tail.current.rotation.z = Math.sin(e * (cat ? 2 : 9)) * (cat ? 0.35 : 0.6);
    if (legs.current) legs.current.children.forEach((l, i) => { l.rotation.x = w ? Math.sin(e * 12 + (i % 2 ? Math.PI : 0)) * 0.6 : 0; });
    if (head.current) head.current.rotation.z = w ? 0 : Math.sin(e * 0.9) * 0.12;
    if (root.current && bunny) root.current.position.y = w ? Math.abs(Math.sin(e * 10)) * 0.07 : 0; // 깡충깡충
  });
  const fur = <meshStandardMaterial color={t.color} roughness={0.9} />;
  const fur2 = <meshStandardMaterial color={t.accent} roughness={0.9} />;
  const s = bunny ? 0.85 : cat ? 1 : 1.12;
  return (
    <group ref={root} scale={s}>
      <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><capsuleGeometry args={[0.105, 0.2, 6, 14]} />{fur}</mesh>
      <mesh position={[0, 0.16, 0.06]} scale={[0.8, 0.5, 1]}><sphereGeometry args={[0.1, 12, 10]} />{fur2}</mesh>
      <group ref={legs}>
        {[[-0.07, 0.13], [0.07, 0.13], [-0.07, -0.13], [0.07, -0.13]].map(([x, z], i) => (
          <group key={i} position={[x, 0.13, z]}>
            <mesh position={[0, -0.065, 0]} castShadow><cylinderGeometry args={[0.03, 0.028, 0.13, 8]} />{i < 2 ? fur2 : fur}</mesh>
          </group>
        ))}
      </group>
      <group ref={head} position={[0, 0.32, 0.2]}>
        <mesh castShadow scale={[1.08, 0.95, 0.95]}><sphereGeometry args={[0.13, 18, 14]} />{fur}</mesh>
        {acc && <group position={[0, 0.12, 0]}><PetAccMesh acc={acc} /></group>}
        <mesh position={[0, -0.035, 0.1]} scale={[1, 0.7, 0.8]}><sphereGeometry args={[cat ? 0.05 : 0.065, 10, 8]} />{fur2}</mesh>
        <mesh position={[0, -0.02, cat ? 0.142 : 0.16]}><sphereGeometry args={[0.016, 8, 8]} /><meshStandardMaterial color={cat ? "#e58aa0" : "#2a2224"} roughness={0.4} /></mesh>
        {[-1, 1].map((k) => (
          <group key={k}>
            <mesh position={[k * 0.05, 0.025, 0.112]}><sphereGeometry args={[0.02, 10, 8]} /><meshStandardMaterial color="#1d1718" roughness={0.2} /></mesh>
            <mesh position={[k * 0.045, 0.033, 0.13]}><sphereGeometry args={[0.006, 6, 6]} /><meshBasicMaterial color="#ffffff" /></mesh>
            {bunny ? (
              <mesh position={[k * 0.05, 0.2, -0.02]} rotation={[-0.15, 0, -k * 0.12]} scale={[1, 1, 0.55]} castShadow><capsuleGeometry args={[0.032, 0.17, 4, 10]} />{fur}</mesh>
            ) : cat ? (
              <mesh position={[k * 0.075, 0.125, 0]} rotation={[0, 0, -k * 0.25]} castShadow><coneGeometry args={[0.045, 0.09, 4]} />{fur}</mesh>
            ) : (
              <mesh position={[k * 0.125, 0.02, 0]} rotation={[0, 0, k * 0.5]} scale={[0.5, 1.1, 0.8]} castShadow><sphereGeometry args={[0.065, 10, 8]} />{fur2}</mesh>
            )}
          </group>
        ))}
      </group>
      <group ref={tail} position={[0, 0.25, -0.2]}>
        {bunny ? (
          <mesh position={[0, -0.02, 0.02]}><sphereGeometry args={[0.05, 12, 10]} />{fur2}</mesh>
        ) : cat ? (
          <mesh position={[0, 0.1, -0.03]} rotation={[-0.5, 0, 0]} castShadow><capsuleGeometry args={[0.022, 0.2, 4, 8]} />{fur}</mesh>
        ) : (
          <mesh position={[0, 0.05, -0.02]} rotation={[-0.7, 0, 0]} castShadow><capsuleGeometry args={[0.028, 0.08, 4, 8]} />{fur2}</mesh>
        )}
      </group>
      <mesh position={[0, 0.262, 0.14]} rotation={[Math.PI / 2 - 0.3, 0, 0]}><torusGeometry args={[0.085, 0.012, 6, 20]} /><meshStandardMaterial color={cat ? "#e79aae" : "#c9a66b"} metalness={cat ? 0 : 0.7} roughness={0.4} /></mesh>
    </group>
  );
}

/** 애니메이션 펫 모델마다 머리 뼈 기준 장식 위치 (p: 실제 크기 m, r: 회전, s: 배율) */
// Quaternius 동물 리그는 머리 뼈 Y 가 주둥이 쪽, Z 가 위쪽 → 장식의 위(Y)를 뼈 Z 로, 앞(Z)을 뼈 Y 로 돌린다
const QUAT_RIG = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 1).normalize(), Math.PI);
const PET_ACC_FIT: Record<string, { p: [number, number, number]; q: THREE.Quaternion; s: number }> = {
  default: { p: [0, 0.025, 0.065], q: QUAT_RIG, s: 0.85 },
  pet_fox: { p: [0, 0.01, 0.06], q: QUAT_RIG, s: 0.8 },
};

// ───────────── 애니메이션 펫 (Quaternius Ultimate Animated Animals, CC0) ─────────────
const petCache = new Map<string, Promise<GLTF | null>>();
function loadPet(name: string) {
  let p = petCache.get(name);
  if (!p) {
    p = new Promise<GLTF | null>((resolve) => makeGLTFLoader().load(`./models/${name}.glb`, resolve, undefined, () => resolve(null)));
    petCache.set(name, p);
  }
  return p;
}

/** 모델을 불러오는 동안·실패하면 코드 모델(PetModel)을 그대로 보여 준다 */
export function AnimatedPet({ t, walking, happy, acc }: { t: PetType; walking?: { current: boolean }; happy?: { current: number }; acc?: PetAcc | null }) {
  const [gltf, setGltf] = useState<GLTF | null>(null);
  useEffect(() => { let on = true; if (t.model) void loadPet(t.model).then((g) => on && setGltf(g)); return () => { on = false; }; }, [t.model]);
  const rig = useMemo(() => {
    if (!gltf) return null;
    const obj = cloneSkinned(gltf.scene) as THREE.Group;
    obj.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    const mixer = new THREE.AnimationMixer(obj);
    const act = (n: string) => { const c = gltf.animations.find((a) => a.name === n); return c ? mixer.clipAction(c) : null; };
    const idle = act("Idle"), walk = act("Walk"), joy = act("Jump_ToIdle"), sniff = act("Idle_2_HeadLow");
    joy?.setLoop(THREE.LoopOnce, 1);
    if (joy) joy.clampWhenFinished = false;
    idle?.play();
    // 장식을 붙일 머리 뼈와, 모델 크기에 맞춘 장식 배율 (뼈 공간 단위 → 실제 크기)
    let head: THREE.Object3D | null = null;
    obj.traverse((o) => { if (!head && (o as THREE.Bone).isBone && /head/i.test(o.name) && !/end|top/i.test(o.name)) head = o; });
    let accScale = 1;
    if (head) {
      obj.updateMatrixWorld(true);
      const ws = new THREE.Vector3(); (head as THREE.Object3D).getWorldScale(ws);
      const os = new THREE.Vector3(); obj.getWorldScale(os);
      accScale = os.x / Math.max(1e-6, ws.x);
    }
    return { obj, mixer, idle, walk, joy, sniff, cur: idle, lastHappy: 0, t: 0, head: head as THREE.Object3D | null, accScale };
  }, [gltf]);
  useEffect(() => () => { rig?.mixer.stopAllAction(); }, [rig]);
  useFrame((_, dt) => {
    if (!rig) return;
    rig.t += dt;
    const h = happy?.current ?? 0;
    let want = walking?.current ? rig.walk : rig.idle;
    // 쓰다듬으면 한 번 깡충 → 다시 평소 동작
    if (h > rig.lastHappy && rig.joy) { rig.joy.reset().play(); rig.lastHappy = h; }
    if (!walking?.current && rig.sniff && Math.sin(rig.t * 0.21) > 0.93) want = rig.sniff; // 가끔 바닥 냄새 맡기
    if (want && want !== rig.cur) { want.reset().fadeIn(0.25).play(); rig.cur?.fadeOut(0.25); rig.cur = want; }
    rig.mixer.update(Math.min(dt, 0.05));
  });
  if (!rig) return <PetModel t={t} walking={walking} acc={acc} />;
  const fit = PET_ACC_FIT[t.model ?? ""] ?? PET_ACC_FIT.default;
  return (
    <>
      <primitive object={rig.obj} />
      {acc && rig.head && createPortal(
        <group scale={rig.accScale * fit.s} position={fit.p.map((v) => v * rig.accScale) as [number, number, number]} quaternion={fit.q}><PetAccMesh acc={acc} /></group>,
        rig.head,
      )}
    </>
  );
}

export function PetActor({ pet, L, seed }: { pet: Pet; L: Layout; seed: number }) {
  const t = PET_MAP[pet.type];
  const acc = pet.acc ? PET_ACC_MAP[pet.acc] ?? null : null;
  const g = useRef<THREE.Group>(null!);
  const pos = useRef({ x: -1 + seed * 0.9, z: 1.5 + (seed % 2) });
  const goal = useRef<{ x: number; z: number } | null>(null);
  const rest = useRef(1 + seed);
  const walking = useRef(false);
  const fx = useRef(0);
  const happy = useRef(0);
  const hearts = useRef<THREE.Group>(null!);
  useEffect(() => () => { delete petPos[pet.id]; delete petFx[pet.id]; }, [pet.id]);

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const p = pos.current;
    // 애정도가 높을수록 플레이어 곁을 자주 따라다닌다
    if (!goal.current) {
      rest.current -= dt;
      if (rest.current <= 0) {
        const follow = Math.random() < 0.25 + pet.affection / 160;
        const a = Math.random() * Math.PI * 2;
        goal.current = follow
          ? { x: input.playerPos.x + Math.cos(a) * 0.9, z: input.playerPos.z + Math.sin(a) * 0.9 }
          : { x: (Math.random() - 0.5) * (L.w - 4), z: (Math.random() - 0.3) * (L.d - 5) };
        goal.current.x = THREE.MathUtils.clamp(goal.current.x, -L.w / 2 + 1, L.w / 2 - 1);
        goal.current.z = THREE.MathUtils.clamp(goal.current.z, -L.d / 2 + 3, L.d / 2 - 1.2);
      }
    }
    walking.current = false;
    if (goal.current) {
      const dx = goal.current.x - p.x, dz = goal.current.z - p.z, d = Math.hypot(dx, dz);
      if (d < 0.12) { goal.current = null; rest.current = 1.5 + Math.random() * 4; }
      else {
        const sp = t.kind === "dog" ? 1.6 : t.kind === "rabbit" ? 1.3 : 1.1;
        p.x += (dx / d) * sp * dt; p.z += (dz / d) * sp * dt; walking.current = true;
        if (g.current) { let dy = Math.atan2(dx, dz) - g.current.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); g.current.rotation.y += dy * Math.min(1, dt * 8); }
      }
    }
    if (g.current) g.current.position.set(p.x, walking.current && !t.model ? Math.abs(Math.sin(clock.elapsedTime * 12)) * 0.015 : 0, p.z);
    petPos[pet.id] = { x: p.x, z: p.z };
    if (petFx[pet.id]) { fx.current = 1.6; happy.current += 1; petFx[pet.id] = 0; goal.current = null; rest.current = 2.5; }
    fx.current = Math.max(0, fx.current - dt);
    if (hearts.current) hearts.current.visible = fx.current > 0;
  });
  if (!t) return null;
  return (
    <group ref={g} userData={{ petId: pet.id }}>
      {t.model ? <AnimatedPet t={t} walking={walking} happy={happy} acc={acc} /> : <PetModel t={t} walking={walking} acc={acc} />}
      <group ref={hearts} visible={false}>
        <Sparkles count={14} scale={[0.6, 0.7, 0.6]} position={[0, 0.7, 0]} size={5} speed={1.6} color="#ff7fa5" />
      </group>
    </group>
  );
}
