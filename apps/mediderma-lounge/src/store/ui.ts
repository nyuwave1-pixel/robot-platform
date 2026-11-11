/** 저장하지 않는 런타임 상태: 화면, 모드, 케어 세션, 방문 고객, 조이스틱 입력 등 */
import { create } from "zustand";
import type { ModeId, RoutineStep, ZoneId } from "../data/devices";
import type { ExpKey } from "../data/game";

export type Screen = "splash" | "intro" | "create" | "game";
export type Panel = null | "character" | "lounge" | "care" | "shop" | "social" | "quests" | "profile" | "settings" | "customers" | "growth";
export type GameMode = "explore" | "care" | "edit" | "cinematic" | "photo";
export type ZoneKey = "shelf" | "device" | "reception" | "vanity" | "photo";

export interface Customer {
  id: string; type: string; name: string;
  state: "enter" | "wait" | "toBed" | "care" | "toPay" | "pay" | "leave";
  seat: number; stars: number; t: number;
}

export interface CareSession {
  subject: "player" | string; // customer id
  routineId: string | null;
  title: string;
  phase: "pick" | "step" | "mist" | "result";
  steps: RoutineStep[];
  zones: ZoneId[];
  step: number;
  /** 현재 스텝에서 제품을 발랐는지 */
  applied: boolean;
  product: string | null;
  zone: ZoneId | null;
  done: ZoneId[];
  /** 현재 부위 진행도 0..1 */
  progress: number;
  modes: ModeId[];
  zonesDone: number;
  mist: boolean;
  mistAllowed: boolean;
  /** 고객 추천 적중 여부 */
  liked?: boolean;
  result?: { gain: Partial<Record<ExpKey, number>>; coins: number; stars?: number; lp?: number; firstTime: boolean };
}

interface UIState {
  screen: Screen;
  panel: Panel;
  shopTab: "product" | "fashion" | "interior" | "codex";
  mode: GameMode;
  near: ZoneKey | null;
  nearCustomer: string | null;
  toasts: { id: number; text: string }[];
  care: CareSession | null;
  customers: Customer[];
  consult: string | null;
  selected: string | null; // 편집 중 가구 uid
  visiting: string | null; // 방문 중인 데모 친구 id
  cine: { from: number; to: number } | null;
  growthView: number | null; // 연출 중 표시 성장값
  flash: number;
  stroking: boolean;
  set: (p: Partial<UIState>) => void;
  toast: (text: string) => void;
  open: (p: Panel) => void;
  patchCare: (p: Partial<CareSession>) => void;
  patchCustomer: (id: string, p: Partial<Customer>) => void;
}

let tid = 0;
export const useUI = create<UIState>((set, get) => ({
  screen: "splash",
  panel: null,
  shopTab: "product",
  mode: "explore",
  near: null,
  nearCustomer: null,
  toasts: [],
  care: null,
  customers: [],
  consult: null,
  selected: null,
  visiting: null,
  cine: null,
  growthView: null,
  flash: 0,
  stroking: false,
  set: (p) => set(p),
  toast: (text) => {
    const id = ++tid;
    set({ toasts: [...get().toasts.slice(-2), { id, text }] });
    setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 2600);
  },
  open: (p) => set({ panel: get().panel === p ? null : p }),
  patchCare: (p) => set((s) => (s.care ? { care: { ...s.care, ...p } } : {})),
  patchCustomer: (id, p) => set((s) => ({ customers: s.customers.map((c) => (c.id === id ? { ...c, ...p } : c)) })),
}));

/** 프레임마다 바뀌는 입력값은 리렌더 없이 공유한다. */
export const input = {
  joy: { x: 0, y: 0 },
  keys: new Set<string>(),
  moveTarget: null as null | { x: number; z: number },
  playerPos: { x: 0, z: 1.6 },
  playerYaw: Math.PI,
  moving: false,
  cam: { yaw: 0, pitch: 0.38, dist: 6.2 },
  camDragging: false,
};
