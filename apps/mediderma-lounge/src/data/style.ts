/**
 * 스타일 챌린지: 오늘의 테마에 맞게 룩을 꾸며 출전하고, 공개된 점수표로 심사받는다.
 * 다른 뷰티·패션 게임 분석에서 가져온 원칙 (docs/STYLE_CHALLENGE.md):
 *  - 테마 라운드 + 숫자 속성 점수 → 점수가 어떻게 나왔는지 그대로 보여 준다
 *  - 오늘의 트렌드로 매일 정답이 달라진다 (반복 피로 감소)
 *  - 스타일리스트 팁: 가진 아이템 중 점수를 가장 많이 올리는 한 수를 알려 준다 (개인화)
 *  - 연속 출전 보상이 점점 커진다 (평평한 출석 보상 대신)
 */
import { FASHION_MAP, type Slot } from "./game";

export const STYLES = ["cute", "elegant", "natural", "glam", "chic"] as const;
export type Style = (typeof STYLES)[number];
export const STYLE_META: Record<Style, { ko: string; en: string; color: string }> = {
  cute: { ko: "큐트", en: "Cute", color: "#f29bb1" },
  elegant: { ko: "엘레강스", en: "Elegant", color: "#c9a66b" },
  natural: { ko: "내추럴", en: "Natural", color: "#7fc8a9" },
  glam: { ko: "글램", en: "Glam", color: "#b9a2e8" },
  chic: { ko: "시크", en: "Chic", color: "#5b4a50" },
};
type V = [number, number, number, number, number]; // cute, elegant, natural, glam, chic (0~5)

/** 아이템별 스타일 수치 (직접 정한 값) */
export const ITEM_STYLE: Record<string, V> = {
  "hair-bob": [4, 1, 3, 0, 1], "hair-twin": [5, 0, 1, 1, 0], "hair-bun": [4, 1, 2, 1, 1], "hair-pony": [2, 1, 3, 1, 3],
  "hair-long": [1, 3, 4, 1, 3], "hair-wave": [1, 3, 1, 5, 2], "hair-updo": [0, 5, 0, 3, 3], "hair-pixie": [1, 0, 2, 1, 5],
  "hair-space": [5, 0, 0, 2, 1], "hair-braid": [3, 2, 4, 0, 1], "hair-hime": [2, 3, 1, 1, 4],
  "fit-pastel": [5, 1, 2, 0, 0], "fit-lav": [4, 2, 1, 1, 0], "fit-peach": [3, 2, 4, 0, 1], "fit-uniform": [0, 3, 2, 0, 5],
  "fit-black": [0, 4, 0, 3, 5], "fit-gown": [0, 5, 0, 5, 1], "fit-mint": [4, 1, 3, 0, 0], "fit-casual": [2, 0, 5, 0, 2],
  "fit-denim": [2, 0, 4, 0, 3], "fit-rose": [1, 3, 0, 4, 2], "fit-suit": [0, 2, 0, 1, 5], "fit-pure": [1, 5, 2, 2, 1],
  "acc-ribbon": [5, 1, 0, 0, 0], "acc-flower": [3, 1, 4, 0, 0], "acc-beret": [2, 2, 1, 0, 4], "acc-tiara": [1, 4, 0, 5, 0],
  "acc-headband": [3, 3, 1, 0, 1], "acc-glasses": [1, 0, 2, 0, 4], "acc-cap": [2, 0, 4, 0, 2],
  "ear-pearl": [1, 4, 1, 1, 2], "ear-gold": [0, 2, 0, 4, 3], "neck-pearl": [1, 5, 1, 1, 1], "neck-gold": [0, 1, 0, 4, 4],
  "bag-mini": [4, 0, 2, 0, 1], "bag-black": [0, 2, 0, 1, 5],
  "shoe-pink": [5, 1, 0, 0, 0], "shoe-white": [1, 0, 5, 0, 2], "shoe-gold": [0, 3, 0, 5, 2],
  "mk-natural": [1, 1, 5, 0, 1], "mk-peach": [4, 1, 3, 0, 0], "mk-rose": [0, 2, 0, 5, 2],
  "nail-pink": [4, 1, 1, 1, 0], "nail-gold": [0, 2, 0, 5, 2],
  "mk-coral": [3, 1, 3, 1, 1], "mk-lavender": [4, 2, 0, 2, 1],
  "base-skin": [1, 0, 5, 0, 1], "base-glow": [3, 2, 4, 2, 0], "base-matte": [0, 3, 1, 2, 4], "base-toneup": [4, 1, 3, 0, 1], "base-satin": [1, 4, 2, 3, 2],
  "sh-brown": [1, 1, 4, 0, 3], "sh-pink": [5, 1, 1, 1, 0], "sh-peach": [4, 1, 3, 1, 0], "sh-gold": [0, 4, 0, 5, 1], "sh-smoky": [0, 1, 0, 4, 5],
  "lip-mlbb": [1, 2, 4, 0, 3], "lip-coral": [4, 1, 3, 1, 0], "lip-pink": [5, 1, 2, 0, 0], "lip-red": [0, 4, 0, 5, 3], "lip-berry": [0, 3, 0, 4, 4],
};
/** 슬롯 가중치: 옷·헤어가 룩의 인상을 가장 크게 좌우한다 */
export const SLOT_WEIGHT: Record<Slot, number> = { outfit: 3, hair: 2, makeup: 1.5, lip: 1.2, base: 1, shadow: 1, shoes: 1.2, accessory: 1, bag: 1, necklace: 0.8, earring: 0.7, nail: 0.6 };
export const SLOTS = Object.keys(SLOT_WEIGHT) as Slot[];

