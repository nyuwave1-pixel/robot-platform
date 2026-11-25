import { keyIngredients, pdrnGenerations, type Ingredient } from "@/data/ingredients";
import { clinical, trial, type ClinicalMetric } from "@/data/clinical";
import { satisfaction } from "@/data/reviews";
import { lineup } from "@/data/howto";
import { product } from "@/data/product";
import { seo } from "@/data/seo";
import { defaultLocale, localeMeta, type Locale } from "./config";
import { ko, type ClinicalId, type IngredientId, type Messages } from "./messages";
import { en } from "./en";
import { zh } from "./zh";

export const messages: Record<Locale, Messages> = { ko, en, zh };

export type LocalizedClinical = ClinicalMetric & { unitLabel: string };

/** 컴포넌트가 쓰는 언어별 뷰 — 번역 문자열 + 언어 무관 데이터(수치·플래그·이미지·영상)를 합친 객체 */
export interface Dict extends Messages {
  locale: Locale;
  htmlLang: string;
  ingredientsList: Ingredient[];
  pdrnList: { gen: number; name: string; line1: string; line2: string; color: string; highlight: boolean; image: string }[];
  trialInfo: { institute: string; code: string; subjects: string; period: string; usage: string; instrument: string; disclaimer: string };
  clinicalList: LocalizedClinical[];
  satisfactionView: { n: number; verified: boolean; items: { when: string; text: string; value: number }[]; footnote: string; tag: string };
  lineupView: { dayRange: readonly [number, number]; nightRange: readonly [number, number]; steps: { step: string; tag: string; name: string; highlight?: boolean }[] };
  seoView: Messages["seo"] & { siteUrl: string; siteName: string; shortTitle: string; ogImage: string; ogImageSquare: string; locale: string; path: string; publishedAt: string };
}

const cache = new Map<Locale, Dict>();

export function getDict(locale: Locale = defaultLocale): Dict {
  const hit = cache.get(locale);
  if (hit) return hit;
  const m = messages[locale];
  const d: Dict = {
    ...m,
    locale,
    htmlLang: localeMeta[locale].htmlLang,
    ingredientsList: keyIngredients.map((i) => {
      const t = m.ingredients[i.id as IngredientId];
      return t ? { ...i, name: t.name, claim1: t.claim1, claim2: t.claim2, sub: t.sub ?? i.sub } : i;
    }),
    pdrnList: pdrnGenerations.map((g, idx) => ({ gen: g.gen, color: g.color, highlight: g.highlight, image: g.image, ...(m.pdrn.gens[idx] ?? { name: g.name, line1: g.line1, line2: g.line2 }) })),
    trialInfo: { ...trial, ...m.trial },
    clinicalList: clinical.map((c) => {
      const t = m.clinical[c.id as ClinicalId];
      return { ...c, ...(t ? { label: t.label, footnote: t.footnote, method: t.method ?? c.method } : {}), unitLabel: c.unit === "%" ? "%" : m.ui.casesUnit };
    }),
    satisfactionView: {
      n: satisfaction.n,
      verified: satisfaction.verified,
      items: satisfaction.items.map((it, idx) => ({ value: it.value, when: m.satisfaction.items[idx]?.when ?? it.when, text: m.satisfaction.items[idx]?.text ?? it.text })),
      footnote: m.satisfaction.footnote,
      tag: m.satisfaction.tag,
    },
    lineupView: {
      dayRange: lineup.dayRange,
      nightRange: lineup.nightRange,
      steps: lineup.steps.map((s, idx) => ({ step: s.step, highlight: "highlight" in s ? s.highlight : undefined, tag: m.lineup.steps[idx]?.tag ?? s.tag, name: m.lineup.steps[idx]?.name ?? s.name })),
    },
    seoView: {
      ...m.seo,
      siteUrl: seo.siteUrl,
      siteName: seo.siteName,
      shortTitle: seo.shortTitle,
      ogImage: seo.ogImage,
      ogImageSquare: seo.ogImageSquare,
      locale: localeMeta[locale].og,
      path: localeMeta[locale].path,
      publishedAt: seo.publishedAt,
    },
  };
  cache.set(locale, d);
  return d;
}

export { product };
