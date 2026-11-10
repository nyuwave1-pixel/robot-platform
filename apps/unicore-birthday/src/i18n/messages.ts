import { copy, type CopyLine } from "@/data/copy";
import { keyIngredients, pdrnGenerations, purityClaim } from "@/data/ingredients";
import { clinical, trial } from "@/data/clinical";
import { satisfaction } from "@/data/reviews";
import { howto, lineup } from "@/data/howto";
import { product } from "@/data/product";
import { seo } from "@/data/seo";

/** CopyLine 트리를 문자열 트리로 — 번역 사전은 플래그 없이 문자열만 담습니다. */
export type Strip<T> = T extends CopyLine
  ? string
  : T extends string
    ? string
    : T extends readonly (infer U)[]
      ? Strip<U>[]
      : T extends object
        ? { -readonly [K in keyof T]: Strip<T[K]> }
        : T;

export type CopyMessages = Strip<typeof copy>;

export type IngredientId = "pdrn" | "gf" | "peptide" | "cica";
export type ClinicalId = "cheek-lifting" | "neck-wrinkle" | "adverse-events";

/** 한 언어의 모든 번역 문자열. ko 는 데이터 원문에서 생성하고 en/zh 는 이 타입을 완전하게 채워야 컴파일됩니다. */
export interface Messages {
  copy: CopyMessages;
  product: { brandLocal: string; nameLocal: string; shortName: string; tagline: string; concept: string };
  ingredients: Record<IngredientId, { name: string; claim1: string; claim2: string; sub?: { name: string; desc: string }[] }>;
  pdrn: { gens: { name: string; line1: string; line2: string }[]; purity: string; purityNote: string };
  trial: { institute: string; subjects: string; period: string; usage: string; disclaimer: string };
  clinical: Record<ClinicalId, { label: string; footnote: string; method?: string }>;
  satisfaction: { tag: string; items: { when: string; text: string }[]; footnote: string };
  howto: { intro: string; steps: { step: string; area: string; line1: string; line2: string }[] };
  lineup: { steps: { tag: string; name: string }[]; day: string; night: string };
  ui: {
    langLabel: string;
    chapters: string;
    footerNav: string;
    footerLinks: { clinical: string; ingredients: string; howto: string; brand: string };
    footerLegal: string; // {institute} {code} {subjects} {period} {usage} {disclaimer}
    soundOn: string; soundOff: string;
    heroFilm: string;
    productExplore: string; productJar: string; productPoints: string;
    inspectorHint: string; zoomIn: string; zoomOut: string;
    pdrnCompare: string; pdrnImage: string; // {name}
    moistureAlt: string;
    clinicalEyebrow: string; instrument: string; before: string; after: string; conditions: string; safety: string; casesUnit: string;
    nobelBadge: string; nobelEyebrow: string; peptideEyebrow: string; peptides: string;
    purchasePending: string;
    lineupAlt: string;
    introAria: string; introStart: string; introSkipAria: string; // introStart: {brand}
    guideNote: string;
    /** 상단 띠 배너(런칭 프로모션) */
    promo: { badge: string; text: string; textShort: string; open: string; live: string; cta: string; close: string };
  };
  seo: { title: string; description: string; keywords: string[]; ogAlt: string };
  jsonld: {
    keyIngredient: string; trialProp: string; birthdayAlias: string;
    videoClinicalName: string; videoClinicalDesc: string; videoCinematicName: string; videoCinematicDesc: string;
    faq: { q: string; a?: string }[]; // a 가 없는 항목은 데이터에서 조립
    howtoAnswerTail: string;
  };
}

function stripCopy<T>(node: T): Strip<T> {
  if (Array.isArray(node)) return node.map((n) => stripCopy(n)) as Strip<T>;
  if (node && typeof node === "object") {
    const o = node as Record<string, unknown>;
    if (typeof o.text === "string" && typeof o.source === "string") return o.text as Strip<T>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(o)) out[k] = stripCopy(o[k]);
    return out as Strip<T>;
  }
  return node as Strip<T>;
}

const ing = (id: IngredientId) => keyIngredients.find((i) => i.id === id)!;
const cl = (id: ClinicalId) => clinical.find((c) => c.id === id)!;