export interface Theme { id: string; ko: string; en: string; descKo: string; descEn: string; w: V; hue?: string }
/** 테마: 스타일별 가중치 (합 1 근처). hue 가 있으면 그 색 계열 아이템에 보너스 */
export const THEMES: Theme[] = [
  { id: "picnic", ko: "봄 피크닉", en: "Spring Picnic", descKo: "햇살 아래 가볍고 사랑스럽게", descEn: "Light and lovely in the sunshine", w: [0.4, 0.05, 0.45, 0, 0.1], hue: "pastel" },
  { id: "redcarpet", ko: "레드카펫 갈라", en: "Red Carpet Gala", descKo: "플래시 세례를 받을 화려함", descEn: "Glamour made for the flashbulbs", w: [0, 0.4, 0, 0.5, 0.1], hue: "gold" },
  { id: "office", ko: "프로 오피스 룩", en: "Pro Office Look", descKo: "단정하고 신뢰감 있게", descEn: "Neat and trustworthy", w: [0, 0.3, 0.15, 0, 0.55], hue: "dark" },
  { id: "kstage", ko: "K-팝 무대", en: "K-pop Stage", descKo: "무대 위에서 빛나는 존재감", descEn: "Shine on stage", w: [0.3, 0, 0, 0.45, 0.25] },
  { id: "wedding", ko: "웨딩 하객", en: "Wedding Guest", descKo: "우아하지만 주인공보다 튀지 않게", descEn: "Elegant without upstaging the couple", w: [0.15, 0.55, 0.2, 0.1, 0], hue: "pastel" },
  { id: "cafe", ko: "카페 데이트", en: "Café Date", descKo: "편안함 속에 설렘 한 스푼", descEn: "Comfy with a spoonful of flutter", w: [0.35, 0.15, 0.35, 0, 0.15] },
  { id: "spa", ko: "스파 & 웰니스 데이", en: "Spa & Wellness Day", descKo: "맨얼굴처럼 맑고 편안하게", descEn: "Clear and relaxed, barely-there", w: [0.1, 0.1, 0.7, 0, 0.1], hue: "white" },
  { id: "night", ko: "시티 나이트", en: "City Night", descKo: "도시의 밤을 닮은 세련됨", descEn: "Sleek like the city at night", w: [0, 0.15, 0, 0.35, 0.5], hue: "dark" },
  { id: "princess", ko: "로열 티파티", en: "Royal Tea Party", descKo: "동화 속 공주님의 오후", descEn: "A fairytale afternoon", w: [0.45, 0.4, 0, 0.15, 0], hue: "pastel" },
  { id: "campus", ko: "캠퍼스 데일리", en: "Campus Daily", descKo: "꾸안꾸의 정석", descEn: "Effortlessly put together", w: [0.2, 0, 0.45, 0, 0.35] },
];

/** 날짜 문자열 → 결정적 정수 (같은 날이면 모두 같은 테마) */
export const dayHash = (d: string) => [...d].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
export const themeOfDay = (d: string) => THEMES[dayHash(d) % THEMES.length];
/** 오늘의 트렌드 스타일: 테마와 따로 돈다. 해당 스타일 점수 ×1.5 */
export const trendOfDay = (d: string): Style => STYLES[(dayHash(d + "#trend") >>> 3) % STYLES.length];
export const TREND_BOOST = 1.5;

