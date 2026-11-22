/** 이벤트 · 프로모션 상태: 공식 이벤트 보상, 내 라운지 열기·이벤트, 방문 혜택 하루 기록 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { EVENT_HOST_DAILY, EVENT_VISIT_DAILY, LOUNGE_EVENT_MAP, cleanEvents, isActive, type OfficialEvent } from "../data/events";
import { useGame } from "./game";

const today = () => new Date().toISOString().slice(0, 10);

export interface HostEvent { id: number; until: number }

interface EventsState {
  /** 보상을 받은 공식 이벤트 */
  claimed: string[];
  /** 안내를 본 공식 이벤트 (새 이벤트 표시용) */
  seen: string[];
  /** 내 라운지에 있는 동안 다른 플레이어가 실시간으로 들어올 수 있다 */
  open: boolean;
  /** 내가 연 라운지 이벤트 */
  hosting: HostEvent | null;
  daily: { date: string; hosted: number; visits: number; owners: string[] };
  /** 보상을 받은 콘테스트 주 */
  contestClaimed: string[];

  setOpen: (v: boolean) => void;
  markSeen: (ids: string[]) => void;
  /** 공식 이벤트 참여 보상. 받은 보상 또는 null */
  claimOfficial: (e: OfficialEvent, now?: number) => OfficialEvent["reward"] | null;
  startLoungeEvent: (id: number, now?: number) => "ok" | "money" | "limit" | "busy" | "bad";
  endLoungeEvent: () => void;
  /** 진행 중인 다른 사람 라운지 이벤트의 방문 혜택 (라운지마다 하루 한 번) */
  eventVisit: (owner: string, id: number, until: number, now?: number) => { coins: number; stars: number } | null;
  /** 지난 주 콘테스트 순위 보상 (주마다 한 번) */
  claimContest: (week: string, reward: { coins: number; gems: number } | null) => boolean;
}

const day = (d: EventsState["daily"]) => (d.date === today() ? d : { date: today(), hosted: 0, visits: 0, owners: [] });

export const useEvents = create<EventsState>()(
  persist(
    (set, get) => ({
      claimed: [], seen: [], open: true, hosting: null, contestClaimed: [],
      daily: { date: today(), hosted: 0, visits: 0, owners: [] },

      setOpen: (v) => set({ open: v }),
      markSeen: (ids) => set((s) => ({ seen: [...new Set([...s.seen, ...ids])].slice(-100) })),
      claimOfficial: (e, now = Date.now()) => {
        const s = get();
        if (!isActive(e, now) || !e.reward || s.claimed.includes(e.id)) return null;
        const g = useGame.getState();
        useGame.setState({ coins: g.coins + (e.reward.coins ?? 0), gems: g.gems + (e.reward.gems ?? 0), stars: g.stars + (e.reward.stars ?? 0) });
        set({ claimed: [...s.claimed, e.id].slice(-200) });
        return e.reward;
      },
      startLoungeEvent: (id, now = Date.now()) => {
        const t = LOUNGE_EVENT_MAP[id];
        if (!t) return "bad";
        const s = get();
        if (s.hosting && s.hosting.until > now) return "busy";
        const d = day(s.daily);
        if (d.hosted >= EVENT_HOST_DAILY) return "limit";
        const g = useGame.getState();
        if (g.coins < t.cost) return "money";
        useGame.setState({ coins: g.coins - t.cost });
        set({ hosting: { id, until: now + t.minutes * 60_000 }, daily: { ...d, hosted: d.hosted + 1 } });
        return "ok";
      },
      endLoungeEvent: () => set({ hosting: null }),
      claimContest: (week, reward) => {
        const s = get();
        if (!reward || !/^\d{4}-W\d{2}$/.test(week) || s.contestClaimed.includes(week)) return false;
        const g = useGame.getState();
        useGame.setState({ coins: g.coins + reward.coins, gems: g.gems + reward.gems });
        set({ contestClaimed: [...s.contestClaimed, week].slice(-60) });
        return true;
      },
      eventVisit: (owner, id, until, now = Date.now()) => {
        const t = LOUNGE_EVENT_MAP[id];
        const g = useGame.getState();
        if (!t || !owner || owner === g.friendCode || until <= now || until > now + 2 * 3_600_000) return null;
        const d = day(get().daily);
        if (d.owners.includes(owner) || d.visits >= EVENT_VISIT_DAILY) return null;
        useGame.setState({ coins: g.coins + t.coins, stars: g.stars + t.stars });
        set({ daily: { ...d, visits: d.visits + 1, owners: [...d.owners, owner] } });
        return { coins: t.coins, stars: t.stars };
      },
    }),
    {
      name: "mediderma-lounge-events-v1",
      version: 1,
      storage: createJSONStorage(() => ({
        getItem: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
        setItem: (k, v) => { try { localStorage.setItem(k, v); } catch { /* 저장 불가 환경 */ } },
        removeItem: (k) => { try { localStorage.removeItem(k); } catch { /* 저장 불가 환경 */ } },
      })),
      partialize: (s) => ({ claimed: s.claimed, seen: s.seen, open: s.open, hosting: s.hosting, daily: s.daily, contestClaimed: s.contestClaimed }),
    },
  ),
);

/** 지금 진행 중인 내 라운지 이벤트 (끝났으면 null) */
export const activeHosting = (h: HostEvent | null, now = Date.now()) => (h && h.until > now ? h : null);

// ───────────── 공식 이벤트 목록 (public/events.json) ─────────────
interface OfficialState { list: OfficialEvent[]; status: "idle" | "loading" | "ok" | "error" }
export const useOfficial = create<OfficialState>(() => ({ list: [], status: "idle" }));
export async function loadOfficialEvents(force = false) {
  const st = useOfficial.getState().status;
  if (!force && (st === "loading" || st === "ok")) return;
  useOfficial.setState({ status: "loading" });
  try {
    const res = await fetch(`./events.json?t=${Math.floor(Date.now() / 300_000)}`, { cache: "no-cache" });
    if (!res.ok) throw new Error(String(res.status));
    useOfficial.setState({ list: cleanEvents(await res.json()), status: "ok" });
  } catch {
    useOfficial.setState({ status: "error" });
  }
}
