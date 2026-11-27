/** Shared types for the UNI&CORE campaign banner engine (runs in the browser editor and in Node export). */

export type Lang = "ko" | "en" | "zh";
export const LANGS: Lang[] = ["ko", "en", "zh"];

export type CampaignId = "skin-rebirth" | "28-days" | "golden-formula" | "clinical-beauty" | "masterpiece";
export const CAMPAIGNS: CampaignId[] = ["skin-rebirth", "28-days", "golden-formula", "clinical-beauty", "masterpiece"];

/** Aspect archetype chosen from the canvas ratio — every campaign defines a composition for each. */
export type Archetype = "ultrawide" | "wide" | "square" | "portrait" | "tall";

export interface Box { x: number; y: number; w: number; h: number }

/** Placement-specific areas that must stay clear of key content (fractions of the trim box). */
export interface SafeSpec {
  /** uniform margin as a fraction of min(w,h); default 0.06 */
  margin?: number;
  top?: number; bottom?: number; left?: number; right?: number; // fractions of h / w
  /** absolute centred safe box (e.g. YouTube channel art 1546x423 within 2560x1440) in canvas units */
  centerBox?: { w: number; h: number };
}

export interface SizeSpec {
  id: string;
  kind: "online" | "print";
  group: string;          // e.g. "web", "search", "social", "video", "kakao", "stand", "poster", "event"
  label: { ko: string; en: string; zh: string };
  w: number; h: number;   // px for online, mm for print (trim size)
  bleed?: number;         // mm, print only
  /** target raster resolution for print (px per inch) — large formats follow print-shop guidance */
  dpi?: number;
  safe?: SafeSpec;
  /** upload limit in KB (online) */
  maxKB?: number;
  format?: "jpg" | "png";
  notes?: string;
  /** print: bottom zone hidden by a roll-up stand etc. (mm) */
  hiddenBottom?: number;
  /** show QR code to the campaign site (print) */
  qr?: boolean;
}

export interface TextStyle {
  family: string;          // font key in the registry, e.g. "pretendard-300"
  accentFamily?: string;   // used for **accent** runs
  size: number;            // canvas units
  minSize?: number;
  lineHeight?: number;     // multiple of size
  tracking?: number;       // em
  fill?: string;           // css color or gradient id url(#..)
  accentFill?: string;
  align?: "left" | "center" | "right";
  upper?: boolean;
  maxLines?: number;
  opacity?: number;
}

/** A user-supplied image (uploaded in the editor). `href` is a URL, blob: or data: URI. */
export interface CustomImage { href: string; w: number; h: number; name?: string }

export interface Overrides {
  copy?: Partial<Record<string, string>>;
  /** dx/dy in units of the canvas short side; scale multiplies the layout's product height */
  product?: { dx?: number; dy?: number; scale?: number; asset?: string; custom?: CustomImage & { base?: number } };
  text?: { scale?: number; dx?: number; dy?: number };
  bg?: {
    tint?: string; brightness?: number; effects?: number; variant?: "wide" | "square" | "tall";
    /** use another campaign's plate */ campaign?: CampaignId;
    /** user plate: anchor = pedestal-top centre (0–1), anchorW = pedestal width share */
    custom?: CustomImage & { anchor?: [number, number]; anchorW?: number };
    /** multiplier for the legibility gradient behind type (0 = none) */ scrim?: number;
    /** solid colour behind / instead of the plate */ color?: string;
  };
  /** replacement logo artwork (SVG/PNG); the official wordmark is used when unset */
  logo?: CustomImage;
  hide?: string[];
}

export interface RenderSpec {
  campaign: CampaignId;
  lang: Lang;
  size: SizeSpec;
  overrides?: Overrides;
  /** draw safe-area guides (editor only) */
  guides?: boolean;
  /** print: render the trim + bleed canvas */
  print?: boolean;
}

export interface Issue { level: "error" | "warn"; code: string; msg: string }

export interface ElementReport { id: string; kind: string; box: Box; fontSize?: number; minSize?: number; lines?: number; overflow?: boolean; text?: string }

export interface RenderReport {
  size: SizeSpec;
  archetype: Archetype;
  canvas: { w: number; h: number; unit: "px" | "mm"; scale: number };
  trim: Box; safe: Box;
  elements: ElementReport[];
  product?: { box: Box; asset: string; aspectOk: boolean; srcW: number; srcH: number; renderScale: number; effDpi?: number };
  background?: { asset: string; scale: number; effDpi?: number };
  issues: Issue[];
  claims: { clinical: boolean; footnote: boolean; storyDisclaimer: boolean };
}

export interface RenderResult { svg: string; report: RenderReport }
