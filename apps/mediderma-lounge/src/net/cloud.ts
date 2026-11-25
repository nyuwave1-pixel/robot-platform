/**
 * 클라우드 백업 · 기기 이전 (Supabase RPC — supabase/mdl_lounge_cloud_save.sql)
 *  - 백업: 게임 · 라이프 · 이벤트 세이브를 한 벌로 묶어 플레이어 코드 + 기기 비밀값으로 올린다 (5분마다 · 창을 닫거나 숨길 때)
 *  - 기기 이전: 옛 기기에서 30분짜리 이전 코드를 만들고, 새 기기에서 친구 코드 + 이전 코드를 넣으면 계정과 세이브를 넘겨받는다
 *    (넘겨받으면 계정 비밀값이 새 기기 것으로 바뀌어, 옛 기기는 그 계정으로 더 저장하지 않는다)
 *  - 사진(SNS 피드 이미지)은 기기에만 두고 백업하지 않는다
 */
import { create } from "zustand";
import { useGame } from "../store/game";
import { newSecret, rpc, secret, setSecret } from "./contest";
import { sendAccountLink } from "../platform/bitpark";
import { useAccountLink, usePlatformStatus } from "../platform/status";

/** 백업하는 세이브 (zustand persist 이름) */
export const SAVE_KEYS = ["mediderma-lounge-save-v1", "mediderma-lounge-life-v1", "mediderma-lounge-events-v1"] as const;
export const BACKUP_EVERY_MS = 5 * 60_000;
const MAX_BYTES = 550_000;

export interface CloudMeta { name: string; stage: number; level: number; coins: number }
interface CloudState { status: "idle" | "saving" | "ok" | "error"; lastAt: string | null }
export const useCloud = create<CloudState>(() => ({ status: "idle", lastAt: null }));

const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };

/** 지금 세이브를 한 벌로 묶는다 (사진 제외). 너무 크면 null */
export function bundle(get: (k: string) => string | null = read): { data: Record<string, unknown>; meta: CloudMeta } | null {
  const data: Record<string, unknown> = {};
  for (const k of SAVE_KEYS) {
    const raw = get(k);
    if (!raw) continue;
    try {
      const v = JSON.parse(raw) as { state?: Record<string, unknown> };
      // SNS 피드 사진은 기기에만 둔다
      if (k === SAVE_KEYS[0] && v?.state && Array.isArray(v.state.posts)) v.state.posts = (v.state.posts as Record<string, unknown>[]).map((p) => ({ ...p, img: undefined }));
      data[k] = v;
    } catch { /* 깨진 세이브는 건너뛴다 */ }
  }
  const g = (data[SAVE_KEYS[0]] as { state?: Record<string, unknown> } | undefined)?.state;
  if (!g || !g.started) return null;
  if (JSON.stringify(data).length > MAX_BYTES) return null;
  const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : 0);
  return { data, meta: { name: typeof g.name === "string" ? g.name.slice(0, 12) : "", stage: num(g.stage), level: num((g.lounge as { level?: number } | undefined)?.level), coins: num(g.coins) } };
}

/** 넘겨받은 세이브를 이 기기에 쓴다 (아는 키 · 객체만). 쓴 키 수를 돌려준다 */
export function applyBundle(data: unknown, set: (k: string, v: string) => void = (k, v) => localStorage.setItem(k, v)): number {
  const o = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  let n = 0;
  for (const k of SAVE_KEYS) {
    const v = o[k];
    if (v && typeof v === "object" && (v as { state?: unknown }).state && typeof (v as { state?: unknown }).state === "object") { set(k, JSON.stringify(v)); n++; }
  }
  return n;
}

export type BackupResult = "ok" | "wait" | "auth" | "size" | "empty" | "error";
export async function backupNow(): Promise<BackupResult> {
  const g = useGame.getState();
  if (!g.started || !/^[A-Z0-9]{6}$/.test(g.friendCode ?? "")) return "empty";
  const b = bundle();
  if (!b) return "size";
  useCloud.setState({ status: "saving" });
  try {
    const r = await rpc<{ ok: boolean; error?: string; at?: string }>("mdl_save_put", { p_code: g.friendCode, p_secret: secret(), p_data: b.data, p_meta: b.meta });
    if (r.ok) {
      useCloud.setState({ status: "ok", lastAt: r.at ?? new Date().toISOString() });
      linkToPlatform();
      return "ok";
    }
    useCloud.setState((s) => ({ status: r.error === "wait" ? s.status === "saving" ? "ok" : s.status : "error" }));
    return (["wait", "auth", "size"] as const).find((e) => e === r.error) ?? "error";
  } catch { useCloud.setState({ status: "error" }); return "error"; }
}

