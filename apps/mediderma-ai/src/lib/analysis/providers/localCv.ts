"use client";
import { analyzeNormalized, ENGINE_VERSION } from "../engine";
import { detectFace, LANDMARK_MODEL, normalizeFace } from "../detect";
import { buildQuality, pixelCheck, preCheck } from "../quality";
import type { ProviderOutput, SkinAnalysisProvider } from "../provider";
import type { AnalysisResult, CategoryScores, ImageQuality, MetricKey } from "../types";

export const MEASURABLE: MetricKey[] = [
  "texture",
  "wrinkleVisibility",
  "nasolabialVisibility",
  "poreVisibility",
  "toneUniformity",
  "pigmentVisibility",
  "rednessVisibility",
  "underEyeDarkness",
  "shine",
];
/** 사진만으로는 측정할 수 없어 값을 만들지 않는 항목 (i18n 키) */
export const NOT_MEASURABLE = ["hydration", "collagen", "sebum", "bloodFlow", "skinTemperature", "skinAge", "dryLook", "elasticity"];

export const SIM_DISCLAIMER = "가상 시뮬레이션이며 실제 개선 결과를 보장하지 않습니다.";

const EMPTY_CATEGORIES: CategoryScores = {
  textureUniformity: null,
  wrinkleVisibility: null,
  poreVisibility: null,
  toneUniformity: null,
  pigmentVisibility: null,
  rednessVisibility: null,
  eyeAreaCondition: null,
  cheekTexture: null,
  jawlineTexture: null,
  overallCondition: null,
};

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

function baseResult(sessionId: string, calVersion: string, quality: ImageQuality): AnalysisResult {
  return {
    schemaVersion: "1.0",
    sessionId,
    analyzedAt: new Date().toISOString(),
    isMock: false,
    provider: { id: "local-cv", kind: "on-device", imageLeftDevice: false },
    modelVersion: `${ENGINE_VERSION}+${LANDMARK_MODEL}+${calVersion}`,
    validation: {
      status: "engineering-calibrated",
      note: "RGB 사진 기반 관찰 지수입니다. 지수 범위는 내부 테스트 이미지로 보정했으며 임상 검증을 거치지 않았습니다. 의료적 진단이 아닙니다.",
    },
    imageQuality: quality,
    analysis: {
      overallConditionScore: null,
      confidence: null,
      needsRetake: true,
      categories: EMPTY_CATEGORIES,
      zones: [],
      topConcerns: [],
      measurable: MEASURABLE,
      notMeasurable: NOT_MEASURABLE,
    },
    survey: null,
    careRecommendations: [],
    simulation: { disclaimer: SIM_DISCLAIMER, periods: ["4weeks", "8weeks", "12weeks"] },
  };
}

export const localCvProvider: SkinAnalysisProvider = {
  id: "local-cv",
  version: ENGINE_VERSION,
  kind: "on-device",
  transmitsImage: false,
  async analyze({ canvas, sessionId, calibration }, onProgress): Promise<ProviderOutput> {
    onProgress?.("loading_model");
    await tick();
    onProgress?.("detecting");
    const det = await detectFace(canvas);
    onProgress?.("quality");
    await tick();
    const pre = preCheck(det.info, calibration);
    // 얼굴이 없거나 여러 명이면 픽셀 분석을 하지 않는다
    if (!det.landmarksPx || !det.info.pose || pre.some((i) => i.code === "no_face" || i.code === "multiple_faces" || i.code === "face_cut_off")) {
      return { result: baseResult(sessionId, calibration.version, buildQuality(det.info, null, pre, calibration)), visual: null };
    }
    const face = normalizeFace(canvas, det.landmarksPx, det.info.pose);
    onProgress?.("analyzing");
    await tick();
    const warnPenalty = pre.some((i) => i.code === "expression_not_neutral") ? 0.9 : 1;
    const out = analyzeNormalized(face, { calibration, qualityFactor: warnPenalty });
    const issues = [...pre, ...pixelCheck(out.stats, calibration)];
    const quality = buildQuality(det.info, out.stats, issues, calibration);
    const result = baseResult(sessionId, calibration.version, quality);
    if (!quality.passed) {
      // 품질 미달: 점수를 만들지 않고 재촬영 안내만 한다
      return { result, visual: null };
    }
    const needsRetake = out.overall === null || (out.confidence ?? 0) < calibration.minOverallConfidence;
    result.analysis = {
      overallConditionScore: needsRetake ? null : out.overall,
      confidence: out.confidence,
      needsRetake,
      categories: needsRetake ? { ...out.categories, overallCondition: null } : out.categories,
      zones: out.zones,
      topConcerns: out.topConcerns,
      measurable: MEASURABLE,
      notMeasurable: NOT_MEASURABLE,
    };
    onProgress?.("done");
    return { result, visual: out.visual };
  },
};
