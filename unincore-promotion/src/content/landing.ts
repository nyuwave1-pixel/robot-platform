import type { ProductKey } from "./types";

/**
 * Copy and layout data for the three Amazon landing pages, taken from the JYT
 * landing plans (one plan per product). Section order on the page follows the
 * plan; keep it that way unless JYT sends a new plan.
 *
 * Photos and videos under /public/landing/amz come from the brand's own US Amazon
 * listings (listing images, A+ content, seller videos). Nothing Korean-market and
 * nothing with TikTok branding. Anything still missing renders as a labeled slot.
 */

export type GalleryItem =
  | { id: string; label: string; kind: "beforeAfter"; tag: string; beforeLabel: string; afterLabel: string; before?: string; after?: string; alt: string }
  | { id: string; label: string; kind: "image"; src: string; alt: string }
  | { id: string; label: string; kind: "slot"; caption: string }
  | { id: string; label: string; kind: "ingredients"; items: { name: string; note: string; src?: string; icon?: IconKey }[] };

export type IconKey = "atom" | "circles" | "drop" | "scales" | "leaf" | "plant";

export interface Stat {
  value: string;
  label: string;
}

/**
 * A written Amazon.com review, copied word for word from the listing (5-star reviews only,
 * about three sentences, never reworded or made up; "..." marks skipped sentences).
 * Read from the listings on 2026-11-10 while signed in.
 */
export interface Review {
  name: string;
  /** As Amazon prints it, e.g. "November 3, 2026". */
  date: string;
  stars: number;
  title?: string;
  text: string;
  /** Amazon's own label on the review, shown as is so free-product (Vine) reviews are disclosed. */
  badge: "Verified Purchase" | "Amazon Vine Customer Review of Free Product";
}

export interface LandingContent {
  key: ProductKey;
  /** "r g b" triplets for --acc, --acc-ink, --acc-tint, --acc-deep (+ --acc-bright: accent text on the deep color). */
  theme: { acc: string; ink: string; tint: string; deep: string; glow: string; bright?: string };
  ctaLabel: string;
  /** Name short enough for the mobile sticky bar. */
  shortTitle: string;
  /** Product photo for the story column and the routine card. A transparent cutout sits on the product's own light. */
  /** White-background Amazon main image: story-column product card, routine card, end card, sticky bar. */
  shot: { src: string };
  /** Key-benefit image from the Amazon listing, shown above the product name (JYT revision 1, item 1). */
  hero: { src: string; alt: string };
  banner: string[];
  gallery: GalleryItem[];
  lead: { eyebrow: string; big: string; text: string };
  title: string;
  result: { title: string; highlight: string; sub: string; stats: Stat[]; /** Photo shown with the result figures. */ image: string; imageAlt: string };
  /** One card per concern, each with a skin close-up cropped from the brand's own Amazon images. */
  concerns: { title: string; text: string; image: string; alt: string }[];
  /** Vertical creator videos from the brand's US Amazon listings. */
  ugc: { caption: string; video: string; poster: string; duration: string }[];
  /** Line under the UGC heading. */
  ugcNote: string;
  clinical?: {
    title: string;
    /** The one word or phrase set in the accent color. */
    accent: string;
    rows: { label: string; value: string; share: number; detail?: string }[];
    facts: { big: string; small: string }[];
    note: string;
  };
  /**
   * Real Amazon reviews, plus product photos the 5-star reviewers uploaded with them.
   * With no reviews filled in, the section shows labeled slots.
   */
  reviews: { eyebrow: string; title: string; items: Review[]; photos: { src: string; name: string }[] };
  /** Step photos for How to use, one per step. */
  stepImages: string[];
  difference: {
    eyebrow: string;
    title: string;
    accent: string;
    typical: { label: string; text: string; level: number };
    ours: { label: string; text: string; level: number };
    note: string;
  };
  ingredients: { tag: string; name: string; text: string; image?: string; icon?: IconKey }[];
  howTo: { title: string; accent: string; steps: string[] };
  disclaimer: string;
}

