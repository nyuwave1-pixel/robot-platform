/**
 * Brand-level copy for the VITA C Collection experience (home page + intro).
 * Product facts (sizes, INCI, how-to) live in src/content/products.ts, which the
 * admin CMS can override — keep product claims there, not here.
 */
export const BRAND = {
  name: "UNI&CORE",
  collection: "VITA C Collection",
  intro: {
    lines: ["Pure vitamin C.", "Unlock your radiance."],
    reveal: "Cleanse. Mask. Brighten.",
  },
  hero: {
    eyebrow: "UNI&CORE · VITA C Collection",
    headline: ["Wake up", "your radiance."],
    sub: "Three Korean vitamin C steps — cleanse, mask, brighten — engineered to work as one ritual. Now on Amazon.com.",
  },
  story: {
    eyebrow: "The Vitamin C Story",
    title: "One ingredient. Three ways to glow.",
    /** General, ingredient-level context. Kept separate from product facts on purpose. */
    ingredient: [
      "Vitamin C (ascorbic acid) is one of the most widely used antioxidants in skincare.",
      "It's known for helping skin look brighter and more even when used consistently.",
      "Pure ascorbic acid is sensitive to water and air, so how a formula is packaged and used matters.",
    ],
  },
  finale: {
    title: "Cleanse. Mask. Brighten. Glow.",
    sub: "Your skin. Your light.",
  },
} as const;
