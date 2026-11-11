/**
 * 게임 전용 데이터 (실제 상품 정보 아님 — 모두 게임 기획 수치·가상 콘텐츠)
 * 성장 단계, 라운지 등급, 패션, 인테리어, 고객 NPC, 퀘스트, 데모 SNS.
 */
import type { ModeId } from "./devices";

export type ExpKey = "skin" | "device" | "knowledge" | "social" | "fashion" | "lounge";
export const EXP_KEYS: ExpKey[] = ["skin", "device", "knowledge", "social", "fashion", "lounge"];
export const EXP_META: Record<ExpKey, { label: string; color: string }> = {
  skin: { label: "Skin Care", color: "#f29bb1" },
  device: { label: "Device Care", color: "#62c6e8" },
  knowledge: { label: "Beauty Knowledge", color: "#a78be6" },
  social: { label: "Social", color: "#f4b860" },
  fashion: { label: "Fashion", color: "#ef86c3" },
  lounge: { label: "Lounge", color: "#c9a66b" },
};

// ───────────── 캐릭터 성장 5단계 ─────────────
export interface Stage {
  n: number;
  name: string;
  ko: string;
  need: number; // 누적 총 EXP
  /** 프로포션 키프레임 (미터 단위) */
  body: { head: number; torso: number; leg: number; arm: number; shoulder: number; eye: number; limb: number; neck: number };
  rewardGems: number;
}
export const STAGES: Stage[] = [
  { n: 1, name: "BABY BEAUTY", ko: "작고 사랑스러운 첫 만남", need: 0, rewardGems: 0, body: { head: 0.4, torso: 0.3, leg: 0.2, arm: 0.2, shoulder: 0.17, eye: 1, limb: 0.07, neck: 0.0 } },
  { n: 2, name: "LOVELY GIRL", ko: "표정이 풍부해진 러블리 걸", need: 120, rewardGems: 5, body: { head: 0.35, torso: 0.38, leg: 0.38, arm: 0.32, shoulder: 0.18, eye: 0.92, limb: 0.065, neck: 0.03 } },
  { n: 3, name: "BEAUTY LADY", ko: "세련된 비율의 뷰티 레이디", need: 420, rewardGems: 10, body: { head: 0.27, torso: 0.48, leg: 0.68, arm: 0.52, shoulder: 0.2, eye: 0.74, limb: 0.058, neck: 0.07 } },
  { n: 4, name: "PREMIUM BEAUTY", ko: "럭셔리 무드의 프리미엄 뷰티", need: 950, rewardGems: 20, body: { head: 0.245, torso: 0.5, leg: 0.78, arm: 0.57, shoulder: 0.205, eye: 0.68, limb: 0.055, neck: 0.085 } },
  { n: 5, name: "MEDIDERMA ICON", ko: "시그니처 메디더마 아이콘", need: 1800, rewardGems: 50, body: { head: 0.235, torso: 0.52, leg: 0.84, arm: 0.6, shoulder: 0.21, eye: 0.64, limb: 0.053, neck: 0.095 } },
];
export const stageFor = (total: number) => {
  let s = 1;
  for (const st of STAGES) if (total >= st.need) s = st.n;
  return s;
};

// ───────────── 라운지 등급 ─────────────
export interface LoungeLevel { n: number; name: string; w: number; d: number; customers: number; cost: number; lp: number; unlocks: string }
export const LOUNGE_LEVELS: LoungeLevel[] = [
  { n: 1, name: "MY MINI LOUNGE", w: 13, d: 11, customers: 1, cost: 0, lp: 0, unlocks: "리셉션 · 스킨케어 진열대 · DERMA HOME 존" },
  { n: 2, name: "SWEET BEAUTY LOUNGE", w: 16, d: 13, customers: 2, cost: 600, lp: 40, unlocks: "포토존 · 헤드 스파 존 · 두피 루틴" },
  { n: 3, name: "PREMIUM DERMA LOUNGE", w: 19, d: 15, customers: 3, cost: 1800, lp: 140, unlocks: "바디 케어 존 · 바디 루틴 · 브랜드 아이템 진열" },
  { n: 4, name: "LUXURY MEDIDERMA LOUNGE", w: 22, d: 17, customers: 4, cost: 4200, lp: 320, unlocks: "VIP 뷰티 룸 · 블랙&골드 인테리어" },
  { n: 5, name: "GLOBAL BEAUTY FLAGSHIP", w: 25, d: 19, customers: 5, cost: 9000, lp: 700, unlocks: "소셜 라운지 · 플래그십 파사드" },
];

