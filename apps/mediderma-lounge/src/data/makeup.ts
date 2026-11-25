/**
 * 메이크업이 실사 캐릭터 얼굴에 주는 변화 (three/RealCharacter.tsx 가 쓴다)
 *  - 베이스(기초 화장): 피부 광택(거칠기) · 밝기 · 톤 균일(붉은기 줄이기)
 *  - 블러셔(look.makeup) · 아이섀도(look.shadow): 머리 뼈에 붙인 부드러운 색 패치
 *  - 립(look.lip): 입술 재질 색
 * 완성형 캐릭터(시그니처 · 손님 모델)는 얼굴이 텍스처에 구워져 있어 베이스 광채만 반영한다.
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
