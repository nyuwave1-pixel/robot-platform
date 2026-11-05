import type { ProductKey } from "./types";

/**
 * Long-tail English guides that answer what shoppers search before buying on
 * Amazon. Rules: cosmetic language only ("brighter-looking"), no competitor
 * names, product facts only from the US labels / official UNI&CORE pages.
 * Each guide renders at /guides/<slug> with Article + FAQPage + Breadcrumb JSON-LD.
 */
export interface Guide {
  slug: string;
  /** <title>, ≤ 60 chars, includes UNI&CORE. */
  title: string;
  /** Meta description, ≤ 155 chars. */
  description: string;
  h1: string;
  intro: string;
  keywords: string[];
  sections: { heading: string; paragraphs: string[]; product?: ProductKey }[];
  faqs: { q: string; a: string }[];
  /** Products featured with Amazon buttons, in order. */
  products: ProductKey[];
  published: string;
  updated: string;
}

export const GUIDES: Guide[] = [
  {
    slug: "vitamin-c-ampoule-vs-serum",
    title: "Vitamin C Ampoule vs Serum: The Difference | UNI&CORE",
    description:
      "Ampoule or serum? How Korean vitamin C ampoules differ from serums, what the percentage means, and where an ampoule fits in your routine.",
    h1: "Vitamin C Ampoule vs Serum: What's the Difference?",
    intro:
      "If you shop Korean skincare you'll see vitamin C sold as both \"serums\" and \"ampoules.\" Here is what the words actually mean, what to look for on the label, and how to use either one.",
    keywords: ["vitamin C ampoule vs serum", "what is an ampoule", "Korean ampoule", "vitamin C serum percentage", "13.5% vitamin C serum"],
    sections: [
      {
        heading: "What is an ampoule?",
        paragraphs: [
          "\"Ampoule\" is a Korean-skincare term for a concentrated serum. It is not a regulated category: it signals a product built around a higher dose of one hero ingredient for a specific concern, such as dullness. A serum is the broader name for a light, water-based treatment step.",
          "In practice you use both the same way: after cleansing (and toner or a sheet mask), before moisturizer and, in the morning, sunscreen.",
        ],
      },
      {
        heading: "What the vitamin C percentage tells you",
        paragraphs: [
          "Look for the form of vitamin C and its percentage. Ascorbic acid is the pure form of vitamin C and the most studied in skincare. Higher percentages are more intense, so they suit people who want a focused brightening step; beginners or sensitive skin often start slowly.",
          "Because pure ascorbic acid breaks down with water and air, the formula and packaging matter as much as the number. A stabilized formula and a pump bottle help keep the vitamin C fresh.",
        ],
      },
      {
        heading: "An example: the UNI&CORE Vita C 13.5 ampoule",
        product: "ampoule",
        paragraphs: [
          "The UNI&CORE Vita C 13.5 Super Brightening Ampoule contains 13.5% pure vitamin C (ascorbic acid), stabilized in a dual-layer formula with a high hydration level, plus glutathione, camu camu, hyaluronic acid and panthenol. It comes in a 1.06 oz (30 g) pump bottle; the brand recommends 2 pumps after cleansing.",
          "In a 7-day human application test with 21 adults aged 20–60 (SKINMED Co., Ltd. Clinical Trial Centre), skin glow improved by 35.6% and elasticity by 14.3%. Individual results may vary.",
        ],
      },
      {
        heading: "Can you use an ampoule and a serum together?",
        paragraphs: [
          "Yes. Apply the thinnest, most concentrated product first and layer the rest from thin to thick. If you are introducing a new vitamin C product, start with it once a day and see how your skin responds before adding more steps.",
        ],
      },
    ],
    faqs: [
      { q: "Is an ampoule stronger than a serum?", a: "Usually an ampoule is positioned as the more concentrated, targeted step, but the label is what counts: compare the ingredient, its form (for vitamin C, ascorbic acid) and its percentage." },
      { q: "Do I need both an ampoule and a serum?", a: "No. One well-formulated vitamin C step is enough for most routines. Add other serums only if they target a different need, such as hydration." },
      { q: "When should I apply a vitamin C ampoule?", a: "After cleansing and toner (or a sheet mask), before moisturizer. In the morning, finish with sunscreen." },
      { q: "Where can I buy the UNI&CORE vitamin C ampoule?", a: "On Amazon.com through the official UNI&CORE listing. Use the Shop on Amazon button in this guide." },
    ],
    products: ["ampoule"],
    published: "2026-11-05",
    updated: "2026-11-05",
  },
  {
    slug: "how-to-use-enzyme-powder-cleanser",
    title: "How to Use an Enzyme Powder Cleanser | UNI&CORE",
    description:
      "How to use a Korean enzyme powder cleanser: how much powder, how to lather, how often, and how it differs from a foam cleanser or a scrub.",
    h1: "How to Use an Enzyme Powder Cleanser",
    intro:
      "Enzyme powder washes are a Korean favorite for smooth, clear-looking skin without harsh scrubbing. Here is how to use one, step by step.",
    keywords: ["how to use enzyme powder cleanser", "enzyme powder wash", "powder face wash", "Korean enzyme cleanser", "papain bromelain cleanser"],
    sections: [
      {
        heading: "What an enzyme powder cleanser does",
        paragraphs: [
          "Enzymes such as papain (from papaya) and bromelain (from pineapple) loosen dead skin cells and buildup on the surface of the skin, so the cleanser exfoliates gently while it washes. Because the formula is a dry powder, the enzymes stay fresh until water activates them.",
        ],
      },
      {
        heading: "Step by step",
        paragraphs: [
          "1. Wet your face and hands. 2. Pour the powder into your palm — one single-use packet if your cleanser comes in packets. 3. Add a few drops of lukewarm water and rub your hands together until it turns into a creamy foam. 4. Massage gently over the face with soft circular motions, avoiding the eye area. 5. Rinse thoroughly with lukewarm water and follow with the rest of your routine.",
          "If you wear heavy or waterproof makeup, remove it first with a cleansing oil or balm, then use the powder wash as your second cleanse.",
        ],
      },
      {
        heading: "An example: UNI&CORE Vita C Enzyme Powder Wash",
        product: "wash",
        paragraphs: [
          "The UNI&CORE Vita C Enzyme Powder Wash combines papain, bromelain and lipase enzymes with vitamin C (ascorbic acid) and curcumin, plus fine wild strawberry seeds and orange peel powder. Mild coconut- and amino-acid-derived cleansers make a rich foam that leaves skin soft rather than tight, and the formula is mildly acidic at pH 5–5.5.",
          "It comes as 30 single-use 1 g pouches (1.06 oz / 30 g), so the dose is always right and the powder stays dry. The brand describes it as gentle enough for daily use.",
        ],
      },
      {
        heading: "How often should you use it?",
        paragraphs: [
          "It depends on the formula. Gentle, low-pH enzyme washes made for everyday cleansing can be used daily; stronger exfoliating powders are often used a few times a week. Follow the instructions on your product, and cut back if your skin feels sensitive.",
        ],
      },
    ],
    faqs: [
      { q: "Is an enzyme powder cleanser the same as a scrub?", a: "No. A scrub exfoliates with particles; an enzyme cleanser relies mainly on enzymes to loosen dead skin cells, which is typically gentler for frequent use." },
      { q: "How much powder should I use?", a: "About a small coin-sized amount, or one single-use packet. The UNI&CORE powder wash comes pre-portioned in 1 g pouches." },
      { q: "Can I use an enzyme powder wash every day?", a: "Gentle, low-pH formulas made for daily use can be. The UNI&CORE Vita C Enzyme Powder Wash is mildly acidic (pH 5–5.5) and designed for everyday cleansing." },
      { q: "Where can I buy the UNI&CORE enzyme powder wash?", a: "On Amazon.com through the official UNI&CORE listing. Use the Shop on Amazon button in this guide." },
    ],
    products: ["wash"],
    published: "2026-11-05",
    updated: "2026-11-05",
  },
  {
    slug: "vitamin-c-and-glutathione",
    title: "Vitamin C and Glutathione in Skincare | UNI&CORE",
    description:
      "Why vitamin C and glutathione are paired in brightening skincare, how to use them in a routine, and what to expect.",
    h1: "Vitamin C and Glutathione: Why They're Paired in Skincare",
    intro:
      "More brightening formulas now list glutathione next to vitamin C. Here is why the two are paired, and how to use them in a simple routine.",
    keywords: ["vitamin C and glutathione", "glutathione vitamin C serum", "glutathione skincare", "brightening serum ingredients"],
    sections: [
      {
        heading: "Two antioxidants that work well together",
        paragraphs: [
          "Vitamin C (ascorbic acid) and glutathione are both antioxidants. In skincare they are paired for a brighter, more even-looking and radiant complexion, and to help skin handle everyday stress from pollution and sunlight. Formulators often describe them as complementary: each helps the other stay in its active form.",
          "Evidence for specific synergy claims is still limited, so judge a product by its full formula, its vitamin C percentage and stability, and any published test results.",
        ],
      },
      {
        heading: "Where you'll find the pair",
        paragraphs: [
          "Both UNI&CORE vitamin C treatments list glutathione on the US label. The Vita C 13.5 ampoule pairs it with 13.5% pure vitamin C; the Vita C Super Brightening Mask pairs it with 2% pure vitamin C and Inula britannica flower extract in a sheet-mask essence.",
        ],
        product: "ampoule",
      },
      {
        heading: "How to use vitamin C and glutathione",
        paragraphs: [
          "Use them after cleansing, before moisturizer. A sheet mask is a good occasional boost; a serum or ampoule is the daily step. In the morning always finish with a broad-spectrum sunscreen — without daily sun protection, no brightening routine can show its best.",
        ],
        product: "mask",
      },
    ],
    faqs: [
      { q: "Can I use vitamin C and glutathione together?", a: "Yes. They are commonly combined in one formula, and both UNI&CORE vitamin C products contain glutathione alongside pure vitamin C." },
      { q: "Should I use them in the morning or at night?", a: "Either works. Many people prefer vitamin C in the morning under sunscreen. Follow your product's directions." },
      { q: "How long until I see results?", a: "It varies. In UNI&CORE's 7-day human application test of the Vita C 13.5 ampoule, skin glow improved by 35.6% (21 adults; individual results may vary)." },
      { q: "Where can I buy UNI&CORE vitamin C with glutathione?", a: "On Amazon.com through the official UNI&CORE listings. Use the Shop on Amazon buttons in this guide." },
    ],
    products: ["ampoule", "mask"],
    published: "2026-11-05",
    updated: "2026-11-05",
  },
  {
    slug: "vitamin-c-sheet-mask-guide",
    title: "How to Use a Vitamin C Sheet Mask | UNI&CORE",
    description:
      "How to use a vitamin C sheet mask: when, how long, which side faces out, what to do after, and how often to mask for a brighter-looking glow.",
    h1: "How to Use a Vitamin C Sheet Mask",
    intro:
      "A sheet mask is the quickest Korean-skincare way to give skin a concentrated dose of essence. Here is how to get the most from a vitamin C mask.",
    keywords: ["how to use a vitamin C sheet mask", "vitamin C face mask", "Korean sheet mask how to use", "how long to leave a sheet mask on"],
    sections: [
      {
        heading: "When to use a sheet mask",
        paragraphs: [
          "Use it after cleansing, when skin is clean and ready to absorb the essence — before a big day, after travel, or as a weekly ritual. Morning or evening both work.",
        ],
      },
      {
        heading: "Step by step",
        paragraphs: [
          "1. Cleanse your skin thoroughly. 2. Unfold the sheet and place it on your face, lining up the eyes and mouth. With the UNI&CORE mask, the darker side faces out. 3. Leave it on for 10–20 minutes — not longer, as a drying sheet can pull moisture back out. 4. Remove it and gently pat the remaining essence into your skin. 5. Finish with a mist, then your vitamin C serum and cream.",
        ],
      },
      {
        heading: "An example: UNI&CORE Vita C Super Brightening Mask",
        product: "mask",
        paragraphs: [
          "Each sheet carries an essence with 2% pure vitamin C, glutathione and Inula britannica flower extract, with a calming complex of ash tree and lotus seed extracts, beta-glucan and panthenol. The premium high-adherence sheet is made from 100% TENCEL™ with water-save technology: its front keeps the essence from evaporating, its back pushes the essence toward the skin. Five sheets per box, 0.56 oz (16 g) each.",
        ],
      },
    ],
    faqs: [
      { q: "How long should I leave a vitamin C sheet mask on?", a: "10–20 minutes. Remove it before it starts to dry." },
      { q: "Do I rinse after a sheet mask?", a: "No. Pat the remaining essence into your skin, then continue with the rest of your routine." },
      { q: "How often can I use a vitamin C sheet mask?", a: "Whenever your skin needs a boost — many people mask once or twice a week, or before an event." },
      { q: "Where can I buy the UNI&CORE vitamin C sheet mask?", a: "On Amazon.com through the official UNI&CORE listing. Use the Shop on Amazon button in this guide." },
    ],
    products: ["mask"],
    published: "2026-11-05",
    updated: "2026-11-05",
  },
];

export const ROUTINE_GUIDE = {
  slug: "korean-vitamin-c-skincare-routine",
  h1: "Korean Vitamin C Skincare Routine: Cleanse, Mask, Brighten",
  description: "A three-step Korean vitamin C routine: enzyme cleanse, vitamin C sheet mask, then a 13.5% vitamin C serum ampoule.",
};
