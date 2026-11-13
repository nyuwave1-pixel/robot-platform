"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ko");
  const [t, setT] = useState<Dict>(ko);
  const apply = useCallback((l: Locale) => {
    loaders[l]()
      .then((m) => {
        setT(m.default);
        setLocaleState(l);
        document.documentElement.lang = l === "zh" ? "zh-CN" : l;
      })
      .catch(() => {
        setT(ko);
        setLocaleState("ko");
      });
  }, []);
  useEffect(() => {
    const l = detect();
    if (l !== "ko") apply(l);
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
  const value = useMemo(() => ({ t, locale, setLocale }), [t, locale, setLocale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);

/** "{name}" 자리표시자 치환 */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}