// ───────────── 커스터마이징 / 패션 ─────────────
export const SKIN_TONES = ["#ffe4d2", "#f8d2b8", "#eebf9c", "#d9a47c", "#b97f58", "#8a5a3c"];
export const HAIR_COLORS = ["#3a2a22", "#6b4630", "#c98f5a", "#f1d28a", "#f2a7b8", "#b9a2e8", "#1c1a1f", "#8fc5d9", "#a8452f", "#e8e3dc", "#7fc8a9", "#f08a5d"];
export const EYE_COLORS = ["#4a3326", "#2f5d8a", "#3d7a5a", "#7a4aa0", "#b0563a", "#22202a"];
export const LIP_COLORS = ["#e98c9a", "#d9627a", "#c8483f", "#b86a58", "#f2a6a0"];
export const FACE_SHAPES = ["round", "soft", "oval"] as const;
export const EYE_SHAPES = ["round", "almond", "smile"] as const;
export const BROWS = ["soft", "arch", "straight"] as const;
export const POSES = ["stand", "cute", "model", "heart"] as const;

export type Slot = "hair" | "outfit" | "accessory" | "earring" | "necklace" | "bag" | "shoes" | "makeup" | "nail";
export interface FashionItem {
  id: string; slot: Slot; ko: string; en: string;
  price: number; currency: "coin" | "star" | "gem";
  minStage: number;
  color?: string; accent?: string;
  /** 의상 실루엣 */
  cut?: "puff" | "aline" | "sheath" | "gown" | "pants";
}
const F = (i: FashionItem) => i;
export const FASHION: FashionItem[] = [
  // hair
  F({ id: "hair-bob", slot: "hair", ko: "몽글 보브", en: "Soft Bob", price: 0, currency: "coin", minStage: 1 }),
  F({ id: "hair-twin", slot: "hair", ko: "트윈 테일", en: "Twin Tails", price: 0, currency: "coin", minStage: 1 }),
  F({ id: "hair-bun", slot: "hair", ko: "똥머리 번", en: "Top Bun", price: 150, currency: "coin", minStage: 1 }),
  F({ id: "hair-pony", slot: "hair", ko: "하이 포니테일", en: "High Ponytail", price: 220, currency: "coin", minStage: 2 }),
  F({ id: "hair-long", slot: "hair", ko: "롱 스트레이트", en: "Long Straight", price: 380, currency: "coin", minStage: 2 }),
  F({ id: "hair-wave", slot: "hair", ko: "글램 웨이브", en: "Glam Wave", price: 30, currency: "star", minStage: 3 }),
  F({ id: "hair-updo", slot: "hair", ko: "시그니처 업두", en: "Signature Updo", price: 25, currency: "gem", minStage: 4 }),
  F({ id: "hair-pixie", slot: "hair", ko: "픽시 컷", en: "Pixie Cut", price: 120, currency: "coin", minStage: 1 }),
  F({ id: "hair-space", slot: "hair", ko: "스페이스 번", en: "Space Buns", price: 180, currency: "coin", minStage: 1 }),
  F({ id: "hair-braid", slot: "hair", ko: "사이드 브레이드", en: "Side Braid", price: 260, currency: "coin", minStage: 2 }),
  F({ id: "hair-hime", slot: "hair", ko: "히메 컷", en: "Hime Cut", price: 20, currency: "star", minStage: 2 }),
  // outfit
  F({ id: "fit-pastel", slot: "outfit", ko: "파스텔 퍼프 원피스", en: "Pastel Puff Dress", price: 0, currency: "coin", minStage: 1, color: "#f9c6d3", accent: "#fff8f0", cut: "puff" }),
  F({ id: "fit-lav", slot: "outfit", ko: "라벤더 리본 원피스", en: "Lavender Ribbon Dress", price: 180, currency: "coin", minStage: 1, color: "#d9cff2", accent: "#ffffff", cut: "puff" }),
  F({ id: "fit-peach", slot: "outfit", ko: "피치 A라인", en: "Peach A-line", price: 320, currency: "coin", minStage: 2, color: "#f6c9a8", accent: "#fff3e6", cut: "aline" }),
  F({ id: "fit-uniform", slot: "outfit", ko: "라운지 매니저 유니폼", en: "Lounge Manager Uniform", price: 520, currency: "coin", minStage: 3, color: "#fff8f0", accent: "#c9a66b", cut: "sheath" }),
  F({ id: "fit-black", slot: "outfit", ko: "프리미엄 블랙 드레스", en: "Premium Black Dress", price: 60, currency: "star", minStage: 4, color: "#1b1719", accent: "#c9a66b", cut: "sheath" }),
  F({ id: "fit-gown", slot: "outfit", ko: "샴페인 골드 가운", en: "Champagne Gold Gown", price: 60, currency: "gem", minStage: 5, color: "#e6cf9f", accent: "#fff6dd", cut: "gown" }),
  F({ id: "fit-mint", slot: "outfit", ko: "민트 퍼프 원피스", en: "Mint Puff Dress", price: 160, currency: "coin", minStage: 1, color: "#bfe8d6", accent: "#ffffff", cut: "puff" }),
  F({ id: "fit-casual", slot: "outfit", ko: "데일리 캐주얼", en: "Daily Casual", price: 200, currency: "coin", minStage: 1, color: "#ffffff", accent: "#f29bb1", cut: "pants" }),
  F({ id: "fit-denim", slot: "outfit", ko: "데님 A라인", en: "Denim A-line", price: 280, currency: "coin", minStage: 2, color: "#7fa3d1", accent: "#ffffff", cut: "aline" }),
  F({ id: "fit-rose", slot: "outfit", ko: "로즈 시스 드레스", en: "Rose Sheath Dress", price: 420, currency: "coin", minStage: 3, color: "#e2718d", accent: "#ffd6e0", cut: "sheath" }),
  F({ id: "fit-suit", slot: "outfit", ko: "블랙 팬츠 수트", en: "Black Pantsuit", price: 45, currency: "star", minStage: 3, color: "#221d1f", accent: "#c9a66b", cut: "pants" }),
  F({ id: "fit-pure", slot: "outfit", ko: "퓨어 화이트 가운", en: "Pure White Gown", price: 40, currency: "gem", minStage: 4, color: "#fffaf5", accent: "#e9d6b0", cut: "gown" }),
  // accessory (head)
  F({ id: "acc-ribbon", slot: "accessory", ko: "핑크 리본", en: "Pink Ribbon", price: 0, currency: "coin", minStage: 1, color: "#ef86a8" }),
  F({ id: "acc-flower", slot: "accessory", ko: "플라워 핀", en: "Flower Pin", price: 120, currency: "coin", minStage: 1, color: "#ffffff" }),
  F({ id: "acc-beret", slot: "accessory", ko: "크림 베레모", en: "Cream Beret", price: 260, currency: "coin", minStage: 2, color: "#f3e6d0" }),
  F({ id: "acc-tiara", slot: "accessory", ko: "골드 티아라", en: "Gold Tiara", price: 40, currency: "gem", minStage: 4, color: "#d8b468" }),
  F({ id: "acc-headband", slot: "accessory", ko: "새틴 헤어밴드", en: "Satin Headband", price: 110, currency: "coin", minStage: 1, color: "#b9a2e8" }),
  F({ id: "acc-glasses", slot: "accessory", ko: "라운드 안경", en: "Round Glasses", price: 150, currency: "coin", minStage: 1, color: "#d8b468" }),
  F({ id: "acc-cap", slot: "accessory", ko: "볼캡", en: "Ball Cap", price: 170, currency: "coin", minStage: 1, color: "#f29bb1" }),
  // earrings / necklace / bag / shoes
  F({ id: "ear-pearl", slot: "earring", ko: "진주 귀걸이", en: "Pearl Earrings", price: 200, currency: "coin", minStage: 2, color: "#fdf6ee" }),
  F({ id: "ear-gold", slot: "earring", ko: "골드 드롭 귀걸이", en: "Gold Drop Earrings", price: 40, currency: "star", minStage: 3, color: "#d8b468" }),
  F({ id: "neck-pearl", slot: "necklace", ko: "진주 목걸이", en: "Pearl Necklace", price: 260, currency: "coin", minStage: 2, color: "#fdf6ee" }),
  F({ id: "neck-gold", slot: "necklace", ko: "골드 체인", en: "Gold Chain", price: 45, currency: "star", minStage: 3, color: "#d8b468" }),
  F({ id: "bag-mini", slot: "bag", ko: "미니 크로스백", en: "Mini Cross Bag", price: 240, currency: "coin", minStage: 2, color: "#f29bb1" }),
  F({ id: "bag-black", slot: "bag", ko: "블랙 토트", en: "Black Tote", price: 50, currency: "star", minStage: 3, color: "#1b1719" }),
  F({ id: "shoe-pink", slot: "shoes", ko: "핑크 메리제인", en: "Pink Mary Janes", price: 0, currency: "coin", minStage: 1, color: "#ef9ab0" }),
  F({ id: "shoe-white", slot: "shoes", ko: "화이트 스니커즈", en: "White Sneakers", price: 140, currency: "coin", minStage: 1, color: "#ffffff" }),
  F({ id: "shoe-gold", slot: "shoes", ko: "골드 힐", en: "Gold Heels", price: 35, currency: "star", minStage: 3, color: "#d8b468" }),
  // makeup / nail
  F({ id: "mk-natural", slot: "makeup", ko: "내추럴", en: "Natural", price: 0, currency: "coin", minStage: 1, color: "#f7b3bd" }),
  F({ id: "mk-peach", slot: "makeup", ko: "피치 블러셔", en: "Peach Blush", price: 120, currency: "coin", minStage: 1, color: "#f6a98a" }),
  F({ id: "mk-rose", slot: "makeup", ko: "로즈 글램", en: "Rose Glam", price: 260, currency: "coin", minStage: 3, color: "#e2718d" }),
  F({ id: "nail-pink", slot: "nail", ko: "베이비 핑크 네일", en: "Baby Pink Nails", price: 80, currency: "coin", minStage: 1, color: "#f7a8bd" }),
  F({ id: "nail-gold", slot: "nail", ko: "골드 글리터 네일", en: "Gold Glitter Nails", price: 20, currency: "star", minStage: 3, color: "#d8b468" }),
];
export const FASHION_MAP: Record<string, FashionItem> = Object.fromEntries(FASHION.map((f) => [f.id, f]));
export const STARTER_FASHION = FASHION.filter((f) => f.price === 0).map((f) => f.id);

