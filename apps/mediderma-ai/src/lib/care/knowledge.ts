/**
 * 더마홈(DERMA HOME) 케어 지식베이스.
 *
 * 출처 (2026-11 확인):
 *  [S1] https://dermahome.unincore.com/ — TECHNOLOGY · CARE GUIDE(페이스 루틴 1-1~2-2) · CARE PATTERN
 *  [S2] https://derma-partners.unincore.com/guide.html — 사용 5단계 · FAQ · 사용하면 안 되는 경우
 *  [S3] 더마홈 가이드북 PDF (derma-partners.unincore.com/download/dermahome-guidebook.pdf) 5·7쪽
 *  [S4] https://www.unincore.com/ 공식몰 상품 상세 (productSeq)
 *  [S5] https://www.youtube.com/watch?v=iRa1JqPJznk — 공식 채널 사용 가이드 영상 (구성만 확인, 음성 미분석)
 *
 * 규칙: 여기에는 공식 자료에 있는 기능·시간·순서·제품만 담는다. 공식 자료에 없는 효능·수치·기능을 추가하지 않는다.
 * 문구는 i18n 리소스(kb.*)에 있으며, 한국어 문구는 공식 표현을 따른다.
 */
import type { CareGoal } from "../analysis/types";

export type Technology = "rf" | "ultrasonic" | "iontophoresis";

export const TECHNOLOGIES: { id: Technology; source: string }[] = [
  { id: "rf", source: "S1" },
  { id: "ultrasonic", source: "S1" },
  { id: "iontophoresis", source: "S1" },
];

export type ProductId = "ampoule" | "mask" | "cream" | "mist" | "tonerPad" | "boostingGel" | "device";

const SHOP = "https://www.unincore.com/shopping/search/view.do?productSeq=";
/** 공식몰에서 상품명·URL 을 확인한 상품만 등록한다 (가격은 변동되므로 저장하지 않는다). */
export const PRODUCTS: Record<ProductId, { officialNameKo: string; url: string }> = {
  ampoule: { officialNameKo: "비타씨 13.5 수퍼 화이트닝 앰플 30g", url: SHOP + "50" },
  mask: { officialNameKo: "비타씨 수퍼 브라이트닝 마스크 5매", url: SHOP + "40" },
  cream: { officialNameKo: "딥 리페어 액티베이팅 뉴트리션 크림 30ml", url: SHOP + "27" },
  mist: { officialNameKo: "하이드레이팅 스킨 베리어 세럼 미스트 50ml", url: SHOP + "37" },
  tonerPad: { officialNameKo: "데일리 카밍 토너 패드 180ml (70매)", url: SHOP + "43" },
  boostingGel: { officialNameKo: "수딩 앤 모이스트 케어 부스팅 젤 250ml", url: SHOP + "61" },
  device: { officialNameKo: "더마-HOME (가격문의)", url: SHOP + "492" },
};

export const LINKS = {
  freeTrial: "https://dermahome.unincore.com/experience/",
  dermahome: "https://dermahome.unincore.com/",
  guide: "https://derma-partners.unincore.com/guide.html",
  guidebookPdf: "https://derma-partners.unincore.com/download/dermahome-guidebook.pdf",
  partners: "https://derma-partners.unincore.com/",
  shop: "https://www.unincore.com/",
};

export type RoutineId = "night_brightening" | "night_wrinkle" | "night_soothing" | "day_depuff" | "day_makeup";

export interface RoutineStep {
  technology: Technology;
  minutes: number;
  product: ProductId;
  /** kb.routines.<id>.steps[i] 문구 인덱스와 대응 */
}

export interface Routine {
  id: RoutineId;
  time: "night" | "day";
  totalMinutes: number;
  steps: RoutineStep[];
  /** 부위별 방향 안내 줄 수 (kb.routines.<id>.directions) — 각 줄이 다루는 얼굴 부위 */
  directionAreas: ("jaw" | "cheek" | "nose" | "forehead" | "eye" | "neck")[];
  source: string;
}

