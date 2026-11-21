/**
 * 이벤트 · 프로모션
 *  - 공식 이벤트: public/events.json 을 고쳐 배포하면 모든 플레이어에게 안내된다 (게임 코드를 고칠 필요 없음)
 *  - 라운지 이벤트: 라운지 주인이 정해진 종류 중에서 골라 일정 시간 연다. 그동안 방문객이 혜택을 받는다
 *  - 라운지 공지: 주인이 지금 라운지에 있는 방문객에게 정해진 안내 문구를 보낸다 (자유 채팅 없음)
 */

export interface OfficialEvent {
  id: string;
  ko: string; en: string;
  descKo: string; descEn: string;
  /** ISO 날짜·시각 (이 시각부터 · 이 시각까지) */
  start: string; end: string;
  /** 배너 색 */
  color: string;
  /** 기간 중 한 번 받는 참여 보상 (없으면 안내만) */
  reward?: { coins?: number; gems?: number; stars?: number };
  /** 눌렀을 때 여는 화면 */
  cta?: "plaza" | "lounge" | "life" | "shop" | "care";
}

/** 공식 이벤트 보상 상한 (잘못 쓴 events.json 이 경제를 망가뜨리지 않게) */
export const EVENT_REWARD_CAP = { coins: 5000, gems: 50, stars: 30 } as const;
const COLOR = /^#[0-9a-f]{6}$/i;
const ID = /^[a-z0-9-]{1,40}$/;
const CTA = ["plaza", "lounge", "life", "shop", "care"] as const;

const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max) : "");
const amount = (v: unknown, cap: number) => (typeof v === "number" && isFinite(v) ? Math.min(cap, Math.max(0, Math.round(v))) : 0);

/** events.json 의 값은 아는 형식만 받아들인다 */
export function cleanEvents(v: unknown): OfficialEvent[] {
  const list = Array.isArray(v) ? v : Array.isArray((v as { events?: unknown })?.events) ? (v as { events: unknown[] }).events : [];
  const out: OfficialEvent[] = [];
  for (const raw of list.slice(0, 30)) {
    const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const id = typeof o.id === "string" && ID.test(o.id) ? o.id : "";
    const start = typeof o.start === "string" ? Date.parse(o.start) : NaN;
    const end = typeof o.end === "string" ? Date.parse(o.end) : NaN;
    const ko = text(o.ko, 40), en = text(o.en, 60) || ko;
    if (!id || !ko || !isFinite(start) || !isFinite(end) || end <= start || out.some((e) => e.id === id)) continue;
    const r = (o.reward && typeof o.reward === "object" ? o.reward : {}) as Record<string, unknown>;
    const reward = { coins: amount(r.coins, EVENT_REWARD_CAP.coins), gems: amount(r.gems, EVENT_REWARD_CAP.gems), stars: amount(r.stars, EVENT_REWARD_CAP.stars) };
    out.push({
      id, ko, en, descKo: text(o.descKo, 200), descEn: text(o.descEn, 260) || text(o.descKo, 200),
      start: new Date(start).toISOString(), end: new Date(end).toISOString(),
      color: typeof o.color === "string" && COLOR.test(o.color) ? o.color : "#e2718d",
      reward: reward.coins || reward.gems || reward.stars ? reward : undefined,
      cta: (CTA as readonly unknown[]).includes(o.cta) ? (o.cta as OfficialEvent["cta"]) : undefined,
    });
  }
  return out;
}

export const isActive = (e: OfficialEvent, now = Date.now()) => Date.parse(e.start) <= now && now < Date.parse(e.end);
export const isUpcoming = (e: OfficialEvent, now = Date.now()) => now < Date.parse(e.start) && Date.parse(e.start) - now < 14 * 86_400_000;

// ───────────── 라운지 이벤트 (주인이 여는 것) ─────────────
export interface LoungeEventType {
  id: number; ko: string; en: string; descKo: string; descEn: string;
  /** 진행 시간(분) */
  minutes: number;
  /** 방문객이 받는 혜택 (라운지마다 하루 한 번) */
  coins: number; stars: number;
  /** 여는 데 드는 BEAUTY COIN */
  cost: number;
  color: string;
}
export const LOUNGE_EVENTS: LoungeEventType[] = [
  { id: 1, ko: "오픈 파티", en: "Open party", descKo: "방문객 모두에게 웰컴 코인을 드려요", descEn: "Every visitor gets welcome coins", minutes: 30, coins: 40, stars: 0, cost: 100, color: "#e2718d" },
  { id: 2, ko: "뷰티 클래스", en: "Beauty class", descKo: "함께 케어 루틴을 배워요 · 소셜 스타 선물", descEn: "Learn a care routine together · Social star gift", minutes: 30, coins: 10, stars: 2, cost: 150, color: "#b9a2e8" },
  { id: 3, ko: "포토 데이", en: "Photo day", descKo: "포토존에서 인생샷 남기기 · 코인과 스타", descEn: "Snap your best shot at the photo zone · Coins and a star", minutes: 60, coins: 25, stars: 1, cost: 200, color: "#c9a66b" },
  { id: 4, ko: "타임 세일", en: "Time sale", descKo: "짧고 굵게! 방문 즉시 코인 두 배", descEn: "Short and sweet: double coins on arrival", minutes: 15, coins: 60, stars: 0, cost: 120, color: "#7fc8a9" },
];
export const LOUNGE_EVENT_MAP = Object.fromEntries(LOUNGE_EVENTS.map((e) => [e.id, e])) as Record<number, LoungeEventType>;
/** 방문객이 라운지 이벤트 혜택을 받을 수 있는 하루 횟수 */
export const EVENT_VISIT_DAILY = 5;
/** 주인이 하루에 열 수 있는 라운지 이벤트 수 */
export const EVENT_HOST_DAILY = 3;

// ───────────── 라운지 공지 (주인 → 방문객) ─────────────
export const NOTICES: { id: number; ko: string; en: string }[] = [
  { id: 0, ko: "어서 오세요! 편하게 둘러보세요", en: "Welcome! Feel free to look around" },
  { id: 1, ko: "지금 라운지 이벤트가 진행 중이에요", en: "A lounge event is on right now" },
  { id: 2, ko: "이벤트가 곧 끝나요. 혜택 꼭 받아 가세요", en: "The event ends soon, grab your perk" },
  { id: 3, ko: "포토존에서 같이 사진 찍어요", en: "Let's take photos at the photo zone" },
  { id: 4, ko: "케어 베드에서 시술 체험해 보세요", en: "Try a treatment at the care bed" },
  { id: 5, ko: "와 주셔서 고마워요. 또 놀러 오세요", en: "Thanks for coming, visit again" },
];