/**
 * Brand colors measured from the packaging (vitamin yellow #FDDF36, studio light #F4E391,
 * greige #DFDDD0) and matched to current trend colors: butter yellow, Pantone 2026
 * Cloud Dancer (#F0EEE9) for the base, and the silver of the ampoule bottle for metal.
 * All three products share it, as the Vita C packaging does.
 */
const BRAND_THEME = { acc: "253 223 54", ink: "84 68 8", tint: "250 240 200", deep: "58 47 5", glow: "244 227 145" };

export const SAVINGS = {
  tag: "Amazon exclusive offer",
  title: "Special savings on Amazon",
  accent: "savings",
  text: "Current Amazon promotion details will be shown here.",
  note: "Offer details may change depending on the current Amazon promotion.",
};

export const ROUTINE = {
  eyebrow: "7-Day Glow Routine",
  title: "Start your 7-day glow today",
  accent: "7-day glow",
  items: [
    { key: "wash" as const, name: "Enzyme Powder Cleanser" },
    { key: "mask" as const, name: "Vitamin C Sheet Mask" },
    { key: "ampoule" as const, name: "13.5 Ampoule Serum" },
  ],
};

export const TRADEMARK = "UNI&CORE. Shop on Amazon. Amazon and the Amazon logo are trademarks of Amazon.com, Inc. or its affiliates.";

