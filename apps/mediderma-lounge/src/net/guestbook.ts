/**
 * 라운지 방명록 (Supabase RPC — supabase/mdl_lounge_guestbook.sql)
 *  - 다른 플레이어 라운지에 정해진 문구 + 스티커를 남긴다 (자유 글 없음)
 *  - 라운지마다 하루 한 번, 하루 최대 10곳. 처음 남길 때마다 작은 보상
 *  - 본인 확인은 콘테스트와 같은 기기 비밀값을 쓴다
 */
import { create } from "zustand";
import { useGame } from "../store/game";
import { cleanName } from "./plaza";
import { rpc, secret } from "./contest";

export const GB_MESSAGES: { id: number; ko: string; en: string }[] = [
  { id: 0, ko: "라운지가 정말 예뻐요", en: "Your lounge is so pretty" },
  { id: 1, ko: "인테리어 감각 최고예요", en: "Amazing interior taste" },
  { id: 2, ko: "포근하고 편안한 분위기예요", en: "Such a cozy, calm vibe" },
  { id: 3, ko: "조명이 너무 잘 어울려요", en: "The lighting fits perfectly" },
  { id: 4, ko: "케어 받고 피부가 환해졌어요", en: "My skin glows after the care" },
  { id: 5, ko: "콘테스트 응원할게요", en: "Rooting for you in the contest" },
  { id: 6, ko: "또 놀러 올게요", en: "I'll visit again" },
  { id: 7, ko: "제 라운지에도 놀러 오세요", en: "Come visit my lounge too" },
  { id: 8, ko: "오늘도 좋은 하루 보내세요", en: "Have a lovely day" },
  { id: 9, ko: "사진 찍기 딱 좋은 곳이에요", en: "Perfect spot for photos" },
];
/** 스티커: 아이콘 이름 + 색 */
export const GB_STICKERS: { id: number; icon: "sparkle" | "flower" | "gift" | "party" | "smile" | "bottle"; color: string }[] = [
  { id: 0, icon: "sparkle", color: "#d9a441" },
  { id: 1, icon: "flower", color: "#e2718d" },
  { id: 2, icon: "smile", color: "#7fc8a9" },
  { id: 3, icon: "gift", color: "#b9a2e8" },
  { id: 4, icon: "party", color: "#7fa8d8" },
  { id: 5, icon: "bottle", color: "#c9a66b" },
];
/** 처음 남길 때 받는 코인 (서버가 라운지마다 하루 한 번만 받아 준다) */
export const GB_REWARD = 15;
export const GB_DAILY = 10;

export interface Note { writer: string; name: string; msg: number; sticker: number; at: string }

/** 서버가 준 값도 아는 형식만 받는다 */
export function cleanNote(v: unknown): Note | null {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const writer = typeof o.writer === "string" && /^[A-Z0-9]{6}$/.test(o.writer) ? o.writer : "";
  const msg = typeof o.msg === "number" && GB_MESSAGES.some((m) => m.id === o.msg) ? o.msg : -1;
  const sticker = typeof o.sticker === "number" && GB_STICKERS.some((s) => s.id === o.sticker) ? o.sticker : 0;
  const t = typeof o.at === "string" ? Date.parse(o.at) : NaN;
  if (!writer || msg < 0 || !isFinite(t)) return null;
  return { writer, name: cleanName(o.name), msg, sticker, at: new Date(t).toISOString() };
}

interface GbState { owner: string; status: "idle" | "loading" | "ok" | "error"; list: Note[]; /** 내 방명록 최신 글 시각 (새 글 표시용) */ mineLatest: string }
export const useGuestbook = create<GbState>(() => ({ owner: "", status: "idle", list: [], mineLatest: "" }));

export async function loadGuestbook(owner: string) {
  if (!/^[A-Z0-9]{6}$/.test(owner)) return;
  useGuestbook.setState((s) => ({ owner, status: s.owner === owner && s.list.length ? s.status : "loading", list: s.owner === owner ? s.list : [] }));
  try {
    const raw = await rpc<unknown[]>("mdl_guest_list", { p_owner: owner });
    if (useGuestbook.getState().owner !== owner) return;
    const list = (Array.isArray(raw) ? raw : []).map(cleanNote).filter((n): n is Note => !!n);
    useGuestbook.setState({ status: "ok", list, ...(owner === useGame.getState().friendCode ? { mineLatest: list[0]?.at ?? "" } : {}) });
  } catch {
    if (useGuestbook.getState().owner === owner) useGuestbook.setState({ status: "error" });
  }
}

export async function writeGuestbook(owner: string, msg: number, sticker: number): Promise<"ok" | "self" | "dup" | "limit" | "auth" | "bad" | "error"> {
  const g = useGame.getState();
  try {
    const r = await rpc<{ ok: boolean; error?: string }>("mdl_guest_write", { p_code: g.friendCode, p_secret: secret(), p_owner: owner, p_name: g.name, p_msg: msg, p_sticker: sticker });
    void loadGuestbook(owner);
    if (r.ok) { useGame.setState({ coins: useGame.getState().coins + GB_REWARD }); return "ok"; }
    return (["self", "dup", "limit", "auth", "bad"] as const).find((e) => e === r.error) ?? "error";
  } catch { return "error"; }
}