// ───────────── 인테리어 ─────────────
export interface InteriorItem { id: string; ko: string; en: string; price: number; currency: "coin" | "star" | "gem"; minLounge: number; kind: "furniture" | "floor" | "wall" | "light"; color?: string; accent?: string }
const I = (i: InteriorItem) => i;
export const INTERIOR: InteriorItem[] = [
  I({ id: "plant", ko: "몬스테라 화분", en: "Monstera Plant", price: 90, currency: "coin", minLounge: 1, kind: "furniture" }),
  I({ id: "flower", ko: "튤립 꽃병", en: "Tulip Vase", price: 70, currency: "coin", minLounge: 1, kind: "furniture" }),
  I({ id: "sofa", ko: "핑크 벨벳 소파", en: "Pink Velvet Sofa", price: 260, currency: "coin", minLounge: 1, kind: "furniture" }),
  I({ id: "mirror", ko: "아치 전신거울", en: "Arch Mirror", price: 220, currency: "coin", minLounge: 1, kind: "furniture" }),
  I({ id: "vanity", ko: "화장대", en: "Vanity Table", price: 340, currency: "coin", minLounge: 1, kind: "furniture" }),
  I({ id: "lamp", ko: "플로어 램프", en: "Floor Lamp", price: 150, currency: "coin", minLounge: 1, kind: "furniture" }),
  I({ id: "display", ko: "원형 제품 진열대", en: "Round Product Display", price: 300, currency: "coin", minLounge: 2, kind: "furniture" }),
  I({ id: "stand", ko: "디바이스 거치대", en: "Device Stand", price: 280, currency: "coin", minLounge: 2, kind: "furniture" }),
  I({ id: "rug", ko: "라운드 러그", en: "Round Rug", price: 120, currency: "coin", minLounge: 1, kind: "furniture" }),
  I({ id: "logo", ko: "브랜드 로고 사인", en: "Brand Logo Sign", price: 30, currency: "star", minLounge: 2, kind: "furniture" }),
  I({ id: "arch", ko: "플라워 아치 포토존", en: "Flower Arch Photo Zone", price: 50, currency: "star", minLounge: 2, kind: "furniture" }),
  I({ id: "goldtable", ko: "골드 사이드 테이블", en: "Gold Side Table", price: 20, currency: "gem", minLounge: 3, kind: "furniture" }),
  I({ id: "armchair", ko: "벨벳 암체어", en: "Velvet Armchair", price: 190, currency: "coin", minLounge: 1, kind: "furniture" }),
  I({ id: "coffeetable", ko: "마블 커피 테이블", en: "Marble Coffee Table", price: 170, currency: "coin", minLounge: 1, kind: "furniture" }),
  I({ id: "bookshelf", ko: "뷰티 매거진 책장", en: "Magazine Bookshelf", price: 260, currency: "coin", minLounge: 1, kind: "furniture" }),
  I({ id: "diffuser", ko: "아로마 디퓨저", en: "Aroma Diffuser", price: 90, currency: "coin", minLounge: 1, kind: "furniture" }),
  I({ id: "petbed", ko: "펫 쿠션", en: "Pet Cushion", price: 120, currency: "coin", minLounge: 1, kind: "furniture" }),
  I({ id: "cattower", ko: "캣 타워", en: "Cat Tower", price: 320, currency: "coin", minLounge: 1, kind: "furniture" }),
  I({ id: "partition", ko: "라탄 파티션", en: "Rattan Partition", price: 240, currency: "coin", minLounge: 2, kind: "furniture" }),
  I({ id: "aquarium", ko: "아쿠아리움", en: "Aquarium", price: 35, currency: "star", minLounge: 2, kind: "furniture" }),
  // themes
  I({ id: "floor-cream", ko: "크림 우드 바닥", en: "Cream Wood Floor", price: 0, currency: "coin", minLounge: 1, kind: "floor", color: "#f3e3cf", accent: "#ead6bd" }),
  I({ id: "floor-pink", ko: "핑크 마블 바닥", en: "Pink Marble Floor", price: 400, currency: "coin", minLounge: 1, kind: "floor", color: "#f9dfe4", accent: "#f3ccd4" }),
  I({ id: "floor-lav", ko: "라벤더 타일 바닥", en: "Lavender Tile Floor", price: 400, currency: "coin", minLounge: 2, kind: "floor", color: "#e6defa", accent: "#d6caf3" }),
  I({ id: "floor-black", ko: "블랙 마블 바닥", en: "Black Marble Floor", price: 40, currency: "gem", minLounge: 4, kind: "floor", color: "#2a2527", accent: "#3a3336" }),
  I({ id: "wall-cream", ko: "크림 화이트 벽", en: "Cream White Wall", price: 0, currency: "coin", minLounge: 1, kind: "wall", color: "#fff6ec", accent: "#f9d5dc" }),
  I({ id: "wall-pink", ko: "소프트 핑크 벽", en: "Soft Pink Wall", price: 350, currency: "coin", minLounge: 1, kind: "wall", color: "#fbe1e6", accent: "#ffffff" }),
  I({ id: "wall-lav", ko: "파스텔 라벤더 벽", en: "Pastel Lavender Wall", price: 350, currency: "coin", minLounge: 2, kind: "wall", color: "#e9e2fa", accent: "#ffffff" }),
  I({ id: "wall-black", ko: "프리미엄 블랙&골드 벽", en: "Premium Black & Gold Wall", price: 40, currency: "gem", minLounge: 4, kind: "wall", color: "#211d1f", accent: "#c9a66b" }),
  I({ id: "light-warm", ko: "웜 라이팅", en: "Warm Lighting", price: 0, currency: "coin", minLounge: 1, kind: "light", color: "#fff1e0" }),
  I({ id: "light-pink", ko: "로지 라이팅", en: "Rosy Lighting", price: 200, currency: "coin", minLounge: 1, kind: "light", color: "#ffdbe6" }),
  I({ id: "light-gold", ko: "샴페인 라이팅", en: "Champagne Lighting", price: 25, currency: "star", minLounge: 3, kind: "light", color: "#ffe6b8" }),
];
export const INTERIOR_MAP: Record<string, InteriorItem> = Object.fromEntries(INTERIOR.map((f) => [f.id, f]));

