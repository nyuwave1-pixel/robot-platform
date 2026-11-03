export const product = {
  brand: "UNI&CORE",
  brandKo: "유니앤코어",
  name: "1ST BIRTHDAY CREAM",
  nameKo: "퍼스트 벌스데이 크림",
  subtitle: "SKIN RE:BIRTH",
  tagline: "피부의 첫 번째 생일",
  concept: "피부의 시간을 되돌려 새로운 피부의 생일을 맞이하다.",
  volume: { g: 50, oz: 1.76 },
  /** 패키지 인쇄 표기 — 임의 수정 금지 */
  print: {
    jar: ["1ST BIRTHDAY CREAM", "SKIN RE:BIRTH", "UNI&CORE"],
    boxLabel: ["III", "1st Birthday Cream", "Skin Re:birth"],
    boxBand: ["NET WT. 1.76 oz", "UNI&CORE", "50 g"],
  },
  urls: {
    purchase: process.env.NEXT_PUBLIC_PURCHASE_URL || "",
    brand: process.env.NEXT_PUBLIC_BRAND_URL || "https://www.unicore.co.kr",
    detail: "#how-to-use",
  },
  images: {
    openBox: "/media/product/product-open-box.webp",
    closedBox: "/media/product/product-closed-box.webp",
  },
} as const;

export type Product = typeof product;
