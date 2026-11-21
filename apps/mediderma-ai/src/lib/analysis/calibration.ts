import type { MetricKey } from "./types";

/**
 * 원시 관찰값 → 0~100 지수 변환 범위와 판정 임계값.
 *
 * ⚠ 이 범위는 내부 테스트 이미지에서 값이 포화되지 않도록 맞춘 "엔지니어링 보정값"이다.
 *   임상·통계적으로 검증된 기준이 아니며, 관리자 페이지에서 조정할 수 있다.
 *   (lo 이하 → 0, hi 이상 → 100, 사이는 선형)
 */
export interface Calibration {
  version: string;
  /** 원시값 범위. texture/toneUniformity 도 "불균일도" 원시값 기준이며 엔진에서 100-x 로 뒤집는다. */
  ranges: Record<MetricKey, { lo: number; hi: number }>;
  /** 영역 신뢰도가 이 값 미만이면 해당 영역의 모든 지표를 null 로 반환 */
  minZoneConfidence: number;
  /** 유효 영역이 이 개수 미만이면 종합 지수를 만들지 않는다 */
  minValidZones: number;
  /** 종합 신뢰도가 이 값 미만이면 "추가 촬영 필요" */
  minOverallConfidence: number;
  quality: {
    maxYaw: number;
    maxPitch: number;
    maxRoll: number;
    warnYaw: number;
    /** 얼굴 영역 L* 98 퍼센타일이 이 값 미만이면 너무 어두움 */
    minHighlightL: number;
    /** 피부 클리핑(과다 노출) 비율 상한 */
    maxClippedFraction: number;
    /** 좌우 볼 L* 차이 */
    warnSideDeltaL: number;
    maxSideDeltaL: number;
    /** 선명도 원시값 하한 */
    minSharpness: number;
    warnSharpness: number;
    /** 원본 이미지에서의 얼굴 폭(px) */
    minFaceWidthPx: number;
    warnFaceWidthPx: number;
    /** 이미지 대비 얼굴 폭 비율 하한 */
    minFaceRatio: number;
  };
  /** 전후 비교에서 "변화 없음"으로 보는 지수 변화 폭(±) */
  compareNoiseBand: number;
}

export const DEFAULT_CALIBRATION: Calibration = {
  version: "cal-0.1.0",
  ranges: {
    texture: { lo: 0.35, hi: 2.2 },
    wrinkleVisibility: { lo: 0.02, hi: 0.6 },
    nasolabialVisibility: { lo: 0.05, hi: 0.8 },
    poreVisibility: { lo: 0.5, hi: 8 },
    toneUniformity: { lo: 1.2, hi: 7.5 },
    pigmentVisibility: { lo: 0.005, hi: 0.15 },
    rednessVisibility: { lo: 1.0, hi: 9 },
    underEyeDarkness: { lo: 2, hi: 16 },
    shine: { lo: 0.01, hi: 0.25 },
  },
  minZoneConfidence: 0.4,
  minValidZones: 8,
  minOverallConfidence: 0.5,
  quality: {
    maxYaw: 18,
    maxPitch: 25,
    maxRoll: 15,
    warnYaw: 10,
    minHighlightL: 48,
    maxClippedFraction: 0.12,
    warnSideDeltaL: 10,
    maxSideDeltaL: 22,
    minSharpness: 3.4,
    warnSharpness: 5.2,
    minFaceWidthPx: 220,
    warnFaceWidthPx: 420,
    minFaceRatio: 0.2,
  },
  compareNoiseBand: 6,
};

export function toIndex(raw: number, range: { lo: number; hi: number }): number {
  const v = ((raw - range.lo) / (range.hi - range.lo)) * 100;
  return Math.round(v < 0 ? 0 : v > 100 ? 100 : v);
}
