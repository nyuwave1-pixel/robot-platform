// 공용 기반: DB, 오류·응답 형식, 입력 검증, 암호화, TOTP, 속도 제한, 마스킹
// (더마홈 회원·파트너 시스템의 core 를 이 사이트 전용으로 옮긴 것 — 실행 환경 의존은 platform.ts 로 분리)
import { Buffer } from "node:buffer";
import { createHash, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual, createCipheriv, createDecipheriv } from "node:crypto";
import { platform, type Queryable } from "./platform.ts";

export function env(name: string): string { return platform().env(name) || ""; }
export function pool(): Queryable { return platform().pool; }

export async function q<T = any>(text: string, params: unknown[] = [], c?: Queryable): Promise<T[]> {
  const r = await (c || pool()).query(text, params);
  return r.rows as T[];
}
export async function q1<T = any>(text: string, params: unknown[] = [], c?: Queryable): Promise<T | null> {
  const rows = await q<T>(text, params, c);
  return rows[0] ?? null;
}
/** 트랜잭션: 같은 연결에서 BEGIN~COMMIT. 실패하면 ROLLBACK 후 오류를 다시 던짐 */
export async function tx<T>(fn: (c: Queryable) => Promise<T>): Promise<T> {
  const client = await platform().pool.connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch { /* ignore */ }
    throw e;
  } finally {
    client.release();
  }
}
export type { Queryable };

// ---- 오류·응답 ----
export class ApiError extends Error {
  status: number; code: string; fields?: Record<string, string>;
  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message); this.status = status; this.code = code; this.fields = fields;
  }
}
export const fail = (status: number, code: string, message: string, fields?: Record<string, string>): never => {
  throw new ApiError(status, code, message, fields);
};
export function ok(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ ok: true, data }), {
    status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}
export function errorResponse(e: unknown): Response {
  let status = 500, code = "INTERNAL", message = "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.", fields: any;
  if (e instanceof ApiError) { status = e.status; code = e.code; message = e.message; fields = e.fields; }
  else if ((e as any)?.code === "23505") { status = 409; code = "DUPLICATE"; message = "이미 등록된 값입니다."; }
  else if ((e as any)?.code === "23503") { status = 409; code = "REFERENCE"; message = "연결된 데이터가 올바르지 않습니다."; }
  else if ((e as any)?.code === "23514") { status = 400; code = "INVALID"; message = "허용되지 않는 값입니다."; }
  else {
    // 개인정보가 섞일 수 있는 상세 메시지는 남기지 않고 오류 종류만 기록
    console.error("[review] unexpected", (e as any)?.code || "", (e as any)?.name || "", String((e as any)?.message || "").slice(0, 80).replace(/\(.*?\)=\(.*?\)/g, "(…)"));
  }
  return new Response(JSON.stringify({ ok: false, error: { code, message, fields } }), {
    status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

// ---- 요청 도우미 ----
/** 이 API 를 부를 수 있는 사이트 출처 (쉼표 구분). 시험용 출처는 BR_TEST_ORIGINS — 그 접수는 테스트로 분리 저장 */
export function allowedOrigins(): string[] {
  return (env("BR_ALLOWED_ORIGINS") || "https://unipromotion.unincore.com").split(",").map((x) => x.trim()).filter(Boolean);
}
export function testOrigins(): string[] { return (env("BR_TEST_ORIGINS") || "").split(",").map((x) => x.trim()).filter(Boolean); }
export async function readJson(req: Request, maxBytes = 64 * 1024): Promise<any> {
  const text = await req.text();
  if (text.length > maxBytes) fail(413, "TOO_LARGE", "요청이 너무 큽니다.");
  if (!text) return {};
  try { return JSON.parse(text); } catch { return fail(400, "BAD_JSON", "요청 형식이 올바르지 않습니다."); }
}
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  return (xff.split(",")[0] || req.headers.get("x-nf-client-connection-ip") || "").trim().slice(0, 64);
}
export function ipHash(req: Request): string {
  const ip = clientIp(req);
  return ip ? sha256(ip + "|" + secretKey().toString("hex").slice(0, 16)).slice(0, 32) : "";
}
// ---- 입력값 검증 ----
export const s = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
export const int = (v: unknown, def = 0) => { if (v === null || v === undefined || v === "") return def; const n = Number(v); return Number.isFinite(n) ? Math.trunc(n) : def; };
export const isDate = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v + "T00:00:00Z"));
export const normEmail = (v: unknown) => s(v, 160).toLowerCase();
export const normPhone = (v: unknown) => String(v ?? "").replace(/\D/g, "").slice(0, 15);
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^01[016789]\d{7,8}$/;

