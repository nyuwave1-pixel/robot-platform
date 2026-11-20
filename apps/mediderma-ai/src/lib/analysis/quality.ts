import { clamp01 } from "./raster";
import type { Calibration } from "./calibration";
import type { PhotoStats } from "./engine";
import type { ImageQuality, QualityIssue } from "./types";

export interface DetectionInfo {
  faceCount: number;
  imageSize: { width: number; height: number };
  /** 원본 이미지 기준 얼굴 폭(px) */
  faceWidthPx: number | null;
  pose: { yaw: number; pitch: number; roll: number } | null;
  /** 얼굴 윤곽이 프레임 밖으로 잘린 비율 0~1 */
  cutOffFraction: number;
  blendshapes: Record<string, number> | null;
}

/** 얼굴 검출 단계에서 바로 걸러지는 문제 (픽셀 분석 전) */
export function preCheck(det: DetectionInfo, cal: Calibration): QualityIssue[] {
  const q = cal.quality;
  const issues: QualityIssue[] = [];
  if (det.faceCount === 0) return [{ code: "no_face", severity: "blocker" }];
  if (det.faceCount > 1) issues.push({ code: "multiple_faces", severity: "blocker", measured: det.faceCount });
  if (det.pose) {
    const { yaw, pitch, roll } = det.pose;
    if (Math.abs(yaw) > q.maxYaw) issues.push({ code: "not_frontal_yaw", severity: "blocker", measured: Math.round(yaw) });
    else if (Math.abs(yaw) > q.warnYaw) issues.push({ code: "not_frontal_yaw", severity: "warning", measured: Math.round(yaw) });
    if (Math.abs(pitch) > q.maxPitch) issues.push({ code: "not_frontal_pitch", severity: "blocker", measured: Math.round(pitch) });
    if (Math.abs(roll) > q.maxRoll) issues.push({ code: "tilted_roll", severity: "blocker", measured: Math.round(roll) });
  }
  if (det.cutOffFraction > 0.04) issues.push({ code: "face_cut_off", severity: "blocker", measured: det.cutOffFraction });
  if (det.faceWidthPx !== null) {
    if (det.faceWidthPx < q.minFaceWidthPx) issues.push({ code: "low_resolution", severity: "blocker", measured: Math.round(det.faceWidthPx) });
    else if (det.faceWidthPx < q.warnFaceWidthPx) issues.push({ code: "low_resolution", severity: "warning", measured: Math.round(det.faceWidthPx) });
    const ratio = det.faceWidthPx / det.imageSize.width;
    if (ratio < q.minFaceRatio) issues.push({ code: "face_too_small", severity: "warning", measured: Math.round(ratio * 100) / 100 });
  }
  const bs = det.blendshapes;
  if (bs) {
    if ((bs.eyeBlinkLeft ?? 0) > 0.6 && (bs.eyeBlinkRight ?? 0) > 0.6) issues.push({ code: "eyes_closed", severity: "warning" });
    const smile = ((bs.mouthSmileLeft ?? 0) + (bs.mouthSmileRight ?? 0)) / 2;
    if (smile > 0.5 || (bs.jawOpen ?? 0) > 0.35 || (bs.browInnerUp ?? 0) > 0.7) {
      issues.push({ code: "expression_not_neutral", severity: "warning", measured: Math.round(Math.max(smile, bs.jawOpen ?? 0) * 100) / 100 });
    }
  }
  return issues;
}

