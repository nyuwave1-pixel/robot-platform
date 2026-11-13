import type { FaceZoneId, MetricKey } from "./analysis/types";

/** Gemini 해설 결과 스키마 — 숫자 점수·피부 나이·진단명을 담을 자리가 없다 (서술과 비교 판단만). */
export interface AiInsight {
  summary: string;
  observations: { zone: FaceZoneId; note: string }[];
  agreement: { metric: MetricKey; view: "agree" | "differs" | "unsure"; note: string }[];
  careExplanation: string;
  model: string;
}

/** 클라이언트 → 서버 요청 본문 */
export interface AiInsightRequest {
  consent: true;
  locale: string;
  sid: string;
  /** 정규화 얼굴 크롭 JPEG (base64, 긴 변 ≤ 640px) */
  imageBase64: string;
  /** 기기 내 엔진이 계산한 관찰 지수 요약 */
  indices: {
    categories: Record<string, number | null>;
    topConcerns: { metric: string; zone: string; severity: number }[];
    zones: { zone: string; conditionIndex: number | null }[];
  };
  /** 추천된 공식 루틴 id (설명 대상) */
  routines: string[];
}
