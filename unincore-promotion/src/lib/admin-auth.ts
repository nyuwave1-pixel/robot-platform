import "server-only";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession, type Role, type Session } from "./session";

export async function getSession(): Promise<Session | null> {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

/**
 * Guard for mutating admin API routes:
 *  - valid signed session cookie (HttpOnly, SameSite=Strict)
 *  - same-origin request (Origin/Host check) as CSRF defense in depth
 *  - required role
 */
export async function requireAdminApi(role: Role = "editor"): Promise<{ session: Session } | { error: NextResponse }> {
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("x-forwarded-host") || h.get("host");
  if (!origin || !host || new URL(origin).host !== host) {
    return { error: NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 }) };
  }
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Not signed in." }, { status: 401 }) };
  if (role === "admin" && session.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin role required." }, { status: 403 }) };
  }
  return { session };
}
