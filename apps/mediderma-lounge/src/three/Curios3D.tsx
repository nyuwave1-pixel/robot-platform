/**
 * 라운지 소품 진열: 가든 화분대 위 벽 선반 2단에 모은 인테리어 소품이 3D 로 놓인다.
 * 세트를 다 모으면 그 칸 앞에 금색 명판이 붙는다. 모델은 프로시저럴(가볍게, 소품당 메시 3~8개).
 */
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CURIO_SETS, CURIOS } from "../data/life";
import { useLife } from "../store/life";
import type { Layout } from "./layout";

const C = { pink: "#f2a6b8", rose: "#e98c9a", gold: "#e3c26f", cream: "#fff3e2", lav: "#b9a2e8", mint: "#9fd3c7", brown: "#c8946a", blue: "#a9d4ec", leaf: "#7fc8a9", stem: "#5fae7e" };
const Std = ({ c, r = 0.55, m = 0, e }: { c: string; r?: number; m?: number; e?: number }) => <meshStandardMaterial color={c} roughness={r} metalness={m} emissive={e ? c : "#000000"} emissiveIntensity={e ?? 0} />;
const Glass = ({ c = "#dcecf6" }: { c?: string }) => <meshPhysicalMaterial color={c} roughness={0.08} transmission={0.6} thickness={0.02} transparent opacity={0.75} />;

function Vase({ petal, big }: { petal: string; big?: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.045, 0]}><cylinderGeometry args={[0.03, 0.022, 0.09, 14]} /><Glass /></mesh>
      <mesh position={[0, 0.11, 0]}><cylinderGeometry args={[0.003, 0.003, 0.08, 5]} /><Std c={C.stem} /></mesh>
      {[[0, 0.16, 0], [-0.025, 0.14, 0.01], [0.025, 0.145, -0.01]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}><sphereGeometry args={[big ? 0.026 : 0.019, 10, 8]} /><Std c={petal} r={0.6} /></mesh>
      ))}
    </group>
  );
}

