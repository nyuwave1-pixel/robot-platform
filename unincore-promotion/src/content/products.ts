import type { ProductContent, Promotion } from "./types";

/**
 * Default product content. The admin CMS stores overrides on top of these
 * defaults, so this file is also the "factory reset" for every product.
 *
 * Copy guidelines (US cosmetics): describe how skin *looks* and *feels*
 * ("brighter-looking", "radiant-looking"). Do not claim to treat, cure or
 * remove any condition — that would make the product a drug in FDA terms and
 * also fails Meta ad review.
 */

const BFCM_2026 = {
  name: "Black Friday & Cyber Monday",
  // US Pacific time. DST ends Nov 1 2026, so the offset is -08:00 for the whole window.
  startsAt: "2026-11-19T00:00:00-08:00",
  endsAt: "2026-12-01T00:00:00-08:00",
} as const;

function bfcm(discountPct: number, extra: Partial<Promotion> = {}): Promotion {
  return {
    enabled: true,
    ...BFCM_2026,
    discountPct,
    headline: `Black Friday: ${discountPct}% off on Amazon`,
    detail: "Deal runs Nov 19 – Nov 30, 2026 on Amazon.com while supplies last. The final price is shown on Amazon at checkout.",
    couponNote: "No code needed — the discount is applied on Amazon.",
    ...extra,
  };
}

export const AMPOULE: ProductContent = {
  key: "ampoule",
  slug: "vitamin-c-13-5-ampoule",
  published: true,

  asin: "B0HJRKRKT7",
  asinVerified: false,
  amazonUrl: "https://www.amazon.com/UNI-CORE-Brightening-Glutathione-Stabilized/dp/B0HJRKRKT7/",
  attribution: {},

  name: "Vita C 13.5 Super Brightening Ampoule",
  shortName: "Vita C 13.5 Ampoule",
  size: "30 g",
  accent: "citrus",
  routineStep: 3,

  heroEyebrow: "13.5% Pure Vitamin C",
  heroHeadline: "13.5% Pure Vitamin C for Radiant-Looking Skin",
  heroSub:
    "A concentrated Korean vitamin C ampoule that layers like a serum and helps dull, uneven-looking skin look brighter, smoother and more luminous.",
  tagline: "Concentrated vitamin C, made for an everyday glow.",
  keyIngredient: "13.5% Pure Vitamin C",
  highlights: ["13.5% pure vitamin C", "Lightweight ampoule texture", "For dull, tired-looking skin", "Made in Korea"],
  specs: [
    { label: "Key ingredient", value: "13.5% Pure Vitamin C" },
    { label: "Size", value: "30 g" },
    { label: "Step", value: "Ampoule / Serum" },
    { label: "Best for", value: "Dull, uneven-looking skin" },
  ],

  concerns: [
    { title: "Dull, tired-looking skin", text: "Late nights, city air and dry indoor heat can leave skin looking flat and lackluster." },
    { title: "Uneven-looking tone", text: "Spots and patches make makeup work harder and skin look less even." },
    { title: "Loss of glow", text: "When skin looks matte and fatigued, even a good routine can feel like it isn't showing." },
  ],
  benefits: [
    { title: "Visibly brighter", text: "Pure vitamin C at 13.5% helps skin look brighter and more even with consistent use." },
    { title: "Radiant-looking finish", text: "Leaves a fresh, luminous look rather than a sticky film." },
    { title: "Layers easily", text: "A lightweight ampoule texture that sits well under moisturizer and sunscreen." },
  ],
  claims: [
    {
      id: "sold-korea",
      value: "100,000+",
      label: "bottles sold in Korea",
      source: "UNI&CORE internal sales data — confirm counting unit and period before publishing.",
      status: "pending",
    },
    {
      id: "radiance",
      value: "+35.6%",
      label: "skin radiance after 7 days",
      source: "Human application test, 7-day use — confirm report number, panel size and measured parameter.",
      status: "pending",
    },
    {
      id: "elasticity",
      value: "+14.3%",
      label: "skin elasticity after 7 days",
      source: "Human application test, 7-day use — confirm report number and measured parameter.",
      status: "pending",
    },
    {
      id: "pigmentation",
      value: "7.2%",
      label: "improvement in a pigmentation index after 7 days",
      source: "Human application test, 7-day use — confirm the exact index name before publishing.",
      status: "pending",
    },
  ],
  claimsNote:
    "Results are from a human application test and may vary by individual. This product is a cosmetic and is not intended to diagnose, treat, cure or prevent any disease.",
  beforeAfter: [
    // Add Day 0 / Day 7 photos from the original test report here (status: "verified" once matched to the report).
  ],
  videos: [],
  differentiators: [
    { title: "13.5% — stated on the label", text: "The vitamin C percentage is right in the name, so you know exactly what you're applying." },
    { title: "Ampoule-strength, serum-easy", text: "Concentrated like an ampoule, but light enough to use every day as your serum step." },
    { title: "Korean skincare know-how", text: "Developed in Korea, where layering lightweight, targeted steps is how routines are built." },
  ],
  ingredients: [
    {
      name: "Pure Vitamin C",
      inci: "Ascorbic Acid",
      role: "Brightening antioxidant",
      detail: "The most studied form of vitamin C in skincare. At 13.5% it's the hero of this formula, helping skin look brighter and more even.",
      status: "verified",
    },
    {
      name: "Glutathione",
      inci: "Glutathione",
      role: "Supporting antioxidant",
      detail: "Referenced in the Amazon listing title — confirm against the US INCI list before publishing.",
      status: "pending",
    },
  ],
  texture: {
    title: "A silky ampoule that sinks in",
    text: "A few drops spread easily across the face and absorb quickly, leaving skin fresh rather than tacky — so the next step goes on smoothly.",
    notes: ["Lightweight", "Fast-absorbing", "Non-sticky finish"],
  },
  howTo: [
    { title: "Cleanse & prep", text: "Start on clean skin. After cleansing, use your toner or a sheet mask as usual." },
    { title: "Apply a few drops", text: "Dispense 2–3 drops onto your fingertips and press gently over the face, avoiding the eye area." },
    { title: "Seal it in", text: "Follow with moisturizer. In the morning, always finish with a broad-spectrum sunscreen." },
  ],
  routineText: "Finish with the ampoule to lock in a concentrated dose of vitamin C.",
  faqs: [
    { q: "How often should I use the ampoule?", a: "Use it once or twice a day after cleansing and toning. If you're new to vitamin C, start once a day and build up." },
    { q: "Can I use it in the morning?", a: "Yes. Vitamin C fits well in a morning routine — just follow with sunscreen, as you should with any brightening product." },
    { q: "Is it suitable for sensitive skin?", a: "Patch test on a small area first. If you notice irritation, reduce how often you use it or stop and consult a dermatologist." },
    { q: "Where can I buy it in the US?", a: "UNI&CORE products are sold on Amazon.com. Use the Shop on Amazon button on this page to go straight to the official listing." },
  ],

  promotion: bfcm(20),

  seo: {
    title: "Vitamin C 13.5% Ampoule Serum | UNI&CORE Korean Skincare",
    description:
      "Meet the UNI&CORE Vita C 13.5 Super Brightening Ampoule — a 13.5% pure vitamin C serum from Korea for brighter, radiant-looking skin. Shop on Amazon.",
    keywords: ["vitamin C 13.5 serum", "vitamin C ampoule", "pure vitamin C serum", "brightening ampoule", "Korean vitamin C serum", "skin radiance serum", "UNI&CORE"],
  },
};

