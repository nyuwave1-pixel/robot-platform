import { NextResponse, type NextRequest } from "next/server";

/** domain.com/@아이디 → /p/아이디 (주소창은 그대로 /@아이디) */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const m = /^\/@([a-z0-9-]{3,30})\/?$/.exec(pathname);
  if (m) {
    const url = req.nextUrl.clone();
    url.pathname = `/p/${m[1]}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}
// "@" 가 들어간 경로는 경로 패턴 매칭이 불안정해서, 정적 파일을 뺀 모든 요청을 받아 코드에서 판별한다
export const config = { matcher: ["/((?!_next/|products/|favicon|robots.txt|sitemap.xml).*)"] };