/** 기기 이전 코드 만들기 (먼저 최신 백업을 올린다) */
export async function createTransfer(): Promise<{ pin: string; expires: string } | "nosave" | "auth" | "error"> {
  const g = useGame.getState();
  await backupNow();
  try {
    const r = await rpc<{ ok: boolean; error?: string; pin?: string; expires?: string }>("mdl_transfer_create", { p_code: g.friendCode, p_secret: secret() });
    if (r.ok && r.pin && /^[A-Z0-9]{8}$/.test(r.pin)) return { pin: r.pin, expires: r.expires ?? "" };
    return r.error === "nosave" ? "nosave" : r.error === "auth" ? "auth" : "error";
  } catch { return "error"; }
}

export const normPin = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);

/** 새 기기에서 넘겨받기: 성공하면 세이브를 쓰고 새로고침한다 */
export async function claimTransfer(code: string, pin: string, reload = () => location.reload()): Promise<"ok" | "pin" | "expired" | "bad" | "nosave" | "error"> {
  const c = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const p = normPin(pin);
  if (!/^[A-Z0-9]{6}$/.test(c) || p.length !== 8) return "bad";
  const fresh = newSecret();
  try {
    const r = await rpc<{ ok: boolean; error?: string; data?: unknown }>("mdl_transfer_claim", { p_code: c, p_pin: p, p_new_secret: fresh });
    if (!r.ok) return (["pin", "expired", "bad", "nosave"] as const).find((e) => e === r.error) ?? "error";
    if (!applyBundle(r.data)) return "nosave";
    setSecret(fresh);
    reload();
    return "ok";
  } catch { return "error"; }
}

/** 게임 중 자동 백업: 5분마다 · 창을 숨기거나 닫을 때 */
export function initCloudBackup() {
  if (typeof window === "undefined") return;
  let last = 0;
  const tick = () => {
    if (!useGame.getState().started || Date.now() - last < 60_000) return;
    last = Date.now();
    void backupNow();
  };
  setInterval(tick, BACKUP_EVERY_MS);
  // 포털이 계정 연결 정보를 알려 주면 (아직 연결이 없을 때) 이 게임 계정을 연결
  useAccountLink.subscribe(() => linkToPlatform());
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") tick(); });
  setTimeout(tick, 15_000);
}

/** 비트파크에 로그인해 있으면 이 게임 계정을 비트파크 계정에 연결 (계정이 바뀌었을 때만 다시 보낸다) */
let linkedSent = "";
export function linkToPlatform(force = false) {
  const g = useGame.getState();
  if (!g.started || !usePlatformStatus.getState().loggedIn) return;
  const { known, link: cur } = useAccountLink.getState();
  // 자동 연결은 비트파크 계정에 아직 연결된 게임이 없을 때만 (다른 진행이 연결돼 있으면 플레이어가 고른다)
  if (!known) return;
  if (cur && cur.code === g.friendCode && cur.secret === secret()) return; // 이미 연결돼 있다
  if (cur && cur.code !== g.friendCode && !force) return; // 다른 진행이 연결돼 있으면 플레이어가 고른다
  // (같은 계정인데 비밀값이 다르면 — 기기 이전 뒤 — 새 값으로 갱신)
  const key = `${g.friendCode}:${secret()}${force ? ":f" : ""}`;
  if (linkedSent === key) return;
  // 포털이 저장에 성공하면 portal_link 로 다시 알려 준다 → 그때 '연결됨' 표시
  if (sendAccountLink(g.friendCode, secret(), g.name)) linkedSent = key;
}

/** 비트파크 계정에 연결된 진행의 요약 (불러오기 전에 보여 준다) */
export async function accountMeta(link: { code: string; secret: string }): Promise<CloudMeta & { at: string } | null> {
  try {
    const r = await rpc<{ ok: boolean; exists?: boolean; meta?: Partial<CloudMeta>; at?: string }>("mdl_save_meta", { p_code: link.code, p_secret: link.secret });
    if (!r.ok || !r.exists) return null;
    const m = r.meta ?? {};
    const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : 0);
    return { name: typeof m.name === "string" ? m.name.slice(0, 12) : "", stage: num(m.stage), level: num(m.level), coins: num(m.coins), at: r.at ?? "" };
  } catch { return null; }
}

/** 비트파크 계정의 진행을 이 기기로 불러온다 (이 기기의 진행은 바뀐다) */
export async function loadFromAccount(link: { code: string; secret: string }, reload = () => location.reload()): Promise<"ok" | "auth" | "nosave" | "error"> {
  try {
    const r = await rpc<{ ok: boolean; error?: string; data?: unknown }>("mdl_save_get", { p_code: link.code, p_secret: link.secret });
    if (!r.ok) return r.error === "auth" ? "auth" : r.error === "nosave" ? "nosave" : "error";
    if (!applyBundle(r.data)) return "nosave";
    setSecret(link.secret);
    reload();
    return "ok";
  } catch { return "error"; }
}
