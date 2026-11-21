import { NextResponse } from "next/server";
import { adminEnabled, checkPassword, startSession } from "@/server/auth";

export const runtime = "nodejs";
const attempts = new Map<string, { n: number; at: number }>();

export async function POST(req: Request) {
  if (!adminEnabled()) return NextResponse.json({ ok: false, error: "admin_disabled" }, { status: 503 });
  const key = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const a = attempts.get(key);
  if (a && Date.now() - a.at < 60_000 && a.n >= 5) return NextResponse.json({ ok: false, error: "too_many_attempts" }, { status: 429 });
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (typeof password !== "string" || !checkPassword(password)) {
    attempts.set(key, { n: a && Date.now() - a.at < 60_000 ? a.n + 1 : 1, at: Date.now() });
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 401 });
  }
  attempts.delete(key);
  await startSession();
  return NextResponse.json({ ok: true });
}
