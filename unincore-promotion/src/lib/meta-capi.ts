import "server-only";
import type { TrackPayload } from "./events";
import { DEFAULT_PRODUCTS } from "@/content/products";

/**
 * Optional Meta Conversions API forwarding. Runs only when:
 *  - META_CAPI_ACCESS_TOKEN and a Pixel ID are configured, and
 *  - the visitor allowed ad tracking (no opt-out, no GPC).
 * Events share `event_id` with the browser Pixel so Meta deduplicates them.
 * Amazon purchases are NOT sent — they happen on Amazon and are measured by Amazon Attribution.
 */
const FORWARD: Record<string, string> = { view_item: "ViewContent", amazon_cta_click: "AmazonCTAClick" };

export async function forwardToMetaCapi(
  t: TrackPayload,
  ctx: { pixelId: string; ip?: string; ua?: string; url: string; fbp?: string; fbc?: string },
) {
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  const eventName = FORWARD[t.e];
  if (!token || !ctx.pixelId || !eventName || !t.ad || !t.id) return;
  const product = DEFAULT_PRODUCTS.find((p) => p.key === t.p);
  const body: Record<string, unknown> = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: t.id,
        action_source: "website",
        event_source_url: ctx.url,
        user_data: {
          client_ip_address: ctx.ip,
          client_user_agent: ctx.ua,
          ...(ctx.fbp && { fbp: ctx.fbp }),
          ...(ctx.fbc && { fbc: ctx.fbc }),
        },
        custom_data: product ? { content_ids: [product.asin], content_type: "product", content_name: product.name } : {},
      },
    ],
  };
  if (process.env.META_CAPI_TEST_EVENT_CODE) body.test_event_code = process.env.META_CAPI_TEST_EVENT_CODE;
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${ctx.pixelId}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) console.error("[capi]", res.status, await res.text());
  } catch (err) {
    console.error("[capi]", err);
  }
}
