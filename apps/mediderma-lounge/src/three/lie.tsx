import { bodyDims } from "./Character";
import { BED_TOP, type Layout } from "./layout";

/** 일반 베드(바닥 위) 상판 높이 */
export const STATION_TOP = 0.62;

/** 침대에 누운 자세 변환. 로컬 (lx,ly,lz) → 월드 origin + (-ly, lz, -lx). 머리는 -x 쪽 */
export function lieOriginAt(bed: { x: number; z: number }, top: number, growth: number): [number, number, number] {
  const d = bodyDims(growth);
  return [bed.x - 0.74 + d.headY, top + d.head * 0.82, bed.z];
}
export const lieOrigin = (L: Layout, growth: number) => lieOriginAt(L.bed, BED_TOP, growth);

export function LyingAt({ bed, top, growth, children }: { bed: { x: number; z: number }; top: number; growth: number; children: React.ReactNode }) {
  return (
    <group position={lieOriginAt(bed, top, growth)} rotation={[0, Math.PI / 2, 0]}>
      <group rotation={[-Math.PI / 2, 0, 0]}>{children}</group>
    </group>
  );
}
export function Lying({ L, growth, children }: { L: Layout; growth: number; children: React.ReactNode }) {
  return <LyingAt bed={L.bed} top={BED_TOP} growth={growth}>{children}</LyingAt>;
}
