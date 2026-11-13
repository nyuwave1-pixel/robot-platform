/**
 * 더마홈(DERMA HOME) 케어 지식베이스.
 *
 * 출처 (2026-11 확인):
 *  [S1] https://dermahome.unincore.com/ — TECHNOLOGY · CARE GUIDE(페이스 루틴 1-1~2-2) · CARE PATTERN
 *  [S2] https://derma-partners.unincore.com/guide.html — 사용 5단계 · FAQ · 사용하면 안 되는 경우
 *  [S3] 더마홈 가이드북 PDF (derma-partners.unincore.com/download/dermahome-guidebook.pdf) 5·7쪽
 *  [S4] https://www.unincore.com/ 공식몰 상품 상세 (productSeq)
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
