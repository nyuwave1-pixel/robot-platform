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

/** Official UNI&CORE US store detail pages (source of the copy and figures marked "official page"). */
const SHOP_PAGE = (seq: number) => `https://us.unincore.com/shopping/search/view.do?productSeq=${seq}`;

/** The official detail image, sliced top-to-bottom into /public/products/detail/<key>-NN.webp (1000 px wide). */
function slices(key: string, heights: number[]) {
  return heights.map((height, i) => ({ src: `/products/detail/${key}-${String(i + 1).padStart(2, "0")}.webp`, width: 1000, height }));
}

const AMPOULE_TEST =
  "Human application test after 7 days of use, 21 adults aged 20–60, SKINMED Co., Ltd. Clinical Trial Centre (published on the official UNI&CORE product page). Individual results may vary.";

function bfcm(discountPct: number, extra: Partial<Promotion> = {}): Promotion {
  return {
    // Off until the actual Amazon deal (rate + dates per product) is confirmed —
    // the site must never advertise a discount Amazon isn't running.
    enabled: false,
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
  size: "1.06 oz (30 g)",
  accent: "citrus",
  routineStep: 3,

  heroEyebrow: "13.5% Pure Vitamin C Ampoule",
  heroHeadline: "13.5% Pure Vitamin C for Radiant-Looking Skin",
  heroSub:
    "A brightening ampoule with 13.5% pure vitamin C (ascorbic acid), stabilized in a dual-layer formula and kept highly hydrated so the water-soluble vitamin C works its best — for brighter, more luminous-looking skin in 7 days.",
  tagline: "13.5% pure vitamin C. Visible radiance in 7 days.",
  keyIngredient: "13.5% Pure Vitamin C (Ascorbic Acid)",
  highlights: ["13.5% pure vitamin C (ascorbic acid)", "Dual-layer stabilized formula", "+35.6% radiance in 7 days*", "Glutathione + camu camu", "Made in Korea"],
  specs: [
    { label: "Key ingredient", value: "13.5% pure vitamin C (ascorbic acid)" },
    { label: "Size", value: "1.06 oz (30 g), pump bottle" },
    { label: "Step", value: "Ampoule / Serum" },
    { label: "Claim on box", value: "Brightening & Radiance" },
    { label: "Best for", value: "Dull, uneven-looking skin" },
    { label: "Made in", value: "Korea" },
  ],

  heroImage: "/products/ampoule-hero.webp",
  visualImage: "/products/ampoule-visual.webp",
  fullIngredients:
    "Water, Ascorbic Acid, Butylene Glycol, Dipropylene Glycol, Propanediol, Caprylic/Capric Triglyceride, Propylene Glycol Dicaprylate/Dicaprate, Polysorbate 60, Glutathione, Glycerin, Glyceryl Stearate SE, Panthenol, Chitosan, Sodium Gluconate, Sodium Hyaluronate, Helianthus Annuus (Sunflower) Seed Oil, Dimethicone, Xanthan Gum, Guar Hydroxypropyltrimonium Chloride, Sodium Metabisulfite, Fraxinus Rhynchophylla Extract, Nelumbo Nucifera Seed Extract, Inula Britannica Flower Extract, Phaseolus Radiatus Seed Extract, Opuntia Ficus-Indica Fruit Extract, Myrciaria Dubia Fruit Extract, Daucus Carota Sativa (Carrot) Seed Oil, Daucus Carota Sativa (Carrot) Root Extract, Curcuma Longa (Turmeric) Root Extract, Terminalia Ferdinandiana Fruit Extract, Beta-Glucan, Phytic Acid, Betula Platyphylla Japonica Bark Extract, Tocopherol, Rumex Crispus Root Extract, Hydrolyzed Elastin, Disodium EDTA, Sodium Hydroxide, Citrus Paradisi (Grapefruit) Fruit Extract, 1,2-Hexanediol, Ethylhexylglycerin, Fragrance, Beta-Carotene",
  caution:
    "External use only. Avoid contact with eyes; if contact occurs, rinse thoroughly with water. Do not use on broken or irritated skin. Discontinue use if irritation or rash occurs. Keep out of reach of children. Store in a cool, dry place away from direct sunlight.",
  officialDetail: {
    sourceUrl: SHOP_PAGE(449),
    slices: slices("ampoule", [1586, 1586, 1586, 1586, 1586, 1586, 1586, 1586, 1586, 1586, 1586, 1586, 1586, 1582]),
    outline: [
      "Key points: brightening ampoule with 13.5% pure vitamin C (ascorbic acid), double-layer process with a high hydration level, visible change in 7 days",
      "Multi-care with 13.5% pure vitamin C: powerful antioxidant care, brightening and skin elasticity",
      "13.5% pure vitamin C stabilized by a dual-layer formulation, with a high hydration level for water-soluble vitamin C",
      "7-day human application test: +35.6% skin glow (radiance), +14.3% skin elasticity, 7.2% improvement in a skin-pigmentation measurement",
      "Satisfaction survey after 7 days: 90.5% feel improved elasticity, 90.5% say skin looks more luminous, 95.2% satisfied",
      "Ingredients: ascorbic acid, glutathione, camu camu (Myrciaria dubia) fruit extract, turmeric root extract, beta-carotene, calming complex, beta-glucan, panthenol, prickly pear extract, hydrolyzed elastin",
      "How to use in 3 steps, sensitive-skin tip and a note on the natural yellow color",
    ],
  },
  usageNotes: [
    "Sensitive skin? For the first two weeks, prep with a toner before the ampoule; after that, try applying it directly after cleansing.",
    "The ampoule is naturally yellow from its ingredients. Even once absorbed it can transfer to pillowcases or clothing — wipe spills right away, as they can stain if left.",
  ],

  about: [
    {
      heading: "A Korean vitamin C serum with 13.5% pure ascorbic acid",
      paragraphs: [
        "The UNI&CORE Vita C 13.5 Super Brightening Ampoule is a Korean vitamin C serum built around 13.5% pure vitamin C — ascorbic acid, the form of vitamin C most studied in skincare. It is listed second on the US label, right after water, and is paired with glutathione for a brighter, more even-looking complexion.",
        "\"Ampoule\" is the Korean-skincare name for a concentrated serum. You use it exactly like a vitamin C serum: after cleansing and toning, before your moisturizer and sunscreen.",
      ],
    },
    {
      heading: "Why the formula stays stable",
      paragraphs: [
        "Pure ascorbic acid is powerful but easily degraded by water and air. This ampoule uses a dual-layer formulation to keep the vitamin C stable, with a high hydration level so the water-soluble vitamin C can do its job. It comes in a 1.06 oz (30 g) pump bottle — 2 pumps per use, as the brand recommends.",
      ],
    },
    {
      heading: "Results measured in 7 days",
      paragraphs: [
        "In a 7-day human application test with 21 adults aged 20–60 (SKINMED Co., Ltd. Clinical Trial Centre), skin glow (radiance) improved by 35.6%, elasticity by 14.3% and a skin-pigmentation measurement by 7.2%. In the satisfaction survey, 95.2% said they were satisfied with the product. Individual results may vary.",
      ],
    },
    {
      heading: "Who it is for",
      paragraphs: [
        "Anyone whose skin looks dull, tired or uneven and wants a daily vitamin C step that layers well under makeup. Supporting ingredients — camu camu, turmeric, beta-carotene, hyaluronic acid, panthenol and a calming complex — keep the routine comfortable. If your skin is sensitive, start with a toner first for two weeks, as the brand recommends.",
      ],
    },
    {
      heading: "Where to buy the UNI&CORE Vita C 13.5 ampoule in the US",
      paragraphs: [
        "The ampoule is sold on Amazon.com through the official UNI&CORE listing (ASIN B0HJRKRKT7). Use any Shop on Amazon button on this page to see today's price, delivery options and customer reviews.",
      ],
    },
  ],
  concerns: [
    { title: "Dull, tired-looking skin", text: "Late nights, city air and dry indoor heat can leave skin looking flat and lackluster." },
    { title: "Uneven-looking tone", text: "Spots and patches make makeup work harder and skin look less even." },
    { title: "Loss of glow and bounce", text: "When skin looks matte and feels less springy, even a good routine can feel like it isn't showing." },
  ],
  benefits: [
    { title: "Multi-care brightening", text: "13.5% pure vitamin C delivers antioxidant care, a brighter-looking tone and springier-feeling skin in one step." },
    { title: "Stabilized, highly hydrated", text: "A dual-layer formula keeps the vitamin C stable, and a high hydration level helps water-soluble vitamin C perform." },
    { title: "Visible in 7 days", text: "In a 7-day human application test, skin glow improved by 35.6% and elasticity by 14.3%.*" },
  ],
  claims: [
    { id: "radiance", value: "+35.6%", label: "skin glow (radiance) after 7 days", detail: "6.029 → 7.736", source: AMPOULE_TEST, status: "verified" },
    { id: "elasticity", value: "+14.3%", label: "skin elasticity after 7 days", detail: "47.768 → 54.032", source: AMPOULE_TEST, status: "verified" },
    { id: "pigmentation", value: "7.2%", label: "improvement in a skin-pigmentation measurement after 7 days", detail: "128.698 → 118.698", source: AMPOULE_TEST, status: "verified" },
    { id: "satisfied", value: "95.2%", label: "say “I am satisfied with the product”", detail: "Satisfaction survey after 7 days of use", source: "User satisfaction survey after 7 days of use, 21 adults aged 20–60, SKINMED Co., Ltd. Clinical Trial Centre.", status: "verified" },
    { id: "luminous", value: "90.5%", label: "say skin looks more luminous and glowing", detail: "Satisfaction survey after 7 days of use", status: "verified" },
    { id: "elastic-feel", value: "90.5%", label: "say skin feels more elastic", detail: "Satisfaction survey after 7 days of use", status: "verified" },
    {
      id: "sold-korea",
      value: "100,000+",
      label: "bottles sold in Korea",
      source: "UNI&CORE internal sales data — confirm counting unit and period before publishing.",
      status: "pending",
    },
  ],
  claimsNote:
    "*Results are from a human application test and a satisfaction survey (21 adults aged 20–60, 7 days, SKINMED Co., Ltd. Clinical Trial Centre) and may vary by individual. This product is a cosmetic and is not intended to diagnose, treat, cure or prevent any disease.",
  beforeAfter: [
    // Add Day 0 / Day 7 photos from the original test report here (status: "verified" once matched to the report).
  ],
  videos: [],
  differentiators: [
    { title: "13.5% pure vitamin C", text: "Ascorbic acid — the pure form of vitamin C — at 13.5%, listed second on the US label right after water." },
    { title: "Dual-layer stabilization", text: "Pure vitamin C is notoriously unstable. A double-layer process keeps it stable, with a high hydration level so water-soluble vitamin C performs." },
    { title: "Results you can see in 7 days", text: "Tested on 21 adults: +35.6% radiance and +14.3% elasticity after just 7 days of use.*" },
  ],
  ingredients: [
    {
      name: "13.5% Pure Vitamin C",
      inci: "Ascorbic Acid",
      role: "Brightening antioxidant",
      detail: "13.5% water-soluble pure vitamin C — the hero of the formula, listed second on the label — for a brighter, more even-looking tone.",
      status: "verified",
    },
    {
      name: "Glutathione",
      inci: "Glutathione",
      role: "Brightening partner",
      detail: "Paired with vitamin C for brightening power from deep within, for a clearer, more radiant-looking complexion.",
      status: "verified",
    },
    {
      name: "Camu Camu",
      inci: "Myrciaria Dubia Fruit Extract",
      role: "Vitamin C-rich fruit",
      detail: "An Amazonian superfruit naturally rich in vitamin C, adding another layer of brightening care.",
      status: "verified",
    },
    {
      name: "Turmeric & Beta-Carotene",
      inci: "Curcuma Longa (Turmeric) Root Extract · Beta-Carotene",
      role: "Skin antioxidants",
      detail: "Powerful plant antioxidants that help defend skin against everyday environmental stress — and give the ampoule its natural yellow color.",
      status: "verified",
    },
    {
      name: "Calming Complex",
      inci: "Fraxinus Rhynchophylla Extract · Nelumbo Nucifera Seed Extract · Beta-Glucan · Panthenol · Opuntia Ficus-Indica Fruit Extract",
      role: "Comfort & moisture",
      detail: "Ash tree and lotus seed extracts, beta-glucan, panthenol and prickly pear minimize irritation with a variety of moisturizing and calming ingredients.",
      status: "verified",
    },
    {
      name: "Hydrolyzed Elastin",
      inci: "Hydrolyzed Elastin",
      role: "Bounce",
      detail: "A key ingredient for skin that feels firmer and springier, alongside beta-carotene.",
      status: "verified",
    },
  ],
  texture: {
    title: "A silky ampoule that sinks in",
    text: "Two pumps spread easily across the face and absorb quickly, leaving skin fresh rather than tacky — so creams and mists go on smoothly afterwards.",
    notes: ["Lightweight", "Fast-absorbing", "Non-sticky finish", "Naturally yellow"],
  },
  howTo: [
    { title: "Apply 2 pumps", text: "After cleansing, apply 2 pumps and spread evenly over the face, avoiding the eye area." },
    { title: "Spot-apply", text: "Dab a little more, more delicately, onto areas of concern." },
    { title: "Finish your routine", text: "Follow with cream and mist to finish your skincare routine. In the morning, always finish with sunscreen." },
  ],
  routineText: "Finish with 13.5% pure vitamin C to lock in brightening care.",
  faqs: [
    { q: "How much vitamin C does the ampoule contain?", a: "13.5% pure vitamin C (ascorbic acid), stabilized in a dual-layer formula. Ascorbic acid is listed second on the US label, right after water." },
    { q: "What results were measured?", a: "In a 7-day human application test with 21 adults aged 20–60 (SKINMED Co., Ltd. Clinical Trial Centre), skin glow improved by 35.6%, elasticity by 14.3% and a skin-pigmentation measurement by 7.2%. 95.2% said they were satisfied with the product. Individual results may vary." },
    { q: "How do I use it?", a: "After cleansing, apply 2 pumps and spread evenly over the face, avoiding the eye area. Dab a little extra on areas of concern, then follow with cream and mist. Use sunscreen in the morning." },
    { q: "Is it suitable for sensitive skin?", a: "If your skin is sensitive, prep with a toner for the first two weeks before applying the ampoule, then try using it directly after cleansing. Patch test first and stop if irritation occurs." },
    { q: "Why is the ampoule yellow?", a: "The color comes from its ingredients, such as turmeric root extract and beta-carotene. It can transfer to pillowcases or clothing even after it absorbs, so wipe any spills right away." },
    { q: "Is an ampoule the same as a vitamin C serum?", a: "Yes — ampoule is the Korean-skincare word for a concentrated serum. Use it in the serum step: after cleansing and toner, before moisturizer and sunscreen." },
    { q: "Can I layer it with other serums or actives?", a: "Apply the ampoule first on clean skin, then lighter serums and your cream. Many people use vitamin C in the morning (with sunscreen) and stronger actives such as retinol at night. Patch test new combinations." },
    { q: "Where can I buy it in the US?", a: "UNI&CORE products are sold on Amazon.com. Use the Shop on Amazon button on this page to go straight to the official listing." },
  ],

  promotion: bfcm(20),

  seo: {
    // US search terms (Google, Amazon, TikTok and YouTube suggestions, 2026-11-13): "vitamin c serum for face",
    // "korean vitamin c serum", "pure vitamin c serum", "brightening serum", "glutathione serum", "glass skin serum".
    title: "Korean Vitamin C Serum for Face, 13.5% Pure | UNI&CORE USA",
    description:
      "UNI&CORE 13.5% pure vitamin C serum for face with glutathione: a Korean brightening ampoule for glowing, glass skin. +35.6% radiance in 7 days*. On Amazon.",
    keywords: ["vitamin C serum for face", "Korean vitamin C serum", "pure vitamin C serum", "brightening serum", "glutathione serum", "vitamin C ampoule", "glass skin serum", "Korean serum", "13.5% vitamin C serum", "UNI&CORE vitamin C serum", "UNI&CORE"],
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
  size: "5 sheets × 0.56 oz (16 g)",
  accent: "sun",
  routineStep: 2,

  heroEyebrow: "2% Pure Vitamin C Sheet Mask",
  heroHeadline: "Brighten Your Routine with Vitamin C",
  heroSub:
    "A 10–20 minute sheet mask with 2% pure vitamin C, stabilized in a double-layer formula, on a premium high-adherence 100% TENCEL™ sheet that hugs the skin — for vitality and a brighter, more radiant look.",
  tagline: "Up to twenty minutes to a fresher, brighter-looking face.",
  keyIngredient: "2% Pure Vitamin C",
  highlights: ["2% pure vitamin C", "100% TENCEL™ sheet", "High-adherence fit", "5 sheet masks per box", "Made in Korea"],
  specs: [
    { label: "Key ingredient", value: "2% Pure Vitamin C" },
    { label: "Contents", value: "5 sheets, 0.56 oz (16 g) each" },
    { label: "Sheet", value: "100% TENCEL™, high-adherence" },
    { label: "Wear time", value: "10–20 minutes" },
    { label: "Claim on box", value: "Vitality & Brightening" },
    { label: "Best for", value: "Dull, dehydrated-looking skin" },
    { label: "Made in", value: "Korea" },
  ],

  heroImage: "/products/mask-hero.webp",
  visualImage: "/products/mask-visual.webp",
  packshotWhite: "/products/mask-white.webp",
  fullIngredients:
    "Water, Propanediol, Butylene Glycol, Dipropylene Glycol, Ascorbic Acid, Caprylic/Capric Triglyceride, Propylene Glycol Dicaprylate/Dicaprate, Polysorbate 60, Polyglyceryl-10 Laurate, Glycerin, (-)-alpha-Bisabolol, Panthenol, Glutathione, Dimethicone, Chitosan, Sodium Gluconate, Sodium Hyaluronate, Helianthus Annuus (Sunflower) Seed Oil, Phytic Acid, Beta-Glucan, Fraxinus Rhynchophylla Extract, Nelumbo Nucifera Seed Extract, Hydrolyzed Elastin, Inula Britannica Flower Extract, Phaseolus Radiatus Seed Extract, Rumex Crispus Root Extract, Betula Platyphylla Japonica Bark Extract, Acetyl Hexapeptide-8, Daucus Carota Sativa (Carrot) Root Extract, Daucus Carota Sativa (Carrot) Seed Oil, Disodium EDTA, Guar Hydroxypropyltrimonium Chloride, Sodium Metabisulfite, Tocopherol, Xanthan Gum, Citrus Paradisi (Grapefruit) Fruit Extract, Sodium Hydroxide, 1,2-Hexanediol, Ethylhexylglycerin, Fragrance, Beta-Carotene",
  caution:
    "External use only. Avoid contact with eyes; if contact occurs, rinse thoroughly with water. Do not use on broken or irritated skin. Discontinue use if irritation or rash occurs. Keep out of reach of children. Store in a cool, dry place away from direct sunlight.",

  officialDetail: {
    sourceUrl: SHOP_PAGE(445),
    slices: slices("mask", [1562, 1562, 1562, 1562, 1562, 1562, 1562, 1562, 1562, 1562, 1555]),
    outline: [
      "Key points: brighten and clarify skin with 2% pure vitamin C (ascorbic acid); premium high-adherence sheet made from 100% TENCEL™ using water-save technology",
      "Vitality and radiance from deep within: 2% pure vitamin C stabilized with a double-layer formula and a high hydration level",
      "Sheet structure: the front holds moisture and essence in, the back rapidly propels the essence toward the skin",
      "Ingredients: ascorbic acid, glutathione, Inula britannica flower extract, calming complex, beta-glucan, panthenol, alpha-bisabolol, hydrolyzed elastin, beta-carotene",
      "How to use in 4 steps, with the dark side of the sheet facing out",
    ],
  },
  usageNotes: ["Place the sheet with its darker side facing out."],

  about: [
    {
      heading: "A Korean vitamin C sheet mask with 2% pure vitamin C",
      paragraphs: [
        "The UNI&CORE Vita C Super Brightening Mask is a Korean sheet mask soaked in an essence with 2% pure vitamin C (ascorbic acid), glutathione and Inula britannica flower extract — a brightening trio for skin that looks tired or dull. The vitamin C is stabilized with a double-layer formula and kept at a high hydration level.",
      ],
    },
    {
      heading: "A 100% TENCEL™ sheet that hugs the skin",
      paragraphs: [
        "The premium high-adherence sheet is made from 100% TENCEL™ using water-save technology. Its front keeps moisture and essence from evaporating, while the back pushes the essence toward the skin, so the mask clings to every contour for a firmer, lifted feel.",
      ],
    },
    {
      heading: "How to use a vitamin C face mask",
      paragraphs: [
        "Cleanse, apply the mask with the darker side facing out, and remove it after 10–20 minutes. Pat the remaining essence in, then finish with a mist and cream. Each box holds 5 individually sealed sheets (0.56 oz / 16 g each) — ideal before an event or as a weekly brightening ritual.",
      ],
    },
    {
      heading: "Where to buy the UNI&CORE vitamin C sheet mask in the US",
      paragraphs: [
        "The mask is sold on Amazon.com through the official UNI&CORE listing (ASIN B0HGR6V48S). Use the Shop on Amazon buttons on this page for today's price, delivery and reviews.",
      ],
    },
  ],
  concerns: [
    { title: "Skin looks tired", text: "Busy weeks show up on your face first — as dullness and a lack of bounce." },
    { title: "Makeup won't sit right", text: "Dry-feeling, uneven-looking skin makes foundation look patchy." },
    { title: "No time for a long routine", text: "You want a visible pick-me-up without a ten-step evening." },
  ],
  benefits: [
    { title: "Instant fresh look", text: "Skin looks brighter and feels hydrated right after a single 10–20 minute session." },
    { title: "A sheet that hugs the skin", text: "The high-adhesion 100% TENCEL™ sheet clings closely for a firmer, lifted feel while you wear it." },
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
    { title: "2% pure vitamin C, stabilized", text: "Real ascorbic acid — not a vitamin C scent — kept stable in a double-layer formula with a high hydration level." },
    { title: "100% TENCEL™ premium sheet", text: "Made with water-save technology. The front keeps moisture and essence from escaping; the back propels essence toward the skin." },
    { title: "High-adherence fit", text: "The sheet hugs every contour for a firmer, lifted feel — no slipping, no gaps." },
  ],
  ingredients: [
    {
      name: "Pure Vitamin C",
      inci: "Ascorbic Acid",
      role: "Brightening",
      detail: "2% pure vitamin C in a soothing essence helps skin look fresher and more even after each use.",
      status: "verified",
    },
    {
      name: "Glutathione",
      inci: "Glutathione",
      role: "Supporting antioxidant",
      detail: "Paired with vitamin C in the essence for brightening power from deep within and a clearer, more radiant-looking finish.",
      status: "verified",
    },
    {
      name: "Inula Britannica Flower",
      inci: "Inula Britannica Flower Extract",
      role: "Brightening botanical",
      detail: "A flower extract that joins vitamin C and glutathione in the brightening trio of the essence.",
      status: "verified",
    },
    {
      name: "Calming Complex",
      inci: "Fraxinus Rhynchophylla Extract · Nelumbo Nucifera Seed Extract · Beta-Glucan · Panthenol",
      role: "Comfort & moisture",
      detail: "Ash tree and lotus seed extracts with beta-glucan and panthenol minimize irritation with a variety of moisturizing and calming ingredients.",
      status: "verified",
    },
    {
      name: "Bisabolol",
      inci: "(-)-alpha-Bisabolol",
      role: "Soothing",
      detail: "A chamomile-derived ingredient registered in Korea as a functional brightening ingredient, that also helps skin feel calm while you wear the mask.",
      status: "verified",
    },
    {
      name: "Hyaluronic Acid",
      inci: "Sodium Hyaluronate",
      role: "Hydration",
      detail: "Helps skin feel plump and hydrated after the sheet comes off.",
      status: "verified",
    },
    {
      name: "Hydrolyzed Elastin & Beta-Carotene",
      inci: "Hydrolyzed Elastin · Beta-Carotene",
      role: "Firm-feeling skin & antioxidant care",
      detail: "Care for firmer-feeling skin plus antioxidant support.",
      status: "verified",
    },
  ],
  texture: {
    title: "Essence you can feel working",
    text: "A soft, well-soaked sheet delivers a light, watery essence. After removing the mask, pat the remaining essence into skin until absorbed.",
    notes: ["Soft, fitted sheet", "Light, watery essence", "Comfortable 20-minute wear"],
  },
  howTo: [
    { title: "Cleanse", text: "Cleanse your skin thoroughly — ideally with the Vita C Enzyme Powder Wash." },
    { title: "Apply for 10–20 minutes", text: "Apply the mask evenly over your face, darker side facing out, and remove it after about 10 to 20 minutes." },
    { title: "Pat in the essence", text: "After removing the sheet, gently pat the remaining essence until absorbed." },
    { title: "Finish", text: "Finish with a mist — and if your skin feels dry, an extra layer of cream. Then the Vita C 13.5 ampoule." },
  ],
  routineText: "Flood freshly cleansed skin with vitamin C essence in 20 minutes.",
  faqs: [
    { q: "How often can I use the mask?", a: "Two to three times a week works well for most people, or whenever skin needs a quick refresh." },
    { q: "Can I leave it on longer than 20 minutes?", a: "We don't recommend it. Once the sheet starts to dry it can draw moisture back out of the skin." },
    { q: "Should I rinse after using the mask?", a: "No need — pat the remaining essence into your skin and continue with your ampoule and moisturizer." },
    { q: "How many masks come in a box?", a: "Each box contains 5 individually packed sheet masks, 0.56 oz (16 g) each." },
    { q: "What is the sheet made of?", a: "A premium high-adherence sheet made from 100% TENCEL™ using water-save technology. It hugs the skin, keeps the essence from evaporating and pushes it toward the skin." },
    { q: "Which side faces out?", a: "Place the sheet with the darker side facing out." },
    { q: "Where can I buy the vitamin C sheet mask in the US?", a: "On Amazon.com, through the official UNI&CORE listing. Use the Shop on Amazon button on this page." },
  ],

  promotion: bfcm(20),

  seo: {
    // US search terms (2026-11-13): "korean sheet mask", "vitamin c sheet mask", "vitamin c face mask", "brightening
    // sheet mask", "hydrating sheet mask", "korean face mask", "glass skin mask".
    title: "Korean Vitamin C Sheet Mask, Brightening | UNI&CORE USA",
    description:
      "UNI&CORE Korean vitamin C sheet mask with 2% pure vitamin C and glutathione: a brightening, hydrating face mask for glass skin. 5 TENCEL™ sheets on Amazon.",
    keywords: ["Korean sheet mask", "vitamin C sheet mask", "vitamin C face mask", "brightening sheet mask", "hydrating sheet mask", "Korean face mask", "glass skin mask", "sheet mask", "UNI&CORE face mask", "UNI&CORE"],
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
  size: "30 single-use pouches (1 g each)",
  accent: "peach",
  routineStep: 1,

  heroEyebrow: "Papain + Bromelain Enzyme Cleanser",
  heroHeadline: "The Power of Enzymes in Every Wash",
  heroSub:
    "A gentle enzyme powder that turns into a creamy foam with a splash of water — lifting away dullness and buildup for smoother, brighter-looking skin.",
  tagline: "Fresh powder, every single wash.",
  keyIngredient: "Papain & Bromelain Enzymes",
  highlights: ["Papain + bromelain + lipase enzymes", "Pure vitamin C + curcumin", "Mildly acidic pH 5–5.5", "No tightness after washing", "30 single-use pouches"],
  specs: [
    { label: "Key ingredients", value: "Papain, bromelain, vitamin C" },
    { label: "Contents", value: "30 pouches × 0.03 oz (1 g) — 1.06 oz (30 g)" },
    { label: "Format", value: "Powder-to-foam cleanser" },
    { label: "pH", value: "Mildly acidic, 5–5.5" },
    { label: "Skin type", value: "Oily, normal, combination and dry" },
    { label: "Made in", value: "Korea" },
  ],

  heroImage: "/products/wash-hero.webp",
  visualImage: "/products/wash-visual.webp",
  packshotWhite: "/products/wash-white.webp",
  fullIngredients:
    "Zea Mays (Corn) Starch, Sodium Cocoyl Isethionate, Sodium Lauroyl Glutamate, Sodium Palmitate, Diglycerin, Allantoin, Maltodextrin, Citrus Aurantium Dulcis (Orange) Peel Powder, Fragaria Vesca (Strawberry) Seed, Papain, Bromelain, Ascorbic Acid, Sucrose, Cellulose Gum, Curcumin, Styrene/Acrylates Copolymer, Lipase, Titanium Dioxide (CI 77891), Mica, Iron Oxide (CI 77492)",
  caution:
    "External use only. Avoid contact with eyes; if contact occurs, rinse thoroughly with water. Do not use this product in a manner that may lead to inhalation. Do not use on broken or irritated skin. If irritation occurs, discontinue use immediately and consult a physician. Keep out of reach of children.",

  officialDetail: {
    sourceUrl: SHOP_PAGE(441),
    slices: slices("wash", [1513, 1513, 1513, 1513, 1513, 1513, 1513, 1513, 1513, 1513, 1512]),
    outline: [
      "Clear and radiant skin transformation. Key points: cleansing power, mildly acidic pH care, moisturizing without tightness",
      "Vitamin C antioxidant foam: a daily antioxidant routine with pure vitamin C (ascorbic acid) and curcumin",
      "Gentle exfoliating care with naturally derived ingredients: orange peel powder, wild strawberry seeds, papain, bromelain and lipase enzymes",
      "Rich, creamy foam from mild coconut- and amino-acid-derived surfactants",
      "Skin-friendly mildly acidic pH of 5 to 5.5 that mimics the skin barrier, with moisturizing ingredients for a healthy skin balance",
      "FAQ: powder wash vs. foam cleanser, sensitive skin, everyday use",
    ],
  },

  about: [
    {
      heading: "A Korean enzyme powder wash with vitamin C",
      paragraphs: [
        "The UNI&CORE Vita C Enzyme Powder Wash is a Korean powder cleanser that turns into a rich, creamy foam with a splash of water. It combines pure vitamin C (ascorbic acid) and curcumin with three enzymes — papain from papaya, bromelain from pineapple and lipase — for a gentle daily exfoliating cleanse.",
      ],
    },
    {
      heading: "Gentle exfoliation at a skin-friendly pH",
      paragraphs: [
        "Instead of harsh scrubbing, the enzymes break down dead skin cells, excess sebum and impurities. Fine wild strawberry seeds and orange peel powder add a soft polish, and mild coconut- and amino-acid-derived cleansers keep skin from feeling tight. The formula is mildly acidic, at pH 5 to 5.5, close to the skin's own barrier.",
      ],
    },
    {
      heading: "Single-use packets for every skin type",
      paragraphs: [
        "Each box holds 30 single-use 1 g pouches (1.06 oz / 30 g total), so the powder stays dry and fresh and travels easily. The box lists oily, normal, combination and dry skin. Use it daily, or as the first step before the vitamin C sheet mask and ampoule.",
      ],
    },
    {
      heading: "Where to buy the UNI&CORE enzyme powder wash in the US",
      paragraphs: [
        "The powder wash is sold on Amazon.com through the official UNI&CORE listing (ASIN B0HGQYFF13). Use the Shop on Amazon buttons on this page for today's price, delivery options and reviews.",
      ],
    },
  ],
  concerns: [
    { title: "Rough, uneven texture", text: "Dead-skin buildup makes skin feel rough and look dull." },
    { title: "Congested-looking pores", text: "Oil and residue can leave pores looking more visible by the end of the day." },
    { title: "Harsh scrubs", text: "Gritty exfoliators can feel too aggressive for everyday use." },
  ],
  benefits: [
    { title: "Cleansing power", text: "Papain, bromelain and lipase enzymes lift away dead skin cells, excess sebum and impurities — no gritty scrubbing required." },
    { title: "Mildly acidic pH care", text: "A skin-friendly pH of 5 to 5.5 that mimics the skin barrier, for daily cleansing without worrying about irritation." },
    { title: "Moisturizing without tightness", text: "Gentle coconut- and amino-acid-derived cleansers whip into a rich, creamy foam that leaves skin soft, never tight." },
  ],
  claims: [
    {
      id: "ph",
      value: "pH 5–5.5",
      label: "mildly acidic, skin-friendly cleansing",
      detail: "Mimics the skin barrier",
      source: "Official UNI&CORE product page (mildly acidic pH 5 to 5.5); the US box states \"pH balanced formula\".",
      status: "verified",
    },
  ],
  claimsNote: "Individual results may vary. This product is a cosmetic and is not intended to diagnose, treat, cure or prevent any disease.",
  beforeAfter: [],
  videos: [],
  differentiators: [
    { title: "Three enzymes, plus plant exfoliants", text: "Papain, bromelain and lipase with orange peel powder and fine wild strawberry seeds — gentle enough for every day." },
    { title: "One packet, one wash", text: "Pre-portioned packets mean no wet jar, no clumping and the right amount every time." },
    { title: "Built for travel", text: "Toss a few packets in your bag — no liquids, no spills." },
  ],
  ingredients: [
    {
      name: "Bromelain",
      inci: "Bromelain",
      role: "Enzyme exfoliant",
      detail: "A pineapple-derived enzyme that refines dead skin cells and impurities on the skin's surface for clearer, more radiant-looking skin.",
      status: "verified",
    },
    {
      name: "Papain",
      inci: "Papain",
      role: "Enzyme exfoliant",
      detail: "A naturally derived papaya enzyme that selectively and gently removes unwanted dead skin cells, leaving rough skin smooth.",
      status: "verified",
    },
    {
      name: "Pure Vitamin C",
      inci: "Ascorbic Acid",
      role: "Antioxidant foam",
      detail: "Nurtures healthy-looking skin and refines the complexion to a clear, radiant finish.",
      status: "verified",
    },
    {
      name: "Curcumin",
      inci: "Curcumin",
      role: "Natural antioxidant",
      detail: "Helps protect skin from the external environment and comforts it after cleansing.",
      status: "verified",
    },
    {
      name: "Lipase",
      inci: "Lipase",
      role: "Sebum-balancing enzyme",
      detail: "The delicate power of enzymes gently breaks down excess sebum and impurities, leaving skin feeling clean and balanced.",
      status: "verified",
    },
    {
      name: "Orange Peel Powder",
      inci: "Citrus Aurantium Dulcis (Orange) Peel Powder",
      role: "Vitality",
      detail: "Packed with vitamins and antioxidants, orange peel breathes vitality into dull-looking skin for a fresh, radiant look.",
      status: "verified",
    },
    {
      name: "Wild Strawberry Seeds",
      inci: "Fragaria Vesca (Strawberry) Seed",
      role: "Gentle physical exfoliant",
      detail: "Fine, plant-derived seeds gently remove dead skin cells and impurities for smoother, more refined-feeling skin.",
      status: "verified",
    },
    {
      name: "Coconut & Amino-Acid Cleansers",
      inci: "Sodium Cocoyl Isethionate · Sodium Lauroyl Glutamate",
      role: "Rich, mild foam",
      detail: "Gentle cleansing ingredients derived from coconut and amino acids keep skin moisturized and healthy-feeling, without tightness after cleansing.",
      status: "verified",
    },
  ],
  texture: {
    title: "From fine powder to cloud-soft foam",
    text: "Pour the fine powder into a wet palm, add a few drops of water and rub — it turns into a dense, creamy foam in seconds.",
    notes: ["Fine, soft powder", "Activates with water", "Dense, creamy lather"],
  },
  howTo: [
    { title: "Open a pouch", text: "Tear open one pouch and pour the powder into your palm." },
    { title: "Add water & lather", text: "Add a small amount of lukewarm water and rub your hands together until it turns into a rich foam." },
    { title: "Massage & rinse", text: "Massage gently over the face with soft rolling motions, avoiding the eye area, then rinse clean with warm water." },
  ],
  routineText: "Start with fresh enzyme foam to clear the way for vitamin C.",
  faqs: [
    { q: "How is a powder wash different from a regular foam cleanser?", a: "The powder turns into a soft foam on contact with water and uses enzymes and naturally derived ingredients to clear away dead skin cells and impurities without irritation. It also leaves skin moisturized, without that tight feeling after cleansing." },
    { q: "Can I use the powder wash every day?", a: "Yes. It removes dead skin cells and impurities with the power of enzymes rather than harsh scrubbing, so you can use it every day for clear, healthy-looking skin." },
    { q: "How many washes are in a box?", a: "Each box contains 30 individually packed 1 g pouches — one pouch per wash." },
    { q: "Is the powder wash good for oily or combination skin?", a: "The box lists oily, normal, combination and dry skin. The lipase enzyme helps break down excess sebum, while mild cleansers keep skin from feeling tight." },
    { q: "Where can I buy the enzyme powder wash in the US?", a: "On Amazon.com, through the official UNI&CORE listing. Use the Shop on Amazon button on this page." },
    { q: "Does it replace my makeup remover?", a: "For heavy or waterproof makeup, remove it first with a cleansing oil or balm, then use the powder wash as your second cleanse." },
    { q: "Can I use it with sensitive skin?", a: "Yes. It's made with naturally derived ingredients and low-irritation enzymes at a mildly acidic pH of 5–5.5. As with any new product, patch test first if your skin is reactive." },
  ],

  promotion: bfcm(20),

  seo: {
    // US search terms (2026-11-13): "enzyme powder face wash", "enzyme powder cleanser", "korean face wash",
    // "exfoliating face wash", "powder cleanser", "vitamin c cleanser", "travel face wash".
    title: "Enzyme Powder Cleanser, Korean Face Wash | UNI&CORE USA",
    description:
      "UNI&CORE Korean enzyme powder face wash with vitamin C, papain and bromelain: a gentle exfoliating cleanser, pH 5–5.5, in 30 travel-size packets. On Amazon.",
    keywords: ["enzyme powder face wash", "enzyme powder cleanser", "Korean face wash", "exfoliating face wash", "powder cleanser", "powder face wash", "vitamin C cleanser", "enzyme cleanser", "travel face wash", "UNI&CORE"],
  },
};

/** The serum mist's TikTok Shop listing (product 1732276811319186292), link supplied by the client on 2026-11-13. */
const MIST_TIKTOK_SHOP = "https://vm.tiktok.com/ZP9fQ7EhYBHsH-pAk1Y/";

/**
 * Hydrating Skin Barrier Serum Mist. Sold on TikTok Shop, not Amazon: no ASIN, and every
 * "Shop" button on its page opens TikTok Shop. Copy from the client's product text (2026-11-13).
 */
export const MIST: ProductContent = {
  key: "mist",
  slug: "hydrating-skin-barrier-serum-mist",
  published: true,

  asin: "",
  asinVerified: false,
  amazonUrl: "",
  attribution: {},
  shop: { kind: "tiktok", url: MIST_TIKTOK_SHOP },

  name: "Hydrating Skin Barrier Serum Mist",
  shortName: "Serum Mist",
  size: "1.76 fl oz (50 ml)",
  accent: "sun",
  routineStep: 3,

  heroEyebrow: "Hydrate. Barrier Support. Radiant-looking Skin.",
  heroHeadline: "Not just hydration: an alive nano-liposome serum mist",
  heroSub:
    "A serum mist with copper tripeptide-1 and CICA in nano liposomes (~50 nm) and a rare O/W/O multi emulsion, for quick but long-lasting hydration in an ultra-fine spray.",
  tagline: "Serum-level hydration in an ultra-fine mist.",
  keyIngredient: "Copper Tripeptide-1 (GHK-Cu)",
  highlights: ["1 million sold", "Long-lasting hydration for 24 hours*", "Copper tripeptide-1 + CICA mild complex", "Nano liposomes in an O/W/O multi emulsion", "Use anytime, even over makeup"],
  specs: [
    { label: "Key ingredients", value: "Copper tripeptide-1, CICA mild complex" },
    { label: "Net weight", value: "1.76 fl oz (50 ml)" },
    { label: "Step", value: "Serum mist" },
    { label: "Use", value: "After cleansing, before skincare, over makeup, midday" },
    { label: "Made in", value: "Korea" },
  ],

  heroImage: "/landing/mist/listing-1.webp",
  packshotWhite: "/landing/mist/product.webp",

  concerns: [
    { title: "Tight after cleansing", text: "Skin that needs moisture right after washing." },
    { title: "Dry by midday", text: "Air conditioning, heat and long days leave skin feeling dry." },
  ],
  benefits: [
    { title: "Fast absorption", text: "Ready for the next skincare step." },
    { title: "Quick but long-lasting hydration", text: "Hydration that stays, in an ultra-fine mist." },
    { title: "Barrier-supporting care", text: "Supports skin barrier comfort against daily environmental stress." },
    { title: "Luxury peptide care", text: "Copper tripeptide-1 for skin vitality." },
    { title: "Naturally radiant", text: "Leaves skin soft, smooth and naturally radiant." },
  ],
  claims: [],
  claimsNote: "*Based on internal testing. Individual results may vary. This product is a cosmetic and is not intended to diagnose, treat, cure or prevent any disease.",
  beforeAfter: [],
  videos: [],
  differentiators: [
    { title: "Alive nano-liposome movement formulation", text: "Nano liposomes and nano vesicles (~50 nm) form dynamic micro-particles that keep moving and spreading across the skin surface." },
    { title: "Rare O/W/O multi emulsion", text: "A luxury water-oil-water system that delivers hydration and lipid nourishment together." },
    { title: "Biomimetic RPI structure", text: "Designed to mimic the skin's natural lipid barrier for faster absorption and long-lasting hydration." },
  ],
  ingredients: [
    { name: "Copper Tripeptide-1", inci: "Copper Tripeptide-1", role: "Premium peptide", detail: "Known for supporting skin vitality and helping improve the appearance of firmness and smoothness.", status: "verified" },
    { name: "CICA Mild Complex", role: "Soothing", detail: "Helps calm skin, maintain moisture balance and support barrier comfort after cleansing.", status: "verified" },
    { name: "Nano Liposome & Vesicle", role: "Delivery", detail: "Micro-sized dispersion technology spreads active ingredients evenly across the skin for fast-feeling absorption.", status: "verified" },
    { name: "O/W/O Multi Emulsion", role: "Long-lasting comfort", detail: "A water-oil-water system that delivers hydration and lipid nourishment at the same time.", status: "verified" },
  ],
  texture: {
    title: "Ultra-fine serum mist texture",
    text: "The micro-fine spray spreads evenly without disturbing makeup, delivering serum-level hydration in a lightweight mist.",
    notes: ["After cleansing", "Before skincare", "Over makeup", "Midday hydration reset"],
  },
  howTo: [
    { title: "Spray", text: "Hold the bottle 20-30 cm away from your face and spray evenly." },
    { title: "Pat", text: "Gently pat for enhanced absorption if desired." },
    { title: "Anytime", text: "Use morning, evening or throughout the day, whenever skin feels dry." },
  ],
  routineText: "Mist after cleansing and whenever skin feels dry.",
  faqs: [],

  // No TikTok Shop promotion is set up on this site; the page never shows a discount.
  promotion: { enabled: false, ...BFCM_2026, discountPct: 0, headline: "", detail: "" },

  seo: {
    // US search terms (2026-11-13): "face mist", "hydrating face mist", "korean face mist", "serum mist", "spray serum",
    // "facial mist", "face spray", "copper peptide", "glass skin", "hydrating face mist for makeup".
    title: "Korean Hydrating Face Mist, Serum Spray | UNI&CORE USA",
    description:
      "UNI&CORE Korean serum mist spray with copper peptide and CICA: a hydrating face mist for glass skin, fine enough for over makeup. 24h hydration*. TikTok Shop.",
    keywords: ["hydrating face mist", "Korean face mist", "face mist", "serum mist", "spray serum", "facial mist", "face spray", "copper peptide mist", "glass skin", "face mist for makeup", "UNI&CORE"],
  },
};

/** Routine order: wash → mask → ampoule, then the serum mist (sold on TikTok Shop). */
export const DEFAULT_PRODUCTS: ProductContent[] = [WASH, MASK, AMPOULE, MIST];
