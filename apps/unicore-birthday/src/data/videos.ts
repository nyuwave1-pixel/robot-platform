export interface VideoSource {
  src: string;
  type: "video/mp4" | "video/webm";
  width: number;
  height: number;
}

export interface VideoAsset {
  key: string;
  sources: VideoSource[];
  poster: string;
  aspect: "16/9" | "9/16";
  durationSec: number;
  origin: "drive-upload" | "generated" | "placeholder";
  driveFileId?: string;
  /** 사운드 게이트가 나타나는 지점(초) */
  gateAt?: number;
  /** 스킵 시 건너뛸 지점(초) */
  skipTo?: number;
}

/** 섹션 스크럽 구간 (시네마틱 필름 v1 기준, 초) */
export const filmSegments = {
  heroLoop: { start: 0.0, end: 3.8 },
  masterpiece: { start: 18.5, end: 26.0 },
  twentyEight: { start: 26.0, end: 28.5 },
  clinicalLid: { start: 32.0, end: 34.0 },
  ingredients: { start: 45.5, end: 49.5 },
  ending: { start: 51.5, end: 57.5 },
  logo: { start: 59.0, end: 62.0 },
} as const;

export const videos: Record<string, VideoAsset> = {
  film: {
    key: "film",
    sources: [
      { src: "/media/film/film_1080.mp4", type: "video/mp4", width: 1920, height: 1080 },
      { src: "/media/film/film_720.mp4", type: "video/mp4", width: 1280, height: 720 },
    ],
    poster: "/media/posters/film_poster.webp",
    aspect: "16/9",
    durationSec: 62,
    origin: "drive-upload",
    driveFileId: "1oMyRx7j4OorJCE4PxYZSoki3tbJB_qUH",
    gateAt: 12,
    skipTo: 59,
  },
  filmScrub: {
    key: "filmScrub",
    sources: [{ src: "/media/film/film_scrub_720.mp4", type: "video/mp4", width: 1280, height: 720 }],
    poster: "/media/stills/06_lid_clean.webp",
    aspect: "16/9",
    durationSec: 62,
    origin: "drive-upload",
  },
  filmPortrait: {
    key: "filmPortrait",
    sources: [
      { src: "/media/film/film_portrait_1080.mp4", type: "video/mp4", width: 1080, height: 1920 },
      { src: "/media/film/film_portrait_720.mp4", type: "video/mp4", width: 720, height: 1280 },
    ],
    poster: "/media/posters/film_portrait_poster.webp",
    aspect: "9/16",
    durationSec: 63,
    origin: "drive-upload",
    driveFileId: "1ASIl1bw3QQfW_nbQivwWwXVF1h7UFYbv",
    gateAt: 8,
    skipTo: 60,
  },
  filmClinical: {
    key: "filmClinical",
    sources: [{ src: "/media/film/film_clinical_720.mp4", type: "video/mp4", width: 1280, height: 720 }],
    poster: "/media/stills/06_lid_4833.webp",
    aspect: "16/9",
    durationSec: 63,
    origin: "drive-upload",
    driveFileId: "1zn5SJGHlPsfLswqNV0Stu1-Uq9C3Wh_-",
  },
};

export const stills = {
  candleDark: "/media/stills/00_candle_dark.webp",
  cakeClean: "/media/stills/01_cake_clean.webp",
  flameGold: "/media/stills/02_flame_gold.webp",
  boxBlackClean: "/media/stills/03_box_black_clean.webp",
  boxOpening: "/media/stills/04_box_opening.webp",
  masterpieceOpen: "/media/stills/04_masterpiece_open.webp",
  creamClean: "/media/stills/05_cream_clean.webp",
  lidClean: "/media/stills/06_lid_clean.webp",
  ginseng: "/media/stills/09_ginseng_particles.webp",
  molecule: "/media/stills/09_molecule.webp",
  jarCandleClean: "/media/stills/10_jar_candle_clean.webp",
  logo: "/media/stills/11_logo.webp",
} as const;

/** 뷰포트에 맞는 소스 순서 — 모바일은 저용량(720p)부터, 브라우저는 첫 번째 재생 가능한 소스를 사용 */
export function sourcesFor(asset: VideoAsset, mobile: boolean): VideoSource[] {
  const sorted = [...asset.sources].sort((a, b) => (mobile ? a.width - b.width : b.width - a.width));
  return sorted;
}