// ───────────── 고객 NPC (가상 인물) ─────────────
export interface CustomerType {
  id: string; ko: string; en: string;
  /** 선호 루틴 id — 추천이 맞으면 만족도↑ */
  likes: string[];
  ask: { ko: string; en: string };
  minLounge: number;
  pay: number;
  revisit: number; // 재방문 성향 0~1
  look: { hair: string; hairColor: string; outfit: string; skin: string };
}
export const CUSTOMER_TYPES: CustomerType[] = [
  { id: "beginner", ko: "뷰티 초보 고객", en: "Beauty Beginner", likes: ["calming", "depuff"], minLounge: 1, pay: 100, revisit: 0.5,
    ask: { ko: "디바이스는 처음이에요. 부담 없이 순하게 시작하고 싶어요.", en: "It's my first time with a device. Something gentle to start, please." },
    look: { hair: "hair-bob", hairColor: "#6b4630", outfit: "fit-lav", skin: "#f8d2b8" } },
  { id: "office", ko: "직장인", en: "Office Worker", likes: ["depuff", "makeup-ready"], minLounge: 1, pay: 110, revisit: 0.6,
    ask: { ko: "출근 전에 5분밖에 없어요. 빠르게 관리받고 싶어요!", en: "I only have five minutes before work. Something quick!" },
    look: { hair: "hair-pony", hairColor: "#1c1a1f", outfit: "fit-uniform", skin: "#eebf9c" } },
  { id: "influencer", ko: "패션 인플루언서", en: "Fashion Influencer", likes: ["makeup-ready", "brightening"], minLounge: 1, pay: 140, revisit: 0.4,
    ask: { ko: "오늘 촬영이 있어요. 화장이 잘 받는 관리 있을까요?", en: "I have a shoot today. Anything that preps skin for makeup?" },
    look: { hair: "hair-wave", hairColor: "#f1d28a", outfit: "fit-peach", skin: "#ffe4d2" } },
  { id: "creator", ko: "뷰티 크리에이터", en: "Beauty Creator", likes: ["brightening", "wrinkle"], minLounge: 2, pay: 170, revisit: 0.5,
    ask: { ko: "나이트 30분 루틴을 제대로 체험하고 리뷰하고 싶어요.", en: "I'd like to try a full 30-minute night routine and review it." },
    look: { hair: "hair-long", hairColor: "#f2a7b8", outfit: "fit-pastel", skin: "#f8d2b8" } },
  { id: "scalp", ko: "두피 관리 관심 고객", en: "Scalp Care Guest", likes: ["scalp-care"], minLounge: 2, pay: 200, revisit: 0.7,
    ask: { ko: "요즘 두피 관리에 관심이 많아요. 두피 프로그램이 있나요?", en: "I'm into scalp care lately. Do you have a scalp program?" },
    look: { hair: "hair-bun", hairColor: "#3a2a22", outfit: "fit-lav", skin: "#d9a47c" } },
  { id: "premium", ko: "프리미엄 케어 고객", en: "Premium Care Guest", likes: ["wrinkle", "brightening"], minLounge: 3, pay: 260, revisit: 0.7,
    ask: { ko: "탄탄한 느낌의 집중 케어 프로그램을 추천해 주세요.", en: "Please recommend an intensive, firming-themed program." },
    look: { hair: "hair-updo", hairColor: "#1c1a1f", outfit: "fit-black", skin: "#eebf9c" } },
  { id: "tourist", ko: "글로벌 관광객", en: "Global Tourist", likes: ["calming", "body-circulation"], minLounge: 3, pay: 230, revisit: 0.2,
    ask: { ko: "긴 비행으로 지쳤어요. 편안하게 풀어 주는 관리가 좋겠어요.", en: "Long flight… I'd love something relaxing." },
    look: { hair: "hair-wave", hairColor: "#c98f5a", outfit: "fit-peach", skin: "#b97f58" } },
  { id: "vip", ko: "VIP 고객", en: "VIP Guest", likes: ["brightening", "wrinkle", "scalp-care"], minLounge: 4, pay: 400, revisit: 0.9,
    ask: { ko: "오늘은 시그니처 풀코스로 부탁드려요.", en: "The signature full course today, please." },
    look: { hair: "hair-updo", hairColor: "#8a5a3c", outfit: "fit-gown", skin: "#ffe4d2" } },
];
export const CUSTOMER_NAMES = ["하린", "Mia", "소이", "Yuki", "Linh", "Nara", "Sofia", "지우", "Anya", "Ploy", "Emma", "서아"];

