/** Shared between client and server: the closed list of tracked events. */
export const EVENTS = [
  "page_view",
  "view_item",
  "product_detail_view",
  "video_play",
  "amazon_cta_click",
  "promotion_view",
  "faq_open",
] as const;
export type EventName = (typeof EVENTS)[number];

export const DEVICES = ["mobile", "tablet", "desktop"] as const;
export type Device = (typeof DEVICES)[number];

export interface TrackPayload {
  e: EventName;
  /** product key */
  p?: string;
  /** CTA placement, e.g. hero / sticky / final */
  loc?: string;
  ch?: string;
  src?: string;
  med?: string;
  cmp?: string;
  cnt?: string;
  dev?: Device;
  path?: string;
  /** dedup id shared with the Meta Pixel event (for Conversions API) */
  id?: string;
  /** visitor allowed ad tracking (consent / no GPC) */
  ad?: boolean;
}
