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
      { q: "Is an enzyme powder cleanser OK for sensitive skin?", a: "It depends on the formula and your skin. If your skin is reactive, patch test first and start with a few washes a week before moving to daily use. The UNI&CORE Vita C Enzyme Powder Wash uses low-irritation enzymes at a mildly acidic pH of 5–5.5." },
      { q: "Can I double cleanse with an enzyme powder cleanser?", a: "Yes. Use an oil or balm cleanser first to remove makeup and sunscreen, then the enzyme powder as the second, water-based cleanse. On makeup-free mornings the powder cleanser alone is enough." },
      { q: "Is an enzyme powder cleanser good for oily skin?", a: "It can be a gentle daily option. The UNI&CORE Vita C Enzyme Powder Wash lists oily, normal, combination and dry skin on the box, and its lipase enzyme helps break down excess sebum. It is a cleanser, not an acne product; for persistent breakouts, see a dermatologist." },
      { q: "Where can I buy the UNI&CORE enzyme powder wash?", a: "On Amazon.com through the official UNI&CORE listing. Use the Shop on Amazon button in this guide." },
    ],
    products: ["wash"],
    published: "2026-11-05",
    updated: "2026-11-14",
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
      { q: "Where does a glutathione product go in my routine?", a: "Like other serums: on clean skin after cleansing and toner, before moisturizer. In the morning, finish with a broad-spectrum sunscreen." },
      { q: "Where can I buy UNI&CORE vitamin C with glutathione?", a: "On Amazon.com through the official UNI&CORE listings. Use the Shop on Amazon buttons in this guide." },
    ],
    products: ["ampoule", "mask"],
    published: "2026-11-05",
    updated: "2026-11-12",
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
      { q: "Should I use a serum before or after a sheet mask?", a: "Either order is used. A simple approach is to mask after cleansing and toner, pat in the remaining essence, then apply your serum or ampoule and finish with moisturizer. In the morning, end with sunscreen." },
      { q: "Can I sleep in a sheet mask?", a: "No. A regular sheet mask is a short treatment: take it off after 10–20 minutes, before it dries, and pat in the remaining essence. Only products made as overnight or sleeping masks are meant to stay on all night." },
      { q: "Where can I buy the UNI&CORE vitamin C sheet mask?", a: "On Amazon.com through the official UNI&CORE listing. Use the Shop on Amazon button in this guide." },
    ],
    products: ["mask"],
    published: "2026-11-05",
    updated: "2026-11-13",
  },
  {
    slug: "how-to-use-vitamin-c-serum",
    title: "How to Use Vitamin C Serum: Morning or Night? | UNI&CORE",
    description:
      "How to use a vitamin C serum: morning or night, where it goes in your routine, how to layer it with other products, and tips for sensitive skin.",
    h1: "How to Use Vitamin C Serum",
    intro:
      "Vitamin C is one of the most popular skincare ingredients — and one of the most asked-about. Here is when to apply it, in what order, and how to fit it in with the rest of your routine.",
    keywords: ["how to use vitamin C serum", "vitamin C serum morning or night", "vitamin C serum routine order", "how to layer vitamin C serum", "vitamin C serum for beginners"],
    sections: [
      {
        heading: "Morning or night?",
        paragraphs: [
          "Both work. Many people prefer the morning, because vitamin C is an antioxidant that pairs well with sunscreen in your daytime routine. If you use it in the morning, always finish with a broad-spectrum sunscreen. You can also use it at night, or morning and night, as your product's directions allow.",
        ],
      },
      {
        heading: "Where it goes in your routine",
        paragraphs: [
          "Apply vitamin C on clean skin, after cleansing and toner (or a sheet mask), and before moisturizer. The general rule is thinnest to thickest: cleanser → toner or essence → vitamin C serum → other serums → moisturizer → sunscreen in the morning.",
          "Use a small amount and spread it evenly over the face, avoiding the eye area. Let it absorb for a moment before the next step.",
        ],
      },
      {
        heading: "Layering with other products",
        paragraphs: [
          "Vitamin C layers well with hydrating ingredients such as hyaluronic acid and panthenol. If you also use stronger actives, such as retinol or exfoliating acids, many people keep vitamin C for the morning and use the other active at night, so each has its own slot. Introduce one new product at a time and patch test.",
        ],
      },
      {
        heading: "An example: the UNI&CORE Vita C 13.5 ampoule",
        product: "ampoule",
        paragraphs: [
          "The UNI&CORE Vita C 13.5 Super Brightening Ampoule is a Korean vitamin C serum with 13.5% pure vitamin C (ascorbic acid), stabilized in a dual-layer formula, with glutathione, hyaluronic acid and panthenol. The brand recommends 2 pumps after cleansing, spread evenly over the face, a little extra on areas of concern, then cream and mist.",
          "Sensitive skin? UNI&CORE suggests prepping with a toner before the ampoule for the first two weeks, then trying it directly after cleansing. The ampoule is naturally yellow, so let it absorb before bed to avoid transfer to pillowcases.",
        ],
      },
    ],
    faqs: [
      { q: "Should I apply vitamin C serum before or after moisturizer?", a: "Before. Apply vitamin C on clean skin after toner, then moisturizer on top, and sunscreen last in the morning." },
      { q: "Can I use vitamin C serum every day?", a: "Most people can use it daily. If you're new to vitamin C or have sensitive skin, start once a day and build up." },
      { q: "Can I use vitamin C serum with retinol?", a: "Many people use vitamin C in the morning and retinol at night, so each product has its own step. Patch test new combinations." },
      { q: "How much vitamin C serum should I use?", a: "Follow your product's directions. For the UNI&CORE Vita C 13.5 ampoule, the brand recommends 2 pumps for the whole face." },
      { q: "How should I store vitamin C serum?", a: "Close it after every use and keep it in a cool, dry place away from heat and direct sunlight. Use it within the period printed on the package. Color alone can mislead: the UNI&CORE Vita C 13.5 ampoule is naturally yellow from turmeric root extract and beta-carotene." },
      { q: "Can I use vitamin C serum with niacinamide?", a: "Yes, many routines use both. Apply the thinner product first and let it absorb before the next. If your skin is sensitive, you can also use them at different times of day." },
      { q: "Where can I buy the UNI&CORE vitamin C serum?", a: "On Amazon.com through the official UNI&CORE listing. Use the Shop on Amazon button in this guide." },
    ],
    products: ["ampoule"],
    published: "2026-11-10",
    updated: "2026-11-14",
  },
  {
    slug: "vitamin-c-for-sensitive-skin",
    title: "Vitamin C for Sensitive Skin: How to Start | UNI&CORE",
    description:
      "New to vitamin C or easily irritated? How to patch test, how often to start, what to pair it with, and a gentle cleanse-to-serum routine.",
    h1: "Vitamin C for Sensitive Skin: How to Start",
    intro:
      "Vitamin C can fit into a sensitive-skin routine, but how you introduce it matters. Start slowly, change one thing at a time, and let your skin set the pace.",
    keywords: ["vitamin C for sensitive skin", "vitamin C serum sensitive skin", "how to start vitamin C serum", "patch test vitamin C serum", "gentle vitamin C routine"],
    sections: [
      {
        heading: "Patch test before the first full use",
        paragraphs: [
          "Apply a small amount to a discreet area, such as the inner forearm or behind the ear, and wait a day. If the area stays comfortable, move on to your face. Skip any new product on skin that is already irritated or broken.",
        ],
      },
      {
        heading: "Start slowly and build up",
        paragraphs: [
          "Begin with a few applications a week rather than every day, and add days as your skin stays comfortable. A brief tingle can happen with pure vitamin C (ascorbic acid); lasting redness, stinging or itching is a sign to stop and rinse.",
          "Introduce one new product at a time. If you start vitamin C the same week as a new exfoliant or retinol, you won't know which one your skin is reacting to.",
        ],
      },
      {
        heading: "Keep the rest of the routine gentle",
        paragraphs: [
          "Use a mild cleanser, a simple moisturizer and, in the morning, a broad-spectrum sunscreen. Many people keep vitamin C for the morning and stronger actives such as retinol or exfoliating acids for the evening, so each has its own slot.",
          "A buffer step can help: applying a hydrating toner first puts a light layer between your skin and the serum while you get used to it.",
        ],
      },
      {
        heading: "A gentle first step: a low-pH enzyme cleanser",
        product: "wash",
        paragraphs: [
          "The UNI&CORE Vita C Enzyme Powder Wash uses low-irritation enzymes at a mildly acidic pH of 5–5.5, close to the skin's own barrier, and comes in single-use 1 g pouches. If your skin is reactive, patch test first.",
        ],
      },
      {
        heading: "How UNI&CORE suggests starting the Vita C 13.5 ampoule",
        product: "ampoule",
        paragraphs: [
          "The UNI&CORE Vita C 13.5 Super Brightening Ampoule contains 13.5% pure vitamin C (ascorbic acid) with glutathione, hyaluronic acid, panthenol and a calming complex. For sensitive skin, the brand suggests prepping with a toner before the ampoule for the first two weeks, then trying it directly after cleansing.",
          "Use 2 pumps for the whole face, avoid the eye area, and follow with your cream. Patch test first and stop if irritation occurs.",
        ],
      },
    ],
    faqs: [
      { q: "Can sensitive skin use vitamin C?", a: "Often yes, with a slow start. Patch test, begin with a few uses a week, and stop if you notice lasting redness, stinging or itching. If you have a skin condition, ask a dermatologist first." },
      { q: "How do I patch test a vitamin C serum?", a: "Apply a small amount to the inner forearm or behind the ear and wait a day. If the area stays comfortable, try it on your face." },
      { q: "How often should I use vitamin C when starting out?", a: "Start with a few times a week and build toward daily use as your skin stays comfortable. Follow your product's directions." },
      { q: "Should I use a toner before vitamin C?", a: "It can help while your skin adjusts. For the Vita C 13.5 ampoule, UNI&CORE suggests a toner first for the first two weeks if your skin is sensitive." },
      { q: "Where can I buy the UNI&CORE vitamin C ampoule?", a: "On Amazon.com through the official UNI&CORE listing. Use the Shop on Amazon button in this guide." },
    ],
    products: ["wash", "ampoule"],
    published: "2026-11-11",
    updated: "2026-11-11",
  },
  {
    slug: "skincare-routine-for-dull-skin",
    title: "Skincare Routine for Dull Skin: Vitamin C Steps | UNI&CORE",
    description:
      "Why skin looks dull and a simple routine to bring back the glow: gentle exfoliating cleanse, hydration, a vitamin C serum and daily sunscreen.",
    h1: "A Skincare Routine for Dull, Tired-Looking Skin",
    intro:
      "Dull skin usually comes down to a few everyday things: buildup on the surface, low hydration and sun exposure. A short, consistent routine addresses all three without overdoing it.",
    keywords: ["skincare routine for dull skin", "how to brighten dull skin", "dull skin vitamin C", "exfoliating cleanser for dull skin", "glowing skin routine"],
    sections: [
      {
        heading: "Why skin looks dull",
        paragraphs: [
          "When dead skin cells build up, the surface reflects light less evenly and looks flat. Dehydration makes it worse, and so does daily sun exposure without protection. Late nights and stress don't help either, but your routine can take care of the surface, the moisture and the protection.",
        ],
      },
      {
        heading: "Step 1: Cleanse with gentle exfoliation",
        product: "wash",
        paragraphs: [
          "Gentle, regular exfoliation clears the buildup that makes skin look flat. Moderation matters: over-exfoliating can leave skin dry and tight, which looks dull too.",
          "The UNI&CORE Vita C Enzyme Powder Wash uses papain, bromelain and lipase enzymes with vitamin C at a mildly acidic pH of 5–5.5, so it cleanses and gently exfoliates in one step. Each wash is a single 1 g pouch.",
        ],
      },
      {
        heading: "Step 2: Add hydration",
        product: "mask",
        paragraphs: [
          "Well-hydrated skin looks smoother and reflects light better. A sheet mask is an easy way to give skin a concentrated dose of moisture a few times a week.",
          "The UNI&CORE Vita C Super Brightening Mask carries an essence with 2% pure vitamin C and glutathione on a 100% TENCEL™ sheet. Leave it on for 10–20 minutes, then pat the remaining essence in.",
        ],
      },
      {
        heading: "Step 3: A vitamin C serum, then sunscreen",
        product: "ampoule",
        paragraphs: [
          "Vitamin C is a go-to ingredient for brighter-looking skin. Apply it on clean skin before moisturizer, and in the morning finish with a broad-spectrum sunscreen.",
          "The UNI&CORE Vita C 13.5 Super Brightening Ampoule contains 13.5% pure vitamin C (ascorbic acid) with glutathione. In a 7-day human application test with 21 adults (SKINMED Co., Ltd. Clinical Trial Centre), skin glow improved by 35.6%. Individual results may vary.",
        ],
      },
      {
        heading: "Give it time",
        paragraphs: [
          "Change one thing at a time and stay consistent. Tone and glow tend to build over several weeks, and if your skin feels irritated, scale back before adding anything new.",
        ],
      },
    ],
    faqs: [
      { q: "What causes dull skin?", a: "Common causes include a buildup of dead skin cells, dehydration and sun exposure. Lack of sleep and stress can also make skin look tired." },
      { q: "How often should I exfoliate dull skin?", a: "Gently and in moderation. A mild enzyme cleanser made for everyday use can be enough; stronger exfoliants are usually used a few times a week. Scale back if skin feels tight or irritated." },
      { q: "Does vitamin C help dull skin?", a: "Vitamin C is widely used for brighter-looking skin. Apply it after cleansing and before moisturizer, and use sunscreen in the morning." },
      { q: "Where can I buy UNI&CORE vitamin C skincare?", a: "On Amazon.com through the official UNI&CORE listings. Use the Shop on Amazon buttons in this guide." },
    ],
    products: ["wash", "mask", "ampoule"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
];

export const ROUTINE_GUIDE = {
  slug: "korean-vitamin-c-skincare-routine",
  h1: "Korean Vitamin C Skincare Routine: Cleanse, Mask, Brighten",
  description: "A three-step Korean vitamin C routine: enzyme cleanse, vitamin C sheet mask, then a 13.5% vitamin C serum ampoule.",
};
