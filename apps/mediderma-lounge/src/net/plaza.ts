/**
 * WORLD PLAZA 실시간 멀티플레이.
 * Supabase Realtime 의 공개 채널(Presence + Broadcast)만 쓴다. 데이터베이스에는 아무것도 저장하지 않는다.
 *  - presence: 접속자와 그 캐릭터 외형(이름·룩·성장 단계·등급)
 *  - broadcast "pos": 위치·방향 (움직일 때만 초당 6번, 서 있을 때는 2초마다 한 번)
 *  - broadcast "say": 정해진 인사말 번호 (자유 채팅 없음)
 * 연결에 실패해도 광장은 혼자서 동작한다.
 */
import { RealtimeClient, type RealtimeChannel } from "@supabase/realtime-js";
import { create } from "zustand";
import { FASHION_MAP } from "../data/game";
import { DEFAULT_LOOK, useGame, type Look } from "../store/game";
import { input } from "../store/ui";

/** 공개(publishable) 키다. 브라우저에 노출되도록 만들어진 값이라 비밀이 아니다. */
const URL = "wss://qeabsjyglethzkwlkmaw.supabase.co/realtime/v1";
const KEY = "sb_publishable_JfbgxhQtx1cnSIdEmXPDvA_3tg9pk0-";
const ROOM = "mdl-plaza-1";
export const MAX_REMOTE = 24;
export const PHRASES = 6;

export interface Remote {
  id: string; name: string; look: Look; stage: number; rank: number;
  x: number; z: number; yaw: number; moving: boolean;
  /** 화면에 그리는 보간 위치 */
  rx: number; rz: number;
  say: number; sayAt: number; seen: number;
}
export const remotes = new Map<string, Remote>();

interface PlazaState { status: "off" | "connecting" | "online" | "offline"; ids: string[]; mySay: number; mySayAt: number }
export const usePlaza = create<PlazaState>(() => ({ status: "off", ids: [], mySay: -1, mySayAt: 0 }));

const HEX = /^#[0-9a-f]{6}$/i;
const hex = (v: unknown, d: string) => (typeof v === "string" && HEX.test(v) ? v : d);
const item = (v: unknown, d: string | null) => (typeof v === "string" && FASHION_MAP[v] ? v : d);
const word = (v: unknown, d: string) => (typeof v === "string" && /^[a-z-]{1,16}$/.test(v) ? v : d);
/** 다른 사람이 보낸 외형을 그대로 믿지 않고, 아는 값만 받아들인다 */
export function cleanLook(v: unknown): Look {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const D = DEFAULT_LOOK;
  return {
    skin: hex(o.skin, D.skin), hairColor: hex(o.hairColor, D.hairColor), eyeColor: hex(o.eyeColor, D.eyeColor), lipColor: hex(o.lipColor, D.lipColor),
    face: word(o.face, D.face), eyes: word(o.eyes, D.eyes), brows: word(o.brows, D.brows), pose: "stand",
    hair: item(o.hair, D.hair)!, outfit: item(o.outfit, D.outfit)!,
    height: typeof o.height === "number" ? Math.min(1.08, Math.max(0.92, o.height)) : 1,
    accessory: item(o.accessory, null), earring: item(o.earring, null), necklace: item(o.necklace, null), bag: item(o.bag, null),
    shoes: item(o.shoes, null), makeup: item(o.makeup, null), nail: item(o.nail, null),
  };
}
export const cleanName = (v: unknown) => (typeof v === "string" ? v.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 12) : "") || "GUEST";
const num = (v: unknown, lo: number, hi: number, d = 0) => (typeof v === "number" && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);

let client: RealtimeClient | null = null;
let channel: RealtimeChannel | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let myId = "";
let last = { x: 0, z: 0, yaw: 0, t: 0 };

function sync() {
  usePlaza.setState({ ids: [...remotes.keys()] });
}

