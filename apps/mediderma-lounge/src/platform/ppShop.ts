/**
 * BIT PARK 포털 (bitpark.airobotphysical.com) 포인트(P) — 게임 속 유료 아이템 · 재화.
 * 포털의 게임 경제(bitpark-portal docs/GAME_ECONOMY.md)를 그대로 쓴다:
 *  - 뷰티 코인 충전: spendPoints({ sku: "beauty-life:topup10|30|50" }) — 포털 가격표, 하루 한도는 포털이 확인
 *  - 뷰티 젬 팩(소모품): buyGameItem → 바로 useGameItem 으로 1개 써서 젬 지급 (같은 ref 는 서버가 한 번만 차감)
 *  - 프리미엄 아이템(한 번 사는 것): buyGameItem → 소유는 포털 인벤토리 → getGameItems 의 owned 로 어느 기기에서든 저장에 넣음
 *  - 결제 확인 창은 항상 포털이 띄운다 (게임이 대신 누를 수 없음). 게임은 포털 플레이어 iframe 안에서만 살 수 있다
 */
import { create } from "zustand";
import { FASHION_MAP, INTERIOR_MAP } from "../data/game";
import { useGame } from "../store/game";

export const BP_PORTAL_ORIGINS = ["https://bitpark.airobotphysical.com"];
export const BP_GAME_ID = "beauty-life";
export const BP_PLAY_URL = "https://bitpark.airobotphysical.com/#play/beauty-life";

/** 포털 iframe 안이면 포털 주소 (아니면 null) */
export function bpPortalOrigin(): string | null {
  try {
    if (typeof window === "undefined" || window.parent === window) return null;
    const anc = (window.location as Location & { ancestorOrigins?: DOMStringList }).ancestorOrigins;
    const parent = anc && anc.length ? anc[0] : document.referrer ? new URL(document.referrer).origin : "";
    return BP_PORTAL_ORIGINS.includes(parent) ? parent : null;
  } catch {
    return null;
  }
}

/* ── 게임 쪽 지급표 (포털 shop_items 와 같은 id — 마이그레이션 20261128010000_beauty_life_game_items.sql) ── */
export type PPGrant = { gems?: number; fashion?: string; interior?: string };
const ITEM_IDS: [string, PPGrant][] = [
  ...Object.values(FASHION_MAP).filter((f) => f.currency === "gem").map((f): [string, PPGrant] => [`beauty-life-${f.id}`, { fashion: f.id }]),
  ...Object.values(INTERIOR_MAP).filter((i) => i.currency === "gem").map((i): [string, PPGrant] => [`beauty-life-${i.id}`, { interior: i.id }]),
];
export const PP_GRANTS: Record<string, PPGrant> = {
  "beauty-life-gems-10": { gems: 10 }, "beauty-life-gems-30": { gems: 30 }, "beauty-life-gems-60": { gems: 60 },
  ...Object.fromEntries(ITEM_IDS),
};
export const isGemPack = (id: string) => !!PP_GRANTS[id]?.gems;

/** 충전 팩 (표시용 — 실제 지급 코인은 포털 응답의 coins) */
export const TOPUPS = [
  { pack: "topup10", pp: 10, coins: 100 }, { pack: "topup30", pp: 30, coins: 330 }, { pack: "topup50", pp: 50, coins: 600 },
] as const;

/** 한 번짜리 아이템이 이 저장에 이미 있는지 */
export function hasItem(id: string): boolean {
  const g = PP_GRANTS[id]; const s = useGame.getState();
  if (!g) return false;
  if ((s.ppGranted ?? []).includes(id)) return true;
  if (g.fashion) return s.ownedFashion.includes(g.fashion);
  if (g.interior) return INTERIOR_MAP[g.interior]?.kind !== "furniture" && s.ownedInterior.includes(g.interior);
  return false;
}

/** 지급 — 젬은 그대로, 아이템은 그 값만큼 젬을 넣고 게임의 원래 구매를 실행 (EXP · 통계가 젬 구매와 같게). 이미 있으면 아무것도 안 함 */
export function applyGrant(id: string): "gems" | "item" | "owned" | null {
  const g = PP_GRANTS[id];
  if (!g) return null;
  const st = useGame.getState();
  if (g.gems) { useGame.setState({ gems: st.gems + g.gems }); return "gems"; }
  if (hasItem(id)) return "owned";
  const mark = () => useGame.setState((s) => ({ ppGranted: [...new Set([...(s.ppGranted ?? []), id])] }));
  if (g.fashion) {
    const f = FASHION_MAP[g.fashion];
    useGame.setState({ gems: st.gems + f.price });
    if (!useGame.getState().buyFashion(f.id)) { useGame.setState((s) => ({ gems: s.gems - f.price })); return null; }
    mark(); return "item";
  }
  if (g.interior) {
    const it = INTERIOR_MAP[g.interior];
    useGame.setState({ gems: st.gems + it.price });
    if (!useGame.getState().buyInterior(it.id)) { useGame.setState((s) => ({ gems: s.gems - it.price })); return null; }
    mark(); return "item";
  }
  return null;
}

