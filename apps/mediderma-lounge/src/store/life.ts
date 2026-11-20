/**
 * 라이프 콘텐츠 상태 (가든 · 피트니스 · 소품 컬렉션 · 친구 선물/도움).
 * 기존 세이브와 따로 저장하고, 코인·젬·경험치 보상은 useGame 에 더한다.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { BOX_COST, CURIO_MAP, CURIO_SETS, CURIOS, DUP_REFUND, FRIEND_MILESTONES, GIFT_COINS, GIFT_DAILY, HELP_COINS, HELP_DAILY, PLANT_MAP, WATER_EVERY_H, WORKOUT_DAILY, WORKOUT_MAP, growth, potsFor, rollCurio, type Curio } from "../data/life";
import { useGame } from "./game";

export interface PlantSlot { id: string; type: string; planted: number; water: number; lastWater: number }

const day = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);

export interface LifeState {
  garden: PlantSlot[];
  harvested: Record<string, number>; // 식물별 누적 수확 (원료 도감)
  fit: number; // 누적 피트니스 점수
  bestScore: Record<string, number>;
  curios: Record<string, number>; // 소품 보유 수
  setsClaimed: string[];
  milestones: number[];
  daily: { date: string; workouts: number; gifts: string[]; helps: string[]; boxes: number };

  plant: (type: string, now?: number) => "ok" | "full" | "money" | "level";
  water: (id: string, now?: number) => boolean;
  harvest: (id: string, now?: number) => { coins: number; ingredient: string } | null;
  finishWorkout: (id: string, hits: number) => { fit: number; coins: number; rewarded: boolean };
  openBox: (rnd?: () => number) => { curio: Curio; dup: boolean } | "money";
  claimSet: (setId: string) => boolean;
  sendGift: (friend: string) => boolean;
  helpFriend: (friend: string) => boolean;
  claimMilestone: (n: number, friends: number) => boolean;
}

const freshDaily = () => ({ date: day(), workouts: 0, gifts: [] as string[], helps: [] as string[], boxes: 0 });
const uid = () => Math.random().toString(36).slice(2, 10);
/** 날짜가 바뀌었으면 일일 기록을 새로 */
const dailyOf = (s: LifeState) => (s.daily.date === day() ? s.daily : freshDaily());

/** useGame 보상 반영 */
function reward(r: { coins?: number; gems?: number; exp?: Partial<Record<"skin" | "lounge" | "social" | "knowledge", number>> }) {
  useGame.setState((g) => {
    const exp = { ...g.exp };
    for (const [k, v] of Object.entries(r.exp ?? {})) exp[k as keyof typeof exp] += v ?? 0;
    return { coins: g.coins + (r.coins ?? 0), gems: g.gems + (r.gems ?? 0), exp };
  });
}
/** 퀘스트용 누적·오늘 카운트 */
const count = (stat: string) => { const b = useGame.getState().bump; b(stat, 1); b(stat, 1, true); };
const spend = (coins: number) => {
  const g = useGame.getState();
  if (g.coins < coins) return false;
  useGame.setState({ coins: g.coins - coins });
  return true;
};

