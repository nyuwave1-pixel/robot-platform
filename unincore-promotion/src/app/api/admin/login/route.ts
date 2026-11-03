import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { checkCredentials, signSession, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/session";

export const runtime = "nodejs";

// Best-effort brute-force throttle (per instance). Pair with Vercel Firewall rate limiting in production.
const attempts = new Map<string, { n: number; until: number }>();

const body = z.object({ username: z.string().max(40), password: z.string().max(200) });

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });

  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const a = attempts.get(ip);
  if (a && a.until > Date.now()) return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  if (!process.env.ADMIN_PASSWORD && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Admin login is not configured (ADMIN_PASSWORD)." }, { status: 503 });
  }
  const role = await checkCredentials(parsed.data.username, parsed.data.password);
  if (!role) {
    const n = (a?.n || 0) + 1;
    attempts.set(ip, { n, until: n >= 5 ? Date.now() + 10 * 60_000 : 0 });
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }
  attempts.delete(ip);
  const token = await signSession({ u: parsed.data.username.trim().toLowerCase(), role });
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
