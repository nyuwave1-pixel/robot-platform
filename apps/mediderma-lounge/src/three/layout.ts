import { LOUNGE_LEVELS } from "../data/game";
import type { ZoneKey } from "../store/ui";

/** 라운지 등급별 공간 배치. 모든 좌표는 방 중심 기준(m). 뒤벽 z=-d/2, 입구 z=+d/2 */
export function layout(level: number, stations = 0) {
  const L = LOUNGE_LEVELS[Math.min(LOUNGE_LEVELS.length, Math.max(1, level)) - 1];
  const w = L.w, d = L.d;
  const bed = { x: w / 2 - 4.2, z: -d / 2 + 2.0 };
  const shelf = { x: -w / 2 + 3.4, z: -d / 2 + 0.45 };
  const reception = { x: w / 2 - 2.4, z: d / 2 - 2.6 };
  const vanity = { x: -w / 2 + 0.55, z: -0.4 };
  const photo = { x: -w / 2 + 1.9, z: 2.2 };
  // 입구(|x|<1.3) 동선을 비워 두고 왼쪽 앞벽에 대기 소파를 둔다
  const sofa = { x: -3.0, z: d / 2 - 2.2 };
  // 추가 DERMA HOME 스테이션 자리: 오른쪽 창가를 따라 늘어선다
  const stationSpots: { x: number; z: number }[] = [];
  for (let z = -d / 2 + 5.2; z <= d / 2 - 4.6 + 0.001; z += 2.4) stationSpots.push({ x: w / 2 - 2.1, z });
  const game = { x: 2.4, z: d / 2 - 1.15 };
  const zones: { key: ZoneKey; x: z_; z: z_; min: number }[] = [
    { key: "shelf", x: shelf.x, z: shelf.z + 1.5, min: 1 },
    { key: "device", x: bed.x, z: bed.z + 1.5, min: 1 },
    { key: "reception", x: reception.x, z: reception.z - 1.75, min: 1 },
    { key: "vanity", x: vanity.x + 1.3, z: vanity.z, min: 1 },
    { key: "photo", x: photo.x + 1.7, z: photo.z, min: 2 },
    { key: "game", x: game.x, z: game.z - 1.15, min: 1 },
  ];
  const seats = Array.from({ length: 5 }, (_, i) => ({ x: sofa.x - 1.2 + (i % 3) * 0.8 + (i >= 3 ? 6.8 : 0), z: sofa.z + (i >= 3 ? -0.2 : 0) }));
  const obstacles = [
    { x: bed.x - 0.6, z: bed.z, r: 0.8 }, { x: bed.x + 0.6, z: bed.z, r: 0.8 }, { x: bed.x - 1.75, z: bed.z - 0.4, r: 0.55 },
    { x: shelf.x - 1.2, z: shelf.z, r: 0.75 }, { x: shelf.x, z: shelf.z, r: 0.75 }, { x: shelf.x + 1.2, z: shelf.z, r: 0.75 },
    { x: reception.x, z: reception.z + 0.25, r: 1.3 },
    { x: vanity.x, z: vanity.z, r: 0.7 },
    { x: sofa.x - 1.3, z: sofa.z + 0.15, r: 0.6 }, { x: sofa.x - 0.4, z: sofa.z + 0.15, r: 0.6 }, { x: sofa.x + 0.5, z: sofa.z + 0.15, r: 0.6 },
    { x: game.x, z: game.z, r: 0.6 },
    ...stationSpots.slice(0, stations).flatMap((s) => [{ x: s.x - 0.55, z: s.z, r: 0.7 }, { x: s.x + 0.55, z: s.z, r: 0.7 }]),
  ];
  return { stationSpots, stations: Math.min(stations, stationSpots.length), game, level: L, w, d, bed, shelf, reception, vanity, photo, sofa, zones: zones.filter((z) => level >= z.min), seats, obstacles, entrance: { x: 0, z: d / 2 - 0.3 }, payPoint: { x: reception.x, z: reception.z - 1.6 } };
}
type z_ = number;
export type Layout = ReturnType<typeof layout>;

export const BED_TOP = 0.68; // 케어 스테이지(6cm) 위의 베드 상판
