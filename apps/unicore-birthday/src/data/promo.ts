/** 런칭 프로모션 설정 — 띠 배너·CTA 공용. 종료 시 enabled:false 또는 NEXT_PUBLIC_PROMO=off */
export const promo = {
  enabled: process.env.NEXT_PUBLIC_PROMO !== "off",
  /** 오픈 시각 (한국) — 이전에는 "오픈 예정", 이후에는 "진행 중" 문구 */
  openAt: "2026-11-10T15:00:00+09:00",
  pack: 6,
  regular: 1_494_000,
  price: 1_100_000,
  discountPct: 26,
  pv: 1000,
  cv: 700,
} as const;
