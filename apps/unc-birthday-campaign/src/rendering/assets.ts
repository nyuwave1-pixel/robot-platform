import type { CampaignId } from "./types";

/**
 * Asset catalogue. Backgrounds are AI-generated plates WITHOUT any product (brand-approved look:
 * deep black + champagne gold). The product is always the real photographed jar / gift box cutout
 * (upscaled 4x, verified against the original at 33–37 dB PSNR) so the package print is never redrawn.
 *
 * `anchor` = where the product's base sits in the plate (normalised 0..1), `anchorW` = usable width
 * of the pedestal / pool of light (fraction of the plate width) used to size the product.
 */
export interface BgMeta { file: string; w: number; h: number; anchor: [number, number]; anchorW: number; floor: number }
export type BgVariant = "wide" | "square" | "tall";

export const BACKGROUNDS: Record<CampaignId, Record<BgVariant, BgMeta>> = {
  "skin-rebirth": {
    wide: { file: "backgrounds/c01_wide.jpg", w: 3840, h: 1648, anchor: [0.647, 0.718], anchorW: 0.33, floor: 0.74 },
    square: { file: "backgrounds/c01_square.jpg", w: 2880, h: 2880, anchor: [0.497, 0.778], anchorW: 0.58, floor: 0.8 },
    tall: { file: "backgrounds/c01_tall.jpg", w: 2160, h: 3840, anchor: [0.5, 0.738], anchorW: 0.74, floor: 0.76 },
  },
  "28-days": {
    wide: { file: "backgrounds/c02_wide.jpg", w: 3840, h: 1648, anchor: [0.70, 0.64], anchorW: 0.36, floor: 0.64 },
    square: { file: "backgrounds/c02_square.jpg", w: 2880, h: 2880, anchor: [0.5, 0.74], anchorW: 0.62, floor: 0.74 },
    tall: { file: "backgrounds/c02_tall.jpg", w: 2160, h: 3840, anchor: [0.52, 0.74], anchorW: 0.72, floor: 0.74 },
  },
  "golden-formula": {
    wide: { file: "backgrounds/c03_wide.jpg", w: 3840, h: 1648, anchor: [0.62, 0.84], anchorW: 0.3, floor: 0.84 },
    square: { file: "backgrounds/c03_square.jpg", w: 2880, h: 2880, anchor: [0.5, 0.8], anchorW: 0.55, floor: 0.8 },
    tall: { file: "backgrounds/c03_tall.jpg", w: 2160, h: 3840, anchor: [0.5, 0.82], anchorW: 0.7, floor: 0.82 },
  },
  "clinical-beauty": {
    wide: { file: "backgrounds/c04_wide.jpg", w: 3840, h: 1648, anchor: [0.62, 0.735], anchorW: 0.34, floor: 0.735 },
    square: { file: "backgrounds/c04_square.jpg", w: 2880, h: 2880, anchor: [0.52, 0.80], anchorW: 0.55, floor: 0.8 },
    tall: { file: "backgrounds/c04_tall.jpg", w: 2160, h: 3840, anchor: [0.5, 0.75], anchorW: 0.72, floor: 0.75 },
  },
  masterpiece: {
    wide: { file: "backgrounds/c05_wide.jpg", w: 3840, h: 1648, anchor: [0.62, 0.665], anchorW: 0.5, floor: 0.665 },
    square: { file: "backgrounds/c05_square.jpg", w: 2880, h: 2880, anchor: [0.5, 0.758], anchorW: 0.86, floor: 0.758 },
    tall: { file: "backgrounds/c05_tall.jpg", w: 2160, h: 3840, anchor: [0.49, 0.69], anchorW: 0.9, floor: 0.69 },
  },
};

export interface ProductMeta { file: string; w: number; h: number; label: string; /** base width / image width, for contact shadow */ base: number }
export const PRODUCTS: Record<string, ProductMeta> = {
  jar: { file: "products/jar_front.webp", w: 3884, h: 3666, label: "1ST BIRTHDAY CREAM 50g jar", base: 0.9 },
  boxOpenJar: { file: "products/box_open_jar.webp", w: 3987, h: 2311, label: "Gift box (open) with jar", base: 0.78 },
  boxHalfOpen: { file: "products/box_half_open.webp", w: 3934, h: 2955, label: "Gift box (half open) with jar", base: 0.7 },
  boxClosed: { file: "products/box_closed.webp", w: 3842, h: 3924, label: "Gift box (closed)", base: 0.72 },
};

export const INGREDIENTS = {
  pdrn: "ingredients/pdrn.jpg",
  gf: "ingredients/4gf.jpg",
  lecithin: "ingredients/lecithin.jpg",
  ceramide: "ingredients/ceramide.jpg",
} as const;
export type IngredientKey = keyof typeof INGREDIENTS;

/** Resolves an asset path to something an SVG <image href> can use (URL in the editor, data URI in Node export). */
/** Resolve an asset path to an href. `px` = largest on-output pixel width it will be drawn at (lets the env pick a lighter variant). */
export type AssetResolver = (path: string, px?: number) => string;
