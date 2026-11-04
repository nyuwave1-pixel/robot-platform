/** Shared between client and server: the closed list of tracked events. */
export const EVENTS = [
  "page_view",
  "view_item",
  "product_detail_view",
  "video_play",
  "amazon_cta_click",
  "promotion_view",
  "faq_open",
  "official_details_open",
] as const;
export type EventName = (typeof EVENTS)[number];
