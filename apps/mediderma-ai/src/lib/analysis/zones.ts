import facedata from "./facedata.json";
import type { FaceZoneId, MetricKey } from "./types";

/**
 * 얼굴 영역 정의 — MediaPipe Face Mesh(468점) 랜드마크 인덱스 폴리곤.
 * left/right 는 피험자 본인 기준(사진에서는 좌우가 반대로 보인다).
 * 폴리곤은 canonical face model 위에 렌더링해 육안 검증했다 (docs/mediderma-ai/03 참고).
 */
const Z = facedata.zones as Record<string, number[]>;
const EX = facedata.exclusions as Record<string, number[]>;

export const FACE_ZONES: { id: FaceZoneId; polygon: number[] }[] = [
  { id: "forehead", polygon: Z.forehead },
  { id: "glabella", polygon: Z.glabella },
  { id: "left_eye_corner", polygon: Z.left_eye_corner },
  { id: "right_eye_corner", polygon: Z.right_eye_corner },
  { id: "left_under_eye", polygon: Z.left_under_eye },
  { id: "right_under_eye", polygon: Z.right_under_eye },
  { id: "left_cheek", polygon: Z.left_cheek },
  { id: "right_cheek", polygon: Z.right_cheek },
  { id: "nose", polygon: Z.nose },
  { id: "mouth_area", polygon: Z.mouth_area },
  { id: "left_jawline", polygon: Z.left_jawline },
  { id: "right_jawline", polygon: Z.right_jawline },
  { id: "chin", polygon: Z.chin },
];

export const ZONE_INDEX: Record<FaceZoneId, number> = Object.fromEntries(
  FACE_ZONES.map((z, i) => [z.id, i]),
) as Record<FaceZoneId, number>;

/** 팔자 부위 보조 ROI (볼 영역의 nasolabialVisibility 계산에만 사용) */
export const NASOLABIAL: { left: number[]; right: number[] } = {
  left: Z.left_nasolabial,
  right: Z.right_nasolabial,
};

/** 분석에서 제외하는 부위 (눈·눈썹·입술·콧구멍) */
export const EXCLUSIONS: { id: string; polygon: number[]; dilate: number }[] = [
  { id: "left_eye", polygon: EX.left_eye, dilate: 0.022 },
  { id: "right_eye", polygon: EX.right_eye, dilate: 0.022 },
  { id: "left_brow", polygon: EX.left_brow, dilate: 0.018 },
  { id: "right_brow", polygon: EX.right_brow, dilate: 0.018 },
  { id: "lips", polygon: EX.lips, dilate: 0.014 },
  { id: "left_nostril", polygon: EX.left_nostril, dilate: 0.012 },
  { id: "right_nostril", polygon: EX.right_nostril, dilate: 0.012 },
];

export const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150,
  136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
];

export const TRIANGLES: number[] = facedata.triangles;
export const CANONICAL: number[] = facedata.canonical;
export const MIRROR: number[] = facedata.mirror;

/** 영역별로 계산하는 지표와 영역 컨디션 지수 가중치 */
export const ZONE_METRICS: Record<FaceZoneId, Partial<Record<MetricKey, number>>> = {
  forehead: { texture: 1, wrinkleVisibility: 1.2, poreVisibility: 0.6, toneUniformity: 0.8, pigmentVisibility: 0.8, rednessVisibility: 0.6, shine: 0 },
  glabella: { wrinkleVisibility: 1.2, texture: 0.8, rednessVisibility: 0.5 },
  left_eye_corner: { wrinkleVisibility: 1.3, toneUniformity: 0.5 },
  right_eye_corner: { wrinkleVisibility: 1.3, toneUniformity: 0.5 },
  left_under_eye: { wrinkleVisibility: 1, underEyeDarkness: 1, toneUniformity: 0.5 },
  right_under_eye: { wrinkleVisibility: 1, underEyeDarkness: 1, toneUniformity: 0.5 },
  left_cheek: { texture: 1, poreVisibility: 1, toneUniformity: 1, pigmentVisibility: 1, rednessVisibility: 1, nasolabialVisibility: 0.8 },
  right_cheek: { texture: 1, poreVisibility: 1, toneUniformity: 1, pigmentVisibility: 1, rednessVisibility: 1, nasolabialVisibility: 0.8 },
  nose: { poreVisibility: 1, rednessVisibility: 0.8, texture: 0.6, shine: 0 },
  mouth_area: { wrinkleVisibility: 1, texture: 0.8, toneUniformity: 0.8, rednessVisibility: 0.6 },
  left_jawline: { texture: 1, toneUniformity: 0.8, pigmentVisibility: 0.6, rednessVisibility: 0.6 },
  right_jawline: { texture: 1, toneUniformity: 0.8, pigmentVisibility: 0.6, rednessVisibility: 0.6 },
  chin: { texture: 1, poreVisibility: 0.8, toneUniformity: 0.6, rednessVisibility: 0.8 },
};

/** 종합 지수 계산 시 영역 가중치 */
export const ZONE_WEIGHT: Record<FaceZoneId, number> = {
  forehead: 1.2,
  glabella: 0.5,
  left_eye_corner: 0.6,
  right_eye_corner: 0.6,
  left_under_eye: 0.7,
  right_under_eye: 0.7,
  left_cheek: 1.4,
  right_cheek: 1.4,
  nose: 0.7,
  mouth_area: 0.8,
  left_jawline: 0.7,
  right_jawline: 0.7,
  chin: 0.7,
};

/** 주요 기준 랜드마크 */
export const LM = {
  faceRight: 234,
  faceLeft: 454,
  top: 10,
  chin: 152,
  noseTip: 1,
  rightEyeOuter: 33,
  rightEyeInner: 133,
  leftEyeInner: 362,
  leftEyeOuter: 263,
  mouthRight: 61,
  mouthLeft: 291,
};
