/**
 * MEDIDERMA AI — 분석 결과 표준 스키마 (JSON 직렬화 가능).
 *
 * 원칙
 * - 사진에서 관찰할 수 없거나 신뢰도가 낮은 항목은 숫자를 만들지 않고 null 로 둔다.
 * - "…Visibility" 값은 0~100, 높을수록 "더 많이 보임". "…Uniformity"/texture 는 높을수록 "더 균일".
 * - 모든 값은 RGB 사진 기반 관찰 지수이며 임상 검증된 측정값이 아니다 (validation.status 참고).
 */

export type FaceZoneId =
  | "forehead"
  | "glabella"
  | "left_eye_corner"
  | "right_eye_corner"
  | "left_under_eye"
  | "right_under_eye"
  | "left_cheek"
  | "right_cheek"
  | "nose"
  | "mouth_area"
  | "left_jawline"
  | "right_jawline"
  | "chin";

export type ZoneId = FaceZoneId | "neck";

/** 사진에서 관찰하는 지표 키 */
export type MetricKey =
  | "texture" // 피부결 균일성 (높을수록 균일)
  | "wrinkleVisibility" // 주름·잔주름 가시성 (높을수록 많이 보임)
  | "nasolabialVisibility" // 팔자 부위 주름 가시성
  | "poreVisibility" // 모공 가시성
  | "toneUniformity" // 피부톤 균일성 (높을수록 균일)
  | "pigmentVisibility" // 색소·잡티 가시성
  | "rednessVisibility" // 붉은 기 가시성 (얼굴 내 상대값)
  | "underEyeDarkness" // 눈밑 어두운 영역 (볼 대비)
  | "shine"; // 광택·번들거림 (정반사 영역 비율)

/** 높을수록 좋은 지표인지 (나머지는 높을수록 "많이 보임") */
export const HIGHER_IS_BETTER: Record<MetricKey, boolean> = {
  texture: true,
  toneUniformity: true,
  wrinkleVisibility: false,
  nasolabialVisibility: false,
  poreVisibility: false,
  pigmentVisibility: false,
  rednessVisibility: false,
  underEyeDarkness: false,
  shine: false,
};

export type QualityIssueCode =
  | "no_face"
  | "multiple_faces"
  | "not_frontal_yaw"
  | "not_frontal_pitch"
  | "tilted_roll"
  | "face_cut_off"
  | "too_dark"
  | "too_bright"
  | "uneven_lighting"
  | "backlight"
  | "blurry"
  | "occlusion_lower_face"
  | "occlusion_eyes"
  | "low_resolution"
  | "face_too_small"
  | "expression_not_neutral"
  | "eyes_closed"
  | "not_color";

export interface QualityIssue {
  code: QualityIssueCode;
  /** blocker: 분석 중단 후 재촬영 안내 / warning: 분석은 진행하되 신뢰도 하향 */
  severity: "blocker" | "warning";
  /** 판정에 사용한 실제 측정값 (디버그·리포트용) */
  measured?: number;
}

export interface ImageQuality {
  /** 0~100 종합 촬영 품질 점수. 얼굴 미검출 시 0 */
  score: number;
  faceDetected: boolean;
  faceCount: number;
  frontalScore: number;
  lightingScore: number;
  sharpnessScore: number;
  resolutionScore: number;
  /** 도(°) 단위 추정 자세. 얼굴 미검출 시 null */
  pose: { yaw: number; pitch: number; roll: number } | null;
  /** 원본 이미지에서의 얼굴 폭(px) */
  faceWidthPx: number | null;
  imageSize: { width: number; height: number };
  issues: QualityIssue[];
  /** 전후 비교의 촬영 조건 판정에 쓰는 요약 통계 (이미지 자체는 포함하지 않는다) */
  capture: { skinL: number; skinA: number; skinB: number; sideDeltaL: number; sharpness: number } | null;
  /** blocker 가 하나도 없으면 true */
  passed: boolean;
}

export type ZoneMetrics = { [K in MetricKey]: number | null };

export interface ZoneResult extends ZoneMetrics {
  zone: ZoneId;
  /** 0~100 영역 컨디션 지수 (적용 가능한 지표의 가중 평균). 산출 불가 시 null */
  conditionIndex: number | null;
  /** 0~1 */
  confidence: number | null;
  /** 이 영역에서 값이 null 인 이유 */
  nullReason?: "low_confidence" | "occluded" | "facial_hair" | "not_provided";
}