/** 한국어 — 데이터 파일(상세페이지 원문)에서 그대로 생성 */
export const ko: Messages = {
  copy: stripCopy(copy),
  product: { brandLocal: product.brandKo, nameLocal: product.nameKo, shortName: "벌스데이 크림", tagline: product.tagline, concept: product.concept },
  ingredients: {
    pdrn: { name: ing("pdrn").name, claim1: ing("pdrn").claim1, claim2: ing("pdrn").claim2 },
    gf: { name: ing("gf").name, claim1: ing("gf").claim1, claim2: ing("gf").claim2 },
    peptide: { name: ing("peptide").name, claim1: ing("peptide").claim1, claim2: ing("peptide").claim2, sub: ing("peptide").sub },
    cica: { name: ing("cica").name, claim1: ing("cica").claim1, claim2: ing("cica").claim2, sub: ing("cica").sub },
  },
  pdrn: { gens: pdrnGenerations.map((g) => ({ name: g.name, line1: g.line1, line2: g.line2 })), purity: purityClaim.text, purityNote: "원료 순도 표기는 원료사 자료 기준이며, 제품 처방 근거는 검토 중입니다." },
  trial: { institute: trial.institute, subjects: trial.subjects, period: trial.period, usage: trial.usage, disclaimer: trial.disclaimer },
  clinical: {
    "cheek-lifting": { label: cl("cheek-lifting").label, footnote: cl("cheek-lifting").footnote, method: cl("cheek-lifting").method },
    "neck-wrinkle": { label: cl("neck-wrinkle").label, footnote: cl("neck-wrinkle").footnote, method: cl("neck-wrinkle").method },
    "adverse-events": { label: cl("adverse-events").label, footnote: cl("adverse-events").footnote },
  },
  satisfaction: { tag: "주관적 설문", items: satisfaction.items.map((i) => ({ when: i.when, text: i.text })), footnote: satisfaction.footnote },
  howto: { intro: howto.intro, steps: howto.steps.map((s) => ({ ...s })) },
  lineup: { steps: lineup.steps.map((s) => ({ tag: s.tag, name: s.name })), day: "DAY", night: "NIGHT" },
  ui: {
    langLabel: "언어 선택",
    chapters: "챕터",
    footerNav: "하단",
    footerLinks: { clinical: "임상 시험 조건", ingredients: "성분", howto: "사용법", brand: "브랜드 소개" },
    footerLegal: "임상 수치는 {institute} 인체적용시험({code}, {subjects}, {period}, {usage}) 결과이며 {disclaimer} 사용 만족도는 동일 시험의 주관적 설문 결과입니다.",
    soundOn: "사운드 켜기", soundOff: "사운드 끄기",
    heroFilm: "임상 강조 필름",
    productExplore: "제품 살펴보기", productJar: "용기", productPoints: "제품 포인트",
    inspectorHint: "제품 3D 인스펙터: 드래그로 회전, 더블클릭으로 초기화", zoomIn: "확대", zoomOut: "축소",
    pdrnCompare: "PDRN 세대 비교", pdrnImage: "{name} 이미지",
    moistureAlt: "시카 컴플렉스·우레아 비주얼",
    clinicalEyebrow: "Clinical · 인체적용시험", instrument: "기기 측정", before: "사용 전", after: "4주 후", conditions: "시험 조건 보기", safety: "Safety", casesUnit: "건",
    nobelBadge: "NOBEL PRIZE INGREDIENT", nobelEyebrow: "Nobel Prize Ingredient", peptideEyebrow: "Expression Lines Care", peptides: "핵심 펩타이드 2종",
    purchasePending: "구매 페이지 URL 확정 전 — 임시로 사용법 섹션으로 연결됩니다.",
    lineupAlt: "유니앤코어 스킨케어 가이드 — 6단계 루틴",
    introAria: "인트로 영상", introStart: "{brand} 시작하기", introSkipAria: "인트로 영상 건너뛰기",
    guideNote: "",
    promo: {
      badge: "LAUNCH PROMOTION",
      text: "6개 패키지 26% 할인 · 1,494,000원 → 1,100,000원",
      textShort: "6개 패키지 26% 할인",
      open: "11월 10일(화) 오후 3시 오픈",
      live: "프로모션 진행 중",
      cta: "구매하기",
      close: "배너 닫기",
    },
  },
  seo: { title: seo.title, description: seo.description, keywords: [...seo.keywords], ogAlt: `${product.brandKo} ${product.nameKo} — ${product.subtitle}` },
  jsonld: {
    keyIngredient: "핵심 성분", trialProp: "인체적용시험", birthdayAlias: `${product.brandKo} 버스데이 크림`,
    videoClinicalName: "임상 강조 필름", videoClinicalDesc: `4주 인체적용시험 결과를 담은 ${product.brandKo} ${product.nameKo} 세로 필름 (60초)`,
    videoCinematicName: "시네마틱 필름", videoCinematicDesc: `피부의 첫 번째 생일, ${product.subtitle}. ${product.brandKo} ${product.nameKo} 브랜드 필름 (62초)`,
    faq: [
      { q: "1ST BIRTHDAY CREAM은 어떻게 사용하나요?" },
      { q: "인체적용시험 결과는 무엇인가요?" },
      { q: "핵심 성분은 무엇인가요?" },
      { q: "용량과 라인업 내 사용 순서는?" },
    ],
    howtoAnswerTail: "세안 후 스킨케어 마지막 단계(크림 단계)에 사용합니다.",
  },
};

/** "{key}" 치환 */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
