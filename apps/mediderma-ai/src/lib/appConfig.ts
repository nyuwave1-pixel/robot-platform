import { DEFAULT_CALIBRATION, type Calibration } from "./analysis/calibration";
import type { MetricKey } from "./analysis/types";
import { LINKS, PRODUCTS, ROUTINES, type ProductId, type RoutineId } from "./care/knowledge";

export const LOCALES = ["ko", "en", "ja", "zh", "es", "vi", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_NAMES: Record<Locale, string> = { ko: "한국어", en: "English", ja: "日本語", zh: "简体中文", es: "Español", vi: "Tiếng Việt", ru: "Русский" };

/** 관리자 페이지에서 조정 가능한 운영 설정. 저장소에 없으면 이 기본값을 쓴다. */
export interface AppConfig {
  provider: { id: string; note: string };
  calibration: Calibration;
  /** 리포트에 노출할 분석 항목 */
  enabledMetrics: MetricKey[];
  /** 추천 알고리즘: 관찰값을 '고민'으로 보는 기준 지수 */
  recommendation: { noticeThreshold: number };
  routinesEnabled: Record<RoutineId, boolean>;
  products: Record<ProductId, { enabled: boolean; url: string }>;
  links: { freeTrial: string; partners: string };
  locales: Locale[];
  retention: { sessionMinutes: number; historyDays: number };
  /**
   * Gemini 해설(선택 기능). 사진이 Google 로 전송되므로 기본은 꺼져 있다.
   * enabled + paidTierConfirmed + 서버의 GEMINI_API_KEY 가 모두 있어야 동작한다 (available 은 서버가 계산해 내려준다).
   * 무료 등급 키는 Google 이 전송 내용을 제품 개선·사람 검토에 쓸 수 있어 얼굴 사진에 사용하면 안 된다.
   */
  aiInsight: { enabled: boolean; paidTierConfirmed: boolean; available?: boolean };
}

export const DEFAULT_CONFIG: AppConfig = {
  provider: { id: "local-cv", note: "On-device Local CV (MediaPipe Face Landmarker + 자체 분석 알고리즘)" },
  calibration: DEFAULT_CALIBRATION,
  enabledMetrics: ["texture", "wrinkleVisibility", "nasolabialVisibility", "poreVisibility", "toneUniformity", "pigmentVisibility", "rednessVisibility", "underEyeDarkness", "shine"],
  recommendation: { noticeThreshold: 40 },
  routinesEnabled: Object.fromEntries(Object.keys(ROUTINES).map((k) => [k, true])) as Record<RoutineId, boolean>,
  products: Object.fromEntries(Object.entries(PRODUCTS).map(([k, v]) => [k, { enabled: true, url: v.url }])) as Record<ProductId, { enabled: boolean; url: string }>,
  links: { freeTrial: LINKS.freeTrial, partners: LINKS.partners },
  locales: [...LOCALES],
  retention: { sessionMinutes: 60, historyDays: 90 },
  aiInsight: { enabled: false, paidTierConfirmed: false },
};

/** 저장된 부분 설정을 기본값 위에 얕게 병합 (알 수 없는 키는 버린다) */
export function mergeConfig(partial: unknown): AppConfig {
  const p = (partial && typeof partial === "object" ? partial : {}) as Partial<AppConfig>;
  const d = DEFAULT_CONFIG;
  const num = (v: unknown, fb: number, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fb);
  const cal = (p.calibration ?? {}) as Partial<Calibration>;
  const ranges = { ...d.calibration.ranges };
  for (const k of Object.keys(ranges) as MetricKey[]) {
    const r = cal.ranges?.[k];
    if (r && typeof r.lo === "number" && typeof r.hi === "number" && r.hi > r.lo) ranges[k] = { lo: r.lo, hi: r.hi };
  }
  const quality = { ...d.calibration.quality };
  for (const k of Object.keys(quality) as (keyof typeof quality)[]) quality[k] = num(cal.quality?.[k], quality[k], 0, 10000);
  const products = { ...d.products };
  for (const k of Object.keys(products) as ProductId[]) {
    const v = p.products?.[k];
    if (v) products[k] = { enabled: v.enabled !== false, url: typeof v.url === "string" && /^https:\/\/([a-z0-9-]+\.)*unincore\.com\//.test(v.url) ? v.url : d.products[k].url };
  }
  const routinesEnabled = { ...d.routinesEnabled };
  for (const k of Object.keys(routinesEnabled) as RoutineId[]) if (p.routinesEnabled && k in p.routinesEnabled) routinesEnabled[k] = p.routinesEnabled[k] !== false;
  const okUrl = (v: unknown, fb: string) => (typeof v === "string" && /^https:\/\/([a-z0-9-]+\.)*unincore\.com\//.test(v) ? v : fb);
  return {
    provider: { id: p.provider?.id === "local-cv" ? "local-cv" : d.provider.id, note: typeof p.provider?.note === "string" ? p.provider.note.slice(0, 200) : d.provider.note },
    calibration: {
      version: typeof cal.version === "string" ? cal.version.slice(0, 40) : d.calibration.version,
      ranges,
      quality,
      minZoneConfidence: num(cal.minZoneConfidence, d.calibration.minZoneConfidence, 0.1, 0.95),
      minValidZones: num(cal.minValidZones, d.calibration.minValidZones, 4, 13),
      minOverallConfidence: num(cal.minOverallConfidence, d.calibration.minOverallConfidence, 0.1, 0.95),
      compareNoiseBand: num(cal.compareNoiseBand, d.calibration.compareNoiseBand, 1, 30),
    },
    enabledMetrics: Array.isArray(p.enabledMetrics) ? d.enabledMetrics.filter((m) => (p.enabledMetrics as string[]).includes(m)) : d.enabledMetrics,
    recommendation: { noticeThreshold: num(p.recommendation?.noticeThreshold, d.recommendation.noticeThreshold, 10, 90) },
    routinesEnabled,
    products,
    links: { freeTrial: okUrl(p.links?.freeTrial, d.links.freeTrial), partners: okUrl(p.links?.partners, d.links.partners) },
    locales: Array.isArray(p.locales) && p.locales.length ? LOCALES.filter((l) => (p.locales as string[]).includes(l) || l === "ko") : d.locales,
    aiInsight: { enabled: p.aiInsight?.enabled === true, paidTierConfirmed: p.aiInsight?.paidTierConfirmed === true, ...(p.aiInsight?.available === true ? { available: true } : {}) },
    retention: { sessionMinutes: num(p.retention?.sessionMinutes, d.retention.sessionMinutes, 5, 240), historyDays: num(p.retention?.historyDays, d.retention.historyDays, 1, 365) },
  };
}
