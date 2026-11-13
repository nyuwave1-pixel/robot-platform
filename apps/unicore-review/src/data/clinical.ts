/**
 * 임상 데이터 — 상세페이지 261102 수정본 및 시네마틱 필름 번인 주석과 대조 완료.
 * verified:false 인 항목은 렌더링 시 수치가 숨겨집니다.
 */
export interface ClinicalMetric {
  id: string;
  kind: "instrument" | "survey" | "safety";
  label: string;
  value: number;
  unit: "%" | "건";
  before?: number;
  after?: number;
  measureUnit?: string;
  method?: string;
  footnote: string;
  verified: boolean;
}

export const trial = {
  institute: "한국피부과학연구원",
  code: "KIDS-BEL087-USU",
  subjects: "만 27~67세 성인 남녀 21명",
  period: "2025.12.24~2026.01.21",
  usage: "4주간 1일 2회 사용",
  instrument: "ANTERA 3D",
  disclaimer: "완제품 시험 결과이며 개인차가 있을 수 있음.",
} as const;

export const clinical: ClinicalMetric[] = [
  {
    id: "cheek-lifting",
    kind: "instrument",
    label: "볼 리프팅(볼륨) 개선율",
    value: 48.33,
    unit: "%",
    before: 3.03,
    after: 1.56,
    measureUnit: "㎣",
    method: "ANTERA 3D로 측정한 볼 부위 함몰 부피(Depressions medium) 개선율",
    footnote:
      "한국피부과학연구원 인체적용시험(KIDS-BEL087-USU) 만 27~67세 성인 남녀 21명, 2025.12.24~2026.01.21. 4주간 1일 2회 사용 후 ANTERA 3D로 측정한 볼 부위 함몰 부피(Depressions medium) 개선율(사용 전 3.03㎣ → 4주 후 1.56㎣, p<.001). 완제품 시험 결과이며 개인차가 있을 수 있음.",
    verified: true,
  },
  {
    id: "neck-wrinkle",
    kind: "instrument",
    label: "목 주름 감소율",
    value: 19.06,
    unit: "%",
    before: 55.74,
    after: 45.12,
    measureUnit: "",
    method: "ANTERA 3D로 측정한 목 부위 주름 지수(Wrinkles large) 변화",
    footnote:
      "한국피부과학연구원 인체적용시험(KIDS-BEL087-USU), 만 27~67세 성인 남녀 21명, 2025.12.24~2026.01.21. 4주간 1일 2회 목을 포함한 얼굴에 사용 후 ANTERA 3D로 측정한 목 부위 주름 지수(Wrinkles large) 변화(사용 전 55.74 → 4주 후 45.12, 개선율 19.06%, p<.001). 21명 전원 측정값 감소. 완제품 시험 결과이며 특정 성분의 단독 효과가 아님. 개인차가 있을 수 있음.",
    verified: true,
  },
  {
    id: "adverse-events",
    kind: "safety",
    label: "4주동안 피부 이상반응",
    value: 0,
    unit: "건",
    footnote:
      "한국피부과학연구원 인체적용시험(KIDS-BEL087-USU), 만 27~67세 성인 남녀 21명, 2025.12.24~2026.01.21, 4주간 1일 2회 얼굴·목 사용 후 사용 전 대비 결과. 완제품 시험 결과이며 특정 성분의 단독 효과가 아님. 개인차가 있을 수 있음.",
    verified: true,
  },
];

/** 피부 고민 설문 — 상세페이지에 '시안 작성용 예시 데이터'로 명시되어 수치 노출 금지 */
export const concernSurvey = {
  verified: false,
  message: "피부 처짐과 눈가주름, 목주름 고민",
};