const MODELS: Record<string, () => JSX.Element> = {
  "c-tulip": () => <Vase petal={C.rose} />,
  "c-sunflower": () => <Vase petal={C.gold} big />,
  "c-bouquet": () => (
    <group>
      <mesh position={[0, 0.05, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.035, 0.1, 12]} /><Std c={C.cream} r={0.7} /></mesh>
      {[[0, 0.13, 0, C.pink], [-0.025, 0.12, 0.01, C.lav], [0.025, 0.12, 0.01, C.cream], [0, 0.115, -0.025, C.rose]].map(([x, y, z, c], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]}><sphereGeometry args={[0.024, 10, 8]} /><Std c={c as string} r={0.6} /></mesh>
      ))}
    </group>
  ),
  "c-cherry": () => (
    <group>
      <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.028, 0.03, 0.06, 12]} /><Std c={C.cream} /></mesh>
      <mesh position={[0.02, 0.12, 0]} rotation={[0, 0, -0.35]}><cylinderGeometry args={[0.004, 0.005, 0.16, 5]} /><Std c={C.brown} /></mesh>
      {[[0.04, 0.17], [0.0, 0.14], [0.055, 0.12], [0.02, 0.19]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0]}><sphereGeometry args={[0.016, 8, 6]} /><Std c="#f7c6d4" e={0.1} /></mesh>
      ))}
    </group>
  ),
  "c-candle": () => (
    <group>
      <mesh position={[0, 0.045, 0]}><cylinderGeometry args={[0.025, 0.025, 0.09, 14]} /><Std c={C.cream} r={0.8} /></mesh>
      <mesh position={[0, 0.105, 0]} scale={[1, 1.6, 1]}><sphereGeometry args={[0.009, 8, 6]} /><meshBasicMaterial color="#ffc861" /></mesh>
    </group>
  ),
  "c-diffuser": () => (
    <group>
      <mesh position={[0, 0.035, 0]}><cylinderGeometry args={[0.028, 0.03, 0.07, 12]} /><Glass c={C.lav} /></mesh>
      {[-0.3, 0, 0.3].map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * 0.04, 0.12, 0]} rotation={[0, 0, -a]}><cylinderGeometry args={[0.002, 0.002, 0.14, 4]} /><Std c={C.brown} /></mesh>
      ))}
    </group>
  ),
  "c-lamp": () => (
    <group>
      <mesh position={[0, 0.005, 0]}><cylinderGeometry args={[0.03, 0.035, 0.01, 14]} /><Std c={C.gold} m={0.7} r={0.3} /></mesh>
      <mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.004, 0.004, 0.1, 6]} /><Std c={C.gold} m={0.7} r={0.3} /></mesh>
      <mesh position={[0, 0.13, 0]}><cylinderGeometry args={[0.025, 0.045, 0.06, 14, 1, true]} /><meshStandardMaterial color={C.pink} emissive="#ffd7c2" emissiveIntensity={0.6} side={THREE.DoubleSide} /></mesh>
    </group>
  ),
  "c-crystal": () => (
    <group>
      <mesh position={[0, 0.012, 0]}><cylinderGeometry args={[0.025, 0.032, 0.024, 12]} /><Std c={C.gold} m={0.7} r={0.3} /></mesh>
      <mesh position={[0, 0.06, 0]}><sphereGeometry args={[0.04, 18, 14]} /><meshPhysicalMaterial color={C.lav} roughness={0.05} transmission={0.5} transparent opacity={0.85} emissive={C.lav} emissiveIntensity={0.25} /></mesh>
    </group>
  ),
  "c-mirror": () => (
    <group>
      <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.006, 0.006, 0.06, 6]} /><Std c={C.gold} m={0.7} r={0.3} /></mesh>
      <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1.15]}><cylinderGeometry args={[0.04, 0.04, 0.008, 20]} /><Std c={C.gold} m={0.7} r={0.3} /></mesh>
      <mesh position={[0, 0.1, 0.005]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1.15]}><cylinderGeometry args={[0.032, 0.032, 0.002, 20]} /><meshStandardMaterial color="#e8f2f8" metalness={1} roughness={0.05} /></mesh>
    </group>
  ),
  "c-ribbon": () => (
    <group position={[0, 0.06, 0]}>
      {[-1, 1].map((k) => <mesh key={k} position={[k * 0.03, 0, 0]} rotation={[0, 0, k * 0.5]} scale={[1.4, 0.8, 0.4]}><sphereGeometry args={[0.025, 10, 8]} /><Std c={C.pink} r={0.35} /></mesh>)}
      <mesh><sphereGeometry args={[0.014, 8, 6]} /><Std c={C.rose} r={0.35} /></mesh>
      {[-1, 1].map((k) => <mesh key={`t${k}`} position={[k * 0.015, -0.04, 0]} rotation={[0, 0, k * 0.3]}><boxGeometry args={[0.012, 0.06, 0.004]} /><Std c={C.pink} r={0.35} /></mesh>)}
    </group>
  ),
  "c-perfume": () => (
    <group>
      <mesh position={[0, 0.04, 0]}><boxGeometry args={[0.06, 0.07, 0.035]} /><meshPhysicalMaterial color={C.pink} roughness={0.05} transmission={0.4} transparent opacity={0.85} /></mesh>
      <mesh position={[0, 0.085, 0]}><cylinderGeometry args={[0.008, 0.008, 0.02, 8]} /><Std c={C.gold} m={0.8} r={0.25} /></mesh>
      <mesh position={[0, 0.105, 0]}><sphereGeometry args={[0.014, 10, 8]} /><Std c={C.gold} m={0.8} r={0.25} /></mesh>
    </group>
  ),
  "c-crown": () => (
    <group position={[0, 0.02, 0]}>
      <mesh><torusGeometry args={[0.035, 0.006, 6, 24]} /><Std c={C.gold} m={0.85} r={0.2} e={0.1} /></mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return <mesh key={i} position={[Math.cos(a) * 0.035, 0.022, Math.sin(a) * 0.035]}><coneGeometry args={[0.008, 0.035, 5]} /><Std c={C.gold} m={0.85} r={0.2} e={0.1} /></mesh>;
      })}
      <mesh position={[0, 0.03, 0.036]}><sphereGeometry args={[0.008, 8, 6]} /><Std c={C.rose} r={0.2} e={0.2} /></mesh>
    </group>
  ),
  "c-teddy": () => (
    <group>
      <mesh position={[0, 0.04, 0]} scale={[1, 1.1, 0.9]}><sphereGeometry args={[0.04, 12, 10]} /><Std c={C.brown} r={0.95} /></mesh>
      <mesh position={[0, 0.1, 0]}><sphereGeometry args={[0.032, 12, 10]} /><Std c={C.brown} r={0.95} /></mesh>
      {[-1, 1].map((k) => <mesh key={k} position={[k * 0.026, 0.128, 0]}><sphereGeometry args={[0.012, 8, 6]} /><Std c={C.brown} r={0.95} /></mesh>)}
      <mesh position={[0, 0.095, 0.028]}><sphereGeometry args={[0.012, 8, 6]} /><Std c={C.cream} r={0.9} /></mesh>
    </group>
  ),
  "c-tea": () => (
    <group>
      <mesh position={[0, 0.04, 0]} scale={[1, 0.85, 1]}><sphereGeometry args={[0.045, 14, 10]} /><Std c={C.cream} r={0.25} /></mesh>
      <mesh position={[0, 0.085, 0]}><sphereGeometry args={[0.01, 8, 6]} /><Std c={C.gold} m={0.7} r={0.3} /></mesh>
      <mesh position={[0.055, 0.045, 0]} rotation={[0, 0, -0.8]}><cylinderGeometry args={[0.006, 0.01, 0.05, 6]} /><Std c={C.cream} r={0.25} /></mesh>
      <mesh position={[-0.05, 0.045, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.018, 0.005, 6, 12]} /><Std c={C.pink} r={0.3} /></mesh>
    </group>
  ),
  "c-books": () => (
    <group>
      {[[C.lav, 0, 0.012, 0.1], [C.mint, 0.005, 0.034, 0.09], [C.pink, -0.003, 0.056, 0.095]].map(([c, x, y, w], i) => (
        <mesh key={i} position={[x as number, y as number, 0]} rotation={[0, i * 0.15, 0]}><boxGeometry args={[w as number, 0.02, 0.07]} /><Std c={c as string} r={0.8} /></mesh>
      ))}
    </group>
  ),
  "c-globe": () => (
    <group>
      <mesh position={[0, 0.015, 0]}><cylinderGeometry args={[0.03, 0.036, 0.03, 14]} /><Std c={C.brown} r={0.6} /></mesh>
      <mesh position={[0, 0.07, 0]}><sphereGeometry args={[0.042, 18, 14]} /><meshPhysicalMaterial color={C.blue} roughness={0.05} transmission={0.6} transparent opacity={0.6} /></mesh>
      <mesh position={[0, 0.05, 0]}><coneGeometry args={[0.018, 0.035, 8]} /><Std c={C.stem} /></mesh>
    </group>
  ),
};
export const CURIO_MODEL_IDS = Object.keys(MODELS);

