/**
 * 메이크업이 실사 캐릭터 얼굴에 주는 변화 (three/RealCharacter.tsx 가 쓴다)
 *  - 베이스(기초 화장): 피부 광택(거칠기) · 밝기 · 톤 균일(붉은기 줄이기)
 *  - 블러셔(look.makeup) · 아이섀도(look.shadow): 머리 뼈에 붙인 부드러운 색 패치
 *  - 립(look.lip): 입술 재질 색
 * 완성형 캐릭터(시그니처 · 손님 모델)는 얼굴이 텍스처에 구워져 있어 재질 색을 못 바꾸므로,
 * 모델마다 잰 얼굴 위치(DESIGNED_FACE)에 블러셔 · 섀도 · 립 패치를 얹는다.
 * (텍스처 한 장에 옷까지 들어 있어 베이스는 완성형 모델에 적용하지 않는다)
 */
export interface BaseFx { rough: number; bright: number; even: number; glow: number }
/** rough: 피부 거칠기(낮을수록 물광), bright: 밝기 배율, even: 톤 균일 0~1, glow: 은은한 자체 광 */
export const BASE_FX: Record<string, BaseFx> = {
  "base-skin": { rough: 0.62, bright: 1.0, even: 0.1, glow: 0 },
  "base-glow": { rough: 0.48, bright: 0.99, even: 0.3, glow: 0.015 },
  "base-matte": { rough: 0.85, bright: 0.98, even: 0.55, glow: 0 },
  "base-toneup": { rough: 0.58, bright: 1.04, even: 0.4, glow: 0.015 },
  "base-satin": { rough: 0.48, bright: 1.01, even: 0.5, glow: 0.02 },
};
/** 머리 뼈 기준 패치 위치 (실사 기본 모델: X 옆, Y 위, Z 얼굴 정면, 단위 m) */
export const FACE_PATCH = {
  blush: { x: 0.041, y: 0.056, z: 0.084, w: 0.046, h: 0.03, turn: 0.5, opacity: 0.36 },
  shadow: { x: 0.03, y: 0.104, z: 0.093, w: 0.032, h: 0.015, turn: 0.28, opacity: 0.62 },
};

/**
 * 완성형 모델의 얼굴 위치: 모델 공간(m, Y 위 · Z 앞)에서 머리 뼈 위치를 0으로 둔 값.
 * blush · shadow = [좌우 x, 높이 y, 얼굴 앞쪽으로 나온 거리 z], lip = [높이 y, 앞 z]. turn = 볼 · 눈가 패치가 옆으로 돌아가는 각도.
 */
/** headY: 모델 공간의 머리 뼈 높이 (실사 기본 여성 1.52) — 얼굴 확대 카메라 높이에 쓴다 */
export interface FaceAnchor { headY: number; blush: [number, number, number]; shadow: [number, number, number]; lip: [number, number]; size: number; turn: number }
export const DESIGNED_FACE: Record<string, FaceAnchor> = {
  signature: { headY: 1.331, blush: [0.032, 0.06, 0.1], shadow: [0.038, 0.098, 0.097], lip: [0.05, 0.101], size: 1, turn: 0.45 },
  guest_mint: { headY: 1.326, blush: [0.05, 0.075, 0.135], shadow: [0.04, 0.12, 0.15], lip: [0.0, 0.14], size: 1, turn: 0.45 },
  guest_lavender: { headY: 1.3, blush: [0.035, 0.07, 0.1], shadow: [0.033, 0.11, 0.105], lip: [0.045, 0.105], size: 1, turn: 0.45 },
  guest_coral: { headY: 1.312, blush: [0.055, 0.08, 0.13], shadow: [0.038, 0.12, 0.14], lip: [0.035, 0.13], size: 1, turn: 0.45 },
  guest_gentle: { headY: 1.439, blush: [0.048, 0.08, 0.09], shadow: [0.036, 0.15, 0.1], lip: [0.06, 0.1], size: 1, turn: 0.45 },
};
/** 실사 기본 모델의 머리 뼈 높이 */
export const REAL_HEAD_Y = 1.52;