export const useLife = create<LifeState>()(
  persist(
    (set, get) => ({
      garden: [],
      harvested: {},
      fit: 0,
      bestScore: {},
      curios: {},
      setsClaimed: [],
      milestones: [],
      daily: freshDaily(),

      plant: (type, now = Date.now()) => {
        const p = PLANT_MAP[type]; const s = get(); const lv = useGame.getState().lounge.level;
        if (!p) return "level";
        if (lv < p.minLevel) return "level";
        if (s.garden.length >= potsFor(lv)) return "full";
        if (!spend(p.seed)) return "money";
        set({ garden: [...s.garden, { id: uid(), type, planted: now, water: 0, lastWater: 0 }] });
        return "ok";
      },
      water: (id, now = Date.now()) => {
        const s = get(); const slot = s.garden.find((x) => x.id === id);
        if (!slot || now - slot.lastWater < WATER_EVERY_H * 3_600_000 || growth(slot, PLANT_MAP[slot.type], now).stage >= 3) return false;
        set({ garden: s.garden.map((x) => (x.id === id ? { ...x, water: x.water + 1, lastWater: now } : x)) });
        reward({ exp: { lounge: 2 } });
        return true;
      },
      harvest: (id, now = Date.now()) => {
        const s = get(); const slot = s.garden.find((x) => x.id === id); const p = slot && PLANT_MAP[slot.type];
        if (!slot || !p || growth(slot, p, now).stage < 3) return null;
        set({ garden: s.garden.filter((x) => x.id !== id), harvested: { ...s.harvested, [p.id]: (s.harvested[p.id] ?? 0) + 1 } });
        reward({ coins: p.coins, exp: { lounge: Math.round(p.exp / 2), knowledge: Math.round(p.exp / 2) } });
        count("harvest");
        return { coins: p.coins, ingredient: p.ingredient };
      },
      finishWorkout: (id, hits) => {
        const w = WORKOUT_MAP[id]; const s = get(); const d = dailyOf(s);
        if (!w) return { fit: 0, coins: 0, rewarded: false };
        const ratio = Math.max(0, Math.min(1, hits / w.beats));
        const rewarded = d.workouts < WORKOUT_DAILY;
        const fit = Math.round(w.fit * (0.3 + 0.7 * ratio)); // 끝까지 하면 점수가 낮아도 기본 점수
        const coins = rewarded ? Math.round(w.coins * ratio) : 0;
        set({ fit: s.fit + fit, bestScore: { ...s.bestScore, [id]: Math.max(s.bestScore[id] ?? 0, hits) }, daily: { ...d, workouts: d.workouts + 1 } });
        reward({ coins, exp: { skin: Math.round(fit / 3) } });
        count("workout");
        return { fit, coins, rewarded };
      },
      openBox: (rnd = Math.random) => {
        if (!spend(BOX_COST)) return "money";
        const s = get(); const curio = rollCurio(rnd(), rnd());
        const dup = (s.curios[curio.id] ?? 0) > 0;
        const d = dailyOf(s);
        set({ curios: { ...s.curios, [curio.id]: (s.curios[curio.id] ?? 0) + 1 }, daily: { ...d, boxes: d.boxes + 1 } });
        if (dup) reward({ coins: DUP_REFUND });
        else reward({ exp: { lounge: 5 } });
        return { curio, dup };
      },
      claimSet: (setId) => {
        const s = get(); const st = CURIO_SETS.find((x) => x.id === setId);
        if (!st || s.setsClaimed.includes(setId)) return false;
        if (!CURIOS.filter((c) => c.set === setId).every((c) => (s.curios[c.id] ?? 0) > 0)) return false;
        set({ setsClaimed: [...s.setsClaimed, setId] });
        reward({ coins: st.coins, gems: st.gems, exp: { lounge: 30 } });
        return true;
      },
      sendGift: (friend) => {
        const s = get(); const d = dailyOf(s);
        if (d.gifts.includes(friend) || d.gifts.length >= GIFT_DAILY) return false;
        set({ daily: { ...d, gifts: [...d.gifts, friend] } });
        reward({ coins: GIFT_COINS, exp: { social: 4 } });
        count("gift");
        return true;
      },
      helpFriend: (friend) => {
        const s = get(); const d = dailyOf(s);
        if (d.helps.includes(friend) || d.helps.length >= HELP_DAILY) return false;
        set({ daily: { ...d, helps: [...d.helps, friend] } });
        reward({ coins: HELP_COINS, exp: { social: 3, lounge: 1 } });
        return true;
      },
      claimMilestone: (n, friends) => {
        const s = get(); const m = FRIEND_MILESTONES.find((x) => x.n === n);
        if (!m || friends < n || s.milestones.includes(n)) return false;
        set({ milestones: [...s.milestones, n] });
        reward({ coins: m.coins, gems: m.gems, exp: { social: 10 } });
        return true;
      },
    }),
    {
      name: "mediderma-lounge-life-v1",
      version: 1,
      storage: createJSONStorage(() => ({
        getItem: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
        setItem: (k, v) => { try { localStorage.setItem(k, v); } catch { /* 저장 불가 환경 */ } },
        removeItem: (k) => { try { localStorage.removeItem(k); } catch { /* */ } },
      })),
      partialize: (s) => ({ garden: s.garden, harvested: s.harvested, fit: s.fit, bestScore: s.bestScore, curios: s.curios, setsClaimed: s.setsClaimed, milestones: s.milestones, daily: s.daily }) as LifeState,
      merge: (p, cur) => ({ ...cur, ...((p ?? {}) as Partial<LifeState>) }),
    },
  ),
);

/** 오늘 기록 (날짜가 바뀌었으면 빈 기록) */
export const lifeDaily = (s: LifeState) => dailyOf(s);
export const ownedCurios = (s: LifeState) => Object.keys(s.curios).filter((k) => (s.curios[k] ?? 0) > 0 && CURIO_MAP[k]).length;
