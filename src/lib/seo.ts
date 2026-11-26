import type { Metadata } from "next";

/** SEO 단일 소스 — 이 앱은 basePath(/robot-platform) 아래에 있으므로 canonical 은 항상 절대 URL 로 만든다. */
export const SITE_URL = "https://www.airobotphysical.com/robot-platform";

export function absoluteUrl(path = ""): string {
  const clean = `/${path}`.replace(/\/+/g, "/").replace(/\/$/, "");
  return `${SITE_URL}${clean}`;
}

/** 자기 자신을 canonical 로 선언 (+ og:url 일치) */
export function canonical(path = ""): Pick<Metadata, "alternates"> {
  return { alternates: { canonical: absoluteUrl(path) } };
}

/** 로그인·개인 화면, 아직 실제 콘텐츠가 없는 화면 — 검색 결과에서 제외 */
export const NOINDEX: Pick<Metadata, "robots"> = { robots: { index: false, follow: true } };
