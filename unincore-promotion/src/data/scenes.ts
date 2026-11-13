import type { ProductKey } from "@/content/types";

/**
 * Per-product cinematic direction. Each product has its own "hero material"
 * so the three sections never look like one template:
 *   wash    → powder meets water and turns into foam
 *   mask    → essence drops flowing over a sheet texture
 *   ampoule → oversized 13.5 typography and molten gold drops
 *
 * Copy here is campaign copy only. Every factual line shown next to it
 * (size, how-to, ingredients) is read from the product content / US label.
 */
export interface ProductScene {
  key: ProductKey;
  step: string;
  verb: string;
  kicker: string;
  headline: string;
  sub: string;
  discover: string;
  buy: string;
  /** Short label for tight spots (mobile purchase bar). */
  buyShort: string;
  /** Section theme: light sections sit on ivory, dark ones on obsidian. */
  tone: "light" | "dark";
}

export const SCENES: Record<ProductKey, ProductScene> = {
  wash: {
    key: "wash",
    step: "Step 01",
    verb: "Cleanse",
    kicker: "Vita C Enzyme Powder Wash",
    headline: "Powder. Water. Glow.",
    sub: "A fine enzyme powder that wakes up with a splash of water and turns into a soft, creamy foam.",
    discover: "Discover Powder Wash",
    buy: "Buy Vita C Enzyme Powder Wash",
    buyShort: "Buy Powder Wash",
    tone: "light",
  },
  mask: {
    key: "mask",
    step: "Step 02",
    verb: "Mask",
    kicker: "Vita C Super Brightening Mask",
    headline: "Pause. Mask. Glow.",
    sub: "An essence-soaked sheet that settles over the face for a focused vitamin C moment.",
    discover: "Discover Brightening Mask",
    buy: "Buy Vita C Super Brightening Mask",
    buyShort: "Buy the Mask",
    tone: "light",
  },
  ampoule: {
    key: "ampoule",
    step: "Step 03",
    verb: "Brighten",
    kicker: "Vita C 13.5 Super Brightening Ampoule",
    headline: "Discover your radiance.",
    sub: "The finishing step of the ritual — 13.5% pure vitamin C, stabilized in a dual-layer formula, in a pump bottle.",
    discover: "Discover Vita C 13.5",
    buy: "Buy Vita C 13.5 Super Brightening Ampoule",
    buyShort: "Buy Vita C 13.5",
    tone: "dark",
  },
  // Not part of the three-step ritual on the home page; used for its share image.
  mist: {
    key: "mist",
    step: "Anytime",
    verb: "Hydrate",
    kicker: "Hydrating Skin Barrier Serum Mist",
    headline: "Hydration in a mist.",
    sub: "Copper tripeptide-1 and CICA in nano liposomes, in an ultra-fine spray.",
    discover: "Discover Serum Mist",
    buy: "Buy Hydrating Skin Barrier Serum Mist",
    buyShort: "Buy Serum Mist",
    tone: "light",
  },
};

/** The three Vita C steps on the home page. The serum mist is sold on TikTok Shop and is not part of it. */
export type RitualKey = Exclude<ProductKey, "mist">;
export const RITUAL_ORDER: RitualKey[] = ["wash", "mask", "ampoule"];
