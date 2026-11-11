import { bodyDims } from "./Character";
import { BED_TOP, type Layout } from "./layout";

/** 침대에 누운 자세 변환. 로컬 (lx,ly,lz) → 월드 origin + (-ly, lz, -lx) */
export function lieOrigin(L: Layout, growth: number): [number, number, number] {
  const d = bodyDims(growth);
  return [L.bed.x - 0.74 + d.headY, BED_TOP + d.head * 0.82, L.bed.z];
}
export function Lying({ L, growth, children }: { L: Layout; growth: number; children: React.ReactNode }) {
  return (
    <group position={lieOrigin(L, growth)} rotation={[0, Math.PI / 2, 0]}>
      <group rotation={[-Math.PI / 2, 0, 0]}>{children}</group>
    </group>
  );
}
