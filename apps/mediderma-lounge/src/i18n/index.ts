/**
 * 다국어: 모든 UI 문구는 언어별 JSON 으로 관리한다.
 * ko / en 은 전체 번역, 나머지 7개 언어는 핵심 UI 만 번역(베타)하고 없는 키는 영어로 대체한다.
 * 공식 브랜드명·제품명은 승인된 표기만 쓰므로 번역하지 않는다(상품 DB 의 name / nameEn 그대로 노출).
 */
import ko from "./ko.json";
import en from "./en.json";
import extra from "./extra.json";
import { useGame } from "../store/game";

export const LANGS = [
  { id: "ko", label: "한국어" }, { id: "en", label: "English" }, { id: "ja", label: "日本語" }, { id: "zh", label: "中文" },
  { id: "es", label: "Español" }, { id: "ru", label: "Русский" }, { id: "vi", label: "Tiếng Việt" }, { id: "th", label: "ไทย" }, { id: "mn", label: "Монгол" },
] as const;
export type Lang = (typeof LANGS)[number]["id"];

const DICT: Record<string, Record<string, string>> = { ko, en, ...(extra as Record<string, Record<string, string>>) };

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>) {
  let s = DICT[lang]?.[key] ?? DICT.en[key] ?? DICT.ko[key] ?? key;
  if (vars) for (const k in vars) s = s.replace(`{${k}}`, String(vars[k]));
  return s;
}
export function useT() {
  const lang = useGame((s) => s.settings.lang);
  return (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);
}
/** 데이터의 {ko,en} 필드 선택 */
export function useL() {
  const lang = useGame((s) => s.settings.lang);
  return <T extends { ko: string; en: string }>(o: T) => (lang === "ko" ? o.ko : o.en);
}
