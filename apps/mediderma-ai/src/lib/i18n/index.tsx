"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import ko, { type Dict } from "./locales/ko";
import { LOCALES, type Locale } from "../appConfig";

const loaders: Record<Locale, () => Promise<{ default: Dict }>> = {
  ko: async () => ({ default: ko }),
  en: () => import("./locales/en"),
  ja: () => import("./locales/ja"),
  zh: () => import("./locales/zh"),
  es: () => import("./locales/es"),
  vi: () => import("./locales/vi"),
  ru: () => import("./locales/ru"),
  th: () => import("./locales/th"),
  mn: () => import("./locales/mn"),
};

interface I18n {
  t: Dict;
  locale: Locale;
  setLocale: (l: Locale) => void;
}
const Ctx = createContext<I18n>({ t: ko, locale: "ko", setLocale: () => {} });
const STORAGE = "md_locale";

function detect(): Locale {
  try {
    const q = new URLSearchParams(location.search).get("lang");
    if (q && (LOCALES as readonly string[]).includes(q)) return q as Locale;
    const s = localStorage.getItem(STORAGE);
    if (s && (LOCALES as readonly string[]).includes(s)) return s as Locale;
    const n = navigator.language.slice(0, 2).toLowerCase();
    if ((LOCALES as readonly string[]).includes(n)) return n as Locale;
  } catch {
    /* noop */
  }
  return "ko";
}

/**
 * 한국어가 아닌 방문자는 이 모듈이 실행되는 즉시(하이드레이션 전) 언어 파일을 내려받기 시작한다.
 * 화면이 다 뜬 뒤에 받기 시작하면 번역 화면으로 바뀌는 시점이 그만큼 늦어진다.
 */
const early: { locale: Locale; promise: Promise<{ default: Dict }> } | null = (() => {
  if (typeof window === "undefined") return null;
  const l = detect();
  if (l === "ko") return null;
  const promise = loaders[l]();
  promise.catch(() => {});
  return { locale: l, promise };
})();

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ko");
  const [t, setT] = useState<Dict>(ko);
  const target = useRef<Locale | null>(null);
  const apply = useCallback((l: Locale) => {
    target.current = l;
    (early && early.locale === l ? early.promise : loaders[l]())
      .then((m) => {
        setT(m.default);
        setLocaleState(l);
        document.documentElement.lang = l === "zh" ? "zh-CN" : l;
      })
      .catch(() => {
        target.current = "ko";
        setT(ko);
        setLocaleState("ko");
      });
  }, []);
  useEffect(() => {
    const l = detect();
    if (l !== "ko") {
      // 한국어로 그려진 화면이 번역으로 바뀌며 밀리지 않도록(CLS) 본문을 잠깐 가린다. 2.5초 안전장치
      document.documentElement.classList.add("i18n-pending");
      setTimeout(() => document.documentElement.classList.remove("i18n-pending"), 2500);
      apply(l);
    }
  }, [apply]);
  const setLocale = useCallback(
    (l: Locale) => {
      try {
        localStorage.setItem(STORAGE, l);
      } catch {
        /* noop */
      }
      apply(l);
    },
    [apply],
  );
  // 번역 문구가 실제로 화면에 반영(commit)된 뒤에 가림을 푼다 — 그 전에 풀면 한국어→번역 전환이 밀림(CLS)으로 잡힌다
  useEffect(() => {
    if (target.current !== null && locale === target.current) reveal();
  }, [t, locale]);
  const value = useMemo(() => ({ t, locale, setLocale }), [t, locale, setLocale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function reveal() {
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove("i18n-pending")));
}

export const useI18n = () => useContext(Ctx);

/** "{name}" 자리표시자 치환 */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}
