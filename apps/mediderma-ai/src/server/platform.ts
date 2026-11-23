import "server-only";
import type { TrackEvent } from "@/lib/events";

/**
 * UNI&CORE 통합 관리자(api.unincore.com)로 익명 이벤트를 전달한다.
 *  - 보내는 값: 이벤트 타입 · 국가 코드 · 기기 종류(모바일/태블릿/PC) · 언어 · 허용된 props(고민 지표 키, 추천 기능 등)
 *  - 보내지 않는 값: 세션 ID · IP · 사진 · 랜드마크 · 개별 점수
 *  - PLATFORM_API_URL / PLATFORM_INGEST_KEY 가 없으면 아무것도 하지 않는다. 실패해도 사용자 요청에는 영향이 없다.
 */
export function deviceType(ua: string | null): "mobile" | "tablet" | "desktop" | "unknown" {
  if (!ua) return "unknown";
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) return "mobile";
  if (/Windows|Macintosh|X11|Linux|CrOS/i.test(ua)) return "desktop";
  return "unknown";
}

export function platformPayload(ev: TrackEvent, country: string, ua: string | null) {
  return { type: ev.type, country, device: deviceType(ua), locale: ev.locale, props: ev.props ?? {} };
}

export async function forwardToPlatform(ev: TrackEvent, country: string, ua: string | null): Promise<void> {
  const base = process.env.PLATFORM_API_URL;
  const key = process.env.PLATFORM_INGEST_KEY;
  if (!base || !key) return;
  try {
    await fetch(`${base.replace(/\/+$/, "")}/platform/skin-stats/event`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-internal-key": key },
      body: JSON.stringify(platformPayload(ev, country, ua)),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // 통합 관리자 장애가 분석 서비스에 영향을 주지 않도록 무시
  }
}
