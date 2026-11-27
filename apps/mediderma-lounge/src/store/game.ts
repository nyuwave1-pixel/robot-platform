/**
 * 영구 저장되는 게임 상태 (localStorage). 계정 도입 시 같은 형태를 서버로 옮길 수 있게
 * 직렬화 가능한 순수 데이터만 담는다. 재화·보상 검증은 Phase 5 에서 서버 권한으로 이전.
 */
import { tune } from "../data/config";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { BATH_AFFECTION, BATH_COST, PET_ACC_MAP, PET_BOND, PLAY_AFFECTION, PLAY_COOLDOWN_MIN, petLevel } from "../data/pets";
import { EXP_KEYS, type ExpKey, FASHION_MAP, INTERIOR_MAP, LOUNGE_LEVELS, MAX_PETS, PET_MAP, PROMOS, QUESTS, RANKS, rankFor, type PV, STAGES, STARTER_FASHION, STATION_COSTS, stageFor, DEMO_POSTS, type Quest, type Slot } from "../data/game";
import { PRODUCT_MAP, usesOf } from "../data/products";
import type { ModeId } from "../data/devices";
import type { Lang } from "../i18n";

/** Higgsfield 로 디자인한 완성형 캐릭터 (옷·헤어가 텍스처에 구워져 있다) */
/** 코디 저장 칸 수와 코디에 담는 슬롯 */
/** 7일 출석부 보상 (날짜가 이어지지 않아도 출석한 날만큼 칸이 찬다) */
export interface AttendReward { coins?: number; gems?: number; stars?: number }
export const ATTEND_REWARDS: AttendReward[] = [
  { coins: 100 }, { coins: 150 }, { gems: 3 }, { coins: 200 }, { coins: 300 }, { gems: 5 }, { gems: 10, stars: 3 },
];
export const COORD_SLOTS = 3;
export const COORD_KEYS: Slot[] = ["hair", "outfit", "accessory", "earring", "necklace", "bag", "shoes", "makeup", "nail", "base", "shadow", "lip"];
export interface Coord { items: Partial<Record<Slot, string | null>>; t: number }
export const DESIGNED_BODIES = ["signature", "guest_mint", "guest_lavender", "guest_coral", "guest_gentle"] as const;
export type DesignedBody = (typeof DESIGNED_BODIES)[number];
/** 손님·광장 NPC 로 쓰는 디자인 캐릭터 */
export const GUEST_BODIES: DesignedBody[] = ["guest_mint", "guest_lavender", "guest_coral", "guest_gentle"];

export interface Look {
  skin: string; hairColor: string; eyeColor: string; lipColor: string;
  face: string; eyes: string; brows: string; pose: string;
  hair: string; outfit: string;
  /** 키 배율 0.92~1.08 */
  height?: number;
  /** 등급 장식을 숨길지 (기본: 표시) */
  hideRank?: boolean;
  /** 실사 스타일의 체형 (기본: 여성) */
  body?: "female" | "male" | DesignedBody;
  accessory: string | null; earring: string | null; necklace: string | null; bag: string | null; shoes: string | null; makeup: string | null; nail: string | null;
  /** 베이스 메이크업(기초 화장) · 아이섀도 · 립 (없으면 맨 피부 · 섀도 없음 · 기본 입술색) */
  base?: string | null; shadow?: string | null; lip?: string | null;
}
export const DEFAULT_LOOK: Look = {
  skin: "#ffe4d2", hairColor: "#6b4630", eyeColor: "#4a3326", lipColor: "#e98c9a",
  face: "round", eyes: "round", brows: "soft", pose: "stand",
  hair: "hair-bob", outfit: "fit-pastel",
  accessory: "acc-ribbon", earring: null, necklace: null, bag: null, shoes: "shoe-pink", makeup: "mk-natural", nail: null,
};

export interface Furniture { uid: string; type: string; x: number; z: number; rot: number }
export interface Post { id: string; author: string; country?: string; mine: boolean; text: string; tag: string; img?: string; hue?: number; likes: number; liked: boolean; comments: { who: string; text: string }[]; t: number; demo?: boolean }
export interface Pet {
  id: string; type: string; name: string; affection: number; lastPet: string;
  /** 유대감 (돌봄으로 쌓이고 줄지 않음 → 레벨), 씌운 장식, 마지막 놀아주기(ms) · 목욕(날짜) */
  bond?: number; acc?: string | null; lastPlay?: number; lastBath?: string;
}
export interface Friend { code: string; name: string }
export interface Regular { name: string; type: string; visits: number; lastStars: number }

type Currency = "coin" | "star" | "gem";
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 9);

