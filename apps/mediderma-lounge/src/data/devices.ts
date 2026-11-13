/**
 * DERMA HOME 디바이스 · 공식 루틴 데이터
 * 출처: https://dermahome.unincore.com (모드 설명, 루틴 표, 부위별 방향), /guide/ (사용 순서·주의)
 *       https://derma-partners.unincore.com (사양 표기)
 * 게임 내 분 단위 시간은 "공식 가이드 표기"로만 보여 주고, 실제 플레이는 축약 인터랙션이다.
 */
export type ModeId = "rf" | "us" | "ionto";
export type ZoneId = "forehead" | "cheek" | "jaw" | "neck" | "scalp" | "body";
export type AreaId = "face" | "scalp" | "body";

export interface Mode {
  id: ModeId;
  label: string;
  ko: string;
  /** 공식 사양 표기 */
  spec: string;
  /** 공식 설명 요약 */
  how: { ko: string; en: string };
  color: string;
  fx: "ember" | "ripple" | "spark";
}

export const MODES: Record<ModeId, Mode> = {
  rf: {
    id: "rf", label: "RF RADIO FREQUENCY", ko: "RF 고주파", spec: "RF 1,000,000Hz",
    how: { ko: "고주파 에너지로 피부에 은은한 온열감을 전달하는 모드", en: "Delivers gentle warmth through radio-frequency energy" },
    color: "#ff9a5c", fx: "ember",
  },
  us: {
    id: "us", label: "ULTRASONIC", ko: "울트라소닉 초음파", spec: "800kHz~1MHz",
    how: { ko: "초음파 진동과 함께 앰플·젤을 마사지하듯 관리하는 모드", en: "Ultrasonic vibration while massaging in ampoule or gel" },
    color: "#62d2f5", fx: "ripple",
  },
  ionto: {
    id: "ionto", label: "IONTOPHORESIS", ko: "이온토포레시스", spec: "2-WAY",
    how: { ko: "미세 전류로 앰플 관리 단계를 돕는 모드", en: "A mild current that supports the ampoule step" },
    color: "#b08cff", fx: "spark",
  },
};

export const ZONES: Record<ZoneId, { ko: string; en: string; area: AreaId; dir: { ko: string; en: string } }> = {
  forehead: { ko: "이마", en: "Forehead", area: "face", dir: { ko: "미간 → 관자놀이·헤어라인", en: "Between brows → temples / hairline" } },
  cheek: { ko: "볼", en: "Cheek", area: "face", dir: { ko: "입꼬리 → 귓불", en: "Mouth corner → earlobe" } },
  jaw: { ko: "턱선", en: "Jawline", area: "face", dir: { ko: "턱 → 귀", en: "Chin → ear" } },
  neck: { ko: "목", en: "Neck", area: "face", dir: { ko: "귀 뒤 → 쇄골", en: "Behind ear → collarbone" } },
  scalp: { ko: "두피", en: "Scalp", area: "scalp", dir: { ko: "헤어라인 → 정수리", en: "Hairline → crown" } },
  body: { ko: "바디", en: "Body", area: "body", dir: { ko: "말단 → 중심 (옆구리 → 배꼽)", en: "Extremities → center" } },
};

export interface RoutineStep {
  mode: ModeId;
  /** 공식 가이드 표기 시간(분) */
  minutes: number;
  /** 공식 루틴에 명시된 제품 (복수면 택1) */
  products: string[];
}

export interface Routine {
  id: string;
  ko: string;
  en: string;
  group: { ko: string; en: string };
  area: AreaId;
  zones: ZoneId[];
  steps: RoutineStep[];
  /** 공식 팁 */
  tip?: { ko: string; en: string };
  /** 게임 해금 조건 */
  unlock: { stage?: number; lounge?: number };
  /** 페이스 루틴은 미스트 마무리(공식 가이드) */
  mistFinish: boolean;
}

const FACE: ZoneId[] = ["forehead", "cheek", "jaw", "neck"];