export function joinPlaza() {
  if (channel) return;
  const g = useGame.getState();
  myId = `${g.friendCode || "GUEST0"}-${Math.random().toString(36).slice(2, 7)}`;
  usePlaza.setState({ status: "connecting", ids: [] });
  try {
    client = new RealtimeClient(URL, { params: { apikey: KEY, eventsPerSecond: 8 } });
    channel = client.channel(ROOM, { config: { broadcast: { self: false }, presence: { key: myId } } });
  } catch {
    usePlaza.setState({ status: "offline" });
    return;
  }
  const ch = channel;
  ch.on("presence", { event: "sync" }, () => {
    const st = ch.presenceState() as Record<string, { name?: unknown; look?: unknown; stage?: unknown; rank?: unknown; x?: unknown; z?: unknown }[]>;
    const now = Date.now();
    const alive = new Set<string>();
    for (const id of Object.keys(st)) {
      if (id === myId || alive.size >= MAX_REMOTE) continue;
      const m = st[id][0] ?? {};
      alive.add(id);
      const old = remotes.get(id);
      const x = num(m.x, -14, 14), z = num(m.z, -14, 14, 8);
      remotes.set(id, {
        id, name: cleanName(m.name), look: cleanLook(m.look), stage: Math.round(num(m.stage, 1, 5, 1)), rank: Math.round(num(m.rank, 0, 10)),
        x: old?.x ?? x, z: old?.z ?? z, yaw: old?.yaw ?? 0, moving: old?.moving ?? false, rx: old?.rx ?? x, rz: old?.rz ?? z,
        say: old?.say ?? -1, sayAt: old?.sayAt ?? 0, seen: now,
      });
    }
    for (const id of [...remotes.keys()]) if (!alive.has(id)) remotes.delete(id);
    sync();
  });
  ch.on("broadcast", { event: "pos" }, ({ payload }) => {
    const r = remotes.get(String(payload?.id));
    if (!r) return;
    r.x = num(payload.x, -14, 14); r.z = num(payload.z, -14, 14); r.yaw = num(payload.y, -7, 7); r.moving = !!payload.m; r.seen = Date.now();
  });
  ch.on("broadcast", { event: "say" }, ({ payload }) => {
    const r = remotes.get(String(payload?.id));
    if (!r) return;
    r.say = Math.round(num(payload.i, 0, PHRASES - 1)); r.sayAt = Date.now();
    sync();
  });
  ch.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      usePlaza.setState({ status: "online" });
      const s = useGame.getState();
      void ch.track({ name: s.name, look: { ...s.look, hideRank: undefined }, stage: s.stage, rank: s.look.hideRank ? 0 : s.rank, x: input.playerPos.x, z: input.playerPos.z });
    } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
      if (usePlaza.getState().status !== "off") usePlaza.setState({ status: "offline" });
    }
  });
  timer = setInterval(() => {
    if (usePlaza.getState().status !== "online" || !channel) return;
    const p = input.playerPos, now = Date.now();
    const moved = Math.hypot(p.x - last.x, p.z - last.z) > 0.02 || Math.abs(input.playerYaw - last.yaw) > 0.05;
    if (!moved && now - last.t < 2000) return;
    last = { x: p.x, z: p.z, yaw: input.playerYaw, t: now };
    void channel.send({ type: "broadcast", event: "pos", payload: { id: myId, x: +p.x.toFixed(2), z: +p.z.toFixed(2), y: +input.playerYaw.toFixed(2), m: input.moving } });
  }, 160);
}

export function say(i: number) {
  usePlaza.setState({ mySay: i, mySayAt: Date.now() });
  if (channel && usePlaza.getState().status === "online") void channel.send({ type: "broadcast", event: "say", payload: { id: myId, i } });
}

export function leavePlaza() {
  if (timer) clearInterval(timer);
  timer = null;
  const ch = channel, cl = client;
  channel = null; client = null;
  remotes.clear();
  usePlaza.setState({ status: "off", ids: [], mySay: -1 });
  try { if (ch) void ch.unsubscribe(); cl?.disconnect(); } catch { /* 이미 끊긴 연결 */ }
}

// ───────────── 광장 이벤트: 반짝이 모으기 ─────────────
/** 2분마다 모두에게 같은 자리에 생기는 반짝이 (시간 슬롯을 씨앗으로 쓴다) */
export const SLOT_MS = 120_000;
export function sparkleSpots(slot: number, n = 10) {
  let s = (slot * 2654435761) >>> 0;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  const out: { x: number; z: number }[] = [];
  while (out.length < n) {
    const a = rnd() * Math.PI * 2, r = 3.2 + rnd() * 9.3;
    out.push({ x: +(Math.cos(a) * r).toFixed(2), z: +(Math.sin(a) * r).toFixed(2) });
  }
  return out;
}
