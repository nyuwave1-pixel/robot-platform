/**
 * 상세페이지(261102 수정본) 비주얼 크롭 — scripts/fetch-assets.mjs 가 빌드 시 public/media/detail/ 에 배치합니다.
 * 텍스트가 포함되지 않은 영역만 잘라 사용하며, 로고/패키지 인쇄는 원본 그대로입니다.
 */
const base = "/media/detail";
export const detail = {
  candle: `${base}/d01_candle_1st.webp`,
  cake: `${base}/d02_cake.webp`,
  jarStone: `${base}/d03_jar_stone.webp`,
  modelJar: `${base}/d04_model_jar_face.webp`,
  masterpieceBox: `${base}/d05_masterpiece_box.webp`,
  ingGinseng: `${base}/d06_ing_ginseng.webp`,
  ingGoldDrop: `${base}/d07_ing_gold_drop.webp`,
  ingPeptide: `${base}/d08_ing_peptide.webp`,
  ingCica: `${base}/d09_ing_cica_urea.webp`,
  goldBubbles: `${base}/d10_gold_bubbles.webp`,
  pdrnSalmon: `${base}/d11_pdrn_salmon.webp`,
  pdrnPlant: `${base}/d12_pdrn_plant.webp`,
  pdrnGinseng: `${base}/d13_pdrn_ginseng.webp`,
  goldSphere: `${base}/d15_gold_sphere.webp`,
  moleculeA: `${base}/d16_molecule_a.webp`,
  moleculeB: `${base}/d17_molecule_b.webp`,
  jarOpenCream: `${base}/d18_jar_open_cream.webp`,
  skincareGuide: `${base}/d19_skincare_guide.webp`,
  skinCheek: `${base}/d20_skin_cheek.webp`,
  nobelBand: `${base}/d22_nobel_band.webp`,
} as const;

/** 피부 질감 배경 루프 (임상 세로 영상에서 텍스트 없는 구간만 추출, 무음) */
export const skinLoop = { src: "/media/product/skin_28_720.mp4", poster: "/media/product/skin_28_poster.webp" } as const;

/** HOW TO USE 배경 — 골든 파티클 분자 영상(사용자 제공, 무음 루프) */
export const howtoLoop = { src: "/media/product/howto_particles_720.mp4", poster: "/media/product/howto_particles_poster.webp" } as const;

/** 제품 리빌 배경 — 실크가 용기에서 흘러내리는 영상(사용자 제공, 무음 루프), 실패 시 스톤 위 용기 사진 */
export const productLoop = { src: "/media/product/silk_jar_720.mp4", poster: "/media/product/silk_jar_poster.webp" } as const;

/** 임상 안전성(이상반응 0건) 배경 — 스포트라이트 용기 영상(사용자 제공, 무음 루프) */
export const safetyLoop = { src: "/media/product/spotlight_jar_720.mp4", poster: "/media/product/spotlight_jar_poster.webp" } as const;

/** 성분·패키지 클립 (사용자 제공, 무음 720p) */
export const clips = {
  pdrnGinseng: { src: "/media/product/ing_v1_720.mp4", poster: "/media/product/ing_v1_poster.webp" },
  cicaLeaves: { src: "/media/product/ing_v2_720.mp4", poster: "/media/product/ing_v2_poster.webp" },
  goldenRing: { src: "/media/product/ing_v3_720.mp4", poster: "/media/product/ing_v3_poster.webp" },
  boxOpenGreen: { src: "/media/product/ing_v4_720.mp4", poster: "/media/product/ing_v4_poster.webp" },
  particlesBox: { src: "/media/product/ing_v5_720.mp4", poster: "/media/product/ing_v5_poster.webp" },
} as const;
