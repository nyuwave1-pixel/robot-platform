// Cloudflare Pages Function for "/" only (replaces the old Next.js middleware).
// Ad routing: "/?product=mask&utm_source=…" → the product landing page, keeping every tracking parameter.
const PRODUCT_ALIASES = {
  ampoule: "vitamin-c-13-5-ampoule",
  serum: "vitamin-c-13-5-ampoule",
  mask: "vita-c-brightening-mask",
  wash: "vita-c-enzyme-powder-wash",
  cleanser: "vita-c-enzyme-powder-wash",
  mist: "hydrating-skin-barrier-serum-mist",
};

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const slug = PRODUCT_ALIASES[(url.searchParams.get("product") || "").toLowerCase()];
  if (slug) {
    url.pathname = `/products/${slug}`;
    url.searchParams.delete("product");
    return Response.redirect(url.toString(), 307);
  }
  return context.next();
}
