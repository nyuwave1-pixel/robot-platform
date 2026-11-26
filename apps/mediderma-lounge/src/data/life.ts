/**
 * 라이프 콘텐츠 데이터: 뷰티 가든(식물 키우기) · 웰니스 피트니스(운동) · 인테리어 소품 컬렉션 · 친구 선물/도움.
 * 숫자는 모두 게임 안 가상 보상이며 실제 제품 효능·체형 변화를 뜻하지 않는다.
 */

// ───────────── 뷰티 가든 ─────────────
export interface Plant {
  id: string; ko: string; en: string;
  color: string; // 꽃·잎 색 (3D 화분)
  seed: number; // 씨앗 값 (코인)
  hours: number; // 물을 안 주고 다 자라는 데 걸리는 시간
  coins: number; exp: number; // 수확 보상
  ingredient: string; // 수확하면 얻는 뷰티 원료 이름
  minLevel: number; // 라운지 레벨 조건
}
export const PLANTS: Plant[] = [
  { id: "mint", ko: "민트", en: "Mint", color: "#7fc8a9", seed: 20, hours: 1, coins: 45, exp: 6, ingredient: "민트 잎", minLevel: 1 },
  { id: "chamomile", ko: "캐모마일", en: "Chamomile", color: "#f6e27a", seed: 40, hours: 3, coins: 110, exp: 12, ingredient: "캐모마일 꽃", minLevel: 1 },
  { id: "aloe", ko: "알로에", en: "Aloe", color: "#5fae7e", seed: 60, hours: 6, coins: 190, exp: 18, ingredient: "알로에 젤", minLevel: 1 },
  { id: "lavender", ko: "라벤더", en: "Lavender", color: "#b9a2e8", seed: 90, hours: 8, coins: 280, exp: 24, ingredient: "라벤더 오일", minLevel: 2 },
  { id: "rose", ko: "로즈", en: "Rose", color: "#e98c9a", seed: 140, hours: 12, coins: 460, exp: 34, ingredient: "로즈 워터", minLevel: 2 },
  { id: "camellia", ko: "동백", en: "Camellia", color: "#d9627a", seed: 220, hours: 20, coins: 780, exp: 50, ingredient: "동백 오일", minLevel: 3 },
];
export const PLANT_MAP: Record<string, Plant> = Object.fromEntries(PLANTS.map((p) => [p.id, p]));
/** 물 한 번이 줄여 주는 성장 시간 비율 · 물 주기 간격(시간) */
export const WATER_BOOST = 0.2;
export const WATER_EVERY_H = 1;
/** 라운지 레벨별 화분 수 */
export const potsFor = (loungeLevel: number) => Math.min(6, 2 + loungeLevel);

/** 영양제: 화분마다 한 번, 남은 성장 시간을 줄이고 황금 수확 확률을 올린다 */
export const FERTILIZER_COST = 50;
export const FERTILIZER_SPEED = 0.7; // 다 자라는 데 걸리는 시간 배율
/** 황금 수확: 기본 확률 + 물 준 횟수(최대 3번) + 영양제 → 코인 2배, 황금 원료 도감 */
export function goldenChance(p: { water: number; fert?: boolean }) {
  return Math.min(0.35, 0.08 + 0.04 * Math.min(3, p.water) + (p.fert ? 0.1 : 0));
}

/** 0 씨앗 · 1 새싹 · 2 봉오리 · 3 수확 가능 */
export function growth(p: { planted: number; water: number; fert?: boolean }, plant: Plant, now = Date.now()) {
  const h = (now - p.planted) / 3_600_000;
  const need = plant.hours * Math.max(0.25, 1 - p.water * WATER_BOOST) * (p.fert ? FERTILIZER_SPEED : 1);
  const r = Math.min(1, need <= 0 ? 1 : h / need);
  return { ratio: r, stage: r >= 1 ? 3 : r >= 0.5 ? 2 : r >= 0.15 ? 1 : 0, leftMin: Math.max(0, Math.ceil((need - h) * 60)) };
}

