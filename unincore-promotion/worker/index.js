// Cloudflare Worker in front of the static export (out/). It only runs for "/" (run_worker_first in
// wrangler.toml); every other request is served straight from the static assets.
// Ad routing: "/?product=mask&utm_source=…" → the product landing page, keeping every tracking parameter.
const PRODUCT_ALIASES = {
  ampoule: "vitamin-c-13-5-ampoule",
  serum: "vitamin-c-13-5-ampoule",
  mask: "vita-c-brightening-mask",
  wash: "vita-c-enzyme-powder-wash",
  cleanser: "vita-c-enzyme-powder-wash",
  mist: "hydrating-skin-barrier-serum-mist",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/") {
      const slug = PRODUCT_ALIASES[(url.searchParams.get("product") || "").toLowerCase()];
      if (slug) {
        url.pathname = `/products/${slug}`;
        url.searchParams.delete("product");
        return Response.redirect(url.toString(), 307);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