// ───────────── 퀘스트 ─────────────
export interface Quest { id: string; ko: string; en: string; stat: string; goal: number; daily: boolean; reward: { coins?: number; gems?: number; stars?: number; lp?: number; item?: string } }
export const QUESTS: Quest[] = [
  { id: "d-care", ko: "오늘의 뷰티 루틴 1회 완료", en: "Finish 1 beauty routine today", stat: "d.care", goal: 1, daily: true, reward: { coins: 80 } },
  { id: "d-customer", ko: "고객 1명 케어하기", en: "Care for 1 customer", stat: "d.customer", goal: 1, daily: true, reward: { coins: 100, lp: 5 } },
  { id: "d-post", ko: "뷰티 피드에 게시물 올리기", en: "Post to the Beauty Feed", stat: "d.post", goal: 1, daily: true, reward: { stars: 5 } },
  { id: "d-like", ko: "친구 게시물에 좋아요 3번", en: "Like 3 posts", stat: "d.like", goal: 3, daily: true, reward: { stars: 3 } },
  { id: "q-first", ko: "첫 디바이스 케어 완료", en: "Complete your first device care", stat: "care", goal: 1, daily: false, reward: { coins: 150, item: "serum-mist" } },
  { id: "q-3modes", ko: "RF·울트라소닉·이온토 모두 체험", en: "Try RF, Ultrasonic and Iontophoresis", stat: "modes", goal: 3, daily: false, reward: { gems: 5 } },
  { id: "q-routines", ko: "공식 루틴 3종 완료", en: "Complete 3 official routines", stat: "routines", goal: 3, daily: false, reward: { gems: 8, coins: 300 } },
  { id: "q-collect", ko: "제품 도감 8종 등록", en: "Register 8 products in the collection", stat: "codex", goal: 8, daily: false, reward: { gems: 10 } },
  { id: "q-customers", ko: "고객 10명 케어", en: "Care for 10 customers", stat: "customers", goal: 10, daily: false, reward: { coins: 500, lp: 30 } },
  { id: "q-style", ko: "패션 아이템 5개 수집", en: "Collect 5 fashion items", stat: "fashionBought", goal: 5, daily: false, reward: { stars: 15 } },
  { id: "q-deco", ko: "가구 3개 배치", en: "Place 3 furniture pieces", stat: "placed", goal: 3, daily: false, reward: { coins: 200 } },
  { id: "q-lounge2", ko: "라운지 LEVEL 2 달성", en: "Reach Lounge LEVEL 2", stat: "loungeLevel", goal: 2, daily: false, reward: { gems: 10 } },
];