/* ── 포털 SDK 호출 (bitpark-portal backend.js SDK_CALLS) ── */
const pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
let seq = 0;
let listening = false;
function listen(origin: string) {
  if (listening) return;
  listening = true;
  window.addEventListener("message", (e) => {
    if (e.origin !== origin || e.source !== window.parent) return;
    const m = e.data as { source?: unknown; id?: unknown; ok?: unknown; result?: unknown; error?: unknown } | null;
    if (!m || m.source !== "bitpark-portal" || typeof m.id !== "string" || !pending.has(m.id)) return;
    const p = pending.get(m.id)!;
    clearTimeout(p.timer); pending.delete(m.id);
    if (m.ok === true) p.resolve(m.result);
    else p.reject(new Error(typeof m.error === "string" ? m.error.slice(0, 40) : "portal_error"));
  });
}
export function portalCall<T>(call: string, args?: Record<string, unknown>, timeoutMs = 8000): Promise<T> {
  const origin = bpPortalOrigin();
  if (!origin) return Promise.reject(new Error("no_portal"));
  listen(origin);
  const id = `${BP_GAME_ID}:${++seq}`;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error("portal_timeout")); }, timeoutMs);
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject, timer });
    window.parent.postMessage({ source: "bitpark-game", slug: BP_GAME_ID, sdk: "1.0.0", call, id, args }, origin);
  });
}
export function portalEmit(event: string, data: Record<string, unknown> = {}) {
  const origin = bpPortalOrigin();
  if (!origin) return;
  try { window.parent.postMessage({ source: "bitpark-game", slug: BP_GAME_ID, sdk: "1.0.0", event, data }, origin); } catch { /* 부모 창이 사라짐 */ }
}
export function newRef() {
  const b = new Uint8Array(12);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/* ── 상태 ── */
export interface PPItem { id: string; name: string; price: number; owned: boolean; count: number; consumable: boolean }
interface PPState {
  status: "off" | "loading" | "ok" | "error";
  signedIn: boolean; canSpend: boolean; pp: number | null; items: PPItem[];
  /** 지금 결제 중인 것 (확인 창이 떠 있는 동안) */
  busy: string | null;
}
export const usePPShop = create<PPState>(() => ({ status: "off", signedIn: false, canSpend: false, pp: null, items: [], busy: null }));

/** 포털이 준 아이템 중 게임이 지급할 수 있는 PP 상품만 */
export function cleanItems(v: unknown): PPItem[] {
  return (Array.isArray(v) ? v : []).slice(0, 60).map((x) => {
    const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    if (typeof o.id !== "string" || !PP_GRANTS[o.id] || o.currency !== "PP") return null;
    const price = typeof o.price === "number" && isFinite(o.price) && o.price > 0 ? Math.floor(o.price) : 0;
    if (!price) return null;
    const name = typeof o.name === "string" ? o.name.replace(/[\u0000-\u001f<>]/g, "").slice(0, 40) : o.id;
    const count = typeof o.count === "number" && o.count > 0 ? Math.min(999, Math.floor(o.count)) : 0;
    return { id: o.id, name, price, owned: o.owned === true, count, consumable: o.consumable === true };
  }).filter((p): p is PPItem => !!p);
}

/** 젬 팩 1개 쓰기 → 젬 지급. ref 를 먼저 저장해 두고, 결과를 받으면 지운다 (응답을 놓쳐도 같은 ref 로 다시 물어 한 번만 받음) */
async function useGemPack(id: string, ref = newRef()): Promise<boolean> {
  useGame.setState((s) => ({ ppPending: { ...(s.ppPending ?? {}), [ref]: id } }));
  const drop = () => useGame.setState((s) => { const { [ref]: _d, ...rest } = s.ppPending ?? {}; return { ppPending: rest }; });
  try {
    await portalCall("useGameItem", { id, ref });
    drop();
    return applyGrant(id) === "gems";
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    if (m.includes("none_left") || m.includes("item_unavailable")) drop();   // 남은 게 없거나 잘못된 것 → 다시 물을 필요 없음
    return false;
  }
}

/** 포털과 맞추기: 응답을 놓친 젬 팩 → 남은 젬 팩 → 포털에 있는데 저장에 없는 아이템. 넣은 것 목록을 돌려준다 */
export async function syncWithPortal(items: PPItem[]): Promise<string[]> {
  const done: string[] = [];
  for (const [ref, id] of Object.entries(useGame.getState().ppPending ?? {}).slice(0, 20)) {
    if (PP_GRANTS[id] && (await useGemPack(id, ref))) done.push(id);
  }
  // 위에서 쓴 만큼 count 가 줄었으니 다시 읽는다
  const fresh = done.length ? cleanItems(await portalCall<unknown>("getGameItems").catch(() => [])) : items;
  for (const it of fresh) {
    if (it.consumable && isGemPack(it.id)) for (let i = 0; i < Math.min(it.count, 20); i++) { if (await useGemPack(it.id)) done.push(it.id); else break; }
    else if (it.owned && !isGemPack(it.id) && applyGrant(it.id) === "item") done.push(it.id);
  }
  if (done.length) usePPShop.setState({ items: cleanItems(await portalCall<unknown>("getGameItems").catch(() => [])) });
  return done;
}

/** 상점 열 때: 로그인 · 사용 가능 여부 · 잔액 · 아이템 → 포털과 맞추기 */
export async function loadPPShop(): Promise<string[]> {
  if (!bpPortalOrigin()) { usePPShop.setState({ status: "off" }); return []; }
  usePPShop.setState((s) => ({ status: s.status === "ok" ? "ok" : "loading" }));
  try {
    const [me, wallet, items] = await Promise.all([
      portalCall<{ signedIn?: boolean; canSpendPoints?: boolean }>("getPlayer"),
      portalCall<Record<string, number>>("getWallet"),
      portalCall<unknown>("getGameItems"),
    ]);
    const signedIn = me?.signedIn === true;
    const list = cleanItems(items);
    usePPShop.setState({ status: "ok", signedIn, canSpend: me?.canSpendPoints === true, pp: signedIn && typeof wallet?.PP === "number" ? wallet.PP : null, items: list });
    return signedIn ? await syncWithPortal(list) : [];
  } catch {
    usePPShop.setState({ status: "error" });
    return [];
  }
}

const refreshWallet = async () => {
  const w = await portalCall<Record<string, number>>("getWallet").catch(() => null);
  if (w && typeof w.PP === "number") usePPShop.setState({ pp: w.PP });
};

export type BuyFail = "no_portal" | "not_signed_in" | "cancelled" | "insufficient_funds" | "daily_limit" | "already_owned" | "item_unavailable" | "busy" | "error";
export type BuyResult = { ok: true; grant: "gems" | "item" | "coins"; amount?: number } | { ok: false; reason: BuyFail };
const failOf = (e: unknown): BuyFail => {
  const m = e instanceof Error ? e.message : "";
  if (m.includes("declined") || m.includes("cancelled")) return "cancelled";
  if (m.includes("insufficient")) return "insufficient_funds";
  return (["not_signed_in", "daily_limit", "already_owned", "item_unavailable", "no_portal"] as const).find((k) => m.includes(k)) ?? "error";
};

/** 젬 팩 · 프리미엄 아이템 사기 (포털 확인 창 → 결제 → 지급) */
export async function buyItem(id: string): Promise<BuyResult> {
  if (!bpPortalOrigin()) return { ok: false, reason: "no_portal" };
  if (!PP_GRANTS[id]) return { ok: false, reason: "item_unavailable" };
  if (usePPShop.getState().busy) return { ok: false, reason: "busy" };
  usePPShop.setState({ busy: id });
  try {
    await portalCall("buyGameItem", { id }, 300_000);
    void refreshWallet();
    if (isGemPack(id)) {
      // 산 젬 팩은 바로 1개 써서 젬으로. 실패하면 포털에 남아 있어 다음에 상점을 열 때 마저 지급
      return (await useGemPack(id)) ? { ok: true, grant: "gems", amount: PP_GRANTS[id].gems } : { ok: false, reason: "error" };
    }
    const g = applyGrant(id);
    return g === "item" || g === "owned" ? { ok: true, grant: "item" } : { ok: false, reason: "error" };
  } catch (e) {
    return { ok: false, reason: failOf(e) };
  } finally {
    usePPShop.setState({ busy: null });
    usePPShop.setState({ items: cleanItems(await portalCall<unknown>("getGameItems").catch(() => usePPShop.getState().items)) });
  }
}

/** 뷰티 코인 충전 (포털 가격표 · 하루 한도). 같은 요청 재시도는 같은 ref 로 → 두 번 차감 없음 */
export async function topUp(pack: (typeof TOPUPS)[number]["pack"], label: string): Promise<BuyResult> {
  if (!bpPortalOrigin()) return { ok: false, reason: "no_portal" };
  if (usePPShop.getState().busy) return { ok: false, reason: "busy" };
  usePPShop.setState({ busy: pack });
  const idem = newRef();
  try {
    const r = await portalCall<{ ok?: boolean; coins?: number; balance?: number }>("spendPoints", { sku: `${BP_GAME_ID}:${pack}`, idem, label }, 300_000);
    const coins = typeof r?.coins === "number" && r.coins > 0 ? Math.min(100_000, Math.floor(r.coins)) : 0;
    if (!coins) return { ok: false, reason: "error" };
    useGame.setState((s) => ({ coins: s.coins + coins }));
    if (typeof r.balance === "number") usePPShop.setState({ pp: r.balance });
    return { ok: true, grant: "coins", amount: coins };
  } catch (e) {
    return { ok: false, reason: failOf(e) };
  } finally {
    usePPShop.setState({ busy: null });
  }
}