export const LANDING: Record<ProductKey, LandingContent> = {
  ampoule: {
    key: "ampoule",
    theme: BRAND_THEME,
    ctaLabel: "Shop Now on",
    shortTitle: "Vita C 13.5 Ampoule",
    shot: { src: "/landing/amz/ampoule-product.webp" },
    hero: {
      src: "/landing/amz/ampoule-hero.webp",
      alt: "13.5% Pure Vitamin C. Vita C 13.5 Super Brightening Ampoule with glutathione in a stabilized dual-layer formula. 100K+ ampoules sold in Korea. Results in 7 days.",
    },
    banner: ["Korea's best-selling vitamin C ampoule", "100,000+ bottles sold in Korea", "Now on Amazon US", "13.5% pure vitamin C + glutathione", "+35.6% skin radiance in 7 days*"],
    gallery: [
      { id: "ba", label: "Before & After", kind: "beforeAfter", tag: "Day 0 → Day 7", beforeLabel: "Day 0", afterLabel: "Day 7", before: "/landing/amz/ampoule-before.webp", after: "/landing/amz/ampoule-after.webp", alt: "Skin before use and after 7 days of the Vita C 13.5 Ampoule" },
      { id: "product", label: "Product", kind: "image", src: "/landing/amz/ampoule-product.webp", alt: "UNI&CORE Vita C 13.5 Ampoule Serum with its yellow texture, orange and kakadu plum" },
      // Amazon listing images #2-#9, in the listing order (#1 is the Product tile above).
      // Texture tile removed 2026-11-10: the photo showed an orange serum, the real texture is milky.
      { id: "amz-2", label: "13.5% vitamin C", kind: "image", src: "/landing/amz/listing/ampoule-2.webp", alt: "13.5% pure vitamin C ampoule with glutathione in a stabilized dual-layer formula. 100K+ ampoules sold in Korea, results in 7 days" },
      { id: "amz-3", label: "7-day results", kind: "image", src: "/landing/amz/listing/ampoule-3.webp", alt: "Results you can measure in 7 days: skin radiance +35.6%, skin elasticity +14.3%, before and after 7 days" },
      { id: "amz-4", label: "Why 13.5%", kind: "image", src: "/landing/amz/listing/ampoule-4.webp", alt: "Why 13.5% pure vitamin C: ascorbic acid, 135,000 ppm, kakadu plum, high strength kept fresh" },
      { id: "amz-5", label: "With glutathione", kind: "image", src: "/landing/amz/listing/ampoule-5.webp", alt: "Vitamin C plus glutathione: 13.5% pure vitamin C, fully supported" },
      { id: "amz-6", label: "Double layer", kind: "image", src: "/landing/amz/listing/ampoule-6.webp", alt: "Double-layer vitamin C protection that shields pure vitamin C from air, heat and light" },
      { id: "amz-7", label: "How to use", kind: "image", src: "/landing/amz/listing/ampoule-7.webp", alt: "How to use the ampoule in three steps, with notes on the yellow tint and patch testing" },
      { id: "amz-8", label: "On skin", kind: "image", src: "/landing/amz/listing/ampoule-8.webp", alt: "Model holding the Vita C 13.5 ampoule with a swipe of serum on her cheek" },
      { id: "amz-9", label: "Ingredient list", kind: "image", src: "/landing/amz/listing/ampoule-9.webp", alt: "Full ingredient list of the Vita C 13.5 Super Brightening Ampoule, made in Korea" },
    ],
    lead: { eyebrow: "Korea's best-selling vitamin C ampoule", big: "100,000+", text: "bottles sold in Korea, now on Amazon US" },
    title: "UNI&CORE Vita C 13.5 Ampoule Serum",
    result: {
      title: "Visible results in",
      highlight: "just 7 days",
      sub: "After 7 days of use, human application test, 21 adults",
      image: "/landing/amz/ampoule-texture.webp",
      imageAlt: "Model with the ampoule and a drop of yellow serum on her cheek",
      stats: [
        { value: "+35.6%", label: "Skin radiance" },
        { value: "+14.3%", label: "Skin elasticity" },
        { value: "7.2%", label: "Look of pigmentation improved" },
      ],
    },
    concerns: [
      { title: "Dullness", text: "Tired, flat-looking skin", image: "/landing/amz/concern/dull.webp", alt: "Close-up of dull-looking skin around the nose" },
      { title: "Uneven tone", text: "Patchy, uneven-looking color", image: "/landing/amz/concern/uneven.webp", alt: "Close-up of a cheek with patchy, uneven-looking color" },
      // Freckled cheek: freestocks.org on Flickr, CC0 (flickr.com/photos/135396164@N05/29047364532).
      { title: "Dark spots", text: "The look of spots and sun marks", image: "/landing/amz/concern/dark-spots-2.webp", alt: "Close-up of a cheek with scattered brown spots" },
      { title: "Post-blemish marks", text: "Marks left after breakouts", image: "/landing/amz/concern/marks.webp", alt: "Close-up of a cheek with small red marks" },
    ],
    ugcNote: "The rest of the Vita C routine, filmed by creators",
    ugc: [
      { caption: "Step 1: How to use the Vita C Enzyme Powder Wash", video: "/landing/amz/video/wash-2.mp4", poster: "/landing/amz/video/wash-2.webp", duration: "0:29" },
      { caption: "Step 2: My 20-minute vitamin C sheet mask experience", video: "/landing/amz/video/mask-2.mp4", poster: "/landing/amz/video/mask-2.webp", duration: "0:44" },
      { caption: "Easy travel skincare with single-use powder wash", video: "/landing/amz/video/wash-1.mp4", poster: "/landing/amz/video/wash-1.webp", duration: "0:28" },
      { caption: "Vitamin C sheet mask for your weekly routine", video: "/landing/amz/video/mask-5.mp4", poster: "/landing/amz/video/mask-5.webp", duration: "0:35" },
    ],
    clinical: {
      title: "Visibly brighter, firmer-looking skin in just 7 days",
      accent: "just 7 days",
      rows: [
        { label: "Skin radiance", value: "+35.6%", share: 35.6 / 40 },
        { label: "Skin elasticity", value: "+14.3%", share: 14.3 / 40, detail: "47.768 → 54.032 (measured value)" },
        { label: "Look of pigmentation", value: "7.2%", share: 7.2 / 40, detail: "128.698 → 118.698 improvement (measured value)" },
      ],
      facts: [
        { big: "21", small: "adults, 20-60" },
        { big: "7 days", small: "of daily use" },
        { big: "SkinMed", small: "Clinical Research Center" },
      ],
      note: "Human application test results vs. baseline. Individual results may vary.",
    },
    // No 5-star ampoule review has a photo yet, so this page shows the reviews without a photo row.
    reviews: {
      eyebrow: "5-star reviews from Amazon.com",
      title: "What customers are saying",
      photos: [],
      items: [
        {
          name: "Christine",
          date: "November 6, 2026",
          stars: 5,
          title: "serum",
          text: "I’ve been using it so for a month now and it hoestly smells like REAL vitamin c! my skin getting brighter also my boyfriend has been using it on his dark spots too and it actually worked",
          badge: "Verified Purchase",
        },
        {
          name: "Happy CA",
          date: "October 9, 2026",
          stars: 5,
          title: "Lightweight vitamin C serum",
          text: "The serum feels lightweight and spreads easily across my face. It has a slightly oily feel at first, but it absorbs without leaving my skin feeling overly greasy or sticky. I also like that it doesn't feel heavy when I layer moisturizer and sunscreen over it.",
          badge: "Amazon Vine Customer Review of Free Product",
        },
        {
          name: "Mike",
          date: "October 2, 2026",
          stars: 5,
          title: "A Glowing Review?",
          text: "Sometimes you need a game plan for your skin care regimen. The Uni & Core Pure Vita C Serum should be Step #1 in that plan. ... It feels silky smooth going on and absorbs well.",
          badge: "Amazon Vine Customer Review of Free Product",
        },
      ],
    },
    stepImages: ["/landing/amz/ampoule-step1.webp", "/landing/amz/ampoule-step2.webp", "/landing/amz/ampoule-step3.webp"],
    difference: {
      eyebrow: "What makes it different: why most vitamin C fades",
      title: "Pure vitamin C is powerful and fragile",
      accent: "fragile",
      typical: { label: "Typical serum", text: "Exposed to air every time you open it. Potency drops as it oxidizes.", level: 0.35 },
      ours: { label: "UNI&CORE 13.5", text: "Water-based formula stabilized in a fine micro-particle structure, sealed in an airless pump.", level: 0.92 },
      note: "Illustration of the stabilization concept, not measured data.",
    },
    ingredients: [
      { tag: "13.5%, 135,000 ppm", name: "Pure Vitamin C", text: "Ascorbic acid, the most researched form, for brighter-looking skin.", image: "/landing/amz/ing-vitc.webp" },
      { tag: "Brightening duo", name: "Glutathione", text: "Works alongside vitamin C to even out the look of skin tone.", image: "/landing/amz/ing-glut-glass-s3.webp" },
      { tag: "Stabilized", name: "Micro-particle formula", text: "Water, oil and vitamin C held together to keep the formula fresh.", icon: "circles" },
      { tag: "Airless pump", name: "Fresh to the last drop", text: "Sealed packaging limits air contact after every use.", icon: "drop" },
    ],
    howTo: {
      title: "Two pumps, morning and night",
      accent: "Two pumps",
      steps: [
        "After cleansing and toner, dispense 1-2 pumps.",
        "Pat gently over face and neck until absorbed.",
        "Twist the cap closed. Follow with moisturizer and SPF in the morning.",
      ],
    },
    disclaimer:
      "*Human application test: 21 adults aged 20-60, 7 days of use, SkinMed Clinical Research Center. Results compared with baseline; individual results may vary. This product is a cosmetic and is not intended to diagnose, treat, cure or prevent any disease.",
  },

  mask: {
    key: "mask",
    theme: BRAND_THEME,
    ctaLabel: "Shop Now on",
    shortTitle: "Brightening Mask",
    shot: { src: "/landing/amz/mask-product.webp" },
    hero: {
      src: "/landing/amz/mask-hero.webp",
      alt: "2% Pure Vitamin C. A high-strength treatment mask, not just a hydrating sheet. 10M+ mask boxes sold in Korea.",
    },
    banner: ["Korea's best-selling vitamin C sheet mask", "10M+ sold in Korea", "Now on Amazon US", "2% pure vitamin C on a 100% Tencel sheet"],
    gallery: [
      { id: "ba", label: "Before & After", kind: "beforeAfter", tag: "Before → 7 days", beforeLabel: "Before", afterLabel: "After 7 days", before: "/landing/amz/mask-before.webp", after: "/landing/amz/mask-after.webp", alt: "Skin before and after 7 days of the Vita C Brightening Mask" },
      { id: "product", label: "Product", kind: "image", src: "/landing/amz/mask-product.webp", alt: "UNI&CORE Vita C Super Brightening Mask box, pouches and the black Tencel sheet" },
      { id: "sheet", label: "Sheet", kind: "image", src: "/landing/amz/mask-sheet.webp", alt: "The essence-soaked black Tencel sheet" },
      // Amazon listing images #2-#9, in the listing order (#1 is the Product tile above).
      { id: "amz-2", label: "2% vitamin C", kind: "image", src: "/landing/amz/listing/mask-2.webp", alt: "2% pure vitamin C: a high-strength treatment mask, not just a hydrating sheet. 10M+ mask boxes sold in Korea" },
      { id: "amz-3", label: "7-day results", kind: "image", src: "/landing/amz/listing/mask-3.webp", alt: "Visibly brighter in 7 days: before and after, evens the appearance of uneven skin tone" },
      { id: "amz-4", label: "Tencel sheet", kind: "image", src: "/landing/amz/listing/mask-4.webp", alt: "100% Tencel sheet that fits like a second skin and molds into the curve of the face" },
      { id: "amz-5", label: "Key ingredients", kind: "image", src: "/landing/amz/listing/mask-5.webp", alt: "Vitality and brightening: vitamin C, glutathione, panthenol, beta-glucan and sodium hyaluronate" },
      { id: "amz-6", label: "Essence-soaked", kind: "image", src: "/landing/amz/listing/mask-6.webp", alt: "Essence-soaked, not just damp: a concentrated essence layer sits close to skin for the full treatment time" },
      { id: "amz-7", label: "How to use", kind: "image", src: "/landing/amz/listing/mask-7.webp", alt: "How to use: discard the white cover, apply the black sheet, leave on 10 to 20 minutes, pat in the rest" },
      { id: "amz-8", label: "On skin", kind: "image", src: "/landing/amz/listing/mask-8.webp", alt: "Model wearing the black sheet mask, which holds essence close to skin" },
      { id: "amz-9", label: "Ingredient list", kind: "image", src: "/landing/amz/listing/mask-9.webp", alt: "Full ingredient list of the Vita C Super Brightening Mask, made in Korea" },
    ],
    lead: { eyebrow: "Korea's best-selling vitamin C sheet mask", big: "10M+", text: "sold in Korea, now on Amazon US" },
    title: "UNI&CORE Vita C Super Brightening Mask, 5 Sheets",
    result: {
      title: "Visible glow in",
      highlight: "just 7 days",
      sub: "After 7 days, 3 sheets",
      image: "/landing/amz/mask-model.webp",
      imageAlt: "Model wearing the black Tencel sheet mask",
      stats: [
        { value: "Brighter", label: "looking skin" },
        { value: "Hydrated", label: "feeling skin" },
        { value: "Even", label: "looking tone" },
      ],
    },
    concerns: [
      { title: "Dullness", text: "Skin that looks tired after a long week", image: "/landing/amz/concern/dull.webp", alt: "Close-up of dull-looking skin around the nose" },
      { title: "Dehydration", text: "Tight, dry-feeling skin", image: "/landing/amz/concern/rough.webp", alt: "Close-up of dry, flaky-looking skin" },
      { title: "Uneven tone", text: "Patchy, uneven-looking color", image: "/landing/amz/concern/uneven.webp", alt: "Close-up of a cheek with patchy, uneven-looking color" },
      { title: "Rough texture", text: "Skin that feels less smooth", image: "/landing/amz/concern/texture.webp", alt: "Close-up of a cheek with visible pores and uneven texture" },
    ],
    ugcNote: "Real people, real routines",
    ugc: [
      { caption: "My 20-minute vitamin C sheet mask experience", video: "/landing/amz/video/mask-2.mp4", poster: "/landing/amz/video/mask-2.webp", duration: "0:44" },
      { caption: "Pure vitamin C sheet mask: formula, fit and feel", video: "/landing/amz/video/mask-1.mp4", poster: "/landing/amz/video/mask-1.webp", duration: "0:56" },
      { caption: "First impressions of the vitamin C sheet mask", video: "/landing/amz/video/mask-3.mp4", poster: "/landing/amz/video/mask-3.webp", duration: "0:29" },
      { caption: "A vitamin C sheet mask for your weekly routine", video: "/landing/amz/video/mask-5.mp4", poster: "/landing/amz/video/mask-5.webp", duration: "0:35" },
    ],
    // Clinical results stay hidden until a mask test report is supplied (plan note).
    reviews: {
      eyebrow: "5-star reviews from Amazon.com",
      title: "What customers are saying",
      photos: [
        { src: "/landing/amz/review/mask-1.webp", name: "Amazon Customer" },
        { src: "/landing/amz/review/mask-2.webp", name: "Amazon Customer" },
      ],
      items: [
        {
          name: "Amazon Customer",
          date: "October 15, 2026",
          stars: 5,
          title: "Worked well for my skin, no irritation.",
          text: "After removing the mask, I patted the remaining serum into my skin. I was happy that I had no redness, burning, itching, or irritation at all. ... My skin felt hydrated afterward, and after using these I could actually see a brighter look to my complexion.",
          badge: "Amazon Vine Customer Review of Free Product",
        },
        {
          name: "Circle",
          date: "November 1, 2026",
          stars: 5,
          title: "Good quality mask!",
          text: "They unfolded perfectly, opened up perfectly, and laid on the face perfectly. They are comfortable to wear too. They did not slip, even for a second.",
          badge: "Amazon Vine Customer Review of Free Product",
        },
        {
          name: "Astrid",
          date: "October 9, 2026",
          stars: 5,
          title: "Good For All Skin Types",
          text: "A rather nice facial mask that is fairly easy to use and helps to brighten my mature combination skin. ... I really like the tencel fit as it has cuts along the chin line that help this mask to form around the lower parts of your face and stay intact better than most other facial masks.",
          badge: "Amazon Vine Customer Review of Free Product",
        },
      ],
    },
    stepImages: ["/landing/amz/mask-sheet.webp", "/landing/amz/mask-inuse.webp", "/landing/amz/mask-model.webp"],
    difference: {
      eyebrow: "What makes it different: why the sheet matters",
      title: "A strong essence needs a sheet that stays on",
      accent: "stays on",
      typical: { label: "Standard sheet", text: "Stiff, lifts at the edges and dries out before the 20 minutes are up.", level: 0.35 },
      ours: { label: "100% Tencel", text: "Soft and thin, it stays in place so the 2% vitamin C essence can do its job.", level: 0.92 },
      note: "Illustration of fit, not measured data.",
    },
    ingredients: [
      { tag: "2% pure", name: "Vitamin C", text: "For a brighter, more even-looking complexion.", image: "/landing/amz/ing-plum.webp" },
      { tag: "Brightening", name: "Glutathione", text: "Pairs with vitamin C for a clearer-looking tone.", image: "/landing/amz/ing-glut-glass-s3.webp" },
      // Water drops from the brand's own detail page (USB archive, 13.5 Ampoule Product Description.png).
      { tag: "Hydrating", name: "Sodium Hyaluronate", text: "Draws in moisture for plump, soft-feeling skin.", image: "/landing/amz/ing-hyaluronate.webp" },
      // Mushroom (beta-glucan) photo from the brand's TikTok Shop detail image (USB archive, Facial Mask Product Detail.png).
      { tag: "Soothing", name: "Panthenol + Beta-Glucan", text: "Comforts skin and supports the moisture barrier.", image: "/landing/amz/ing-betaglucan.webp" },
    ],
    howTo: {
      title: "20 minutes, 2-3 times a week",
      accent: "20 minutes",
      steps: [
        "After cleansing and toner, unfold the sheet and place it on your face.",
        "Relax for 15-20 minutes, then remove.",
        "Pat the remaining essence in, then lock it in with ampoule and moisturizer.",
      ],
    },
    disclaimer: "Individual results may vary. This product is a cosmetic and is not intended to diagnose, treat, cure or prevent any disease.",
  },

  wash: {
    key: "wash",
    theme: BRAND_THEME,
    ctaLabel: "Check Best Price on",
    shortTitle: "Enzyme Powder Wash",
    shot: { src: "/landing/amz/wash-product.webp" },
    hero: {
      src: "/landing/amz/wash-hero.webp",
      alt: "Enzyme Powder Cleanser. Cleanses and gently exfoliates in one step. pH 5-5.5, daily use.",
    },
    banner: ["Gentle enough for every day", "pH 5-5.5 enzyme powder cleanser", "30 single-use sachets", "Now on Amazon US"],
    gallery: [
      { id: "foam", label: "Powder → foam", kind: "image", src: "/landing/amz/wash-powder.webp", alt: "A hand holding two sachets with the powder turning to foam in water" },
      { id: "in-use", label: "In use", kind: "image", src: "/landing/amz/wash-step3.webp", alt: "Model massaging the soft foam onto damp skin" },
      // Amazon listing images #1-#9, in the listing order.
      { id: "amz-1", label: "Product", kind: "image", src: "/landing/amz/listing/wash-1.webp", alt: "UNI&CORE Vita C Enzyme Powder Wash box with a single sachet and the powder" },
      { id: "amz-2", label: "Enzyme cleanser", kind: "image", src: "/landing/amz/listing/wash-2.webp", alt: "Enzyme powder cleanser that cleanses and gently exfoliates in one step, pH 5-5.5 for daily use" },
      { id: "amz-3", label: "30 sachets", kind: "image", src: "/landing/amz/listing/wash-3.webp", alt: "30 sachets, one cleanse each: individually sealed and travel-ready" },
      { id: "amz-4", label: "Powder to foam", kind: "image", src: "/landing/amz/listing/wash-4.webp", alt: "Powder to soft foam: fine powder, add water, creamy foam" },
      { id: "amz-5", label: "Enzymes + vitamin C", kind: "image", src: "/landing/amz/listing/wash-5.webp", alt: "Powered by enzymes and vitamin C: papain, bromelain and vitamin C in a pH-balanced formula" },
      { id: "amz-6", label: "Everyday routine", kind: "image", src: "/landing/amz/listing/wash-6.webp", alt: "Made for your everyday glow routine: dull-looking skin, rough-feeling texture, busy on-the-go routines" },
      { id: "amz-7", label: "How to use", kind: "image", src: "/landing/amz/listing/wash-7.webp", alt: "How to use: tear open one sachet, pour into a wet palm, lather with water and massage onto damp skin" },
      { id: "amz-8", label: "Two methods", kind: "image", src: "/landing/amz/listing/wash-8.webp", alt: "Pick your method: a 7:3 powder-to-water mix for gentle cleansing or 3:7 for effective scrubbing" },
      { id: "amz-9", label: "Ingredient list", kind: "image", src: "/landing/amz/listing/wash-9.webp", alt: "Full ingredient list of the Vita C Enzyme Powder Wash, made in Korea" },
    ],
    lead: { eyebrow: "Gentle enough for every day", big: "pH 5-5.5", text: "Mildly acidic, skin-friendly enzyme cleanser you can use every day, morning or night" },
    title: "UNI&CORE Vita C Enzyme Powder Cleanser, 30 Sachets",
    result: {
      title: "Smoother-looking skin",
      highlight: "from the first wash",
      sub: "After one wash",
      image: "/landing/amz/wash-powder.webp",
      imageAlt: "Powder sachets turning into a soft foam",
      stats: [
        { value: "Smoother", label: "feeling texture" },
        { value: "Brighter", label: "looking skin" },
        { value: "Fresh", label: "not stripped" },
      ],
    },
    concerns: [
      { title: "Dull surface", text: "Buildup that makes skin look flat", image: "/landing/amz/concern/dull.webp", alt: "Close-up of dull-looking skin around the nose" },
      { title: "Rough texture", text: "Skin that feels bumpy or uneven", image: "/landing/amz/concern/rough.webp", alt: "Close-up of rough, flaky-looking skin" },
      { title: "Clogged-looking pores", text: "Pores that look congested", image: "/landing/amz/concern/pores.webp", alt: "Close-up of visible pores on the nose" },
      { title: "Excess oil", text: "Shine by midday", image: "/landing/amz/concern/oil.webp", alt: "Close-up of shiny, oily-looking skin" },
    ],
    ugcNote: "Real people, real routines",
    ugc: [
      { caption: "How to use the Vita C Enzyme Powder Wash", video: "/landing/amz/video/wash-2.mp4", poster: "/landing/amz/video/wash-2.webp", duration: "0:29" },
      { caption: "Easy travel skincare with single-use powder wash", video: "/landing/amz/video/wash-1.mp4", poster: "/landing/amz/video/wash-1.webp", duration: "0:28" },
      { caption: "A daily facial powder wash cleanser", video: "/landing/amz/video/wash-3.mp4", poster: "/landing/amz/video/wash-3.webp", duration: "0:43" },
      { caption: "Vitamin C enzyme powder wash, start to finish", video: "/landing/amz/video/wash-4.mp4", poster: "/landing/amz/video/wash-4.webp", duration: "0:24" },
    ],
    reviews: {
      eyebrow: "5-star reviews from Amazon.com",
      title: "What customers are saying",
      photos: [
        { src: "/landing/amz/review/wash-1.webp", name: "JSJ" },
        { src: "/landing/amz/review/wash-2.webp", name: "Cosmo" },
        { src: "/landing/amz/review/wash-3.webp", name: "JSJ" },
      ],
      items: [
        {
          name: "JSJ",
          date: "October 6, 2026",
          stars: 5,
          title: "Gentle & Travel-Friendly Enzyme Cleanser",
          text: "I was looking for an enzyme cleanser and decided to try this one because of its gentle ingredients. I also love that it comes in individual packets, which makes it super convenient to take with me when traveling or going to the gym!",
          badge: "Verified Purchase",
        },
        {
          name: "Cosmo",
          date: "November 1, 2026",
          stars: 5,
          title: "Convenient powder cleanser",
          text: "I pour it into my palm, add a little water, and rub it together to make a nice foam before massaging it onto my face. ... I like how my skin feels after washing with it. My face feels clean but not dry or tight, which is important to me.",
          badge: "Amazon Vine Customer Review of Free Product",
        },
        {
          name: "E. Bernard",
          date: "October 22, 2026",
          stars: 5,
          title: "Great for combination skin!",
          text: "After rinsing off, my skin felt uber clean, tight and the \"trouble zone\" between my brows and also on my forehead was free from flaky, dry skin and totally smooth and soft! As a matter of fact, I cannot recall a time when I have utilized a facial cleanser that has left my skin so supple, without having to follow up with a cream.",
          badge: "Amazon Vine Customer Review of Free Product",
        },
      ],
    },
    stepImages: ["/landing/amz/wash-step1.webp", "/landing/amz/wash-step2.webp", "/landing/amz/wash-step3.webp"],
    difference: {
      eyebrow: "What makes it different: tube vs. sachet",
      title: "A fresh dose every time",
      accent: "every time",
      typical: { label: "Open tube cleanser", text: "Opened every day. Easy to squeeze out too much.", level: 0.4 },
      ours: { label: "Sealed 1 g sachet", text: "Pre-measured, opened once, easy to pack for travel and the gym.", level: 0.92 },
      note: "Illustration of the format difference, not measured data.",
    },
    ingredients: [
      { tag: "Papaya enzyme", name: "Papain", text: "Gently loosens dull surface buildup.", image: "/landing/amz/ing-papaya.webp" },
      { tag: "Pineapple enzyme", name: "Bromelain", text: "Helps smooth rough-feeling texture.", image: "/landing/amz/ing-pineapple.webp" },
      { tag: "Brightening", name: "Vitamin C", text: "For a fresher, brighter-looking complexion.", image: "/landing/amz/ing-vitc.webp" },
      { tag: "pH 5-5.5", name: "Balanced formula", text: "Mildly acidic, mild exfoliating cleanse for daily use.", icon: "scales" },
    ],
    howTo: {
      title: "One sachet, every morning or night",
      accent: "One sachet",
      steps: [
        "Tear open one sachet and pour the powder into wet palms.",
        "Rub with a little water until it turns into a soft foam.",
        "Massage over damp skin for 30 seconds, then rinse.",
      ],
    },
    disclaimer: "Individual results may vary. Avoid contact with eyes. This product is a cosmetic and is not intended to diagnose, treat, cure or prevent any disease.",
  },
};
