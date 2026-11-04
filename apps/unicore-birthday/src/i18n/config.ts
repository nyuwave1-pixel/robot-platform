/** 지원 언어 — 한국어(기본, 경로 없음) · 영어(/en) · 중국어 간체(/zh) */
export const locales = ["ko", "en", "zh"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ko";

export const localeMeta: Record<Locale, { label: string; name: string; htmlLang: string; hreflang: string; og: string; path: string }> = {
  ko: { label: "KO", name: "한국어", htmlLang: "ko", hreflang: "ko-KR", og: "ko_KR", path: "/" },
  en: { label: "EN", name: "English", htmlLang: "en", hreflang: "en", og: "en_US", path: "/en" },
  zh: { label: "中文", name: "简体中文", htmlLang: "zh-Hans", hreflang: "zh-Hans", og: "zh_CN", path: "/zh" },
};

export function isLocale(v: string | undefined): v is Locale {
  return !!v && (locales as readonly string[]).includes(v);
}

/** 언어별 경로 (해시 유지) */
export function localePath(locale: Locale, hash = ""): string {
  return `${localeMeta[locale].path}${hash}`;
}

/** hreflang 대체 링크 맵 (sitemap · metadata 공용) */
export function hreflangMap(base = ""): Record<string, string> {
  const m: Record<string, string> = {};
  for (const l of locales) m[localeMeta[l].hreflang] = `${base}${localeMeta[l].path}`;
  m["x-default"] = `${base}${localeMeta.ko.path}`;
  return m;
}