/** 선반 하나: 길이 len 의 떠 있는 벽 선반 */
function Shelf({ y, len }: { y: number; len: number }) {
  return (
    <group position={[0, y, 0]}>
      <mesh castShadow receiveShadow><boxGeometry args={[len, 0.03, 0.2]} /><Std c="#f6ece4" r={0.6} /></mesh>
      <mesh position={[0, -0.018, 0.098]}><boxGeometry args={[len, 0.008, 0.008]} /><Std c={C.gold} m={0.8} r={0.25} /></mesh>
      {[-1, 1].map((k) => <mesh key={k} position={[k * (len / 2 - 0.08), -0.05, -0.07]}><boxGeometry args={[0.02, 0.07, 0.05]} /><Std c={C.gold} m={0.8} r={0.25} /></mesh>)}
    </group>
  );
}

export function Curios3D({ L }: { L: Layout }) {
  const curios = useLife((s) => s.curios);
  const claimed = useLife((s) => s.setsClaimed);
  const spin = useRef<THREE.Group>(null!);
  // 희귀 소품(★★★)은 천천히 돌며 반짝인다
  useFrame(({ clock }) => { spin.current?.children.forEach((c) => { c.rotation.y = clock.elapsedTime * 0.6; }); });
  const len = 1.9;
  // 세트마다 4칸 · 위 선반 2세트, 아래 선반 2세트
  const slots = useMemo(() => CURIO_SETS.flatMap((st, si) =>
    CURIOS.filter((c) => c.set === st.id).map((c, i) => ({ c, si, x: -len / 2 + 0.14 + ((si % 2) * 4 + i) * ((len - 0.28) / 7), y: si < 2 ? 1.72 : 1.32 }))), []);
  const owned = (id: string) => (curios[id] ?? 0) > 0;
  return (
    <group position={[L.garden.x - 0.3, 0, L.garden.z]} rotation={[0, Math.PI / 2, 0]}>
      <Shelf y={1.3} len={len} />
      <Shelf y={1.7} len={len} />
      <group ref={spin}>
        {slots.filter((s) => owned(s.c.id) && s.c.rarity === 3).map((s) => (
          <group key={s.c.id} position={[s.x, s.y + 0.015, 0]} scale={1.7}>{MODELS[s.c.id]?.()}</group>
        ))}
      </group>
      {slots.filter((s) => owned(s.c.id) && s.c.rarity < 3).map((s) => (
        <group key={s.c.id} position={[s.x, s.y + 0.015, 0]} scale={1.7}>{MODELS[s.c.id]?.()}</group>
      ))}
      {/* 세트 완성 명판 */}
      {CURIO_SETS.map((st, si) => claimed.includes(st.id) && (
        <group key={st.id} position={[-len / 4 + (si % 2) * (len / 2), si < 2 ? 1.66 : 1.26, 0.105]}>
          <mesh><boxGeometry args={[0.22, 0.03, 0.006]} /><Std c={C.gold} m={0.85} r={0.2} e={0.15} /></mesh>
          <mesh position={[0, 0, 0.004]}><boxGeometry args={[0.2, 0.016, 0.002]} /><Std c={st.color} r={0.4} /></mesh>
        </group>
      ))}
    </group>
  );
}
