/**
 * BIT PARK 포털 (bitpark.airobotphysical.com) 포인트(PP) 상점.
 *  - 게임이 포털 iframe(#play/beauty-life) 안에서 돌 때만 쓸 수 있다. 포털 밖에서는 "BIT PARK 에서 열기" 안내만 한다
 *  - 가격은 포털 DB(game_products)가 정한다. 게임은 상품을 "요청"만 하고, 포털이 자기 확인 창을 띄워 본인이 눌러야 결제된다
 *  - 결제되면 영수증이 생기고, 게임은 영수증을 claim 해서 성공할 때만 지급한다 (영수증 하나에 한 번 — 다른 기기 · 재전송 중복 지급 없음)
 *  - 결제 뒤 지급 전에 창이 닫혔으면 다음 실행 때 getUnclaimed 로 찾아 마저 지급한다
 *  - 메시지 규격: 포털 SDK v1.1 (bitpark-portal public/sdk/bitpark-sdk.js) 과 같다
 */
import { create } from "zustand";
import { FASHION_MAP, INTERIOR_MAP } from "../data/game";
import { useGame } from "../store/game";

export const BP_PORTAL_ORIGINS = ["https://bitpark.airobotphysical.com"];
export const BP_GAME_ID = "beauty-life";
export const BP_PLAY_URL = "https://bitpark.airobotphysical.com/#play/beauty-life";
const SDK = "1.1.0";

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

/* ── 게임 쪽 지급표: sku → 무엇을 주는가 (가격은 포털 표) ── */
export type PPGrant = { gems?: number; coins?: number; fashion?: string; interior?: string };
const ITEM_GRANTS: Record<string, PPGrant> = Object.fromEntries([
  ...Object.values(FASHION_MAP).filter((f) => f.currency === "gem").map((f) => [`item:${f.id}`, { fashion: f.id }]),
  ...Object.values(INTERIOR_MAP).filter((i) => i.currency === "gem").map((i) => [`item:${i.id}`, { interior: i.id }]),
]);
export const PP_GRANTS: Record<string, PPGrant> = {
  "gems-10": { gems: 10 }, "gems-30": { gems: 30 }, "gems-60": { gems: 60 }, "coins-5000": { coins: 5000 },
  ...ITEM_GRANTS,
};

/** 지급 — 아이템은 그 값만큼 젬을 넣고 게임의 원래 구매를 그대로 실행한다 (EXP · 통계가 젬 구매와 같게). 이미 가진 아이템이면 젬으로 남는다 */
export function applyGrant(sku: string): "gems" | "coins" | "item" | "kept-gems" | null {
  const g = PP_GRANTS[sku];
  if (!g) return null;
  const st = useGame.getState();
  if (g.gems) { useGame.setState({ gems: st.gems + g.gems }); return "gems"; }
  if (g.coins) { useGame.setState({ coins: st.coins + g.coins }); return "coins"; }
  if (g.fashion) {
    const f = FASHION_MAP[g.fashion];
    useGame.setState({ gems: st.gems + f.price });
    return useGame.getState().buyFashion(f.id) ? "item" : "kept-gems";
  }
  if (g.interior) {
    const it = INTERIOR_MAP[g.interior];
    useGame.setState({ gems: st.gems + it.price });
    return useGame.getState().buyInterior(it.id) ? "item" : "kept-gems";
  }
  return null;
}

/* ── 포털 SDK 호출 ── */
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
    window.parent.postMessage({ source: "bitpark-game", slug: BP_GAME_ID, sdk: SDK, call, id, args }, origin);
  });
}
export function portalEmit(event: string, data: Record<string, unknown> = {}) {
  const origin = bpPortalOrigin();
  if (!origin) return;
  try { window.parent.postMessage({ source: "bitpark-game", slug: BP_GAME_ID, sdk: SDK, event, data }, origin); } catch { /* 부모 창이 사라짐 */ }
}

