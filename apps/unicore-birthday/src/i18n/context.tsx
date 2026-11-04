"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { defaultLocale, type Locale } from "./config";
import { getDict, type Dict } from "./dict";

const LocaleContext = createContext<Locale>(defaultLocale);

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** 현재 언어의 번역 사전 (문자열 + 언어별로 합쳐진 데이터 뷰) */
export function useDict(): Dict {
  const locale = useLocale();
  return useMemo(() => getDict(locale), [locale]);
}

export { fmt } from "./messages";