// ───────────── 데모 SNS (가상 계정 — 실제 사용자 아님) ─────────────
export const DEMO_FRIENDS = [
  { id: "f-mia", name: "Mia", country: "US", level: 3, stage: 3, hair: "hair-wave", hairColor: "#f1d28a", outfit: "fit-peach", skin: "#ffe4d2", wall: "wall-pink", floor: "floor-cream" },
  { id: "f-yuki", name: "Yuki", country: "JP", level: 2, stage: 2, hair: "hair-twin", hairColor: "#f2a7b8", outfit: "fit-lav", skin: "#f8d2b8", wall: "wall-lav", floor: "floor-lav" },
  { id: "f-linh", name: "Linh", country: "VN", level: 4, stage: 4, hair: "hair-long", hairColor: "#1c1a1f", outfit: "fit-black", skin: "#eebf9c", wall: "wall-black", floor: "floor-black" },
];
export const DEMO_POSTS = [
  { id: "p-demo1", author: "Mia", country: "US", text: "Brightening routine done 오늘의 라운지 루틴 인증!", tag: "#BeautyRoutine", likes: 128, hue: 340 },
  { id: "p-demo2", author: "Yuki", country: "JP", text: "新しいラベンダーのワンピース 포토존에서 한 컷", tag: "#OOTD", likes: 96, hue: 265 },
  { id: "p-demo3", author: "Linh", country: "VN", text: "LEVEL 4 라운지 오픈! Black & Gold 인테리어 공개", tag: "#LoungeStory", likes: 214, hue: 40 },
];

