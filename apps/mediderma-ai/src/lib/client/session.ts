"use client";
/**
 * Guest Session — 회원가입 없이 쓰는 임시 세션.
 * sessionStorage 에 임시 ID 와 마지막 활동 시각만 둔다 (탭을 닫으면 사라진다).
 * 사진과 분석 결과는 React 메모리에만 있으며 여기에 저장하지 않는다.
 */
const KEY = "md_session";
const CONSENT_KEY = "md_consent_history"; // 기록 보관 동의 (localStorage, 사용자가 명시적으로 동의한 경우에만)
const ANON_KEY = "md_anon_id";

export interface GuestSession {
  id: string;
  startedAt: number;
  lastActive: number;
}

const uuid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

function read(): GuestSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GuestSession) : null;
  } catch {
    return null;
  }
}
function write(s: GuestSession) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* 저장 불가 환경(프라이빗 모드 등)에서는 메모리 세션으로만 동작 */
  }
}

let mem: GuestSession | null = null;

/** 세션을 가져오되, TTL 이 지났으면 expired=true 와 함께 새 세션을 만든다 */
export function getSession(ttlMinutes: number): { session: GuestSession; expired: boolean } {
  const now = Date.now();
  const cur = read() ?? mem;
  if (cur && now - cur.lastActive <= ttlMinutes * 60_000) return { session: cur, expired: false };
  const fresh = { id: uuid(), startedAt: now, lastActive: now };
  mem = fresh;
  write(fresh);
  return { session: fresh, expired: Boolean(cur) };
}
export function touchSession(): void {
  const cur = read() ?? mem;
  if (!cur) return;
  cur.lastActive = Date.now();
  mem = cur;
  write(cur);
}
export function endSession(): void {
  mem = null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

export function hasHistoryConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}
export function setHistoryConsent(on: boolean): void {
  try {
    if (on) {
      localStorage.setItem(CONSENT_KEY, "1");
      if (!localStorage.getItem(ANON_KEY)) localStorage.setItem(ANON_KEY, `anon-${uuid().slice(0, 13)}`);
    } else {
      localStorage.removeItem(CONSENT_KEY);
      localStorage.removeItem(ANON_KEY);
    }
  } catch {
    /* noop */
  }
}
/** 장기 추적용 익명 ID — 기록 보관에 동의한 경우에만 존재 */
export function getAnonId(): string | null {
  try {
    return localStorage.getItem(ANON_KEY);
  } catch {
    return null;
  }
}
