/**
 * Film slots for the VITA C Collection experience.
 *
 * Footage (Nov 2026): concept / texture loops generated with Google Flow (Omni 1.1 Flash)
 * and graded + looped in post. The texture and citrus loops contain NO packaging.
 * `final-collection` is built only from the real product photos in /public/products,
 * so no slot shows a rendered stand-in for the product.
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
  "brand-intro": { id: "brand-intro", title: "Brand intro", src: "/videos/vitac/brand-intro.mp4", webm: "/videos/vitac/brand-intro.webm", mobileSrc: "/videos/vitac/brand-intro-mobile.mp4", poster: "/videos/vitac/brand-intro-poster.webp" },
  "citrus-macro": { id: "citrus-macro", title: "Citrus macro", src: "/videos/vitac/citrus-macro.mp4", webm: "/videos/vitac/citrus-macro.webm", mobileSrc: "/videos/vitac/citrus-macro-mobile.mp4", poster: "/videos/vitac/citrus-macro-poster.webp" },
  "powder-wash": { id: "powder-wash", title: "Powder to foam", src: "/videos/vitac/powder-wash.mp4", webm: "/videos/vitac/powder-wash.webm", mobileSrc: "/videos/vitac/powder-wash-mobile.mp4", poster: "/videos/vitac/powder-wash-poster.webp" },
  "mask-essence": { id: "mask-essence", title: "Mask essence", src: "/videos/vitac/mask-essence.mp4", webm: "/videos/vitac/mask-essence.webm", mobileSrc: "/videos/vitac/mask-essence-mobile.mp4", poster: "/videos/vitac/mask-essence-poster.webp" },
  "ampoule-texture": { id: "ampoule-texture", title: "Ampoule texture", src: "/videos/vitac/ampoule-texture.mp4", webm: "/videos/vitac/ampoule-texture.webm", mobileSrc: "/videos/vitac/ampoule-texture-mobile.mp4", poster: "/videos/vitac/ampoule-texture-poster.webp" },
  "final-collection": { id: "final-collection", title: "The collection", src: "/videos/vitac/final-collection.mp4", webm: "/videos/vitac/final-collection.webm", mobileSrc: "/videos/vitac/final-collection-mobile.mp4", poster: "/videos/vitac/final-collection-poster.webp" },
};

export const hasFilm = (f: FilmSlot) => Boolean(f.src);

/**
 * Brand films with English kinetic typography (promo / ad cuts).
 * Product shots in these films are AI-rendered from the real packshots; every film
 * ends on the real product photo. Facts on screen match the US label copy.
 */
export interface BrandFilm {
  id: "collection" | "wash" | "mask" | "ampoule";
  title: string;
  /** 16:9 desktop cut. */
  src: string;
  poster: string;
  /** 9:16 mobile / social cut. */
  vertical: string;
  verticalPoster: string;
  /** ISO 8601 duration. */
  duration: string;
  /** When set, the film is kept off the site (reason given). */
  onHold?: string;
}

const film = (id: BrandFilm["id"], title: string, duration: string): BrandFilm => ({
  id,
  title,
  src: `/videos/vitac/films/${id}-16x9.mp4`,
  poster: `/videos/vitac/films/${id}-16x9-poster.webp`,
  vertical: `/videos/vitac/films/${id}-9x16.mp4`,
  verticalPoster: `/videos/vitac/films/${id}-9x16-poster.webp`,
  duration,
});

export const BRAND_FILMS = {
  // collection + ampoule were re-cut (scripts/films/build_ampoule_films.py) so no
  // on-screen copy states a vitamin C percentage. Set `onHold` to pull a film again.
  collection: film("collection", "The VITA C ritual", "PT32S"),
  wash: film("wash", "Vita C Enzyme Powder Wash — the film", "PT15S"),
  mask: film("mask", "Vita C Super Brightening Mask — the film", "PT14S"),
  ampoule: film("ampoule", "Vita C 13.5 Super Brightening Ampoule — the film", "PT15S"),
} as const satisfies Record<BrandFilm["id"], BrandFilm>;

/* ------------------------------------------------------------------ */
/* Motion films (home page): intro, scroll-scrubbed and ambient layers  */
/* ------------------------------------------------------------------ */

/** Any film with an MP4 source, optional WebM and a poster. FilmSlot fits this too. */
export interface Film {
  src: string;
  webm?: string;
  mobileSrc?: string;
  poster: string;
}

const motion = (name: string): Film => ({ src: `/films/${name}.mp4`, webm: `/films/${name}.webm`, poster: `/films/${name}.webp` });

/**
 * Web encodes of the supplied Google Flow clips (1280×720, no audio, WebP poster).
 * The two scrub films use a 4-frame keyframe interval so they can be scrubbed
 * backwards smoothly. Clips that show packaging render the label text
 * inaccurately, so they are pre-blurred at encode time (*-ambient) and used only
 * as backgrounds behind the official product photos — never as product shots.
 */
export const MOTION = {
  /** Intro: translucent lemon slice turning in gold bokeh (no packaging). */
  introLemon: motion("intro-lemon"),
  /** Vitamin C story: lemon slice sinking into water (no packaging). */
  storyLemonWater: motion("story-lemon-water"),
  /** Wash interlude: powder pours into water and turns into foam — scroll-scrubbed. */
  washPowderFoam: motion("wash-powder-foam"),
  /** Ampoule interlude: a golden serum drop splashing — scroll-scrubbed. */
  ampouleSerumDrop: motion("ampoule-serum-drop"),
} satisfies Record<string, Film>;

/** Pre-blurred ambient backgrounds made from the packaging clips. */
export const AMBIENT_FILM = {
  wash: motion("wash-ambient"),
  mask: motion("mask-ambient"),
  ampoule: motion("ampoule-ambient"),
} satisfies Record<string, Film>;

/** Texture loop per product (graded seamless loops from the FILMS slots). */
export const TEXTURE_FILM = {
  wash: FILMS["powder-wash"],
  mask: FILMS["mask-essence"],
  ampoule: FILMS["ampoule-texture"],
} as const;
