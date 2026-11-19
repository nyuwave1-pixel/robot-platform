import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/env";

/** 이메일 인증 링크 → 세션 교환 → 스튜디오로 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const res = NextResponse.redirect(new URL("/studio", req.url));
  if (code) {
    const sb = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    });
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL("/login?error=link", req.url));
  }
  return res;
}
