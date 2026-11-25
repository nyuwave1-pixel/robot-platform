/**
 * 펫 키우기: 유대감 레벨 · 돌봄 행동 · 머리 장식(액세서리)
 *  - 유대감(bond)은 쓰다듬기 · 먹이 · 놀아주기 · 목욕으로 쌓이고 줄지 않는다 → 레벨
 *  - 애정도(affection, 0~100)는 기존대로 곁을 따라다니는 정도
 *  - 장식은 한 번 사면 모든 펫에게 씌울 수 있고, 레벨이 오른 펫만 쓸 수 있는 것도 있다
 */
export const PET_LEVELS = [0, 30, 80, 160, 280, 450, 700];
export const PET_TITLES_KO = ["아기", "친해지는 중", "단짝", "베프", "가족", "영혼의 짝", "전설의 단짝"];
export const PET_TITLES_EN = ["Baby", "Getting close", "Buddy", "Best friend", "Family", "Soulmate", "Legendary pal"];
export const petLevel = (bond: number) => PET_LEVELS.filter((x) => (bond ?? 0) >= x).length;
/** 다음 레벨까지 진행 0..1 (최고 레벨이면 1) */
export function petLevelProgress(bond: number) {
  const lv = petLevel(bond);
  if (lv >= PET_LEVELS.length) return 1;
  const a = PET_LEVELS[lv - 1], b = PET_LEVELS[lv];
  return Math.min(1, Math.max(0, ((bond ?? 0) - a) / (b - a)));
}

/** 돌봄 행동별 유대감 · 애정도 */
export const PET_BOND = { pet: 3, feed: 5, play: 8, bath: 15 } as const;
export const PLAY_COOLDOWN_MIN = 60; // 놀아주기는 한 시간에 한 번
export const PLAY_AFFECTION = 6;
export const BATH_COST = 40; // 목욕은 하루 한 번
export const BATH_AFFECTION = 10;

export type PetAccShape = "ribbon" | "flowers" | "party" | "crown" | "star";
export interface PetAcc { id: string; ko: string; en: string; shape: PetAccShape; color: string; accent: string; price: number; minLevel: number }
export const PET_ACCS: PetAcc[] = [
  { id: "pacc-ribbon", ko: "핑크 리본", en: "Pink Ribbon", shape: "ribbon", color: "#f08aa6", accent: "#ffd1dc", price: 120, minLevel: 1 },
  { id: "pacc-star", ko: "별 머리핀", en: "Star Hairpin", shape: "star", color: "#f3c64f", accent: "#fff3c2", price: 160, minLevel: 2 },
  { id: "pacc-party", ko: "파티 모자", en: "Party Hat", shape: "party", color: "#8fb7f0", accent: "#ffe27a", price: 220, minLevel: 3 },
  { id: "pacc-flowers", ko: "꽃 화관", en: "Flower Crown", shape: "flowers", color: "#7fc28e", accent: "#f5a3bd", price: 300, minLevel: 4 },
  { id: "pacc-crown", ko: "골드 왕관", en: "Gold Crown", shape: "crown", color: "#d9a441", accent: "#fff0b8", price: 600, minLevel: 6 },
];
export const PET_ACC_MAP: Record<string, PetAcc> = Object.fromEntries(PET_ACCS.map((a) => [a.id, a]));