// ---- 암호화 ----
export const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
export function randomToken(bytes = 32): string { return randomBytes(bytes).toString("base64url"); }
function scrypt(pw: string, salt: Buffer, len: number): Promise<Buffer> {
  return new Promise((res, rej) => scryptCb(pw, salt, len, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (e, k) => (e ? rej(e) : res(k))));
}
export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, 64);
  return `scrypt$16384$8$1$${salt.toString("base64")}$${key.toString("base64")}`;
}
export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const p = String(stored || "").split("$");
  if (p.length !== 6 || p[0] !== "scrypt") return false;
  const salt = Buffer.from(p[4], "base64"), want = Buffer.from(p[5], "base64");
  const got = await scrypt(pw, salt, want.length);
  return got.length === want.length && timingSafeEqual(got, want);
}
/** 비밀번호 기준: 10자 이상, 영문·숫자 포함, 아이디(이메일 앞부분)·전화번호 포함 금지 */
export function passwordProblem(pw: string, email: string, phone: string): string | null {
  if (typeof pw !== "string" || pw.length < 10 || pw.length > 72) return "비밀번호는 10~72자로 입력해 주세요.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "비밀번호에 영문과 숫자를 함께 넣어 주세요.";
  const local = email.split("@")[0];
  if (local.length >= 4 && pw.toLowerCase().includes(local.toLowerCase())) return "비밀번호에 아이디를 넣을 수 없습니다.";
  if (phone && phone.length >= 8 && pw.includes(phone.slice(-8))) return "비밀번호에 휴대전화 번호를 넣을 수 없습니다.";
  if (/(.)\1{4,}/.test(pw)) return "같은 문자를 5번 이상 반복할 수 없습니다.";
  return null;
}
function secretKey(): Buffer { return Buffer.from(platform().secret); }
/** 용도별 HMAC (서명 URL·중복 검사용 해시). 용도(purpose)가 다르면 같은 값도 다른 결과가 나온다 */
export function hmac(purpose: string, data: string): string {
  return createHmac("sha256", secretKey()).update(purpose + "\n" + data).digest("hex");
}
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", secretKey(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `v1.${iv.toString("base64")}.${c.getAuthTag().toString("base64")}.${enc.toString("base64")}`;
}
export function decrypt(packed: string): string {
  const [v, iv, tag, data] = String(packed).split(".");
  if (v !== "v1") throw new Error("bad cipher");
  const d = createDecipheriv("aes-256-gcm", secretKey(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(data, "base64")), d.final()]).toString("utf8");
}

// ---- TOTP (RFC 6238, 30초, 6자리) ----
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function base32Encode(buf: Buffer): string {
  let bits = 0, val = 0, out = "";
  for (const b of buf) { val = (val << 8) | b; bits += 8; while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  return out;
}
export function base32Decode(str: string): Buffer {
  let bits = 0, val = 0; const out: number[] = [];
  for (const ch of str.replace(/=+$/, "").toUpperCase()) {
    const i = B32.indexOf(ch); if (i < 0) continue;
    val = (val << 5) | i; bits += 5;
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}
export function totpCode(secretB32: string, t = Date.now(), step = 30): string {
  const counter = Math.floor(t / 1000 / step);
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(counter));
  const h = createHmac("sha1", base32Decode(secretB32)).update(msg).digest();
  const o = h[h.length - 1] & 15;
  const code = ((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).toString();
  return code.padStart(6, "0");
}
export function totpVerify(secretB32: string, code: string, t = Date.now()): boolean {
  const c = String(code || "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(c)) return false;
  return [-1, 0, 1].some((w) => totpCode(secretB32, t + w * 30000) === c);
}
export const newTotpSecret = () => base32Encode(randomBytes(20));

// ---- 속도 제한 (DB 고정 창) ----
export async function rateLimit(bucket: string, limit: number, windowSec: number) {
  const win = new Date(Math.floor(Date.now() / 1000 / windowSec) * windowSec * 1000);
  const row = await q1<{ hits: number }>(
    `INSERT INTO rate_limits (bucket, window_start, hits) VALUES ($1, $2, 1)
     ON CONFLICT (bucket, window_start) DO UPDATE SET hits = rate_limits.hits + 1 RETURNING hits`, [bucket, win]);
  if (Math.random() < 0.02) await q(`DELETE FROM rate_limits WHERE window_start < now() - interval '2 days'`);
  if ((row?.hits || 0) > limit) fail(429, "RATE_LIMIT", "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
}

// ---- 마스킹 ----
export function maskName(n: string): string {
  const a = [...String(n || "")];
  if (a.length <= 1) return a.join("");
  if (a.length === 2) return a[0] + "*";
  return a[0] + "*".repeat(a.length - 2) + a[a.length - 1];
}
export function maskEmail(e: string): string {
  const [l, d] = String(e || "").split("@");
  if (!d) return "***";
  return (l.length <= 2 ? l[0] + "*" : l.slice(0, 2) + "*".repeat(Math.min(6, l.length - 2))) + "@" + d;
}
export function maskPhone(p: string): string {
  const d = String(p || "");
  return d.length >= 10 ? d.slice(0, 3) + "-****-" + d.slice(-4) : "***";
}
export function fmtPhone(p: string): string {
  const d = String(p || "");
  return d.length === 11 ? `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}` : d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : d;
}