export function newIdem() {
  const b = new Uint8Array(12);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/* ── 상태 ── */
export interface PPProduct { sku: string; name: string; price: number; dailyLimit: number | null }
interface PPState {
  status: "off" | "loading" | "ok" | "error";
  signedIn: boolean; pp: number | null; products: PPProduct[];
  /** 지금 결제 중인 sku (확인 창이 떠 있는 동안) */
  busy: string | null;
}
export const usePPShop = create<PPState>(() => ({ status: "off", signedIn: false, pp: null, products: [], busy: null }));

/** 포털이 준 상품 중 게임이 지급할 수 있는 것만 (모르는 sku 는 보이지 않는다) */
export function cleanProducts(v: unknown): PPProduct[] {
  return (Array.isArray(v) ? v : []).slice(0, 60).map((x) => {
    const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    if (typeof o.sku !== "string" || !PP_GRANTS[o.sku]) return null;
    const price = typeof o.price === "number" && isFinite(o.price) && o.price > 0 ? Math.floor(o.price) : 0;
    if (!price) return null;
    const name = typeof o.name === "string" ? o.name.replace(/[\u0000-\u001f<>]/g, "").slice(0, 40) : o.sku;
    const dl = typeof o.dailyLimit === "number" && o.dailyLimit > 0 ? Math.floor(o.dailyLimit) : null;
    return { sku: o.sku, name, price, dailyLimit: dl };
  }).filter((p): p is PPProduct => !!p);
}

/** 상점 열 때: 로그인 · 잔액 · 상품 · 못 받은 영수증 */
export async function loadPPShop() {
  if (!bpPortalOrigin()) { usePPShop.setState({ status: "off" }); return; }
  usePPShop.setState((s) => ({ status: s.status === "ok" ? "ok" : "loading" }));
  try {
    const [me, wallet, products] = await Promise.all([
      portalCall<{ signedIn?: boolean }>("getPlayer"),
      portalCall<Record<string, number>>("getWallet"),
      portalCall<unknown>("getProducts"),
    ]);
    const signedIn = me?.signedIn === true;
    usePPShop.setState({ status: "ok", signedIn, pp: signedIn && typeof wallet?.PP === "number" ? wallet.PP : null, products: cleanProducts(products) });
    if (signedIn) await recoverUnclaimed();
  } catch {
    usePPShop.setState({ status: "error" });
  }
}

async function claimAndGrant(receipt: string, sku: string) {
  const c = await portalCall<{ ok?: boolean; sku?: string }>("claimPurchase", { receipt });
  if (c?.ok !== true || c.sku !== sku) return null;
  return applyGrant(sku);
}

/** 결제했지만 아직 못 받은 것 마저 지급 → 지급한 sku 목록 */
export async function recoverUnclaimed(): Promise<string[]> {
  const list = await portalCall<unknown>("getUnclaimed").catch(() => []);
  const done: string[] = [];
  for (const r of Array.isArray(list) ? list.slice(0, 20) : []) {
    const o = (r && typeof r === "object" ? r : {}) as Record<string, unknown>;
    if (typeof o.receipt !== "string" || typeof o.sku !== "string" || !PP_GRANTS[o.sku]) continue;
    if (await claimAndGrant(o.receipt, o.sku).catch(() => null)) done.push(o.sku);
  }
  return done;
}

export type BuyResult = { ok: true; grant: NonNullable<ReturnType<typeof applyGrant>>; balance: number | null }
  | { ok: false; reason: "no_portal" | "not_signed_in" | "cancelled" | "insufficient_funds" | "daily_limit" | "item_unavailable" | "busy" | "error" };

/** 구매: 포털 확인 창 → 결제 → 영수증 claim → 지급 */
export async function buyWithPP(sku: string): Promise<BuyResult> {
  if (!bpPortalOrigin()) return { ok: false, reason: "no_portal" };
  if (!PP_GRANTS[sku]) return { ok: false, reason: "item_unavailable" };
  if (usePPShop.getState().busy) return { ok: false, reason: "busy" };
  usePPShop.setState({ busy: sku });
  try {
    const r = await portalCall<{ receipt?: string; sku?: string; balance?: number }>("purchase", { sku, idem: newIdem() }, 300_000);
    if (typeof r?.receipt !== "string" || r.sku !== sku) return { ok: false, reason: "error" };
    const balance = typeof r.balance === "number" ? r.balance : null;
    if (balance !== null) usePPShop.setState({ pp: balance });
    const grant = await claimAndGrant(r.receipt, sku).catch(() => null);
    // claim 이 안 됐으면 영수증은 남아 있다 → 다음에 상점을 열 때 recoverUnclaimed 가 마저 지급
    if (!grant) return { ok: false, reason: "error" };
    return { ok: true, grant, balance };
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    const known = ["not_signed_in", "cancelled", "insufficient_funds", "daily_limit", "item_unavailable", "busy"] as const;
    return { ok: false, reason: known.find((k) => m.includes(k)) ?? "error" };
  } finally {
    usePPShop.setState({ busy: null });
  }
}
