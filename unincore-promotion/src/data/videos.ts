/**
 * Film slots for the VITA C Collection experience.
 *
 * No footage exists yet. Each slot stays empty (src: "") until real, approved
 * footage is supplied — the site then renders the WebGL scene / poster instead.
 * Never fill a slot with footage that pretends to show the product if it doesn't.
 *
 * Specs: MP4 (H.264) + WebM (VP9); 1080p desktop, 720p mobile; loops 6–12 s,
 * ≤ 1 MB/s; poster is required. Files > 10 MB belong on a video CDN.
 */
export interface FilmSlot {
  id: "brand-intro" | "citrus-macro" | "powder-wash" | "mask-essence" | "ampoule-texture" | "final-collection";
  title: string;
  /** MP4 source (desktop). Empty = not supplied yet. */
  src: string;
  /** Optional WebM source (preferred when supported). */
  webm?: string;
  /** Optional lighter mobile MP4. */
  mobileSrc?: string;
  /** Poster image shown before playback and as the fallback. */
  poster: string;
  /** True when the film has an audio track worth offering. */
  hasAudio?: boolean;
}

export const FILMS: Record<FilmSlot["id"], FilmSlot> = {
  "brand-intro": { id: "brand-intro", title: "Brand intro", src: "", poster: "/products/ampoule-visual.webp" },
  "citrus-macro": { id: "citrus-macro", title: "Citrus macro", src: "", poster: "/products/ampoule-visual.webp" },
  "powder-wash": { id: "powder-wash", title: "Powder to foam", src: "", poster: "/products/wash-visual.webp" },
  "mask-essence": { id: "mask-essence", title: "Mask essence", src: "", poster: "/products/mask-visual.webp" },
  "ampoule-texture": { id: "ampoule-texture", title: "Ampoule texture", src: "", poster: "/products/ampoule-visual.webp" },
  "final-collection": { id: "final-collection", title: "The collection", src: "", poster: "/products/ampoule-visual.webp" },
};

export const hasFilm = (f: FilmSlot) => Boolean(f.src);