export const MODE_ORDER: ModeId[] = ["rf", "us", "ionto"];

// ───────────── 캐릭터 프리셋 (생성 화면의 빠른 선택) ─────────────
export const LOOK_PRESETS: { id: string; ko: string; en: string; look: Record<string, string> }[] = [
  { id: "sweet", ko: "스위트", en: "Sweet", look: { skin: "#ffe4d2", hairColor: "#6b4630", eyeColor: "#4a3326", hair: "hair-bob", face: "round", eyes: "round" } },
  { id: "sunny", ko: "써니", en: "Sunny", look: { skin: "#eebf9c", hairColor: "#f1d28a", eyeColor: "#2f5d8a", hair: "hair-twin", face: "soft", eyes: "smile" } },
  { id: "cocoa", ko: "코코아", en: "Cocoa", look: { skin: "#b97f58", hairColor: "#1c1a1f", eyeColor: "#4a3326", hair: "hair-bob", face: "round", eyes: "almond" } },
  { id: "berry", ko: "베리", en: "Berry", look: { skin: "#f8d2b8", hairColor: "#f2a7b8", eyeColor: "#7a4aa0", hair: "hair-twin", face: "oval", eyes: "round" } },
  { id: "mocha", ko: "모카", en: "Mocha", look: { skin: "#8a5a3c", hairColor: "#3a2a22", eyeColor: "#3d7a5a", hair: "hair-bob", face: "soft", eyes: "round" } },
  { id: "luna", ko: "루나", en: "Luna", look: { skin: "#d9a47c", hairColor: "#b9a2e8", eyeColor: "#22202a", hair: "hair-twin", face: "oval", eyes: "almond" } },
];

