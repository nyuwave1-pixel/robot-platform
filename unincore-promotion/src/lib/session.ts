/**
 * Stateless admin session tokens signed with HMAC-SHA256 (Web Crypto, so the
 * same code runs in middleware (edge) and route handlers (node)).
 */
export type Role = "admin" | "editor";
export interface Session {
  u: string;
  role: Role;
  exp: number;
}

export const SESSION_COOKIE = "uc_admin";
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function secret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET || "";
  if (s.length >= 32) return s;
  if (process.env.NODE_ENV !== "production") return "dev-only-insecure-session-secret-change-me!!";
  return null;
}

async function hmac(data: string, key: string): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(data)));
}

export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function signSession(s: Omit<Session, "exp">, ttl = SESSION_TTL_SECONDS): Promise<string> {
  const key = secret();
  if (!key) throw new Error("ADMIN_SESSION_SECRET must be set (>= 32 chars) in production.");
  const body = b64url(enc.encode(JSON.stringify({ ...s, exp: Math.floor(Date.now() / 1000) + ttl })));
  return `${body}.${b64url(await hmac(body, key))}`;
}

export async function verifySession(token: string | undefined | null): Promise<Session | null> {
  const key = secret();
  if (!token || !key) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    if (!timingSafeEqual(fromB64url(sig), await hmac(body, key))) return null;
    const s = JSON.parse(new TextDecoder().decode(fromB64url(body))) as Session;
    if (typeof s.exp !== "number" || s.exp < Date.now() / 1000) return null;
    if (s.role !== "admin" && s.role !== "editor") return null;
    return s;
  } catch {
    return null;
  }
}

/** Check credentials against env-configured passwords. Returns the role or null. */
export async function checkCredentials(username: string, password: string): Promise<Role | null> {
  const users: [string, Role, string | undefined][] = [
    ["admin", "admin", process.env.ADMIN_PASSWORD],
    ["editor", "editor", process.env.EDITOR_PASSWORD],
  ];
  let match: Role | null = null;
  for (const [name, role, pw] of users) {
    if (!pw || pw.length < 10) continue;
    // Hash both sides so comparison time doesn't depend on length.
    const [a, b] = await Promise.all([
      crypto.subtle.digest("SHA-256", enc.encode(password)),
      crypto.subtle.digest("SHA-256", enc.encode(pw)),
    ]);
    const ok = timingSafeEqual(new Uint8Array(a), new Uint8Array(b));
    if (ok && username.trim().toLowerCase() === name) match = role;
  }
  return match;
}