/** 공식 CARE GUIDE 페이스 루틴 [S1]. 모든 루틴은 "미스트는 마무리에 필수". */
export const ROUTINES: Record<RoutineId, Routine> = {
  night_brightening: {
    id: "night_brightening",
    time: "night",
    totalMinutes: 30,
    steps: [
      { technology: "iontophoresis", minutes: 10, product: "mask" },
      { technology: "ultrasonic", minutes: 10, product: "ampoule" },
      { technology: "rf", minutes: 10, product: "cream" },
    ],
    directionAreas: ["jaw", "cheek", "nose", "forehead", "neck"],
    source: "dermahome.unincore.com · CARE GUIDE 1-1",
  },
  night_wrinkle: {
    id: "night_wrinkle",
    time: "night",
    totalMinutes: 30,
    steps: [
      { technology: "iontophoresis", minutes: 5, product: "tonerPad" },
      { technology: "rf", minutes: 15, product: "cream" },
      { technology: "ultrasonic", minutes: 10, product: "ampoule" },
    ],
    directionAreas: ["jaw", "cheek", "eye", "forehead", "neck"],
    source: "dermahome.unincore.com · CARE GUIDE 1-2",
  },
  night_soothing: {
    id: "night_soothing",
    time: "night",
    totalMinutes: 30,
    steps: [
      { technology: "ultrasonic", minutes: 15, product: "boostingGel" },
      { technology: "iontophoresis", minutes: 10, product: "tonerPad" },
      { technology: "rf", minutes: 5, product: "cream" },
    ],
    directionAreas: ["jaw", "cheek", "forehead", "neck"],
    source: "dermahome.unincore.com · CARE GUIDE 1-3",
  },
  day_depuff: {
    id: "day_depuff",
    time: "day",
    totalMinutes: 5,
    steps: [
      { technology: "ultrasonic", minutes: 3, product: "boostingGel" },
      { technology: "iontophoresis", minutes: 2, product: "tonerPad" },
    ],
    directionAreas: ["eye", "cheek", "jaw", "neck"],
    source: "dermahome.unincore.com · CARE GUIDE 2-1",
  },
  day_makeup: {
    id: "day_makeup",
    time: "day",
    totalMinutes: 5,
    steps: [
      { technology: "iontophoresis", minutes: 2, product: "mask" },
      { technology: "ultrasonic", minutes: 3, product: "ampoule" },
    ],
    directionAreas: ["cheek", "forehead", "jaw", "eye"],
    source: "dermahome.unincore.com · CARE GUIDE 2-2",
  },
};

/**
 * 공식 사용법 영상 [S5] — 유니앤코어 공식 YouTube 채널 "DERMA HOME - 사용 가이드" (2026-08-14 게시, 약 35분).
 * 구간 시작 시각은 영상의 공개 미리보기 화면(약 9초 간격)으로 구성만 확인한 대략값이다.
 * 자막이 없고 음성은 분석하지 못했으므로, 영상의 설명 내용을 인용하거나 효능을 옮겨 적지 않는다.
 * (확인한 구성: 목·어깨 관리 → 얼굴: 마스크 위 이온토포레시스 → 앰플 후 울트라소닉 → 크림 후 RF → 관리 전·후 모습)
 */
export const GUIDE_VIDEO = {
  id: "iRa1JqPJznk",
  url: "https://www.youtube.com/watch?v=iRa1JqPJznk",
  chapters: [
    { key: "neckShoulder", start: 30 },
    { key: "faceIonto", start: 820 },
    { key: "faceUltrasonic", start: 1324 },
    { key: "faceRf", start: 1631 },
    { key: "beforeAfter", start: 1939 },
  ],
} as const;
export type VideoChapter = (typeof GUIDE_VIDEO.chapters)[number]["key"];
/** 기능 → 영상 구간 */
export const TECH_CHAPTER: Record<Technology, VideoChapter> = { iontophoresis: "faceIonto", ultrasonic: "faceUltrasonic", rf: "faceRf" };

/**
 * 기능별 '변화 추적 지표' — 공식 관리 포인트(탄력·피부결·톤 등)와 가장 가까운, 이 앱이 사진에서 관찰하는 카테고리 지수.
 * 효능 주장이 아니라 "사용 전후에 무엇을 비교해 볼지"에 대한 안내다.
 */
export const TECH_TRACK: Record<Technology, ("wrinkleVisibility" | "textureUniformity" | "toneUniformity" | "pigmentVisibility" | "jawlineTexture")[]> = {
  rf: ["wrinkleVisibility", "jawlineTexture", "textureUniformity"],
  ultrasonic: ["textureUniformity", "toneUniformity"],
  iontophoresis: ["toneUniformity", "pigmentVisibility", "textureUniformity"],
};

/** 관리 목표 → 우선 고려 루틴 */
export const GOAL_ROUTINE: Record<CareGoal, RoutineId> = {
  brightening: "night_brightening",
  wrinkle_firming: "night_wrinkle",
  contour: "night_wrinkle",
  soothing: "night_soothing",
  moisture: "night_soothing",
  pore_texture: "night_brightening",
};

/** 공통 주의사항 키 (kb.cautions.*) — [S2][S3] */
export const COMMON_CAUTIONS = ["applyProductFirst", "frequency", "lowerIntensity", "notMedical"] as const;
/** 사용하면 안 되는 경우 (kb.contra.*) — [S2] 가이드 페이지 · [S3] 가이드북 7쪽 */
export const CONTRAINDICATIONS = ["disease", "pregnancy", "implant", "skinCondition", "minors"] as const;