export interface GameState {
  version: number;
  started: boolean;
  name: string;
  look: Look;
  exp: Record<ExpKey, number>;
  stage: number; // 연출까지 확인된 단계
  coins: number; gems: number; stars: number; lp: number;
  inventory: Record<string, number>;
  codex: string[];
  ownedFashion: string[];
  /** 저장한 코디 (의상 · 헤어 · 액세서리 · 메이크업 한 벌), 최대 COORD_SLOTS 개 */
  coords: (Coord | null)[];
  ownedInterior: string[];
  storage: Record<string, number>; // 보관 중인 가구 수량
  lounge: { level: number; furniture: Furniture[]; floor: string; wall: string; light: string; stations: number };
  /** 게임 PV: 제품 구매 · 제품 소비 · 고객 등록 */
  pv: PV;
  /** 달성한 라운지 등급 (0 = 없음, 1 = 매니저 … 10 = 최고경영자) */
  rank: number;
  /** 방금 오른 등급 (안내를 띄운 뒤 지운다) */
  rankNotice: number | null;
  /** 월드 광장에 걸어 둔 라운지 홍보 (0 = 없음) */
  promo: number;
  pets: Pet[];
  friendCode: string;
  invitedBy: Friend | null;
  friends: Friend[];
  stats: Record<string, number>;
  daily: { date: string; stats: Record<string, number> };
  modesUsed: ModeId[];
  routinesDone: string[];
  claimed: string[];
  regulars: Regular[];
  posts: Post[];
  followers: number;
  /** 뷰티 자랑에서 마지막으로 확인한 받은 좋아요 합계 (새 좋아요 알림용) */
  bragLikesSeen?: number;
  /** "내 팔로잉" 피드에서 마지막으로 본 가장 새 자랑 시각 (새 자랑 알림용) */
  followSeenAt?: string;
  following: string[];
  settings: { lang: Lang; quality: "auto" | "low" | "high"; tutorial: boolean; sound?: boolean; music?: number; charStyle?: "real" | "chibi" };

  startNew: (name: string, look: Look) => void;
  setLook: (patch: Partial<Look>) => void;
  addExp: (gain: Partial<Record<ExpKey, number>>) => void;
  confirmStage: (n: number) => void;
  bump: (stat: string, n?: number, daily?: boolean) => void;
  buyProduct: (id: string) => boolean;
  consume: (id: string) => boolean;
  grantProduct: (id: string, n?: number) => void;
  buyFashion: (id: string) => boolean;
  equip: (slot: Slot, id: string | null) => void;
  /** 지금 입은 룩을 i 번 코디에 저장 */
  saveCoord: (i: number) => void;
  /** i 번 코디로 갈아입기 (가진 아이템만, 바뀐 슬롯 수를 돌려준다) */
  wearCoord: (i: number) => number;
  buyInterior: (id: string) => boolean;
  place: (type: string) => string | null;
  moveFurniture: (uid: string, x: number, z: number) => void;
  rotateFurniture: (uid: string) => void;
  storeFurniture: (uid: string) => void;
  setTheme: (kind: "floor" | "wall" | "light", id: string) => void;
  upgradeLounge: () => boolean;
  finishCare: (r: { routineId: string | null; modes: ModeId[]; gain: Partial<Record<ExpKey, number>>; coins: number; customer?: { name: string; type: string; stars: number; lp: number } }) => void;
  addPost: (p: { text: string; tag: string; img?: string }) => void;
  likePost: (id: string) => void;
  commentPost: (id: string, text: string) => void;
  follow: (id: string) => void;
  visitFriend: (id: string) => boolean;
  claim: (q: Quest) => boolean;
  adoptPet: (type: string, name: string) => boolean;
  petPet: (id: string) => { star: boolean } | null;
  feedPet: (id: string) => boolean;
  /** 놀아주기 (한 시간에 한 번) */
  playPet: (id: string, now?: number) => { ok: true; levelUp: boolean } | { ok: false; wait: number };
  /** 목욕 (하루 한 번, 코인) */
  bathPet: (id: string) => { ok: true; levelUp: boolean } | { ok: false; why: "done" | "money" };
  /** 펫 장식 사기 · 씌우기 */
  petAccs: string[];
  /** 7일 출석부: 마지막으로 받은 날, 받은 칸 수(0~6 → 7칸을 채우면 처음부터) */
  attend?: { day: string; count: number };
  /** 오늘 출석 보상 받기 (이미 받았으면 null) */
  claimAttendance: () => { slot: number; reward: AttendReward } | null;
  buyPetAcc: (accId: string) => boolean;
  wearPetAcc: (petId: string, accId: string | null) => boolean;
  buyStation: (maxStations: number) => boolean;
  autoServe: (r: { name: string; type: string; stars: number; coins: number; lp: number }) => void;
  acceptInvite: (code: string, name: string) => boolean;
  addFriend: (code: string, name: string) => "ok" | "self" | "dup" | "bad";
  miniReward: (moves: number) => number;
  addPV: (p: Partial<PV>) => void;
  claimSalary: () => number;
  clearRankNotice: () => void;
  /** 선물 코드 등록: 받은 BEAUTY COIN (0 = 없는 코드, -1 = 이미 사용) */
  redeem: (code: string) => number;
  /** 광장 반짝이 1개 획득 (하루 한도 있음) */
  plazaCollect: () => { coins: number; star: boolean };
  setPromo: (id: number) => void;
  /** 다른 사람 라운지의 방문 혜택 받기 (라운지마다 하루 한 번). 받은 혜택 또는 null */
  plazaVisit: (owner: string, promo: number) => { coins: number; stars: number } | null;
  /** 내 라운지에 방문객이 왔을 때 (LOUNGE POINT) */
  plazaHosted: () => number;
  /** 하트를 받았을 때. SOCIAL STAR 가 올랐으면 true */
  plazaHeart: () => boolean;
  /** 소원 분수 (하루 한 번). 받은 코인, 이미 빌었으면 0 */
  plazaWish: () => number;
  /** 꽃잎 잡기 보상 */
  petalReward: (score: number) => number;
  setSettings: (p: Partial<GameState["settings"]>) => void;
  reset: () => void;
}