// ───────────── 웰니스 피트니스 ─────────────
export interface Workout {
  id: string; ko: string; en: string;
  beats: number; speed: number; // 리듬 게임: 박자 수 · 마커 속도(1초에 왕복 비율)
  zone: number; // 판정 구간 너비(0~1)
  fit: number; coins: number; // 만점 보상
  minFit: number; // 열리는 피트니스 레벨
  descKo: string; descEn: string;
}
export const WORKOUTS: Workout[] = [
  { id: "stretch", ko: "아침 스트레칭", en: "Morning Stretch", beats: 6, speed: 0.55, zone: 0.26, fit: 10, coins: 40, minFit: 1, descKo: "천천히 숨 쉬며 온몸을 깨워요", descEn: "Wake up your whole body with slow breaths" },
  { id: "yoga", ko: "플로우 요가", en: "Flow Yoga", beats: 8, speed: 0.7, zone: 0.22, fit: 16, coins: 70, minFit: 1, descKo: "균형과 유연성을 키우는 요가 흐름", descEn: "A yoga flow for balance and flexibility" },
  { id: "pilates", ko: "코어 필라테스", en: "Core Pilates", beats: 8, speed: 0.9, zone: 0.2, fit: 22, coins: 95, minFit: 2, descKo: "코어를 단단하게, 자세를 바르게", descEn: "Strong core, better posture" },
  { id: "dance", ko: "K-팝 댄스 카디오", en: "K-pop Dance Cardio", beats: 10, speed: 1.1, zone: 0.18, fit: 30, coins: 130, minFit: 3, descKo: "신나는 박자에 맞춰 땀 흘리기", descEn: "Sweat it out to an upbeat rhythm" },
  { id: "hiit", ko: "뷰티 HIIT", en: "Beauty HIIT", beats: 12, speed: 1.35, zone: 0.16, fit: 40, coins: 180, minFit: 4, descKo: "짧고 강하게, 활력 충전", descEn: "Short, intense, full of energy" },
];
export const WORKOUT_MAP: Record<string, Workout> = Object.fromEntries(WORKOUTS.map((w) => [w.id, w]));
export const WORKOUT_DAILY = 3; // 하루 보상 횟수
/** 피트니스 레벨: 누적 피트니스 점수 → 레벨 1~10 */
export const FIT_STEPS = [0, 40, 110, 220, 380, 600, 900, 1300, 1800, 2500];
export const fitLevel = (fit: number) => FIT_STEPS.filter((x) => fit >= x).length;
export const FIT_TITLES_KO = ["새싹", "워밍업", "꾸준러", "리듬 타는", "코어 장인", "활력 충전", "웰니스 러버", "에너지 뿜뿜", "바디 밸런스 마스터", "웰니스 아이콘"];
export const FIT_TITLES_EN = ["Sprout", "Warming Up", "Steady", "In Rhythm", "Core Crafter", "Energized", "Wellness Lover", "Power Glow", "Balance Master", "Wellness Icon"];

