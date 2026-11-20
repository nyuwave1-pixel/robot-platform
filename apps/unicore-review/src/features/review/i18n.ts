/**
 * 영어 언어팩 — 화면은 한국어로 그리고, 영어를 고르면 보이는 문구를 사전(en.ts)으로 바꿔 준다.
 *  - 언어 선택: 주소의 ?lang=en|ko → 저장된 선택 → 기본 한국어
 *  - 문구가 사전에 없으면 한국어 그대로 둔다(참여자가 쓴 후기·이름 등은 번역하지 않는다)
 *  - data-notranslate 가 붙은 영역은 건드리지 않는다
 */
import { EN, EN_RULES } from "./en";

export type Lang = "ko" | "en";
const KEY = "uc-review-lang";
const HANGUL = /[가-힣]/;
const ATTRS = ["placeholder", "aria-label", "title", "alt"] as const;

export function getLang(): Lang {
  if (typeof window === "undefined") return "ko";
  try {
    const q = new URLSearchParams(window.location.search).get("lang");
    if (q === "en" || q === "ko") { localStorage.setItem(KEY, q); return q; }
    return localStorage.getItem(KEY) === "en" ? "en" : "ko";
  } catch { return "ko"; }
}

export function setLang(lang: Lang) {
  try { localStorage.setItem(KEY, lang); } catch { /* 무시 */ }
  const u = new URL(window.location.href); u.searchParams.set("lang", lang);
  window.location.replace(u.toString());
}

/** 한 문장을 영어로. 사전 → 규칙 순서로 찾고, 없으면 null */
export function toEn(src: string): string | null {
  const key = src.replace(/\s+/g, " ").trim();
  if (!key || !HANGUL.test(key)) return null;
  const hit = EN[key];
  if (hit !== undefined) return hit;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const [re, to] of EN_RULES) if (re.test(key)) return key.replace(re, to as any);
  return null;
}

/** API 가 돌려준 안내 문구 등 코드에서 직접 쓰는 문자열용 */
export const tr = (src: string, lang: Lang) => (lang === "en" ? toEn(src) ?? src : src);

function skip(el: Element | null) { return !!el?.closest("[data-notranslate], script, style, textarea"); }

function textNode(n: Text) {
  const v = n.nodeValue || "";
  if (!HANGUL.test(v) || skip(n.parentElement)) return;
  const en = toEn(v);
  if (en === null) return;
  const lead = v.match(/^\s*/)![0], tail = v.match(/\s*$/)![0];
  n.nodeValue = lead + en + tail;
}
function element(el: Element) {
  if (el.closest("[data-notranslate], script, style")) return; // 입력칸(textarea)의 안내문·라벨은 번역한다
  for (const a of ATTRS) { const v = el.getAttribute(a); if (v && HANGUL.test(v)) { const en = toEn(v); if (en !== null) el.setAttribute(a, en); } }
}
function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) { textNode(root as Text); return; }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  element(root as Element);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = w.nextNode(); n; n = w.nextNode()) n.nodeType === Node.TEXT_NODE ? textNode(n as Text) : element(n as Element);
}

/** 영어 모드에서 화면 전체를 번역하고, 이후 바뀌는 부분도 계속 번역한다. 반환값은 정리 함수 */
export function startTranslator(): () => void {
  document.documentElement.lang = "en";
  document.documentElement.dataset.lang = "en";
  walk(document.body);
  const title = () => { if (HANGUL.test(document.title)) document.title = toEn(document.title) ?? "UNI&CORE 1ST BIRTHDAY CREAM — Review Event"; };
  title();
  const head = new MutationObserver(title); // 제목은 화면이 그려진 뒤에 들어올 수 있다
  head.observe(document.head, { subtree: true, childList: true, characterData: true });
  const mo = new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === "characterData") textNode(m.target as Text);
      else if (m.type === "attributes") element(m.target as Element);
      else m.addedNodes.forEach(walk);
    }
  });
  mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
  document.documentElement.dataset.langReady = "1";
  return () => { mo.disconnect(); head.disconnect(); };
}
