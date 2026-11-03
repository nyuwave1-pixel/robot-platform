/**
 * Brand-level copy for the VITA C Collection experience (home page + intro).
 * Product facts (sizes, INCI, how-to) live in src/content/products.ts, which the
 * admin CMS can override — keep product claims there, not here.
 */
export const BRAND = {
  name: "UNI&CORE",
  collection: "VITA C Collection",
  intro: {
    lines: ["The science of radiance.", "Discover the power of vitamin C."],
    reveal: "Three steps. One radiant ritual.",
  },
  hero: {
    eyebrow: "UNI&CORE · VITA C Collection",
    headline: ["Your daily radiance", "starts here."],
    sub: "Three Korean vitamin C steps — cleanse, mask, brighten — made to work as one ritual. Sold on Amazon.com.",
  },
  story: {
    eyebrow: "The Vitamin C Story",
    title: "A familiar ingredient, used three ways.",
    /** General, ingredient-level context. Kept separate from product facts on purpose. */
    ingredient: [
      "Vitamin C (ascorbic acid) is one of the most widely used antioxidants in skincare.",
      "It's known for helping skin look brighter and more even when used consistently.",
      "Pure ascorbic acid is sensitive to water and air, so how a formula is packaged and used matters.",
    ],
  },
  finale: {
    title: "Three steps. One radiant skincare ritual.",
    sub: "Your skincare. Your radiance.",
  },
} as const;