/** 픽셀 통계 기반 문제 (조명·선명도·가림) */
export function pixelCheck(stats: PhotoStats, cal: Calibration): QualityIssue[] {
  const q = cal.quality;
  const issues: QualityIssue[] = [];
  if (stats.skinChroma < 4 && stats.clippedFraction <= q.maxClippedFraction && stats.highlightL >= q.minHighlightL) issues.push({ code: "not_color", severity: "blocker", measured: r1(stats.skinChroma) });
  if (stats.highlightL < q.minHighlightL) issues.push({ code: "too_dark", severity: "blocker", measured: r1(stats.highlightL) });
  if (stats.clippedFraction > q.maxClippedFraction) issues.push({ code: "too_bright", severity: "blocker", measured: r1(stats.clippedFraction) });
  if (stats.sideDeltaL > q.maxSideDeltaL) issues.push({ code: "uneven_lighting", severity: "blocker", measured: r1(stats.sideDeltaL) });
  else if (stats.sideDeltaL > q.warnSideDeltaL) issues.push({ code: "uneven_lighting", severity: "warning", measured: r1(stats.sideDeltaL) });
  if (stats.backgroundDeltaL !== null && stats.backgroundDeltaL > 30 && stats.highlightL < q.minHighlightL + 14) {
    issues.push({ code: "backlight", severity: "blocker", measured: r1(stats.backgroundDeltaL) });
  }
  if (stats.sharpness < q.minSharpness) issues.push({ code: "blurry", severity: "blocker", measured: r1(stats.sharpness) });
  else if (stats.sharpness < q.warnSharpness) issues.push({ code: "blurry", severity: "warning", measured: r1(stats.sharpness) });
  if (stats.lowerFaceCoverage < 0.35) issues.push({ code: "occlusion_lower_face", severity: "blocker", measured: r1(stats.lowerFaceCoverage) });
  // 눈 영역 전체가 피부보다 훨씬 어두우면(흰자·눈꺼풀이 안 보임) 선글라스 등으로 가려진 것으로 본다
  if (stats.eyeBrightRatio < 0.45) issues.push({ code: "occlusion_eyes", severity: "blocker", measured: r1(stats.eyeBrightRatio) });
  else if (stats.eyeRegionCoverage < 0.4) issues.push({ code: "occlusion_eyes", severity: "warning", measured: r1(stats.eyeRegionCoverage) });
  return issues;
}

const r1 = (v: number) => Math.round(v * 10) / 10;

export function buildQuality(det: DetectionInfo, stats: PhotoStats | null, issues: QualityIssue[], cal: Calibration): ImageQuality {
  const q = cal.quality;
  const faceDetected = det.faceCount > 0;
  let frontal = 0;
  let lighting = 0;
  let sharp = 0;
  let res = 0;
  if (faceDetected && det.pose) {
    const { yaw, pitch, roll } = det.pose;
    frontal = Math.round(100 * (1 - clamp01(Math.max(Math.abs(yaw) / (q.maxYaw * 1.5), Math.abs(pitch) / (q.maxPitch * 1.5), Math.abs(roll) / (q.maxRoll * 1.5)))));
  }
  if (det.faceWidthPx !== null) res = Math.round(100 * clamp01((det.faceWidthPx - q.minFaceWidthPx * 0.5) / (640 - q.minFaceWidthPx * 0.5)));
  if (stats) {
    const expo = clamp01((stats.highlightL - q.minHighlightL * 0.7) / (q.minHighlightL * 0.6)) * (1 - clamp01(stats.clippedFraction / (q.maxClippedFraction * 1.5)));
    const even = 1 - clamp01(stats.sideDeltaL / (q.maxSideDeltaL * 1.3));
    lighting = Math.round(100 * expo * even);
    sharp = Math.round(100 * clamp01((stats.sharpness - q.minSharpness * 0.5) / (q.warnSharpness * 2 - q.minSharpness * 0.5)));
  }
  const blockers = issues.filter((i) => i.severity === "blocker").length;
  const warnings = issues.length - blockers;
  let score = 0;
  if (faceDetected) {
    score = stats ? 0.3 * frontal + 0.3 * lighting + 0.25 * sharp + 0.15 * res : 0.5 * frontal + 0.2 * res;
    score = Math.max(0, score - warnings * 4);
    if (blockers) score = Math.min(score, 45);
  }
  return {
    score: Math.round(score),
    faceDetected,
    faceCount: det.faceCount,
    frontalScore: frontal,
    lightingScore: lighting,
    sharpnessScore: sharp,
    resolutionScore: res,
    pose: det.pose ? { yaw: Math.round(det.pose.yaw * 10) / 10, pitch: Math.round(det.pose.pitch * 10) / 10, roll: Math.round(det.pose.roll * 10) / 10 } : null,
    faceWidthPx: det.faceWidthPx !== null ? Math.round(det.faceWidthPx) : null,
    imageSize: det.imageSize,
    issues,
    capture: stats
      ? { skinL: r1(stats.skinMedianL), skinA: r1(stats.skinMedianA), skinB: r1(stats.skinMedianB), sideDeltaL: r1(stats.sideDeltaL), sharpness: r1(stats.sharpness) }
      : null,
    passed: faceDetected && blockers === 0,
  };
}
