import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/** 관리자 인증: ADMIN_PASSWORD 환경변수 + HMAC 서명 세션 쿠키(8시간). 미설정 시 관리자 기능 전체 비활성. */
const COOKIE = "md_admin";
const TTL_MS = 8 * 3600 * 1000;

export const adminEnabled = () => Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 8);
const secret = () => process.env.ADMIN_SECRET || `md:${process.env.ADMIN_PASSWORD}`;
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("hex");

export function checkPassword(input: string): boolean {
  if (!adminEnabled()) return false;
  const a = Buffer.from(createHmac("sha256", "cmp").update(input).digest("hex"));
  const b = Buffer.from(createHmac("sha256", "cmp").update(process.env.ADMIN_PASSWORD as string).digest("hex"));
  return timingSafeEqual(a, b);
}

export async function startSession(): Promise<void> {
  const exp = String(Date.now() + TTL_MS);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: TTL_MS / 1000 });
}
export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
export async function isAdmin(): Promise<boolean> {
  if (!adminEnabled()) return false;
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const [exp, sig] = v.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = sign(exp);
  return sig.length === good.length && timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}