// ───────────── 인테리어 소품 컬렉션 ─────────────
export interface Curio { id: string; set: string; ko: string; en: string; rarity: 1 | 2 | 3 }
export interface CurioSet { id: string; ko: string; en: string; color: string; gems: number; coins: number }
export const CURIO_SETS: CurioSet[] = [
  { id: "flower", ko: "플라워 베이스 세트", en: "Flower Vase Set", color: "#f2a6b8", gems: 8, coins: 300 },
  { id: "candle", ko: "아로마 캔들 세트", en: "Aroma Candle Set", color: "#f1d28a", gems: 10, coins: 400 },
  { id: "vanity", ko: "뷰티 오브제 세트", en: "Beauty Objet Set", color: "#b9a2e8", gems: 12, coins: 500 },
  { id: "cozy", ko: "코지 홈 세트", en: "Cozy Home Set", color: "#9fd3c7", gems: 15, coins: 600 },
];
export const CURIOS: Curio[] = [
  { id: "c-tulip", set: "flower", ko: "튤립 화병", en: "Tulip Vase", rarity: 1 },
  { id: "c-sunflower", set: "flower", ko: "해바라기 화병", en: "Sunflower Vase", rarity: 1 },
  { id: "c-bouquet", set: "flower", ko: "웨딩 부케", en: "Bridal Bouquet", rarity: 2 },
  { id: "c-cherry", set: "flower", ko: "벚꽃 가지", en: "Cherry Blossom Branch", rarity: 3 },
  { id: "c-candle", set: "candle", ko: "필라 캔들", en: "Pillar Candle", rarity: 1 },
  { id: "c-diffuser", set: "candle", ko: "리드 디퓨저", en: "Reed Diffuser", rarity: 1 },
  { id: "c-lamp", set: "candle", ko: "무드 램프", en: "Mood Lamp", rarity: 2 },
  { id: "c-crystal", set: "candle", ko: "크리스탈 오브", en: "Crystal Orb", rarity: 3 },
  { id: "c-mirror", set: "vanity", ko: "핸드 미러", en: "Hand Mirror", rarity: 1 },
  { id: "c-ribbon", set: "vanity", ko: "새틴 리본", en: "Satin Ribbon", rarity: 1 },
  { id: "c-perfume", set: "vanity", ko: "빈티지 향수병", en: "Vintage Perfume", rarity: 2 },
  { id: "c-crown", set: "vanity", ko: "미니 티아라", en: "Mini Tiara", rarity: 3 },
  { id: "c-teddy", set: "cozy", ko: "테디베어", en: "Teddy Bear", rarity: 1 },
  { id: "c-tea", set: "cozy", ko: "티 세트", en: "Tea Set", rarity: 1 },
  { id: "c-books", set: "cozy", ko: "북 스택", en: "Book Stack", rarity: 2 },
  { id: "c-globe", set: "cozy", ko: "스노우 글로브", en: "Snow Globe", rarity: 3 },
];
export const CURIO_MAP: Record<string, Curio> = Object.fromEntries(CURIOS.map((c) => [c.id, c]));
/** 소품 상자: 게임 코인으로만 연다 (유료 결제 없음). 확률을 화면에 그대로 보여 준다 */
export const BOX_COST = 150;
export const RARITY_ODDS: Record<1 | 2 | 3, number> = { 1: 0.65, 2: 0.27, 3: 0.08 };
/** 중복 소품은 코인으로 돌려준다 */
export const DUP_REFUND = 40;

/** rnd ∈ [0,1) 두 개로 희귀도 → 소품을 고른다 */
export function rollCurio(r1: number, r2: number): Curio {
  const rarity: 1 | 2 | 3 = r1 < RARITY_ODDS[3] ? 3 : r1 < RARITY_ODDS[3] + RARITY_ODDS[2] ? 2 : 1;
  const pool = CURIOS.filter((c) => c.rarity === rarity);
  return pool[Math.min(pool.length - 1, Math.floor(r2 * pool.length))];
}

// ───────────── 친구: 선물 · 도움 · 초대 보상 ─────────────
export const GIFT_COINS = 30; // 선물 보내면 나도 받는 감사 코인
export const GIFT_DAILY = 5;
export const HELP_DAILY = 5; // 친구 정원 물 주기
export const HELP_COINS = 15;
/** 친구 수 달성 보상 (초대·코드 추가 모두 포함) */
export const FRIEND_MILESTONES = [
  { n: 1, gems: 5, coins: 200 },
  { n: 3, gems: 10, coins: 500 },
  { n: 5, gems: 20, coins: 1000 },
  { n: 10, gems: 40, coins: 2500 },
];
