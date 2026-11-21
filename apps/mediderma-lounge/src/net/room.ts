/**
 * 오픈 라운지: 다른 플레이어가 내 라운지에 실시간으로 들어온다.
 * 월드 광장과 같은 Supabase Realtime 공개 채널(Presence + Broadcast)만 쓰고, 데이터베이스에는 아무것도 저장하지 않는다.
 *  - 라운지 채널 mdl-lounge-<친구 코드>: 주인(host)과 방문객(guest)의 외형·위치·인사말, 주인의 라운지 꾸밈·이벤트
 *  - 로비 채널 mdl-lounge-lobby: 지금 열려 있는 라운지 목록 (주인만 자기 라운지를 알린다)
 *  - 주인 공지: 정해진 안내 문구 번호만 보낸다 (자유 채팅 없음)
 * 연결에 실패해도 라운지는 혼자서 동작한다.
 */
import { RealtimeClient, type RealtimeChannel } from "@supabase/realtime-js";
import { create } from "zustand";
import { LOUNGE_EVENT_MAP, NOTICES } from "../data/events";
import { activeHosting, useEvents } from "../store/events";
import { useGame, type Look } from "../store/game";
import { input } from "../store/ui";
import { MAX_FURNITURE, PHRASES, cleanLook, cleanLounge, cleanName, type LoungeSnap } from "./plaza";

const URL = "wss://qeabsjyglethzkwlkmaw.supabase.co/realtime/v1";
/** 공개(publishable) 키 — 브라우저에 노출되도록 만들어진 값이라 비밀이 아니다 */
const KEY = "sb_publishable_JfbgxhQtx1cnSIdEmXPDvA_3tg9pk0-";
const LOBBY = "mdl-lounge-lobby";
export const MAX_GUESTS = 12;
export const roomName = (code: string) => `mdl-lounge-${code}`;

export interface LiveEvent { id: number; until: number }
export interface Guest {
  id: string; name: string; look: Look; stage: number; rank: number; host: boolean;
  x: number; z: number; yaw: number; rx: number; rz: number; moving: boolean;
  say: number; sayAt: number;
}
export const guests = new Map<string, Guest>();

/** 방문객이 보는 주인 정보 */
export interface HostInfo { name: string; code: string; look: Look; stage: number; rank: number; lounge: LoungeSnap; promo: number; ev: LiveEvent | null }
/** 로비에 보이는 열린 라운지 */
export interface OpenLounge { code: string; name: string; level: number; guests: number; promo: number; ev: LiveEvent | null }

interface RoomState {
  status: "off" | "connecting" | "online" | "offline";
  role: "host" | "guest" | null;
  code: string | null;
  ids: string[];
  host: HostInfo | null;
  /** 주인이 보낸 마지막 공지 */
  notice: { id: number; at: number; name: string } | null;
  lobby: OpenLounge[];
  lobbyStatus: "off" | "connecting" | "online" | "offline";
  /** 방 배정을 다시 계산하라는 신호 (코드 방문이 실패했을 때 내 라운지로 돌아가기) */
  nonce: number;
}
export const useRoom = create<RoomState>(() => ({ status: "off", role: null, code: null, ids: [], host: null, notice: null, lobby: [], lobbyStatus: "off", nonce: 0 }));

