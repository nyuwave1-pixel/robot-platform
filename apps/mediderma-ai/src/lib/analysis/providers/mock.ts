import type { SkinAnalysisProvider } from "../provider";
import { MEASURABLE, NOT_MEASURABLE, SIM_DISCLAIMER } from "./localCv";

/**
 * 개발용 Mock Provider. 이미지를 전혀 보지 않으며 모든 관찰값을 null 로 반환한다.
 * (가짜 숫자를 만들지 않는다. UI 흐름 확인용이며 프로덕션 빌드에는 등록되지 않는다.)
 */
export const mockProvider: SkinAnalysisProvider = {
  id: "mock",
  version: "mock-0",
  kind: "mock",
  transmitsImage: false,
  async analyze({ canvas, sessionId }) {
    return {
      visual: null,
      result: {
        schemaVersion: "1.0",
        sessionId,
        analyzedAt: new Date().toISOString(),
        isMock: true,
        provider: { id: "mock", kind: "mock", imageLeftDevice: false },
        modelVersion: "mock-0",
        validation: { status: "mock", note: "MOCK — 실제 분석이 아닙니다." },
        imageQuality: {
          score: 0, faceDetected: false, faceCount: 0, frontalScore: 0, lightingScore: 0, sharpnessScore: 0, resolutionScore: 0,
          pose: null, faceWidthPx: null, imageSize: { width: canvas.width, height: canvas.height }, issues: [], capture: null, passed: false,
        },
        analysis: {
          overallConditionScore: null, confidence: null, needsRetake: true,
          categories: { textureUniformity: null, wrinkleVisibility: null, poreVisibility: null, toneUniformity: null, pigmentVisibility: null, rednessVisibility: null, eyeAreaCondition: null, cheekTexture: null, jawlineTexture: null, overallCondition: null },
          zones: [], topConcerns: [], measurable: MEASURABLE, notMeasurable: NOT_MEASURABLE,
        },
        survey: null,
        careRecommendations: [],
        simulation: { disclaimer: SIM_DISCLAIMER, periods: ["4weeks", "8weeks", "12weeks"] },
      },
    };
  },
};
