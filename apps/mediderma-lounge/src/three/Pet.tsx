/** 라운지 펫 (고양이·강아지): 프로시저럴 모델 + 배회 AI. 쓰다듬으면 하트가 올라온다. */
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { PET_MAP, type PetType } from "../data/game";
import type { Pet } from "../store/game";
import { input } from "../store/ui";
import type { Layout } from "./layout";

/** 근접 판정·쓰다듬기 연출 공유 */
export const petPos: Record<string, { x: number; z: number }> = {};
export const petFx: Record<string, number> = {};

export function PetModel({ t, walking }: { t: PetType; walking?: { current: boolean } }) {
  const tail = useRef<THREE.Group>(null!);
  const legs = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const cat = t.kind === "cat";
  useFrame(({ clock }) => {
    const e = clock.elapsedTime;
    const w = walking?.current;
    if (tail.current) tail.current.rotation.z = Math.sin(e * (cat ? 2 : 9)) * (cat ? 0.35 : 0.6);
    if (legs.current) legs.current.children.forEach((l, i) => { l.rotation.x = w ? Math.sin(e * 12 + (i % 2 ? Math.PI : 0)) * 0.6 : 0; });
    if (head.current) head.current.rotation.z = w ? 0 : Math.sin(e * 0.9) * 0.12;
  });
  const fur = <meshStandardMaterial color={t.color} roughness={0.9} />;
  const fur2 = <meshStandardMaterial color={t.accent} roughness={0.9} />;
  const s = cat ? 1 : 1.12;
  return (
    <group scale={s}>
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
        <mesh position={[0, -0.035, 0.1]} scale={[1, 0.7, 0.8]}><sphereGeometry args={[cat ? 0.05 : 0.065, 10, 8]} />{fur2}</mesh>
        <mesh position={[0, -0.02, cat ? 0.142 : 0.16]}><sphereGeometry args={[0.016, 8, 8]} /><meshStandardMaterial color={cat ? "#e58aa0" : "#2a2224"} roughness={0.4} /></mesh>
        {[-1, 1].map((k) => (
          <group key={k}>
            <mesh position={[k * 0.05, 0.025, 0.112]}><sphereGeometry args={[0.02, 10, 8]} /><meshStandardMaterial color="#1d1718" roughness={0.2} /></mesh>
            <mesh position={[k * 0.045, 0.033, 0.13]}><sphereGeometry args={[0.006, 6, 6]} /><meshBasicMaterial color="#ffffff" /></mesh>
            {cat ? (
              <mesh position={[k * 0.075, 0.125, 0]} rotation={[0, 0, -k * 0.25]} castShadow><coneGeometry args={[0.045, 0.09, 4]} />{fur}</mesh>
            ) : (
              <mesh position={[k * 0.125, 0.02, 0]} rotation={[0, 0, k * 0.5]} scale={[0.5, 1.1, 0.8]} castShadow><sphereGeometry args={[0.065, 10, 8]} />{fur2}</mesh>
            )}
          </group>
        ))}
      </group>
      <group ref={tail} position={[0, 0.25, -0.2]}>
        {cat ? (
          <mesh position={[0, 0.1, -0.03]} rotation={[-0.5, 0, 0]} castShadow><capsuleGeometry args={[0.022, 0.2, 4, 8]} />{fur}</mesh>
        ) : (
          <mesh position={[0, 0.05, -0.02]} rotation={[-0.7, 0, 0]} castShadow><capsuleGeometry args={[0.028, 0.08, 4, 8]} />{fur2}</mesh>
        )}
      </group>
      <mesh position={[0, 0.262, 0.14]} rotation={[Math.PI / 2 - 0.3, 0, 0]}><torusGeometry args={[0.085, 0.012, 6, 20]} /><meshStandardMaterial color={cat ? "#e79aae" : "#c9a66b"} metalness={cat ? 0 : 0.7} roughness={0.4} /></mesh>
    </group>
  );
}

export function PetActor({ pet, L, seed }: { pet: Pet; L: Layout; seed: number }) {
  const t = PET_MAP[pet.type];
  const g = useRef<THREE.Group>(null!);
  const pos = useRef({ x: -1 + seed * 0.9, z: 1.5 + (seed % 2) });
  const goal = useRef<{ x: number; z: number } | null>(null);
  const rest = useRef(1 + seed);
  const walking = useRef(false);
  const fx = useRef(0);
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
        const sp = t.kind === "dog" ? 1.6 : 1.1;
        p.x += (dx / d) * sp * dt; p.z += (dz / d) * sp * dt; walking.current = true;
        if (g.current) { let dy = Math.atan2(dx, dz) - g.current.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); g.current.rotation.y += dy * Math.min(1, dt * 8); }
      }
    }
    if (g.current) g.current.position.set(p.x, walking.current ? Math.abs(Math.sin(clock.elapsedTime * 12)) * 0.015 : 0, p.z);
    petPos[pet.id] = { x: p.x, z: p.z };
    if (petFx[pet.id]) { fx.current = 1.6; petFx[pet.id] = 0; goal.current = null; rest.current = 2.5; }
    fx.current = Math.max(0, fx.current - dt);
    if (hearts.current) hearts.current.visible = fx.current > 0;
  });
  if (!t) return null;
  return (
    <group ref={g}>
      <PetModel t={t} walking={walking} />
      <group ref={hearts} visible={false}>
        <Sparkles count={14} scale={[0.6, 0.7, 0.6]} position={[0, 0.7, 0]} size={5} speed={1.6} color="#ff7fa5" />
      </group>
    </group>
  );
}