const num = (v: unknown, lo: number, hi: number, d = 0) => (typeof v === "number" && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const CODE = /^[A-Z0-9]{6}$/;
/** 다른 사람이 보낸 라운지 이벤트: 아는 종류이고 앞으로 2시간 안에 끝나는 것만 */
export function cleanEvent(v: unknown, now = Date.now()): LiveEvent | null {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const id = Math.round(num(o.id, 0, 99));
  const until = num(o.until, 0, now + 2 * 3_600_000);
  return LOUNGE_EVENT_MAP[id] && until > now ? { id, until } : null;
}
/** 로비 목록 정리: 같은 코드는 하나만, 이벤트 중인 곳 → 방문객 많은 곳 순 */
export function cleanLobby(st: Record<string, Record<string, unknown>[]>, myCode: string, now = Date.now()): OpenLounge[] {
  const out: OpenLounge[] = [];
  for (const k of Object.keys(st)) {
    const m = st[k]?.[0] ?? {};
    const code = typeof m.code === "string" && CODE.test(m.code) ? m.code : "";
    if (!code || code === myCode || out.some((o) => o.code === code)) continue;
    out.push({ code, name: cleanName(m.name), level: Math.round(num(m.level, 1, 10, 1)), guests: Math.round(num(m.guests, 0, MAX_GUESTS)), promo: Math.round(num(m.promo, 0, 9)), ev: cleanEvent(m.ev, now) });
    if (out.length >= 40) break;
  }
  return out.sort((a, b) => Number(!!b.ev) - Number(!!a.ev) || b.guests - a.guests || a.name.localeCompare(b.name));
}

let client: RealtimeClient | null = null;
const getClient = () => (client ??= new RealtimeClient(URL, { params: { apikey: KEY, eventsPerSecond: 8 } }));
let room: RealtimeChannel | null = null;
let lobby: RealtimeChannel | null = null;
let lobbyWatchers = 0;
let timer: ReturnType<typeof setInterval> | null = null;
let myId = "";
let last = { x: 0, z: 0, yaw: 0, t: 0 };
let notify: ((kind: "join" | "notice" | "perk", name: string, extra?: string) => void) | null = null;
export const onRoomNotice = (f: typeof notify) => { notify = f; };

function me() {
  const s = useGame.getState();
  return { name: s.name, look: { ...s.look, hideRank: undefined }, stage: s.stage, rank: s.look.hideRank ? 0 : s.rank };
}
function hostPayload() {
  const s = useGame.getState();
  const ev = activeHosting(useEvents.getState().hosting);
  return {
    ...me(), host: true, code: s.friendCode, promo: s.promo, ev, x: input.playerPos.x, z: input.playerPos.z,
    lounge: { level: s.lounge.level, floor: s.lounge.floor, wall: s.lounge.wall, light: s.lounge.light, furniture: s.lounge.furniture.slice(0, MAX_FURNITURE).map((f) => ({ type: f.type, x: +f.x.toFixed(2), z: +f.z.toFixed(2), rot: +f.rot.toFixed(2) })) },
  };
}
function lobbyPayload() {
  const s = useGame.getState();
  return { code: s.friendCode, name: s.name, level: s.lounge.level, guests: guests.size, promo: s.promo, ev: activeHosting(useEvents.getState().hosting) };
}

/** 라운지 방에 들어간다 (주인은 내 코드, 방문객은 주인 코드) */
export function joinRoom(code: string, role: "host" | "guest") {
  if (!CODE.test(code)) return;
  const cur = useRoom.getState();
  if (room && cur.code === code && cur.role === role) return;
  leaveRoom();
  myId = `${useGame.getState().friendCode || "GUEST0"}-${Math.random().toString(36).slice(2, 7)}`;
  useRoom.setState({ status: "connecting", role, code, ids: [], host: null, notice: null });
  let ch: RealtimeChannel;
  try {
    ch = getClient().channel(roomName(code), { config: { broadcast: { self: false }, presence: { key: myId } } });
  } catch {
    useRoom.setState({ status: "offline" });
    return;
  }
  room = ch;
  let greeted = false;
  ch.on("presence", { event: "sync" }, () => {
    const st = ch.presenceState() as Record<string, Record<string, unknown>[]>;
    const alive = new Set<string>();
    let host: HostInfo | null = null;
    for (const id of Object.keys(st)) {
      if (id === myId) continue;
      const m = st[id][0] ?? {};
      const isHost = m.host === true && m.code === code;
      if (isHost && role === "host") continue; // 같은 코드로 다른 기기에서 연 경우: 주인은 하나만
      if (!isHost && alive.size >= MAX_GUESTS) continue;
      alive.add(id);
      const old = guests.get(id);
      const x = num(m.x, -12, 12), z = num(m.z, -12, 12, 3);
      const look = cleanLook(m.look);
      guests.set(id, {
        id, name: cleanName(m.name), look, stage: Math.round(num(m.stage, 1, 5, 1)), rank: Math.round(num(m.rank, 0, 10)), host: isHost,
        x: old?.x ?? x, z: old?.z ?? z, yaw: old?.yaw ?? 0, rx: old?.rx ?? x, rz: old?.rz ?? z, moving: old?.moving ?? false, say: old?.say ?? -1, sayAt: old?.sayAt ?? 0,
      });
      if (isHost && !host) host = { name: cleanName(m.name), code, look, stage: Math.round(num(m.stage, 1, 5, 1)), rank: Math.round(num(m.rank, 0, 10)), lounge: cleanLounge(m.lounge), promo: Math.round(num(m.promo, 0, 9)), ev: cleanEvent(m.ev) };
    }
    for (const id of [...guests.keys()]) if (!alive.has(id)) guests.delete(id);
    useRoom.setState({ ids: [...guests.keys()], host });
    if (role === "host" && lobby) void lobby.track(lobbyPayload());
    // 방문객: 주인이 있으면 한 번 인사(주인에게 LOUNGE POINT), 이벤트가 열려 있으면 혜택
    if (role === "guest" && host) {
      if (!greeted) { greeted = true; void ch.send({ type: "broadcast", event: "visit", payload: { name: useGame.getState().name } }); }
      if (host.ev) {
        const got = useEvents.getState().eventVisit(code, host.ev.id, host.ev.until);
        if (got) notify?.("perk", host.name, `${got.coins ? `+${got.coins} BEAUTY COIN` : ""}${got.coins && got.stars ? "  " : ""}${got.stars ? `+${got.stars} SOCIAL STAR` : ""}`);
      }
    }
  });
  ch.on("broadcast", { event: "pos" }, ({ payload }) => {
    const r = guests.get(String(payload?.id));
    if (!r) return;
    r.x = num(payload.x, -12, 12); r.z = num(payload.z, -12, 12); r.yaw = num(payload.y, -7, 7); r.moving = !!payload.m;
  });
  ch.on("broadcast", { event: "say" }, ({ payload }) => {
    const r = guests.get(String(payload?.id));
    if (!r) return;
    r.say = Math.round(num(payload.i, 0, PHRASES - 1)); r.sayAt = Date.now();
    useRoom.setState({ ids: [...guests.keys()] });
  });
  // 공지는 주인이 보낸 것만 받는다
  ch.on("broadcast", { event: "notice" }, ({ payload }) => {
    const r = guests.get(String(payload?.id));
    if (!r?.host) return;
    const id = Math.round(num(payload.n, 0, NOTICES.length - 1));
    useRoom.setState({ notice: { id, at: Date.now(), name: r.name } });
    notify?.("notice", r.name, String(id));
  });
  ch.on("broadcast", { event: "visit" }, ({ payload }) => {
    if (role !== "host") return;
    const lp = useGame.getState().plazaHosted();
    notify?.("join", cleanName(payload?.name), lp ? `+${lp} LOUNGE POINT` : "");
  });
  ch.subscribe((status) => {
    if (room !== ch) return;
    if (status === "SUBSCRIBED") {
      useRoom.setState({ status: "online" });
      void ch.track(role === "host" ? hostPayload() : { ...me(), host: false, x: input.playerPos.x, z: input.playerPos.z });
      if (role === "host") watchLobby(true, true);
    } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
      if (useRoom.getState().status !== "off") useRoom.setState({ status: "offline" });
    }
  });
  timer = setInterval(() => {
    if (useRoom.getState().status !== "online" || !room) return;
    const p = input.playerPos, now = Date.now();
    const moved = Math.hypot(p.x - last.x, p.z - last.z) > 0.02 || Math.abs(input.playerYaw - last.yaw) > 0.05;
    if (!moved && now - last.t < 2000) return;
    last = { x: p.x, z: p.z, yaw: input.playerYaw, t: now };
    void room.send({ type: "broadcast", event: "pos", payload: { id: myId, x: +p.x.toFixed(2), z: +p.z.toFixed(2), y: +input.playerYaw.toFixed(2), m: input.moving } });
  }, 160);
}

