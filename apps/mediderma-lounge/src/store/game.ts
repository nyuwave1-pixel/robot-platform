/**
 * 영구 저장되는 게임 상태 (localStorage). 계정 도입 시 같은 형태를 서버로 옮길 수 있게
 * 직렬화 가능한 순수 데이터만 담는다. 재화·보상 검증은 Phase 5 에서 서버 권한으로 이전.
 */
import { tune } from "../data/config";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { EXP_KEYS, type ExpKey, FASHION_MAP, INTERIOR_MAP, LOUNGE_LEVELS, MAX_PETS, PET_MAP, QUESTS, RANKS, rankFor, type PV, STAGES, STARTER_FASHION, STATION_COSTS, stageFor, DEMO_POSTS, type Quest, type Slot } from "../data/game";
import { PRODUCT_MAP, usesOf } from "../data/products";
import type { ModeId } from "../data/devices";
import type { Lang } from "../i18n";

export interface Look {
  skin: string; hairColor: string; eyeColor: string; lipColor: string;
  face: string; eyes: string; brows: string; pose: string;
  hair: string; outfit: string;
  /** 키 배율 0.92~1.08 */
  height?: number;
  /** 등급 장식을 숨길지 (기본: 표시) */
  hideRank?: boolean;
  accessory: string | null; earring: string | null; necklace: string | null; bag: string | null; shoes: string | null; makeup: string | null; nail: string | null;
}
export const DEFAULT_LOOK: Look = {
  skin: "#ffe4d2", hairColor: "#6b4630", eyeColor: "#4a3326", lipColor: "#e98c9a",
  face: "round", eyes: "round", brows: "soft", pose: "stand",
  hair: "hair-bob", outfit: "fit-pastel",
  accessory: "acc-ribbon", earring: null, necklace: null, bag: null, shoes: "shoe-pink", makeup: "mk-natural", nail: null,
};

export interface Furniture { uid: string; type: string; x: number; z: number; rot: number }
export interface Post { id: string; author: string; country?: string; mine: boolean; text: string; tag: string; img?: string; hue?: number; likes: number; liked: boolean; comments: { who: string; text: string }[]; t: number; demo?: boolean }
export interface Pet { id: string; type: string; name: string; affection: number; lastPet: string }
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
  ownedInterior: string[];
  storage: Record<string, number>; // 보관 중인 가구 수량
  lounge: { level: number; furniture: Furniture[]; floor: string; wall: string; light: string; stations: number };
  /** 게임 PV: 제품 구매 · 제품 소비 · 고객 등록 */
  pv: PV;
  /** 달성한 라운지 등급 (0 = 없음, 1 = 매니저 … 10 = 최고경영자) */
  rank: number;
  /** 방금 오른 등급 (안내를 띄운 뒤 지운다) */
  rankNotice: number | null;
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
  following: string[];
  settings: { lang: Lang; quality: "auto" | "low" | "high"; tutorial: boolean };

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
  ownedInterior: ["floor-cream", "wall-cream", "light-warm"],
  storage: { plant: 1, flower: 1 } as Record<string, number>,
  lounge: { level: 1, furniture: [] as Furniture[], floor: "floor-cream", wall: "wall-cream", light: "light-warm", stations: 0 },
  pv: { buy: 0, use: 0, cust: 0 } as PV,
  rank: 0,
  rankNotice: null as number | null,
  pets: [] as Pet[],
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
        set({ coins: s.coins - t.price, pets: [...s.pets, { id: uid(), type, name: name.trim().slice(0, 10) || (t.kind === "cat" ? "Nabi" : "Mong"), affection: 10, lastPet: "" }], exp: { ...s.exp, lounge: s.exp.lounge + 20 } });
        return true;
      },
      petPet: (id) => {
        const s = get(); const p = s.pets.find((x) => x.id === id);
        if (!p) return null;
        const star = p.lastPet !== today();
        set({
          pets: s.pets.map((x) => (x.id === id ? { ...x, affection: Math.min(100, x.affection + tune("pet.pet_affection")), lastPet: today() } : x)),
          stars: s.stars + (star ? tune("pet.daily_star") : 0),
          stats: { ...s.stats, petted: (s.stats.petted ?? 0) + 1 },
        });
        return { star };
      },
      feedPet: (id) => {
        const s = get(); const cost = tune("pet.feed_cost");
        if (!s.pets.some((x) => x.id === id) || s.coins < cost) return false;
        set({ coins: s.coins - cost, pets: s.pets.map((x) => (x.id === id ? { ...x, affection: Math.min(100, x.affection + tune("pet.feed_affection")) } : x)) });
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