export const MASK: ProductContent = {
  key: "mask",
  slug: "vita-c-brightening-mask",
  published: true,

  asin: "B0HGR6V48S",
  asinVerified: false,
  amazonUrl: "https://www.amazon.com/UNI-CORE-Brightening-Moisturizing-Radiant-Skin/dp/B0HGR6V48S/",
  attribution: {},

  name: "Vita C Super Brightening Mask",
  shortName: "Vita C Brightening Mask",
  size: "5 sheets",
  accent: "sun",
  routineStep: 2,

  heroEyebrow: "2% Pure Vitamin C Sheet Mask",
  heroHeadline: "Brighten Your Routine with Vitamin C",
  heroSub:
    "A 20-minute vitamin C sheet mask that drenches skin in brightening essence — for a fresh, glowing look before a big day, or any day.",
  tagline: "Twenty minutes to a fresher, brighter-looking face.",
  keyIngredient: "2% Pure Vitamin C",
  highlights: ["2% pure vitamin C", "5 sheet masks per box", "20-minute ritual", "Made in Korea"],
  specs: [
    { label: "Key ingredient", value: "2% Pure Vitamin C" },
    { label: "Contents", value: "5 sheets" },
    { label: "Wear time", value: "15–20 minutes" },
    { label: "Best for", value: "Dull, dehydrated-looking skin" },
  ],

  concerns: [
    { title: "Skin looks tired", text: "Busy weeks show up on your face first — as dullness and a lack of bounce." },
    { title: "Makeup won't sit right", text: "Dry-feeling, uneven-looking skin makes foundation look patchy." },
    { title: "No time for a long routine", text: "You want a visible pick-me-up without a ten-step evening." },
  ],
  benefits: [
    { title: "Instant fresh look", text: "Skin looks brighter and feels hydrated right after a single 20-minute session." },
    { title: "Essence-soaked sheet", text: "Each sheet carries vitamin C essence that you can pat in after removing the mask." },
    { title: "Prep for makeup", text: "Leaves skin smooth and comfortable — a great base before a night out." },
  ],
  claims: [
    {
      id: "sold-korea",
      value: "10M+",
      label: "masks sold in Korea",
      source: "Cumulative Korean sales — confirm whether this counts single sheets or boxes before publishing.",
      status: "pending",
    },
    {
      id: "seven-day",
      value: "7 days",
      label: "of use — test results",
      source: "Only publish if a 7-day test report exists for this mask.",
      status: "pending",
    },
  ],
  claimsNote: "Individual results may vary. This product is a cosmetic and is not intended to diagnose, treat, cure or prevent any disease.",
  beforeAfter: [],
  videos: [],
  differentiators: [
    { title: "Real vitamin C, clearly labeled", text: "2% pure vitamin C — not just a vitamin C-scented essence." },
    { title: "Easy-peel protective film", text: "Each sheet comes on a protective film, so it unfolds cleanly and goes on without tearing." },
    { title: "A Korean classic, refined", text: "Sheet masking is a Korean beauty staple. This one is built around vitamin C for a brighter look." },
  ],
  ingredients: [
    {
      name: "Pure Vitamin C",
      inci: "Ascorbic Acid",
      role: "Brightening",
      detail: "2% pure vitamin C in a soothing essence helps skin look fresher and more even after each use.",
      status: "verified",
    },
  ],
  texture: {
    title: "Essence you can feel working",
    text: "A soft, well-soaked sheet delivers a light, watery essence. After removing the mask, pat the remaining essence into skin until absorbed.",
    notes: ["Soft, fitted sheet", "Light, watery essence", "Comfortable 20-minute wear"],
  },
  howTo: [
    { title: "Cleanse & tone", text: "Start with clean skin — ideally right after the Vita C Enzyme Powder Wash." },
    { title: "Unfold & remove the film", text: "Open the pouch, unfold the sheet and peel off the protective film." },
    { title: "Wear for 15–20 minutes", text: "Smooth the sheet over your face, aligning the eyes and mouth. Relax for 15–20 minutes." },
    { title: "Pat in the rest", text: "Remove the sheet and gently pat the remaining essence into the skin. Follow with the ampoule." },
  ],
  routineText: "Flood freshly cleansed skin with vitamin C essence in 20 minutes.",
  faqs: [
    { q: "How often can I use the mask?", a: "Two to three times a week works well for most people, or whenever skin needs a quick refresh." },
    { q: "Can I leave it on longer than 20 minutes?", a: "We don't recommend it. Once the sheet starts to dry it can draw moisture back out of the skin." },
    { q: "Should I rinse after using the mask?", a: "No need — pat the remaining essence into your skin and continue with your ampoule and moisturizer." },
    { q: "How many masks come in a box?", a: "Each box contains 5 individually packed sheet masks." },
  ],

  promotion: bfcm(20),

  seo: {
    title: "Vitamin C Sheet Mask (5 Pack) | UNI&CORE Brightening Face Mask",
    description:
      "UNI&CORE Vita C Super Brightening Mask: a Korean vitamin C sheet mask with 2% pure vitamin C for a hydrated, brighter-looking glow in 20 minutes. Shop on Amazon.",
    keywords: ["vitamin C face mask", "brightening sheet mask", "Korean vitamin C mask", "vitamin C sheet mask", "hydrating face mask", "UNI&CORE"],
  },
};

