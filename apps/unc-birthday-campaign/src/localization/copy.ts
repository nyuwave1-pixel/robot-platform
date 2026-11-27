import type { CampaignId, Lang } from "../rendering/types";

/**
 * Localised campaign copy (KO master → EN / ZH-Hans localisation, not literal translation).
 * Markup: **accent** = champagne-gold accent run, \n = preferred line break.
 * Clinical numbers always travel with a footnote that names the test, subjects and the individual-variation notice.
 */

export interface Item { key: string; title: string; desc: string }
export interface Stat { value: string; unit: string; label: string; detail: string }

export interface CampaignCopy {
  eyebrow: string;       // campaign label (English brand style in every language)
  headline: string;
  sub: string;
  cta: string;
  /** fallback when the CTA does not fit (strip banners) */
  ctaShort?: string;
  items?: Item[];
  stats?: Stat[];
  footnote?: "clinical" | "story";
}

export interface SharedCopy {
  slogan: string; concept: string; product: string; size: string; brandMsg: string; url: string;
  footClinicalFull: string; footClinicalShort: string; /** smallest canvases only — still names test, n, duration, method, p and variance */ footClinicalMini: string; footStory: string; qrLabel: string; madeIn: string;
}

export const SHARED: Record<Lang, SharedCopy> = {
  ko: {
    slogan: "YOUR SKIN HAS A BIRTHDAY.",
    concept: "SKIN RE:BIRTH",
    product: "1ST BIRTHDAY CREAM",
    size: "50g / 1.76 oz",
    brandMsg: "시간을 되돌려 처음으로 맞이할 내 피부의 첫 번째 생일",
    url: "birthday.unincore.com",
    footClinicalFull: "*한국피부과학연구원 인체적용시험(KIDS-BEL087-USU), 만 27~67세 성인 남녀 21명, 2025.12.24~2026.01.21. 4주간 1일 2회 사용 후 ANTERA 3D 측정: 볼 함몰 부피(Depressions medium) 3.03→1.56mm³, 목 주름 지수(Wrinkles large) 55.74→45.12(p<.001). 피부 이상반응 0건. 완제품 시험 결과이며 개인차가 있을 수 있음.",
    footClinicalShort: "*한국피부과학연구원 인체적용시험(KIDS-BEL087-USU), 성인 남녀 21명, 4주·1일 2회 사용, ANTERA 3D 측정(p<.001). 완제품 결과이며 개인차가 있을 수 있음.",
    footClinicalMini: "*KIDS 인체적용시험(KIDS-BEL087-USU), 21명·4주, ANTERA 3D 측정(p<.001). 개인차가 있을 수 있음.",
    footStory: "*28일은 피부 턴오버 주기에 관한 일반적인 개념을 바탕으로 한 브랜드 스토리텔링이며, 개인별 결과를 보장하지 않습니다.",
    qrLabel: "공식 사이트에서 자세히 보기",
    madeIn: "UNI&CORE · MADE IN KOREA",
  },
  en: {
    slogan: "YOUR SKIN HAS A BIRTHDAY.",
    concept: "SKIN RE:BIRTH",
    product: "1ST BIRTHDAY CREAM",
    size: "50g / 1.76 oz",
    brandMsg: "Turn back time and welcome your skin's very first birthday.",
    url: "birthday.unincore.com/en",
    footClinicalFull: "*Human application test by the Korea Institute of Dermatological Sciences (KIDS-BEL087-USU), 21 adults aged 27–67, Dec 24, 2025 – Jan 21, 2026. Measured with ANTERA 3D after 4 weeks of twice-daily use: cheek depression volume (Depressions medium) 3.03→1.56 mm³; neck wrinkle index (Wrinkles large) 55.74→45.12 (p<.001). 0 adverse skin reactions. Finished-product results; individual results may vary.",
    footClinicalShort: "*KIDS human application test (KIDS-BEL087-USU), 21 adults, 4 weeks of twice-daily use, ANTERA 3D (p<.001). Finished-product results; individual results may vary.",
    footClinicalMini: "*KIDS test (KIDS-BEL087-USU), n=21, 4 weeks, ANTERA 3D (p<.001). Individual results may vary.",
    footStory: "*The 28 days are brand storytelling based on the general concept of the skin turnover cycle and do not guarantee individual results.",
    qrLabel: "Discover more",
    madeIn: "UNI&CORE · MADE IN KOREA",
  },
  zh: {
    slogan: "YOUR SKIN HAS A BIRTHDAY.",
    concept: "SKIN RE:BIRTH",
    product: "1ST BIRTHDAY CREAM",
    size: "50g / 1.76 oz",
    brandMsg: "让时间倒流，迎接肌肤的第一个生日。",
    url: "birthday.unincore.com/zh",
    footClinicalFull: "*韩国皮肤科学研究院人体适用试验（KIDS-BEL087-USU），27~67周岁成年男女21人，2025.12.24~2026.01.21。每日2次、连续使用4周后经ANTERA 3D测量：面颊凹陷体积（Depressions medium）3.03→1.56mm³，颈部皱纹指数（Wrinkles large）55.74→45.12（p<.001）。皮肤不良反应0例。为成品测试结果，可能存在个体差异。",
    footClinicalShort: "*韩国皮肤科学研究院人体适用试验（KIDS-BEL087-USU），成年男女21人，每日2次、连续4周，ANTERA 3D测量（p<.001）。为成品测试结果，可能存在个体差异。",
    footClinicalMini: "*KIDS人体适用试验（KIDS-BEL087-USU），21人·4周，ANTERA 3D测量（p<.001）。存在个体差异。",
    footStory: "*28天为基于肌肤更新周期一般概念的品牌故事表达，不代表个人效果保证。",
    qrLabel: "扫码了解更多",
    madeIn: "UNI&CORE · 韩国制造",
  },
};

