/** 라운지 뷰티 가든: 왼쪽 벽 화분대에 내 식물이 자라는 단계대로 보인다 (가든 탭과 같은 상태) */
import { useEffect, useState } from "react";
import { PLANT_MAP, growth, potsFor } from "../data/life";
import { useLife } from "../store/life";
import type { Layout } from "./layout";

const WOOD = "#e8d6c4";
const POT = "#e8c2ab";

function Bloom({ color, stage }: { color: string; stage: number }) {
  if (stage === 0) return <mesh position={[0, 0.215, 0]}><sphereGeometry args={[0.018, 8, 6]} /><meshStandardMaterial color="#8a6a4a" /></mesh>;
  const h = stage === 1 ? 0.1 : 0.22;
  return (
    <group position={[0, 0.2, 0]}>
      <mesh position={[0, h / 2, 0]}><cylinderGeometry args={[0.008, 0.01, h, 6]} /><meshStandardMaterial color="#5fae7e" /></mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * 0.04, h * 0.45, 0]} rotation={[0, 0, -k * 0.9]} scale={[1, 0.45, 0.6]}><sphereGeometry args={[0.045, 10, 8]} /><meshStandardMaterial color="#7fc8a9" roughness={0.7} /></mesh>
      ))}
      {stage === 2 && <mesh position={[0, h + 0.02, 0]} scale={[1, 1.3, 1]}><sphereGeometry args={[0.035, 12, 10]} /><meshStandardMaterial color={color} roughness={0.6} /></mesh>}
      {stage >= 3 && (
        <group position={[0, h + 0.03, 0]}>
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2;
            return <mesh key={i} position={[Math.cos(a) * 0.04, 0, Math.sin(a) * 0.04]} scale={[1, 0.5, 1]}><sphereGeometry args={[0.035, 10, 8]} /><meshStandardMaterial color={color} roughness={0.55} emissive={color} emissiveIntensity={0.12} /></mesh>;
          })}
          <mesh position={[0, 0.012, 0]}><sphereGeometry args={[0.022, 10, 8]} /><meshStandardMaterial color="#f6e27a" /></mesh>
        </group>
      )}
    </group>
  );
}

export function Garden3D({ L }: { L: Layout }) {
  const garden = useLife((s) => s.garden);
  // 1분마다 성장 단계를 다시 계산
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(id); }, []);
  const n = potsFor(L.level.n);
  const span = 1.9;
  return (
    <group position={[L.garden.x, 0, L.garden.z]} rotation={[0, Math.PI / 2, 0]}>
      {/* 2단 화분대 */}
      {[0.32, 0.62].map((y, i) => (
        <mesh key={i} position={[0, y, i ? -0.12 : 0.04]} castShadow receiveShadow><boxGeometry args={[span, 0.04, 0.3]} /><meshStandardMaterial color={WOOD} roughness={0.75} /></mesh>
      ))}
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * (span / 2 - 0.03), 0.33, -0.04]} castShadow><boxGeometry args={[0.05, 0.66, 0.42]} /><meshStandardMaterial color={WOOD} roughness={0.75} /></mesh>
      ))}
      {Array.from({ length: n }).map((_, i) => {
        const slot = garden[i];
        const p = slot && PLANT_MAP[slot.type];
        const row = i % 2; // 앞단·뒷단 번갈아
        const x = -span / 2 + 0.22 + (i * (span - 0.44)) / Math.max(1, n - 1);
        return (
          <group key={i} position={[x, row ? 0.64 : 0.34, row ? -0.12 : 0.04]}>
            <mesh position={[0, 0.09, 0]} castShadow><cylinderGeometry args={[0.09, 0.065, 0.18, 14]} /><meshStandardMaterial color={POT} roughness={0.8} /></mesh>
            <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.082, 0.082, 0.01, 14]} /><meshStandardMaterial color="#7a5a40" roughness={1} /></mesh>
            {slot && p && <Bloom color={p.color} stage={growth(slot, p, now).stage} />}
          </group>
        );
      })}
    </group>
  );
}
