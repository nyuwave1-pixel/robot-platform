/** 익명 이용 통계 이벤트 스키마 — 사진·랜드마크·개별 점수·IP 는 절대 포함하지 않는다. */
export const EVENT_TYPES = [
  "visit",
  "analysis_started",
  "upload_rejected",
  "analysis_succeeded",
  "analysis_failed",
  "survey_submitted",
  "care_selected",
  "product_click",
  "trial_click",
  "partner_click",
  "report_saved",
  "compare_run",
  "simulation_viewed",
  "history_saved",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export interface TrackEvent {
  type: EventType;
  /** 임시 세션 ID (익명, 세션 종료 시 폐기) */
  sid: string;
  locale: string;
  /** 허용된 키만 서버에서 통과시킨다 */
  props?: {
    reason?: string; // upload_rejected: 품질 이슈 코드, analysis_failed: 오류 코드
    concerns?: string[]; // analysis_succeeded: 상위 고민 지표 키
    routine?: string; // care_selected
    tech?: string[]; // care_selected: 추천된 기능
    product?: string; // product_click
    format?: string; // report_saved: pdf|image
    needsRetake?: boolean;
    verdicts?: string; // compare_run 요약
  };
}

const PROP_KEYS = ["reason", "concerns", "routine", "tech", "product", "format", "needsRetake", "verdicts"] as const;

/** 서버 측 검증: 알 수 없는 타입·키·과도한 길이를 버린다 */
export function sanitizeEvent(input: unknown): TrackEvent | null {
  if (!input || typeof input !== "object") return null;
  const e = input as Record<string, unknown>;
  if (typeof e.type !== "string" || !(EVENT_TYPES as readonly string[]).includes(e.type)) return null;
  const s = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/[^\w:.\-|,]/g, "").slice(0, n) : undefined);
  const sid = s(e.sid, 40);
  if (!sid) return null;
  const props: Record<string, unknown> = {};
  const p = (e.props && typeof e.props === "object" ? e.props : {}) as Record<string, unknown>;
  for (const k of PROP_KEYS) {
    const v = p[k];
    if (typeof v === "string") props[k] = s(v, 60);
    else if (typeof v === "boolean") props[k] = v;
    else if (Array.isArray(v)) props[k] = v.slice(0, 6).map((x) => s(x, 40)).filter(Boolean);
  }
  return { type: e.type as EventType, sid, locale: s(e.locale, 5) ?? "ko", props };
}