export const ROUTINES: Routine[] = [
  {
    id: "brightening", ko: "브라이트닝 루틴", en: "Brightening Routine", group: { ko: "페이스 · 나이트 30분", en: "Face · Night 30 min" }, area: "face", zones: FACE,
    steps: [
      { mode: "ionto", minutes: 10, products: ["vitac-mask"] },
      { mode: "us", minutes: 10, products: ["vitac-ampoule"] },
      { mode: "rf", minutes: 10, products: ["deep-repair-cream"] },
    ],
    unlock: {}, mistFinish: true,
  },
  {
    id: "wrinkle", ko: "링클 루틴", en: "Wrinkle Routine", group: { ko: "페이스 · 나이트 30분", en: "Face · Night 30 min" }, area: "face", zones: FACE,
    steps: [
      { mode: "ionto", minutes: 5, products: ["toner-pad"] },
      { mode: "rf", minutes: 15, products: ["deep-repair-cream"] },
      { mode: "us", minutes: 10, products: ["vitac-ampoule"] },
    ],
    tip: { ko: "목은 쇄골에서 턱선 방향으로 — 가이드에 표시된 방향을 따릅니다.", en: "For the neck, follow the guide: collarbone toward jawline." },
    unlock: { stage: 2 }, mistFinish: true,
  },
  {
    id: "calming", ko: "카밍 루틴", en: "Calming Routine", group: { ko: "페이스 · 나이트 30분", en: "Face · Night 30 min" }, area: "face", zones: FACE,
    steps: [
      { mode: "us", minutes: 15, products: ["soothing-gel"] },
      { mode: "ionto", minutes: 10, products: ["toner-pad"] },
      { mode: "rf", minutes: 5, products: ["deep-repair-cream"] },
    ],
    tip: { ko: "왕복하지 말고 한 방향으로, 압력은 최소로.", en: "One direction only, with minimal pressure." },
    unlock: {}, mistFinish: true,
  },
  {
    id: "depuff", ko: "붓기 완화 루틴", en: "Puffiness Relief", group: { ko: "페이스 · 외출 전 5분", en: "Face · Pre-outing 5 min" }, area: "face", zones: ["cheek", "jaw"],
    steps: [
      { mode: "us", minutes: 3, products: ["soothing-gel"] },
      { mode: "ionto", minutes: 2, products: ["toner-pad"] },
    ],
    unlock: {}, mistFinish: true,
  },
  {
    id: "makeup-ready", ko: "화장 잘 받는 루틴", en: "Makeup-friendly", group: { ko: "페이스 · 외출 전 5분", en: "Face · Pre-outing 5 min" }, area: "face", zones: ["forehead", "cheek"],
    steps: [
      { mode: "ionto", minutes: 2, products: ["vitac-mask"] },
      { mode: "us", minutes: 3, products: ["vitac-ampoule"] },
    ],
    unlock: {}, mistFinish: true,
  },
  {
    id: "scalp-care", ko: "두피 & 헤어 케어", en: "Scalp & Hair Care", group: { ko: "두피 · 30분", en: "Scalp · 30 min" }, area: "scalp", zones: ["scalp"],
    steps: [
      { mode: "rf", minutes: 10, products: ["body-cream", "deep-repair-cream"] },
      { mode: "us", minutes: 10, products: ["soothing-gel"] },
      { mode: "ionto", minutes: 10, products: ["scalp-serum"] },
    ],
    tip: { ko: "헤어라인에서 정수리로, 가르마를 따라, 정수리는 원을 그리듯.", en: "Hairline to crown, along the part, circles at the crown." },
    unlock: { lounge: 2 }, mistFinish: false,
  },
  {
    id: "body-circulation", ko: "바디 순환 케어", en: "Body Circulation Care", group: { ko: "바디 · 30분", en: "Body · 30 min" }, area: "body", zones: ["body"],
    steps: [
      { mode: "rf", minutes: 10, products: ["body-cream", "deep-repair-cream"] },
      { mode: "us", minutes: 10, products: ["soothing-gel"] },
      { mode: "ionto", minutes: 10, products: ["soothing-gel"] },
    ],
    tip: { ko: "젤은 평소보다 도톰하게 바른 뒤 사용합니다.", en: "Apply gel thicker than usual before using the device." },
    unlock: { lounge: 3 }, mistFinish: false,
  },
];

export const ROUTINE_MAP: Record<string, Routine> = Object.fromEntries(ROUTINES.map((r) => [r.id, r]));

/** 공식 가이드의 공통 안내 (게임 내 고지에 사용) */
export const GUIDE_NOTES = {
  ko: [
    "권장 강도와 시간은 제품 설명서를 따릅니다.",
    "민감한 피부는 낮은 강도부터 시작합니다.",
    "젤·앰플을 넉넉히 바른 뒤 사용합니다.",
    "게임 속 케어는 축약된 체험 연출이며 실제 사용 시간·효과와 다릅니다.",
  ],
  en: [
    "Follow the product manual for intensity and time.",
    "Sensitive skin should start at a low intensity.",
    "Apply gel or ampoule generously before use.",
    "In-game care is a shortened fantasy experience, not real usage time or results.",
  ],
};