/** 색 계열 판정 (테마 hue 보너스) */
export function hueOf(hex?: string): "pastel" | "gold" | "dark" | "white" | "vivid" | null {
  if (!hex) return null;
  const n = parseInt(hex.slice(1), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 510, s = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
  if (l < 0.25) return "dark";
  if (l > 0.93 && s < 0.6) return "white";
  if (r > 200 && g > 160 && b < 140 && r - b > 70) return "gold";
  if (l > 0.72) return "pastel";
  return "vivid";
}

export type Fit = Partial<Record<Slot, string | null>>;
export interface Score { total: number; grade: "S" | "A" | "B" | "C" | "D"; byStyle: Record<Style, number>; bySlot: Partial<Record<Slot, number>>; hueBonus: number }
/** 이 정도면 만점 근처 (S) */
export const SCORE_MAX = 100;

/** 아이템 하나가 이 슬롯에서 받는 점수 */
function itemPts(id: string, slot: Slot, theme: Theme, trend: Style, by?: Record<Style, number>) {
  const v = ITEM_STYLE[id]; if (!v) return { pts: 0, hue: 0 };
  let pts = 0;
  STYLES.forEach((st, i) => {
    const p = v[i] * theme.w[i] * (st === trend ? TREND_BOOST : 1) * SLOT_WEIGHT[slot];
    if (by) by[st] += p;
    pts += p;
  });
  const hue = theme.hue && hueOf(FASHION_MAP[id]?.color) === theme.hue ? 0.6 * SLOT_WEIGHT[slot] : 0;
  return { pts: pts + hue, hue };
}
const idealCache = new Map<string, number>();
/** 슬롯마다 게임에 있는 가장 잘 맞는 아이템을 걸쳤을 때의 점수 = 100점 기준 */
function idealOf(theme: Theme, trend: Style) {
  const k = `${theme.id}|${trend}`;
  let v = idealCache.get(k);
  if (v === undefined) {
    v = 0;
    for (const slot of SLOTS) v += Math.max(0, ...Object.keys(ITEM_STYLE).filter((id) => FASHION_MAP[id]?.slot === slot).map((id) => itemPts(id, slot, theme, trend).pts));
    idealCache.set(k, v);
  }
  return v;
}

export function scoreFit(fit: Fit, theme: Theme, trend: Style): Score {
  const byStyle = Object.fromEntries(STYLES.map((s) => [s, 0])) as Record<Style, number>;
  const bySlot: Partial<Record<Slot, number>> = {};
  let raw = 0, hueBonus = 0;
  for (const slot of SLOTS) {
    const id = fit[slot]; if (!id || !ITEM_STYLE[id]) continue;
    const r = itemPts(id, slot, theme, trend, byStyle);
    bySlot[slot] = r.pts; raw += r.pts; hueBonus += r.hue;
  }
  const total = Math.max(0, Math.min(SCORE_MAX, Math.round((raw / idealOf(theme, trend)) * 100)));
  const grade = total >= 85 ? "S" : total >= 70 ? "A" : total >= 55 ? "B" : total >= 40 ? "C" : "D";
  return { total, grade, byStyle, bySlot, hueBonus };
}

/** 스타일리스트 팁: 가진 아이템으로 한 슬롯만 바꿀 때 점수가 가장 많이 오르는 수 */
export function stylistTip(fit: Fit, owned: string[], theme: Theme, trend: Style): { slot: Slot; id: string; gain: number } | null {
  const base = scoreFit(fit, theme, trend).total;
  let best: { slot: Slot; id: string; gain: number } | null = null;
  for (const id of owned) {
    const it = FASHION_MAP[id]; if (!it || !ITEM_STYLE[id] || fit[it.slot] === id) continue;
    const gain = scoreFit({ ...fit, [it.slot]: id }, theme, trend).total - base;
    if (gain > 0 && (!best || gain > best.gain)) best = { slot: it.slot, id, gain };
  }
  return best;
}

/** 라이벌 출전자 (가상) — 날짜·테마로 정해져 같은 날은 같은 상대 */
export const RIVAL_NAMES = ["Mia", "Yuki", "Linh", "소이", "Anya", "Ploy", "하린", "Sofia"];
export function rivalsOf(d: string, round: number): { name: string; score: number }[] {
  let h = dayHash(`${d}/${round}`);
  const next = () => { h = (h * 1103515245 + 12345) >>> 0; return (h >>> 8) / 16777216; };
  const pool = [...RIVAL_NAMES].sort(() => next() - 0.5).slice(0, 4);
  // 라운드가 오를수록 상대가 강해진다 (점진적 보상 곡선)
  return pool.map((name, i) => ({ name, score: Math.round(34 + round * 6 + next() * 32 + i * 2) })).map((r) => ({ ...r, score: Math.min(98, r.score) }));
}
/** 순위별 보상: 1등부터 5등까지 */
export const PLACE_REWARD = [{ coins: 220, followers: 30 }, { coins: 140, followers: 18 }, { coins: 90, followers: 10 }, { coins: 60, followers: 5 }, { coins: 40, followers: 2 }];
export const CHALLENGE_DAILY = 3;
/** 연속 출전 일수 보너스 (7일 주기로 커진다) */
export const streakBonus = (streak: number) => ({ coins: 30 * Math.min(7, streak), gems: streak > 0 && streak % 7 === 0 ? 10 : 0 });