// ───────────── 라운지 펫 ─────────────
export interface PetType { id: string; kind: "cat" | "dog"; ko: string; en: string; color: string; accent: string; price: number }
export const PET_TYPES: PetType[] = [
  { id: "cat-cream", kind: "cat", ko: "크림 고양이", en: "Cream Cat", color: "#fff3e2", accent: "#f2c9a0", price: 300 },
  { id: "cat-gray", kind: "cat", ko: "회색 고양이", en: "Gray Cat", color: "#9aa0a8", accent: "#e9ecef", price: 300 },
  { id: "cat-black", kind: "cat", ko: "턱시도 고양이", en: "Tuxedo Cat", color: "#2a2628", accent: "#ffffff", price: 450 },
  { id: "dog-gold", kind: "dog", ko: "골든 강아지", en: "Golden Puppy", color: "#e3b877", accent: "#f6dfb8", price: 300 },
  { id: "dog-white", kind: "dog", ko: "화이트 강아지", en: "White Puppy", color: "#ffffff", accent: "#f3e6d8", price: 300 },
  { id: "dog-brown", kind: "dog", ko: "초코 강아지", en: "Choco Puppy", color: "#7a5236", accent: "#d9b48a", price: 450 },
];
export const PET_MAP: Record<string, PetType> = Object.fromEntries(PET_TYPES.map((p) => [p.id, p]));
export const MAX_PETS = 3;

// ───────────── DERMA HOME 추가 스테이션 (n번째 증설 비용) ─────────────
export const STATION_COSTS = [400, 900, 1800, 3200, 5000];

// ───────────── 라운지 등급 (UNI&CORE New Benefit Plan v1 의 직급 체계를 게임 규칙으로 옮김) ─────────────
/**
 * 직급 이름·코드·순서와 승급 조건의 구조(GTV·STV·PLV 세 기준, 단계마다 2배)는 공식 안내서 그대로다.
 * 수치는 공식 표의 1/10 로 줄인 **게임 수치**이고, 세 기준의 의미도 게임 활동으로 바꿨다:
 *   GTV(전체) = 게임 PV 합계 (제품 구매 + 제품 소비 + 고객 등록)
 *   STV(사이드) = 고객 등록 포인트 (케어한 고객에게서 쌓임)
 *   PLV(파워)  = 제품 소비 PV (케어에 실제로 쓴 제품)
 * 게임 등급은 실제 유니앤코어 직급·소득과 무관하다.
 */
export interface Rank { n: number; code: string; ko: string; en: string; gtv: number; stv: number; plv: number; coins: number; gems: number; color: string }
export const RANKS: Rank[] = [
  { n: 1, code: "M", ko: "매니저", en: "Manager", gtv: 100, stv: 0, plv: 0, coins: 100, gems: 2, color: "#f29bb1" },
  { n: 2, code: "TM", ko: "팀 매니저", en: "Team Manager", gtv: 500, stv: 50, plv: 0, coins: 200, gems: 4, color: "#ef86c3" },
  { n: 3, code: "DR", ko: "디렉터", en: "Director", gtv: 1000, stv: 100, plv: 100, coins: 400, gems: 6, color: "#b9a2e8" },
  { n: 4, code: "ED", ko: "이그제큐티브 디렉터", en: "Executive Director", gtv: 2000, stv: 200, plv: 200, coins: 700, gems: 8, color: "#8fb7ee" },
  { n: 5, code: "ID", ko: "인터내셔널 디렉터", en: "International Director", gtv: 4000, stv: 400, plv: 400, coins: 1100, gems: 10, color: "#62c6e8" },
  { n: 6, code: "VP", ko: "바이스프레지던트", en: "Vice President", gtv: 8000, stv: 800, plv: 800, coins: 1600, gems: 14, color: "#6fcfa6" },
  { n: 7, code: "IVP", ko: "인터내셔날 바이스 프레지던트", en: "International Vice President", gtv: 16000, stv: 1600, plv: 1600, coins: 2200, gems: 18, color: "#e6c15a" },
  { n: 8, code: "PD", ko: "프레지던트", en: "President", gtv: 32000, stv: 3200, plv: 3200, coins: 3000, gems: 24, color: "#d8a048" },
  { n: 9, code: "IPD", ko: "인터내셔널PD", en: "International PD", gtv: 64000, stv: 6400, plv: 6400, coins: 4000, gems: 30, color: "#c9a66b" },
  { n: 10, code: "CEO", ko: "최고경영자", en: "CEO", gtv: 128000, stv: 12800, plv: 12800, coins: 6000, gems: 50, color: "#1b1719" },
];
export interface PV { buy: number; use: number; cust: number }
export const gtvOf = (pv: PV) => pv.buy + pv.use + pv.cust;
/** 세 기준을 모두 채운 가장 높은 등급 (0 = 등급 없음) */
export function rankFor(pv: PV) {
  let r = 0;
  for (const k of RANKS) if (gtvOf(pv) >= k.gtv && pv.cust >= k.stv && pv.use >= k.plv) r = k.n; else break;
  return r;
}