export const WASH: ProductContent = {
  key: "wash",
  slug: "vita-c-enzyme-powder-wash",
  published: true,

  asin: "B0HGQYFF13",
  asinVerified: false,
  amazonUrl: "https://www.amazon.com/UNI-CORE-Single-Use-bromelain-exfoliation/dp/B0HGQYFF13/",
  attribution: {},

  name: "Vita C Enzyme Powder Wash",
  shortName: "Vita C Enzyme Powder Wash",
  size: "30 single-use packets",
  accent: "peach",
  routineStep: 1,

  heroEyebrow: "Enzyme Powder Cleanser",
  heroHeadline: "The Power of Enzymes in Every Wash",
  heroSub:
    "A gentle enzyme powder that turns into a creamy foam with a splash of water — lifting away dullness and buildup for smoother, brighter-looking skin.",
  tagline: "Fresh powder, every single wash.",
  keyIngredient: "Bromelain Enzyme",
  highlights: ["Bromelain enzyme powder", "30 single-use packets", "Creamy, rich foam", "Travel-friendly"],
  specs: [
    { label: "Key ingredient", value: "Bromelain (pineapple enzyme)" },
    { label: "Contents", value: "30 single-use packets" },
    { label: "Format", value: "Powder-to-foam cleanser" },
    { label: "Best for", value: "Dull, rough-feeling skin" },
  ],

  concerns: [
    { title: "Rough, uneven texture", text: "Dead-skin buildup makes skin feel rough and look dull." },
    { title: "Congested-looking pores", text: "Oil and residue can leave pores looking more visible by the end of the day." },
    { title: "Harsh scrubs", text: "Gritty exfoliators can feel too aggressive for everyday use." },
  ],
  benefits: [
    { title: "Gentle enzyme exfoliation", text: "Bromelain helps loosen dull surface buildup — no gritty scrubbing required." },
    { title: "Rich, creamy foam", text: "The powder whips into a soft lather that rinses clean." },
    { title: "Always fresh", text: "Each wash comes in its own packet, so the powder stays dry and fresh until you use it." },
  ],
  claims: [
    {
      id: "ph",
      value: "pH 5–5.5",
      label: "low-pH, skin-friendly cleansing",
      source: "Confirm with the US label or a pH test certificate before publishing.",
      status: "pending",
    },
  ],
  claimsNote: "Individual results may vary. This product is a cosmetic and is not intended to diagnose, treat, cure or prevent any disease.",
  beforeAfter: [],
  videos: [],
  differentiators: [
    { title: "Enzymes, not grit", text: "Exfoliates with bromelain instead of scrubbing particles, so it's gentle enough for daily use." },
    { title: "One packet, one wash", text: "Pre-portioned packets mean no wet jar, no clumping and the right amount every time." },
    { title: "Built for travel", text: "Toss a few packets in your bag — no liquids, no spills." },
  ],
  ingredients: [
    {
      name: "Bromelain",
      inci: "Bromelain",
      role: "Enzyme exfoliant",
      detail: "A protein-digesting enzyme from pineapple that helps break down dull surface buildup for smoother-feeling skin.",
      status: "verified",
    },
    {
      name: "Vitamin C",
      role: "Brightening",
      detail: "Confirm the exact vitamin C derivative and its INCI name on the US label before publishing.",
      status: "pending",
    },
  ],
  texture: {
    title: "From fine powder to cloud-soft foam",
    text: "Pour the fine powder into a wet palm, add a few drops of water and rub — it turns into a dense, creamy foam in seconds.",
    notes: ["Fine, soft powder", "Activates with water", "Dense, creamy lather"],
  },
  howTo: [
    { title: "Open a packet", text: "Tear open one packet and pour the powder into wet palms." },
    { title: "Add water & lather", text: "Add a little water and rub your hands together until it turns into a rich foam." },
    { title: "Massage & rinse", text: "Gently massage over the face for 30–60 seconds, avoiding the eye area, then rinse with lukewarm water." },
  ],
  routineText: "Start with fresh enzyme foam to clear the way for vitamin C.",
  faqs: [
    { q: "Can I use the powder wash every day?", a: "Most skin types can use it daily. If your skin feels sensitive, use it every other day or as your evening cleanse." },
    { q: "How many washes are in a box?", a: "Each box contains 30 individually packed single-use packets — one packet per wash." },
    { q: "Does it replace my makeup remover?", a: "For heavy or waterproof makeup, remove it first with a cleansing oil or balm, then use the powder wash as your second cleanse." },
    { q: "Is it gentle enough for sensitive skin?", a: "It's formulated as a gentle enzyme cleanser, but always patch test first if your skin is reactive." },
  ],

  promotion: bfcm(20),

  seo: {
    title: "Enzyme Powder Face Wash with Bromelain | UNI&CORE Korean Cleanser",
    description:
      "UNI&CORE Vita C Enzyme Powder Wash: a gentle Korean enzyme face cleanser with bromelain in 30 single-use packets. Creamy foam, smoother-feeling skin. Shop on Amazon.",
    keywords: ["enzyme powder wash", "enzyme face cleanser", "powder face wash", "bromelain cleanser", "foaming powder cleanser", "daily exfoliating cleanser", "UNI&CORE"],
  },
};

/** Routine order: wash → mask → ampoule. */
export const DEFAULT_PRODUCTS: ProductContent[] = [WASH, MASK, AMPOULE];