/** 주인 정보(꾸밈·이벤트)가 바뀌면 다시 알린다 */
export function refreshHost() {
  const st = useRoom.getState();
  if (!room || st.role !== "host" || st.status !== "online") return;
  void room.track(hostPayload());
  if (lobby) void lobby.track(lobbyPayload());
}

export function roomSay(i: number) {
  if (room && useRoom.getState().status === "online") void room.send({ type: "broadcast", event: "say", payload: { id: myId, i } });
}
/** 주인 → 방문객 공지 */
export function sendNotice(n: number) {
  if (!room || useRoom.getState().role !== "host" || useRoom.getState().status !== "online") return false;
  void room.send({ type: "broadcast", event: "notice", payload: { id: myId, n } });
  return true;
}

export function leaveRoom() {
  if (timer) clearInterval(timer);
  timer = null;
  const ch = room, wasHost = useRoom.getState().role === "host";
  room = null;
  guests.clear();
  useRoom.setState({ status: "off", role: null, code: null, ids: [], host: null, notice: null });
  try { if (ch) void ch.unsubscribe(); } catch { /* 이미 끊김 */ }
  if (wasHost) watchLobby(false, true);
}

// ───────────── 로비: 열린 라운지 목록 ─────────────
let hostInLobby = false;
/** 목록을 보는 화면이 열려 있는 동안(on) 또는 내가 라운지를 연 동안(asHost) 로비에 접속한다 */
export function watchLobby(on: boolean, asHost = false) {
  if (asHost) hostInLobby = on; else lobbyWatchers = Math.max(0, lobbyWatchers + (on ? 1 : -1));
  const want = hostInLobby || lobbyWatchers > 0;
  if (want && !lobby) {
    useRoom.setState({ lobbyStatus: "connecting" });
    let ch: RealtimeChannel;
    try {
      ch = getClient().channel(LOBBY, { config: { presence: { key: `${useGame.getState().friendCode}-${Math.random().toString(36).slice(2, 6)}` } } });
    } catch {
      useRoom.setState({ lobbyStatus: "offline" });
      return;
    }
    lobby = ch;
    ch.on("presence", { event: "sync" }, () => useRoom.setState({ lobby: cleanLobby(ch.presenceState() as Record<string, Record<string, unknown>[]>, useGame.getState().friendCode) }));
    ch.subscribe((status) => {
      if (lobby !== ch) return;
      if (status === "SUBSCRIBED") { useRoom.setState({ lobbyStatus: "online" }); if (hostInLobby) void ch.track(lobbyPayload()); }
      else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") useRoom.setState({ lobbyStatus: "offline" });
    });
  } else if (lobby) {
    if (!want) {
      const ch = lobby; lobby = null;
      useRoom.setState({ lobby: [], lobbyStatus: "off" });
      try { void ch.unsubscribe(); } catch { /* 이미 끊김 */ }
    } else if (asHost) {
      try { void (on ? lobby.track(lobbyPayload()) : lobby.untrack()); } catch { /* 아직 연결 전 */ }
    }
  }
}