export interface CategoryScores {
  textureUniformity: number | null;
  wrinkleVisibility: number | null;
  poreVisibility: number | null;
  toneUniformity: number | null;
  pigmentVisibility: number | null;
  rednessVisibility: number | null;
  eyeAreaCondition: number | null;
  cheekTexture: number | null;
  jawlineTexture: number | null;
  overallCondition: number | null;
}

export interface ConcernItem {
  /** 지표 키 */
  metric: MetricKey;
  zone: ZoneId;
  /** 0~100 고민 강도 (높을수록 우선순위 높음) */
  severity: number;
}

export type SurveyLevel = 0 | 1 | 2 | 3; // 없음·가끔·자주·항상

export interface SurveyAnswers {
  dryness: SurveyLevel | null;
  oiliness: SurveyLevel | null;
  sensitivity: SurveyLevel | null;
  tightness: SurveyLevel | null;
  troubleFrequency: SurveyLevel | null;
  /** 관리 목표 (복수 선택) */
  goals: CareGoal[];
  /** 관리 습관 */
  routineLevel: "none" | "basic" | "regular" | "device" | null;
  /** 현재 사용 중인 제품 유형 */
  currentProducts: string[];
  /** 공식 가이드의 '사용하면 안 되는 경우'에 해당한다고 사용자가 스스로 표시 */
  deviceContraindication: boolean;
}

export type CareGoal = "brightening" | "wrinkle_firming" | "soothing" | "moisture" | "contour" | "pore_texture";

export interface CareRecommendation {
  id: string;
  /** 더마홈 기능 */
  technology: "rf" | "ultrasonic" | "iontophoresis" | "general";
  /** 연결된 공식 루틴 id (없으면 null) */
  routineId: string | null;
  zones: ZoneId[];
  /** 추천 근거: 어떤 관찰값·설문 응답 때문에 추천되었는지 */
  reasons: { type: "observation" | "survey" | "goal"; metric?: MetricKey; zone?: ZoneId; value?: number; key?: string }[];
  /** 주의사항 키 (i18n) */
  cautions: string[];
  priority: number;
}

export interface AnalysisResult {
  schemaVersion: "1.0";
  sessionId: string;
  analyzedAt: string;
  /** Mock 여부 — true 이면 UI 가 반드시 MOCK 배너를 표시해야 한다 */
  isMock: boolean;
  provider: { id: string; kind: "on-device" | "remote" | "mock"; imageLeftDevice: boolean };
  modelVersion: string;
  validation: {
    /** 임상 검증 상태. engineering-calibrated = 내부 테스트 이미지로 범위만 보정, 임상·통계 검증 없음 */
    status: "engineering-calibrated" | "validated" | "mock";
    note: string;
  };
  imageQuality: ImageQuality;
  analysis: {
    overallConditionScore: number | null;
    confidence: number | null;
    needsRetake: boolean;
    categories: CategoryScores;
    zones: ZoneResult[];
    topConcerns: ConcernItem[];
    /** 이 모델 버전이 사진으로 관찰하는 항목 */
    measurable: MetricKey[];
    /** 사진만으로는 측정할 수 없어 값을 만들지 않는 항목 */
    notMeasurable: string[];
  };
  survey: SurveyAnswers | null;
  careRecommendations: CareRecommendation[];
  simulation: {
    disclaimer: string;
    periods: ["4weeks", "8weeks", "12weeks"];
  };
}

/** 분석 엔진 내부에서 UI 로 넘기는 비직렬화 시각화 데이터 (세션 메모리에만 존재) */
export interface VisualData {
  /** 정규화 크롭(얼굴 폭 ≈ 640px) RGBA */
  width: number;
  height: number;
  rgba: Uint8ClampedArray;
  /** 정규화 크롭 좌표계의 랜드마크 [x0,y0,z0,x1,…] (z 는 x 와 같은 스케일) */
  landmarks: Float32Array;
  /** 영역 id 맵 (0 = 없음, 1.. = FACE_ZONES 인덱스+1) */
  zoneMap: Uint8Array;
  /** 분석에 사용된 피부 마스크 (1 = 사용) */
  skinMask: Uint8Array;
  /** 지표별 히트맵 0~1 */
  heatmaps: Partial<Record<MetricKey, Float32Array>>;
}

export interface Raster {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}
