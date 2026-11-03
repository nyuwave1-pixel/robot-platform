import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./lib/session";

const PRODUCT_ALIASES: Record<string, string> = {
  ampoule: "vitamin-c-13-5-ampoule",
  serum: "vitamin-c-13-5-ampoule",
  mask: "vita-c-brightening-mask",
  wash: "vita-c-enzyme-powder-wash",
  cleanser: "vita-c-enzyme-powder-wash",
};

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Ad routing: "/?product=mask&utm_source=…" → product landing page, keeping every tracking parameter.
  if (pathname === "/" && searchParams.has("product")) {
    const slug = PRODUCT_ALIASES[(searchParams.get("product") || "").toLowerCase()];
    if (slug) {
      const url = req.nextUrl.clone();
      url.pathname = `/products/${slug}`;
      url.searchParams.delete("product");
      return NextResponse.redirect(url, 307);
    }
  }

  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApi = pathname.startsWith("/api/admin") && pathname !== "/api/admin/login";
  if (isAdminPage || isAdminApi) {
    const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!session) {
      if (isAdminApi) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/", "/admin/:path*", "/api/admin/:path*"] };
