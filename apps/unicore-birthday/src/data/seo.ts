/** 검색 노출(SEO) 설정 — 구글·네이버 공통. 인증 코드는 환경변수로 주입 */
export const seo = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://birthday.unincore.com",
  siteName: "UNI&CORE 1ST BIRTHDAY CREAM",
  title: "유니앤코어 1ST 버스데이 크림 | 피부의 첫 번째 생일",
  shortTitle: "UNI&CORE 1ST BIRTHDAY CREAM",
  description:
    "3세대 인삼 PDRN · 노벨상 성분 EGF 4GF · 아세틸헥사펩타이드-8 · 시카 카밍. 4주 인체적용시험 볼 리프팅 48.33% 개선, 목 주름 19.06% 감소, 이상반응 0건. 시간을 되돌려 처음으로 맞이할 내 피부의 첫 번째 생일, 유니앤코어 퍼스트 벌스데이 크림.",
  keywords: [
    "유니앤코어", "UNI&CORE", "유니앤코어 벌스데이 크림", "1ST BIRTHDAY CREAM", "퍼스트 벌스데이 크림", "버스데이 크림",
    "인삼 PDRN 크림", "3세대 PDRN", "PDRN 크림", "EGF 크림", "성장인자 크림", "4GF", "아세틸헥사펩타이드-8", "펩타이드 크림",
    "시카 크림", "탄력 크림", "볼 리프팅 크림", "목주름 크림", "표정주름 크림", "안티에이징 크림", "피부 재생 크림", "프리미엄 크림",
    "SKIN RE:BIRTH", "피부의 첫 번째 생일", "인체적용시험 크림",
  ],
  ogImage: "/og/og-1200x630.jpg",
  ogImageSquare: "/og/og-square-1200.jpg",
  locale: "ko_KR",
  /** 서치콘솔/서치어드바이저 인증 — Vercel 환경변수로 설정 */
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    naver: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || "",
  },
  publishedAt: "2026-11-03",
} as const;
