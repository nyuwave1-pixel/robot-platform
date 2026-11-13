import { NextResponse, type NextRequest } from "next/server";

const PRODUCT_ALIASES: Record<string, string> = {
  ampoule: "vitamin-c-13-5-ampoule",
  serum: "vitamin-c-13-5-ampoule",
  mask: "vita-c-brightening-mask",
  wash: "vita-c-enzyme-powder-wash",
  cleanser: "vita-c-enzyme-powder-wash",
  mist: "hydrating-skin-barrier-serum-mist",
};

export function middleware(req: NextRequest) {
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

  return NextResponse.next();
}

export const config = { matcher: ["/"] };