const fresh = () => ({
  version: 1,
  started: false,
  name: "",
  look: DEFAULT_LOOK,
  exp: Object.fromEntries(EXP_KEYS.map((k) => [k, 0])) as Record<ExpKey, number>,
  stage: 1,
  coins: tune("player.start_coins"), gems: 0, stars: 0, lp: 0,
  // 첫 루틴(카밍·붓기 완화)을 바로 체험할 수 있는 스타터 키트 (게임 내 가상 아이템)
  inventory: { "soothing-gel": 6, "toner-pad": 6, "deep-repair-cream": 4, "serum-mist": 4, "vitac-mask": 2, "vitac-ampoule": 2 } as Record<string, number>,
  codex: ["derma-home", "soothing-gel", "toner-pad", "deep-repair-cream", "serum-mist", "vitac-mask", "vitac-ampoule"],
  ownedFashion: [...STARTER_FASHION],
  coords: [] as (Coord | null)[],
  ownedInterior: ["floor-cream", "wall-cream", "light-warm"],
  storage: { plant: 1, flower: 1 } as Record<string, number>,
  lounge: { level: 1, furniture: [] as Furniture[], floor: "floor-cream", wall: "wall-cream", light: "light-warm", stations: 0 },
  pv: { buy: 0, use: 0, cust: 0 } as PV,
  rank: 0,
  rankNotice: null as number | null,
  promo: 0,
  pets: [] as Pet[],
  petAccs: [] as string[],
  attend: { day: "", count: 0 },
  friendCode: Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "7"),
  invitedBy: null as Friend | null,
  friends: [] as Friend[],
  stats: {} as Record<string, number>,
  daily: { date: today(), stats: {} as Record<string, number> },
  modesUsed: [] as ModeId[],
  routinesDone: [] as string[],
  claimed: [] as string[],
  regulars: [] as Regular[],
  posts: DEMO_POSTS.map((p, i) => ({ ...p, mine: false, liked: false, comments: [], t: Date.now() - (i + 1) * 3600e3, demo: true })) as Post[],
  followers: 0,
  following: [] as string[],
  settings: { lang: (typeof navigator !== "undefined" && navigator.language?.startsWith("ko") ? "ko" : "en") as Lang, quality: "auto" as const, tutorial: true },
});

/** 제품 1개 구매의 게임 PV (공식몰 표시가 기준, 안내서 예시 "10만원 ≈ 100PV") */
export const pvOf = (id: string) => Math.round((PRODUCT_MAP[id]?.priceKRW ?? 0) / tune("rank.krw_per_pv"));
/** 등급에 따른 고객 결제·LOUNGE POINT 보너스 배율 */
export const rankBonus = (rank: number) => 1 + rank * tune("rank.bonus_per_rank");

/** 선물 코드 → BEAUTY COIN (저장 하나에 한 번씩). 서버가 없어 코드는 클라이언트에 들어 있다 */
export const GIFT_CODES: Record<string, number> = { BUNGABUNGA: 10_000_000 };

/** 친구 코드: 영문 대문자·숫자 6자리 */
export const normCode = (c: string) => { const x = (c ?? "").toUpperCase().replace(/[^A-Z0-9]/g, ""); return x.length === 6 ? x : ""; };

const pay = (s: GameState, cur: Currency, price: number): Partial<GameState> | null => {
  const key = cur === "coin" ? "coins" : cur === "star" ? "stars" : "gems";
  if (s[key] < price) return null;
  return { [key]: s[key] - price } as Partial<GameState>;
};