export const COPY: Record<CampaignId, Record<Lang, CampaignCopy>> = {
  "skin-rebirth": {
    ko: { eyebrow: "SKIN RE:BIRTH", headline: "피부에도 다시 태어나는\n**생일**이 있습니다.", sub: "시간을 되돌려 처음으로 맞이할 내 피부의 첫 번째 생일.", cta: "새로운 피부의 시작" },
    en: { eyebrow: "SKIN RE:BIRTH", headline: "YOUR SKIN HAS\nA **BIRTHDAY**.", sub: "Rediscover the beauty of your skin.\nCelebrate a new beginning.", cta: "DISCOVER YOUR FIRST BIRTHDAY", ctaShort: "DISCOVER NOW" },
    zh: { eyebrow: "SKIN RE:BIRTH", headline: "让肌肤，\n迎来崭新的**生日**。", sub: "重启肌肤之美，开启焕新护肤体验。", cta: "开启肌肤的全新生日" },
  },
  "28-days": {
    ko: { eyebrow: "THE 28 DAYS", headline: "**28일**, 새로운 피부의\n시간을 경험하다.", sub: "각질이 떨어져 나가는 14일, 세포가 생성되는 14일.", cta: "제품 자세히 보기", footnote: "story" },
    en: { eyebrow: "THE 28 DAYS", headline: "**28 DAYS.**\nA NEW TIME FOR YOUR SKIN.", sub: "14 days to shed, 14 days to renew —\n28 days of new skin time.", cta: "DISCOVER YOUR FIRST BIRTHDAY", ctaShort: "DISCOVER NOW", footnote: "story" },
    zh: { eyebrow: "THE 28 DAYS", headline: "**28天**，\n感受肌肤的焕新时光。", sub: "角质代谢的14天，肌肤新生的14天。", cta: "立即了解", footnote: "story" },
  },
  "golden-formula": {
    ko: {
      eyebrow: "THE GOLDEN FORMULA", headline: "피부 과학을 담은\n**골든 포뮬러**.", sub: "3세대 인삼 유래 PDRN · 4GF 성장인자 콤플렉스 · 레시틴 2.5% & 세라마이드", cta: "제품 자세히 보기",
      items: [
        { key: "pdrn", title: "3세대 인삼 유래 PDRN", desc: "내려앉은 피부에 차세대 PDRN 리프팅" },
        { key: "gf", title: "4GF 성장인자 콤플렉스", desc: "EGF · IGF · FGF · KGF로 매끈하고 쫀쫀한 피부" },
        { key: "lecithin", title: "레시틴 2.5%", desc: "바르는 즉시, 수분 충전" },
        { key: "ceramide", title: "세라마이드 & 우레아", desc: "수분의 공급과 잠금을 한 번에" },
      ],
    },
    en: {
      eyebrow: "THE GOLDEN FORMULA", headline: "THE **GOLDEN FORMULA**\nOF SKIN SCIENCE.", sub: "3rd Generation Ginseng-Derived PDRN · The 4GF Complex · Lecithin 2.5% & Ceramide", cta: "EXPLORE THE MASTERPIECE", ctaShort: "EXPLORE NOW",
      items: [
        { key: "pdrn", title: "3rd-Gen Ginseng PDRN", desc: "Next-generation PDRN lifting" },
        { key: "gf", title: "The 4GF Complex", desc: "EGF · IGF · FGF · KGF for smooth, bouncy skin" },
        { key: "lecithin", title: "Lecithin 2.5%", desc: "Instant hydration on application" },
        { key: "ceramide", title: "Ceramide & Urea", desc: "Hydration supplied and sealed" },
      ],
    },
    zh: {
      eyebrow: "THE GOLDEN FORMULA", headline: "凝萃肌肤科学的\n**黄金配方**。", sub: "第三代人参来源PDRN · 4GF复合成分 · 2.5%卵磷脂与神经酰胺", cta: "探索臻选护肤之美",
      items: [
        { key: "pdrn", title: "第三代人参来源PDRN", desc: "新一代PDRN提拉" },
        { key: "gf", title: "4GF复合成分", desc: "EGF · IGF · FGF · KGF，光滑紧致" },
        { key: "lecithin", title: "2.5%卵磷脂", desc: "一抹即刻补水" },
        { key: "ceramide", title: "神经酰胺与尿素", desc: "补水与锁水一步到位" },
      ],
    },
  },
  "clinical-beauty": {
    ko: {
      eyebrow: "CLINICAL BEAUTY", headline: "**4주**, 피부 변화를\n확인하다.", sub: "4주 인체적용시험으로 확인한 피부 변화", cta: "제품 자세히 보기", footnote: "clinical",
      stats: [
        { value: "48.33", unit: "%", label: "볼 함몰 부피 개선율", detail: "3.03→1.56mm³ · p<.001" },
        { value: "19.06", unit: "%", label: "목 주름 지수 개선율", detail: "55.74→45.12 · p<.001" },
        { value: "0", unit: "건", label: "피부 이상반응", detail: "4주 · 얼굴·목 사용" },
      ],
    },
    en: {
      eyebrow: "CLINICAL BEAUTY", headline: "**4 WEEKS.**\nSEE THE CHANGE.", sub: "Clinically evaluated skin improvements after 4 weeks", cta: "SHOP NOW", footnote: "clinical",
      stats: [
        { value: "48.33", unit: "%", label: "Improvement in cheek depression volume", detail: "3.03→1.56 mm³ · p<.001" },
        { value: "19.06", unit: "%", label: "Reduction in neck wrinkle index", detail: "55.74→45.12 · p<.001" },
        { value: "0", unit: "", label: "Adverse skin reactions", detail: "4 weeks · face & neck" },
      ],
    },
    zh: {
      eyebrow: "CLINICAL BEAUTY", headline: "**4周**，\n见证肌肤之变。", sub: "4周人体功效测试结果", cta: "立即了解", footnote: "clinical",
      stats: [
        { value: "48.33", unit: "%", label: "面颊凹陷体积改善率", detail: "3.03→1.56mm³ · p<.001" },
        { value: "19.06", unit: "%", label: "颈部皱纹指数改善率", detail: "55.74→45.12 · p<.001" },
        { value: "0", unit: "例", label: "皮肤不良反应", detail: "4周 · 面部及颈部" },
      ],
    },
  },
  masterpiece: {
    ko: { eyebrow: "THE MASTERPIECE", headline: "당신의 피부를 위한\n첫 번째 **마스터피스**.", sub: "지금, 당신의 첫 번째 피부 생일을 시작하세요.", cta: "지금 구매하기" },
    en: { eyebrow: "THE MASTERPIECE", headline: "THE FIRST **MASTERPIECE**\nFOR YOUR SKIN.", sub: "Begin your skin's first birthday today.", cta: "SHOP NOW" },
    zh: { eyebrow: "THE MASTERPIECE", headline: "献给肌肤的\n第一件**臻品**。", sub: "此刻，开启肌肤的第一个生日。", cta: "立即选购" },
  },
};

export const CAMPAIGN_META: Record<CampaignId, { no: string; name: string; purpose: { ko: string; en: string; zh: string } }> = {
  "skin-rebirth": { no: "01", name: "SKIN RE:BIRTH", purpose: { ko: "브랜드 인지도 확대", en: "Brand awareness", zh: "品牌认知" } },
  "28-days": { no: "02", name: "THE 28 DAYS", purpose: { ko: "사용 스토리 · 관심 유도", en: "Story & consideration", zh: "故事与兴趣" } },
  "golden-formula": { no: "03", name: "THE GOLDEN FORMULA", purpose: { ko: "성분 차별화", en: "Ingredient differentiation", zh: "成分差异化" } },
  "clinical-beauty": { no: "04", name: "CLINICAL BEAUTY", purpose: { ko: "임상 데이터 기반 신뢰", en: "Clinical trust", zh: "临床信赖" } },
  masterpiece: { no: "05", name: "THE MASTERPIECE", purpose: { ko: "프리미엄 구매 전환", en: "Premium conversion", zh: "高端转化" } },
};
