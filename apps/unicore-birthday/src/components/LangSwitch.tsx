"use client";
import { locales, localeMeta, localePath } from "@/i18n/config";
import { useDict, useLocale } from "@/i18n/context";

/** 좌상단 언어 전환 — KO(/) · EN(/en) · 中文(/zh). 전체 페이지 이동(인트로 '다음 방문 시 건너뛰기' 설정은 유지됨) */
export default function LangSwitch() {
  const t = useDict();
  const locale = useLocale();
  return (
    <nav className="lang-switch" aria-label={t.ui.langLabel}>
      {locales.map((l) => (
        <a
          key={l}
          href={localePath(l)}
          lang={localeMeta[l].htmlLang}
          hrefLang={localeMeta[l].hreflang}
          className={l === locale ? "on" : ""}
          aria-current={l === locale ? "page" : undefined}
          title={localeMeta[l].name}
        >
          {localeMeta[l].label}
        </a>
      ))}
    </nav>
  );
}