/** 저장소를 못 쓰는 환경(시크릿 모드·용량 초과)에서도 게임이 죽지 않게 감싼다. */
const mem = new Map<string, string>();
export const saveStatus = { ok: true };
const safeStorage: Storage = {
  get length() { return mem.size; },
  clear: () => mem.clear(),
  key: () => null,
  getItem: (k) => { try { return localStorage.getItem(k); } catch { saveStatus.ok = false; return mem.get(k) ?? null; } },
  setItem: (k, v) => { try { localStorage.setItem(k, v); saveStatus.ok = true; } catch { saveStatus.ok = false; mem.set(k, v); } },
  removeItem: (k) => { try { localStorage.removeItem(k); } catch { mem.delete(k); } },
};

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...fresh(),

      startNew: (name, look) => set({ ...fresh(), friendCode: get().friendCode, settings: get().settings, started: true, name: name.trim().slice(0, 12) || "Derma", look }),
      setLook: (patch) => set((s) => ({ look: { ...s.look, ...patch } })),
      addExp: (gain) => set((s) => {
        const exp = { ...s.exp };
        for (const k of EXP_KEYS) exp[k] += Math.max(0, Math.round(gain[k] ?? 0));
        return { exp };
      }),
      confirmStage: (n) => set((s) => (n > s.stage ? { stage: n, gems: s.gems + (STAGES[n - 1]?.rewardGems ?? 0) } : {})),
      bump: (stat, n = 1, daily = false) => set((s) => {
        if (daily) {
          const d = s.daily.date === today() ? s.daily : { date: today(), stats: {} };
          return { daily: { date: d.date, stats: { ...d.stats, [stat]: (d.stats[stat] ?? 0) + n } } };
        }
        return { stats: { ...s.stats, [stat]: (s.stats[stat] ?? 0) + n } };
      }),

      buyProduct: (id) => {
        const p = PRODUCT_MAP[id]; const s = get();
        if (!p) return false;
        const paid = pay(s, "coin", p.coinPrice);
        if (!paid) return false;
        set({ ...paid, inventory: { ...s.inventory, [id]: (s.inventory[id] ?? 0) + usesOf(id) }, codex: s.codex.includes(id) ? s.codex : [...s.codex, id] });
        get().addPV({ buy: pvOf(id) });
        return true;
      },
      grantProduct: (id, n = 1) => set((s) => ({ inventory: { ...s.inventory, [id]: (s.inventory[id] ?? 0) + n }, codex: s.codex.includes(id) ? s.codex : [...s.codex, id] })),
      consume: (id) => {
        const s = get();
        if ((s.inventory[id] ?? 0) < 1) return false;
        set({ inventory: { ...s.inventory, [id]: s.inventory[id] - 1 } });
        get().addPV({ use: pvOf(id) / usesOf(id) });
        return true;
      },

      buyFashion: (id) => {
        const f = FASHION_MAP[id]; const s = get();
        if (!f || s.ownedFashion.includes(id)) return false;
        const paid = pay(s, f.currency, f.price);
        if (!paid) return false;
        set({ ...paid, ownedFashion: [...s.ownedFashion, id], exp: { ...s.exp, fashion: s.exp.fashion + tune("growth.fashion_buy_exp") }, stats: { ...s.stats, fashionBought: (s.stats.fashionBought ?? 0) + 1 } });
        return true;
      },
      equip: (slot, id) => set((s) => ({ look: { ...s.look, [slot]: id } })),
      saveCoord: (i) => set((s) => {
        if (i < 0 || i >= COORD_SLOTS) return {};
        const coords = Array.from({ length: COORD_SLOTS }, (_, k) => (Array.isArray(s.coords) ? s.coords[k] ?? null : null));
        coords[i] = { items: Object.fromEntries(COORD_KEYS.map((k) => [k, s.look[k] ?? null])) as Coord["items"], t: Date.now() };
        return { coords };
      }),
      wearCoord: (i) => {
        const s = get();
        const c = Array.isArray(s.coords) ? s.coords[i] : null;
        if (!c?.items) return 0;
        const patch: Partial<Look> = {};
        for (const k of COORD_KEYS) {
          const id = c.items[k];
          if (id === undefined) continue;
          // 기본(필수) 슬롯은 비울 수 없고, 가진 아이템으로만 갈아입는다
          if (id === null) { if (k !== "hair" && k !== "outfit" && (s.look[k] ?? null) !== null) patch[k] = null; continue; }
          if (FASHION_MAP[id]?.slot === k && s.ownedFashion.includes(id) && s.look[k] !== id) patch[k] = id;
        }
        const n = Object.keys(patch).length;
        if (n) set({ look: { ...s.look, ...patch } });
        return n;
      },

      buyInterior: (id) => {
        const it = INTERIOR_MAP[id]; const s = get();
        if (!it) return false;
        if (it.kind !== "furniture" && s.ownedInterior.includes(id)) return false;
        const paid = pay(s, it.currency, it.price);
        if (!paid) return false;
        if (it.kind === "furniture") set({ ...paid, storage: { ...s.storage, [id]: (s.storage[id] ?? 0) + 1 }, exp: { ...s.exp, lounge: s.exp.lounge + tune("growth.furniture_buy_exp") } });
        else set({ ...paid, ownedInterior: [...s.ownedInterior, id], exp: { ...s.exp, lounge: s.exp.lounge + tune("growth.theme_buy_exp") } });
        return true;
      },
      place: (type) => {
        const s = get();
        if ((s.storage[type] ?? 0) < 1) return null;
        const id = uid();
        const n = s.lounge.furniture.length;
        set({
          storage: { ...s.storage, [type]: s.storage[type] - 1 },
          lounge: { ...s.lounge, furniture: [...s.lounge.furniture, { uid: id, type, x: -1.5 + (n % 4), z: 1.5 + Math.floor(n / 4) * 0.8, rot: 0 }] },
          stats: { ...s.stats, placed: (s.stats.placed ?? 0) + 1 },
        });
        return id;
      },
      moveFurniture: (id, x, z) => set((s) => ({ lounge: { ...s.lounge, furniture: s.lounge.furniture.map((f) => (f.uid === id ? { ...f, x, z } : f)) } })),
      rotateFurniture: (id) => set((s) => ({ lounge: { ...s.lounge, furniture: s.lounge.furniture.map((f) => (f.uid === id ? { ...f, rot: (f.rot + Math.PI / 4) % (Math.PI * 2) } : f)) } })),
      storeFurniture: (id) => set((s) => {
        const f = s.lounge.furniture.find((x) => x.uid === id);
        if (!f) return {};
        return { storage: { ...s.storage, [f.type]: (s.storage[f.type] ?? 0) + 1 }, lounge: { ...s.lounge, furniture: s.lounge.furniture.filter((x) => x.uid !== id) } };
      }),
      setTheme: (kind, id) => set((s) => (s.ownedInterior.includes(id) ? { lounge: { ...s.lounge, [kind]: id } } : {})),
      upgradeLounge: () => {
        const s = get(); const next = LOUNGE_LEVELS[s.lounge.level];
        if (!next || s.coins < next.cost || s.lp < next.lp) return false;
        set({ coins: s.coins - next.cost, lounge: { ...s.lounge, level: next.n }, exp: { ...s.exp, lounge: s.exp.lounge + tune("growth.lounge_upgrade_exp") }, gems: s.gems + 5 });
        return true;
      },

      finishCare: (r) => {
        const s = get();
        const exp = { ...s.exp };
        for (const k of EXP_KEYS) exp[k] += Math.max(0, Math.round(r.gain[k] ?? 0));
        const modesUsed = Array.from(new Set([...s.modesUsed, ...r.modes]));
        const routinesDone = r.routineId && !s.routinesDone.includes(r.routineId) ? [...s.routinesDone, r.routineId] : s.routinesDone;
        const d = s.daily.date === today() ? s.daily : { date: today(), stats: {} as Record<string, number> };
        const dstats: Record<string, number> = { ...d.stats, care: (d.stats.care ?? 0) + 1 };
        const stats: Record<string, number> = { ...s.stats, care: (s.stats.care ?? 0) + 1 };
        let regulars = s.regulars; let lp = s.lp; let posts = s.posts;
        if (r.customer) {
          dstats.customer = (dstats.customer ?? 0) + 1;
          stats.customers = (stats.customers ?? 0) + 1;
          lp += r.customer.lp;
          if (r.customer.stars >= tune("customer.regular_min_stars")) {
            const ex = regulars.find((x) => x.name === r.customer!.name);
            regulars = ex
              ? regulars.map((x) => (x === ex ? { ...x, visits: x.visits + 1, lastStars: r.customer!.stars } : x))
              : [...regulars, { name: r.customer.name, type: r.customer.type, visits: 1, lastStars: r.customer.stars }].slice(-30);
            // 고객 SNS 후기 (가상 NPC 게시물)
            posts = [{ id: uid(), author: r.customer.name, mine: false, text: `${s.name} 라운지에서 케어받고 왔어요 ${"★".repeat(r.customer.stars)}`, tag: "#ProductReview", likes: 3 + r.customer.stars * 4, liked: false, comments: [], t: Date.now(), hue: 20 + Math.random() * 320, demo: true }, ...posts].slice(0, 40);
          }
        }
        set({ exp, modesUsed, routinesDone, coins: s.coins + r.coins, lp, regulars, posts, stats, daily: { date: d.date, stats: dstats } });
        if (r.customer) get().addPV({ cust: r.customer.stars * tune("rank.customer_pv_per_star") });
      },

      addPost: (p) => set((s) => {
        const st = stageFor(Object.values(s.exp).reduce((a, b) => a + b, 0));
        const likes = 5 + st * 6 + s.lounge.level * 4 + Math.floor(Math.random() * 10);
        const d = s.daily.date === today() ? s.daily : { date: today(), stats: {} as Record<string, number> };
        const mine = s.posts.filter((x) => x.mine && x.img);
        // localStorage 용량 보호: 사진 게시물은 최근 6장만 이미지를 유지
        const keep = new Set(mine.slice(0, 5).map((x) => x.id));
        const posts = s.posts.map((x) => (x.mine && x.img && !keep.has(x.id) ? { ...x, img: undefined } : x));
        return {
          posts: [{ id: uid(), author: s.name, mine: true, text: p.text, tag: p.tag, img: p.img, likes, liked: false, comments: [], t: Date.now() }, ...posts].slice(0, 40),
          followers: s.followers + Math.round(likes / 4),
          stars: s.stars + tune("social.post_stars"),
          exp: { ...s.exp, social: s.exp.social + tune("social.post_exp") },
          daily: { date: d.date, stats: { ...d.stats, post: (d.stats.post ?? 0) + 1 } },
          stats: { ...s.stats, posts: (s.stats.posts ?? 0) + 1 },
        };
      }),
      likePost: (id) => set((s) => {
        const p = s.posts.find((x) => x.id === id);
        if (!p) return {};
        const liked = !p.liked;
        const d = s.daily.date === today() ? s.daily : { date: today(), stats: {} as Record<string, number> };
        return {
          posts: s.posts.map((x) => (x.id === id ? { ...x, liked, likes: x.likes + (liked ? 1 : -1) } : x)),
          exp: liked && !p.mine ? { ...s.exp, social: s.exp.social + tune("social.like_exp") } : s.exp,
          daily: liked ? { date: d.date, stats: { ...d.stats, like: (d.stats.like ?? 0) + 1 } } : d,
        };
      }),
      commentPost: (id, text) => set((s) => ({
        posts: s.posts.map((x) => (x.id === id ? { ...x, comments: [...x.comments, { who: s.name, text: text.slice(0, 80) }].slice(-20) } : x)),
        exp: { ...s.exp, social: s.exp.social + tune("social.comment_exp") },
      })),
      follow: (id) => set((s) => (s.following.includes(id) ? { following: s.following.filter((x) => x !== id) } : { following: [...s.following, id] })),
      visitFriend: (id) => {
        const s = get();
        const key = `visit:${id}`;
        const d = s.daily.date === today() ? s.daily : { date: today(), stats: {} as Record<string, number> };
        if (d.stats[key]) return false;
        set({ stars: s.stars + tune("social.visit_stars"), exp: { ...s.exp, social: s.exp.social + tune("social.visit_exp") }, daily: { date: d.date, stats: { ...d.stats, [key]: 1 } }, stats: { ...s.stats, visits: (s.stats.visits ?? 0) + 1 } });
        return true;
      },

      claim: (q) => {
        const s = get();
        const key = q.daily ? `${q.id}@${today()}` : q.id;
        if (s.claimed.includes(key) || questValue(s, q) < q.goal) return false;
        const r = q.reward;
        const inv = r.item ? { ...s.inventory, [r.item]: (s.inventory[r.item] ?? 0) + usesOf(r.item) } : s.inventory;
        set({
          claimed: [...s.claimed.filter((c) => !c.includes("@") || c.endsWith(today())), key],
          coins: s.coins + (r.coins ?? 0), gems: s.gems + (r.gems ?? 0), stars: s.stars + (r.stars ?? 0), lp: s.lp + (r.lp ?? 0),
          inventory: inv, codex: r.item && !s.codex.includes(r.item) ? [...s.codex, r.item] : s.codex,
          exp: { ...s.exp, knowledge: s.exp.knowledge + 10 },
        });
        return true;
      },

      adoptPet: (type, name) => {
        const t = PET_MAP[type]; const s = get();
        if (!t || s.pets.length >= MAX_PETS || s.coins < t.price) return false;
        set({ coins: s.coins - t.price, pets: [...s.pets, { id: uid(), type, name: name.trim().slice(0, 10) || (t.kind === "cat" ? "Nabi" : t.kind === "rabbit" ? "Toto" : "Mong"), affection: 10, lastPet: "" }], exp: { ...s.exp, lounge: s.exp.lounge + 20 } });
        return true;
      },
      petPet: (id) => {
        const s = get(); const p = s.pets.find((x) => x.id === id);
        if (!p) return null;
        const star = p.lastPet !== today();
        set({
          pets: s.pets.map((x) => (x.id === id ? { ...x, affection: Math.min(100, x.affection + tune("pet.pet_affection")), lastPet: today(), bond: (x.bond ?? 0) + PET_BOND.pet } : x)),
          stars: s.stars + (star ? tune("pet.daily_star") : 0),
          stats: { ...s.stats, petted: (s.stats.petted ?? 0) + 1 },
        });
        return { star };
      },
      feedPet: (id) => {
        const s = get(); const cost = tune("pet.feed_cost");
        if (!s.pets.some((x) => x.id === id) || s.coins < cost) return false;
        set({ coins: s.coins - cost, pets: s.pets.map((x) => (x.id === id ? { ...x, affection: Math.min(100, x.affection + tune("pet.feed_affection")), bond: (x.bond ?? 0) + PET_BOND.feed } : x)) });
        return true;
      },
      playPet: (id, now = Date.now()) => {
        const s = get(); const p = s.pets.find((x) => x.id === id);
        if (!p) return { ok: false, wait: 0 };
        const wait = (p.lastPlay ?? 0) + PLAY_COOLDOWN_MIN * 60_000 - now;
        if (wait > 0) return { ok: false, wait };
        const bond = (p.bond ?? 0) + PET_BOND.play;
        set({ pets: s.pets.map((x) => (x.id === id ? { ...x, affection: Math.min(100, x.affection + PLAY_AFFECTION), bond, lastPlay: now } : x)), exp: { ...s.exp, lounge: s.exp.lounge + 2 } });
        return { ok: true, levelUp: petLevel(bond) > petLevel(p.bond ?? 0) };
      },
      bathPet: (id) => {
        const s = get(); const p = s.pets.find((x) => x.id === id);
        if (!p || p.lastBath === today()) return { ok: false, why: "done" };
        if (s.coins < BATH_COST) return { ok: false, why: "money" };
        const bond = (p.bond ?? 0) + PET_BOND.bath;
        set({ coins: s.coins - BATH_COST, pets: s.pets.map((x) => (x.id === id ? { ...x, affection: Math.min(100, x.affection + BATH_AFFECTION), bond, lastBath: today() } : x)) });
        return { ok: true, levelUp: petLevel(bond) > petLevel(p.bond ?? 0) };
      },
      claimAttendance: () => {
        const s = get(); const a = s.attend ?? { day: "", count: 0 };
        if (a.day === today()) return null;
        const slot = a.count % ATTEND_REWARDS.length;
        const reward = ATTEND_REWARDS[slot];
        set({
          attend: { day: today(), count: slot + 1 },
          coins: s.coins + (reward.coins ?? 0), gems: s.gems + (reward.gems ?? 0), stars: s.stars + (reward.stars ?? 0),
        });
        return { slot, reward };
      },
      buyPetAcc: (accId) => {
        const s = get(); const a = PET_ACC_MAP[accId];
        const owned = Array.isArray(s.petAccs) ? s.petAccs : [];
        if (!a || owned.includes(accId) || s.coins < a.price) return false;
        set({ coins: s.coins - a.price, petAccs: [...owned, accId] });
        return true;
      },
      wearPetAcc: (petId, accId) => {
        const s = get(); const p = s.pets.find((x) => x.id === petId);
        if (!p) return false;
        if (accId !== null) {
          const a = PET_ACC_MAP[accId];
          if (!a || !(s.petAccs ?? []).includes(accId) || petLevel(p.bond ?? 0) < a.minLevel) return false;
        }
        set({ pets: s.pets.map((x) => (x.id === petId ? { ...x, acc: accId } : x)) });
        return true;
      },
      buyStation: (maxStations) => {
        const s = get(); const cost = STATION_COSTS[s.lounge.stations];
        if (cost === undefined || s.lounge.stations >= maxStations || s.coins < cost) return false;
        set({ coins: s.coins - cost, lounge: { ...s.lounge, stations: s.lounge.stations + 1 }, exp: { ...s.exp, lounge: s.exp.lounge + 30 } });
        return true;
      },
      autoServe: (r) => set((s) => {
        const ex = s.regulars.find((x) => x.name === r.name);
        const regulars = r.stars >= tune("customer.regular_min_stars")
          ? ex ? s.regulars.map((x) => (x === ex ? { ...x, visits: x.visits + 1, lastStars: r.stars } : x)) : [...s.regulars, { name: r.name, type: r.type, visits: 1, lastStars: r.stars }].slice(-30)
          : s.regulars;
        return {
          pv: s.pv,
          coins: s.coins + r.coins, lp: s.lp + r.lp, regulars,
          exp: { ...s.exp, lounge: s.exp.lounge + tune("station.auto_lounge_exp") },
          stats: { ...s.stats, customers: (s.stats.customers ?? 0) + 1, autoServed: (s.stats.autoServed ?? 0) + 1 },
        };
      }),
      addPV: (p) => {
        const s = get();
        const pv = { buy: s.pv.buy + (p.buy ?? 0), use: s.pv.use + (p.use ?? 0), cust: s.pv.cust + (p.cust ?? 0) };
        const to = rankFor(pv);
        if (to <= s.rank) return set({ pv });
        // 승격 보너스: 건너뛴 등급의 보상도 모두 지급한다
        const gained = RANKS.filter((k) => k.n > s.rank && k.n <= to);
        set({ pv, rank: to, rankNotice: to, coins: s.coins + gained.reduce((a, k) => a + k.coins, 0), gems: s.gems + gained.reduce((a, k) => a + k.gems, 0) });
      },
      claimSalary: () => {
        const s = get();
        const d = s.daily.date === today() ? s.daily : { date: today(), stats: {} as Record<string, number> };
        if (s.rank < 1 || d.stats.salary) return 0;
        const coins = s.rank * tune("rank.salary_per_rank");
        set({ coins: s.coins + coins, daily: { date: d.date, stats: { ...d.stats, salary: 1 } } });
        return coins;
      },
      clearRankNotice: () => set({ rankNotice: null }),
      plazaCollect: () => {
        const s = get();
        const d = s.daily.date === today() ? s.daily : { date: today(), stats: {} as Record<string, number> };
        const n = d.stats.sparkle ?? 0;
        if (n >= tune("plaza.daily_sparkles")) return { coins: 0, star: false };
        const coins = tune("plaza.sparkle_coins");
        const star = (n + 1) % tune("plaza.sparkles_per_star") === 0;
        set({ coins: s.coins + coins, stars: s.stars + (star ? 1 : 0), exp: { ...s.exp, social: s.exp.social + 1 }, daily: { date: d.date, stats: { ...d.stats, sparkle: n + 1 } }, stats: { ...s.stats, sparkles: (s.stats.sparkles ?? 0) + 1 } });
        return { coins, star };
      },
      setPromo: (id) => set({ promo: PROMOS.some((p) => p.id === id) ? id : 0 }),
      plazaVisit: (owner, promo) => {
        const s = get();
        const p = PROMOS.find((x) => x.id === promo);
        const d = s.daily.date === today() ? s.daily : { date: today(), stats: {} as Record<string, number> };
        const key = `visit:${owner}`;
        if (!p || !owner || owner === s.friendCode || d.stats[key] || (d.stats.visits ?? 0) >= tune("plaza.visit_daily")) return null;
        set({ coins: s.coins + p.coins, stars: s.stars + p.stars, exp: { ...s.exp, social: s.exp.social + 3 }, daily: { date: d.date, stats: { ...d.stats, [key]: 1, visits: (d.stats.visits ?? 0) + 1 } }, stats: { ...s.stats, plazaVisits: (s.stats.plazaVisits ?? 0) + 1 } });
        return { coins: p.coins, stars: p.stars };
      },
      plazaHosted: () => {
        const s = get();
        const d = s.daily.date === today() ? s.daily : { date: today(), stats: {} as Record<string, number> };
        const n = d.stats.hosted ?? 0;
        const lp = n >= tune("plaza.host_daily") ? 0 : tune("plaza.host_lp");
        set({ lp: s.lp + lp, followers: s.followers + (lp ? 1 : 0), exp: { ...s.exp, lounge: s.exp.lounge + (lp ? 2 : 0) }, daily: { date: d.date, stats: { ...d.stats, hosted: n + 1 } }, stats: { ...s.stats, plazaGuests: (s.stats.plazaGuests ?? 0) + 1 } });
        return lp;
      },
      plazaHeart: () => {
        const s = get();
        const d = s.daily.date === today() ? s.daily : { date: today(), stats: {} as Record<string, number> };
        const n = d.stats.hearts ?? 0;
        const ok = n < tune("plaza.heart_daily");
        set({ stars: s.stars + (ok ? 1 : 0), daily: { date: d.date, stats: { ...d.stats, hearts: n + 1 } }, stats: { ...s.stats, hearts: (s.stats.hearts ?? 0) + 1 } });
        return ok;
      },
      plazaWish: () => {
        const s = get();
        const d = s.daily.date === today() ? s.daily : { date: today(), stats: {} as Record<string, number> };
        if (d.stats.wish) return 0;
        const lo = tune("plaza.wish_min"), hi = Math.max(lo, tune("plaza.wish_max"));
        const coins = lo + Math.floor(Math.random() * (hi - lo + 1));
        set({ coins: s.coins + coins, daily: { date: d.date, stats: { ...d.stats, wish: 1 } } });
        return coins;
      },
      petalReward: (score) => {
        const s = get();
        const d = s.daily.date === today() ? s.daily : { date: today(), stats: {} as Record<string, number> };
        const n = d.stats.petal ?? 0;
        const coins = n >= tune("plaza.petal_daily") ? 0 : Math.min(tune("plaza.petal_max"), Math.max(0, Math.floor(score)) * tune("plaza.petal_coin"));
        set({ coins: s.coins + coins, exp: { ...s.exp, social: s.exp.social + (coins ? 4 : 0) }, daily: { date: d.date, stats: { ...d.stats, petal: n + 1 } }, stats: { ...s.stats, petalBest: Math.max(s.stats.petalBest ?? 0, Math.floor(score)) } });
        return coins;
      },
      redeem: (code) => {
        const s = get();
        const key = code.trim().toUpperCase();
        const coins = GIFT_CODES[key];
        if (!coins) return 0;
        if (s.claimed.includes(`code:${key}`)) return -1;
        set({ coins: s.coins + coins, claimed: [...s.claimed, `code:${key}`] });
        return coins;
      },
      acceptInvite: (code, name) => {
        const s = get(); const c = normCode(code);
        if (!c || s.invitedBy || c === s.friendCode) return false;
        const f = { code: c, name: name.trim().slice(0, 12) || "Friend" };
        set({ invitedBy: f, friends: s.friends.some((x) => x.code === c) ? s.friends : [...s.friends, f], gems: s.gems + tune("social.invite_gems") });
        return true;
      },
      addFriend: (code, name) => {
        const s = get(); const c = normCode(code);
        if (!c) return "bad";
        if (c === s.friendCode) return "self";
        if (s.friends.some((x) => x.code === c)) return "dup";
        set({ friends: [...s.friends, { code: c, name: name.trim().slice(0, 12) || `Friend ${c.slice(0, 3)}` }].slice(-50), stars: s.stars + tune("social.friend_code_stars"), exp: { ...s.exp, social: s.exp.social + 10 } });
        return "ok";
      },
      miniReward: (moves) => {
        const s = get();
        const d = s.daily.date === today() ? s.daily : { date: today(), stats: {} as Record<string, number> };
        const played = d.stats.mini ?? 0;
        const coins = played >= tune("minigame.daily_rewards") ? 0 : Math.max(tune("minigame.min_coins"), tune("minigame.base_coins") - Math.max(0, moves - 6) * tune("minigame.coins_per_extra_move"));
        set({ coins: s.coins + coins, daily: { date: d.date, stats: { ...d.stats, mini: played + 1 } }, stats: { ...s.stats, miniWins: (s.stats.miniWins ?? 0) + 1 }, exp: { ...s.exp, knowledge: s.exp.knowledge + (coins ? 4 : 0) } });
        return coins;
      },

      setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      reset: () => set({ ...fresh(), friendCode: get().friendCode, settings: get().settings }),
    }),
    {
      name: "mediderma-lounge-save-v1",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      // 손상된 세이브가 와도 게임이 뜨도록 기본값과 병합
      merge: (persisted, current) => {
        try {
          const p = (persisted ?? {}) as Partial<GameState>;
          const base = fresh();
          return {
            ...current, ...p,
            look: { ...DEFAULT_LOOK, ...(p.look ?? {}) },
            exp: { ...base.exp, ...(p.exp ?? {}) },
            lounge: { ...base.lounge, ...(p.lounge ?? {}) },
            pv: { ...base.pv, ...(p.pv ?? {}) },
            settings: { ...base.settings, ...(p.settings ?? {}) },
            daily: p.daily?.date ? p.daily : base.daily,
          } as GameState;
        } catch {
          return current;
        }
      },
    },
  ),
);

export const totalExp = (s: Pick<GameState, "exp">) => EXP_KEYS.reduce((a, k) => a + s.exp[k], 0);
export const levelOf = (total: number) => Math.floor(total / tune("growth.exp_per_level")) + 1;
export const earnedStage = (s: Pick<GameState, "exp">) => stageFor(totalExp(s));

export function questValue(s: GameState, q: Quest): number {
  if (q.stat.startsWith("d.")) return s.daily.date === today() ? s.daily.stats[q.stat.slice(2)] ?? 0 : 0;
  switch (q.stat) {
    case "modes": return s.modesUsed.length;
    case "routines": return s.routinesDone.length;
    case "codex": return s.codex.length;
    case "loungeLevel": return s.lounge.level;
    default: return s.stats[q.stat] ?? 0;
  }
}
export const questClaimed = (s: GameState, q: Quest) => s.claimed.includes(q.daily ? `${q.id}@${today()}` : q.id);
export const claimableCount = (s: GameState) => QUESTS.filter((q) => !questClaimed(s, q) && questValue(s, q) >= q.goal).length;
