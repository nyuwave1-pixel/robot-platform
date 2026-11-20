import { describe, expect, it } from "vitest";
import ko from "../../src/lib/i18n/locales/ko";
import en from "../../src/lib/i18n/locales/en";
import ja from "../../src/lib/i18n/locales/ja";
import zh from "../../src/lib/i18n/locales/zh";
import es from "../../src/lib/i18n/locales/es";
import vi from "../../src/lib/i18n/locales/vi";
import ru from "../../src/lib/i18n/locales/ru";
import { sanitizeEvent } from "../../src/lib/events";
import { DEFAULT_CONFIG, mergeConfig } from "../../src/lib/appConfig";
import { DEFAULT_CALIBRATION, toIndex } from "../../src/lib/analysis/calibration";
import { compareResults, similarityTransform } from "../../src/lib/analysis/compare";
import { buildCarePlan } from "../../src/lib/care/recommend";
import { PRODUCTS, PRODUCT_ORDER, ROUTINES } from "../../src/lib/care/knowledge";
import { analyzeNormalized } from "../../src/lib/analysis/engine";
import { simRegion, simulate } from "../../src/lib/analysis/simulate";
import { CANONICAL, FACE_ZONES } from "../../src/lib/analysis/zones";
import type { AnalysisResult, SurveyAnswers, ZoneResult } from "../../src/lib/analysis/types";

// ── i18n ──────────────────────────────────────────────────
function shape(v: unknown, path = ""): string[] {
  if (Array.isArray(v)) return [`${path}[${v.length}]`, ...v.flatMap((x, i) => shape(x, `${path}.${i}`))];
  if (v && typeof v === "object") return Object.entries(v).flatMap(([k, x]) => shape(x, `${path}.${k}`));
  return [path];
}
const placeholders = (v: unknown, path = ""): string[] =>
  typeof v === "string" ? [`${path}:${(v.match(/\{\w+\}/g) ?? []).sort().join("")}`] : v && typeof v === "object" ? Object.entries(v).flatMap(([k, x]) => placeholders(x, `${path}.${k}`)) : [];

describe("i18n resources", () => {
  const locales = { en, ja, zh, es, vi, ru };
  for (const [name, dict] of Object.entries(locales)) {
    it(`${name}: same keys and array lengths as ko`, () => expect(shape(dict)).toEqual(shape(ko)));
    it(`${name}: same placeholders as ko`, () => expect(placeholders(dict)).toEqual(placeholders(ko)));
    it(`${name}: simulation disclaimer present and no empty strings`, () => {
      expect(dict.sim.disclaimer.length).toBeGreaterThan(10);
      // kb.products.*.fn 은 기능성 표기가 없는 상품에서 의도적으로 빈 문자열이다
      expect(JSON.stringify(dict).replace(/"fn":""/g, "")).not.toContain('""');
    });
  }
  it("knowledge base text exists for every routine step and direction", () => {
    for (const r of Object.values(ROUTINES)) {
      expect(ko.kb.routines[r.id].steps.length).toBe(r.steps.length);
      expect(ko.kb.routines[r.id].directions.length).toBe(r.directionAreas.length);
      expect(r.steps.reduce((s, x) => s + x.minutes, 0)).toBe(r.totalMinutes);
    }
  });
  it("product links point to the official shop only", () => {
    for (const p of Object.values(PRODUCTS)) expect(p.url).toMatch(/^https:\/\/www\.unincore\.com\/shopping\/search\/view\.do\?productSeq=\d+$/);
  });
});

// ── 이벤트·설정 검증 ───────────────────────────────────────
describe("telemetry sanitizer", () => {
  it("drops unknown types and unknown props", () => {
    expect(sanitizeEvent({ type: "evil", sid: "a" })).toBeNull();
    expect(sanitizeEvent({ type: "visit" })).toBeNull();
    const e = sanitizeEvent({ type: "product_click", sid: "abc-123", locale: "ko", props: { product: "cream", image: "data:image/png;base64,AAAA", landmarks: [1, 2], score: 88 } });
    expect(e?.props).toEqual({ product: "cream" });
  });
  it("strips unsafe characters", () => {
    const e = sanitizeEvent({ type: "upload_rejected", sid: "s<script>", locale: "ko", props: { reason: "no_face<img onerror=x>" } });
    expect(e?.sid).toBe("sscript");
    expect(e?.props?.reason).not.toMatch(/[<>= ]/);
  });
});
describe("config merge", () => {
  it("falls back to defaults on garbage and rejects non-official URLs", () => {
    expect(mergeConfig("x")).toEqual(DEFAULT_CONFIG);
    const c = mergeConfig({ products: { cream: { enabled: false, url: "https://evil.example.com/x" } }, links: { freeTrial: "javascript:alert(1)" }, retention: { sessionMinutes: 99999 }, locales: ["en"] });
    expect(c.products.cream).toEqual({ enabled: false, url: DEFAULT_CONFIG.products.cream.url });
    expect(c.links.freeTrial).toBe(DEFAULT_CONFIG.links.freeTrial);
    expect(c.retention.sessionMinutes).toBe(240);
    expect(c.locales).toEqual(["ko", "en"]);
  });
  it("index mapping is clamped", () => {
    expect(toIndex(-5, { lo: 0, hi: 10 })).toBe(0);
    expect(toIndex(5, { lo: 0, hi: 10 })).toBe(50);
    expect(toIndex(50, { lo: 0, hi: 10 })).toBe(100);
  });
});

// ── 결과 픽스처 ────────────────────────────────────────────
function zone(id: string, o: Partial<ZoneResult> = {}): ZoneResult {
  return { zone: id as ZoneResult["zone"], texture: 80, wrinkleVisibility: 10, nasolabialVisibility: null, poreVisibility: 10, toneUniformity: 80, pigmentVisibility: 10, rednessVisibility: 10, underEyeDarkness: null, shine: 0, conditionIndex: 85, confidence: 0.9, ...o };
}
function result(o: { zones?: ZoneResult[]; cat?: Partial<AnalysisResult["analysis"]["categories"]>; capture?: Partial<NonNullable<AnalysisResult["imageQuality"]["capture"]>>; yaw?: number } = {}): AnalysisResult {
  return {
    schemaVersion: "1.0", sessionId: "t", analyzedAt: "2026-01-01T00:00:00Z", isMock: false, provider: { id: "local-cv", kind: "on-device", imageLeftDevice: false },
    modelVersion: "t", validation: { status: "engineering-calibrated", note: "" },
    imageQuality: { score: 80, faceDetected: true, faceCount: 1, frontalScore: 90, lightingScore: 80, sharpnessScore: 80, resolutionScore: 100, pose: { yaw: o.yaw ?? 0, pitch: 0, roll: 0 }, faceWidthPx: 640, imageSize: { width: 1000, height: 1200 }, issues: [], capture: { skinL: 65, skinA: 12, skinB: 16, sideDeltaL: 4, sharpness: 8, ...o.capture }, passed: true },
    analysis: {
      overallConditionScore: 80, confidence: 0.9, needsRetake: false,
      categories: { textureUniformity: 80, wrinkleVisibility: 10, poreVisibility: 10, toneUniformity: 80, pigmentVisibility: 10, rednessVisibility: 10, eyeAreaCondition: 80, cheekTexture: 80, jawlineTexture: 80, overallCondition: 80, ...o.cat },
      zones: o.zones ?? FACE_ZONES.map((z) => zone(z.id)), topConcerns: [], measurable: [], notMeasurable: [],
    },
    survey: null, careRecommendations: [], simulation: { disclaimer: "", periods: ["4weeks", "8weeks", "12weeks"] },
  };
}
const survey = (o: Partial<SurveyAnswers> = {}): SurveyAnswers => ({ dryness: null, oiliness: null, sensitivity: null, tightness: null, troubleFrequency: null, goals: [], routineLevel: null, currentProducts: [], deviceContraindication: false, ...o });

// ── 전후 비교 ──────────────────────────────────────────────
describe("before/after comparison", () => {
  const cal = DEFAULT_CALIBRATION;
  it("identical results → no change everywhere", () => {
    const c = compareResults(result(), result(), cal);
    expect(c.conditionIssues).toEqual([]);
    expect(c.categories.every((m) => m.verdict === "no_change")).toBe(true);
    expect(c.zones.every((z) => z.verdict === "no_change")).toBe(true);
  });
  it("change within the noise band is not reported as improvement", () => {
    const c = compareResults(result(), result({ cat: { wrinkleVisibility: 10 - cal.compareNoiseBand, textureUniformity: 80 + cal.compareNoiseBand } }), cal);
    expect(c.categories.find((m) => m.metric === "wrinkleVisibility")?.verdict).toBe("no_change");
    expect(c.categories.find((m) => m.metric === "texture")?.verdict).toBe("no_change");
  });
  it("direction respects metric polarity", () => {
    const c = compareResults(result({ cat: { wrinkleVisibility: 50, toneUniformity: 50 } }), result({ cat: { wrinkleVisibility: 30, toneUniformity: 30 } }), cal);
    expect(c.categories.find((m) => m.metric === "wrinkleVisibility")?.verdict).toBe("improved");
    expect(c.categories.find((m) => m.metric === "toneUniformity")?.verdict).toBe("worsened");
  });
  it("different lighting → color metrics not comparable even if numbers look better", () => {
    const c = compareResults(result({ cat: { rednessVisibility: 60 } }), result({ cat: { rednessVisibility: 10 }, capture: { skinL: 82, skinB: 30 } }), cal);
    expect(c.conditionIssues).toContain("lighting_level");
    expect(c.conditionIssues).toContain("white_balance");
    expect(c.categories.find((m) => m.metric === "rednessVisibility")?.verdict).toBe("not_comparable");
  });
  it("different sharpness or pose → detail metrics not comparable", () => {
    const blur = compareResults(result({ cat: { poreVisibility: 60 } }), result({ cat: { poreVisibility: 5 }, capture: { sharpness: 3 } }), cal);
    expect(blur.categories.find((m) => m.metric === "poreVisibility")?.verdict).toBe("not_comparable");
    expect(blur.categories.find((m) => m.metric === "toneUniformity")?.verdict).toBe("no_change");
    const pose = compareResults(result(), result({ yaw: 15 }), cal);
    expect(pose.categories.every((m) => m.verdict === "not_comparable")).toBe(true);
  });
  it("similarity transform recovers scale/rotation/translation", () => {
    const from = new Float32Array([0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0]);
    const to = new Float32Array(12);
    const a = 1.5 * Math.cos(0.3), b = 1.5 * Math.sin(0.3);
    for (let i = 0; i < 4; i++) { to[3 * i] = a * from[3 * i] - b * from[3 * i + 1] + 7; to[3 * i + 1] = b * from[3 * i] + a * from[3 * i + 1] - 3; }
    const m = similarityTransform(from, to, [0, 1, 2, 3]);
    expect(m.a).toBeCloseTo(a, 4); expect(m.b).toBeCloseTo(b, 4); expect(m.tx).toBeCloseTo(7, 4); expect(m.ty).toBeCloseTo(-3, 4);
  });
});

// ── 추천 엔진 ──────────────────────────────────────────────
describe("care recommendation", () => {
  it("different inputs produce different routines", () => {
    const tone = buildCarePlan(result({ cat: { pigmentVisibility: 70 } }), survey());
    const wr = buildCarePlan(result({ cat: { wrinkleVisibility: 70 } }), survey());
    const sens = buildCarePlan(result({ cat: { wrinkleVisibility: 70 } }), survey({ sensitivity: 3 }));
    expect(tone.night).toBe("night_brightening");
    expect(wr.night).toBe("night_wrinkle");
    expect(sens.night).toBe("night_soothing");
    expect(sens.frequency).toBe("gentle");
  });
  it("contraindication blocks every device routine and recommendation", () => {
    const p = buildCarePlan(result({ cat: { wrinkleVisibility: 90 } }), survey({ deviceContraindication: true, goals: ["contour"] }));
    expect(p.deviceBlocked).toBe(true);
    expect(p.night).toBeNull();
    expect(p.day).toBeNull();
    expect(p.products).not.toContain("device");
    expect(p.recommendations.some((r) => ["rf", "ultrasonic", "iontophoresis"].includes(r.technology))).toBe(false);
    expect(p.recommendations[0].id).toBe("device_blocked");
  });
  it("every recommendation carries reasons and cautions; only official routines are referenced", () => {
    const zones = FACE_ZONES.map((z) => zone(z.id, z.id.includes("cheek") ? { texture: 40, pigmentVisibility: 60, nasolabialVisibility: 55, rednessVisibility: 50 } : z.id.includes("under_eye") ? { underEyeDarkness: 60, wrinkleVisibility: 55 } : {}));
    const p = buildCarePlan(result({ zones }), survey({ dryness: 2, goals: ["contour"] }));
    expect(p.recommendations.length).toBeGreaterThanOrEqual(3);
    for (const r of p.recommendations) {
      expect(r.reasons.length).toBeGreaterThan(0);
      expect(r.cautions.length).toBeGreaterThan(0);
      if (r.routineId) expect(Object.keys(ROUTINES)).toContain(r.routineId);
      for (const c of r.cautions) expect(Object.keys(ko.kb.cautions)).toContain(c);
    }
    expect(p.recommendations.find((r) => r.id === "eye_gentle")?.technology).toBe("general");
    expect(p.products).toContain("mist");
  });
  it("product recommendations carry reasons tied to the user's own result and follow the official guide order", () => {
    const pig = FACE_ZONES.map((z) => zone(z.id, z.id.includes("cheek") ? { pigmentVisibility: 70 } : {}));
    const a = buildCarePlan(result({ zones: pig }), survey());
    expect(a.products).toContain("ampoule");
    expect(a.productReasons.ampoule?.some((r) => r.type === "observation" && r.metric === "pigmentVisibility")).toBe(true);
    expect(a.products).not.toContain("birthdayCream");
    const b = buildCarePlan(result({}), survey({ sensitivity: 3, dryness: 3, goals: ["wrinkle_firming"] }));
    expect(b.productReasons.tonerPad?.some((r) => r.type === "survey" && r.key === "sensitivity")).toBe(true);
    expect(b.productReasons.birthdayCream?.some((r) => r.type === "goal")).toBe(true);
    for (const plan of [a, b]) {
      // 모든 추천 제품에 근거가 있고, 공식 가이드 순서를 따른다
      for (const id of plan.products) expect(plan.productReasons[id]?.length).toBeGreaterThan(0);
      const idx = plan.products.map((id) => PRODUCT_ORDER.indexOf(id));
      expect(idx).toEqual([...idx].sort((x, y) => x - y));
      expect(plan.products).toContain("sunscreen");
      // 같은 미백 단계 제품은 2개까지만
      expect(plan.products.filter((id) => PRODUCTS[id].step === "brighten").length).toBeLessThanOrEqual(2);
    }
    // 기기 금기 → 디바이스는 빠지고 스킨케어 제품만
    const c = buildCarePlan(result({ zones: pig }), survey({ deviceContraindication: true }));
    expect(c.products).not.toContain("device");
    expect(c.products.length).toBeGreaterThan(0);
  });
  it("every product has official copy in every locale", () => {
    for (const id of PRODUCT_ORDER) {
      expect(ko.kb.products[id].points.length).toBe(3);
      expect(ko.kb.products[id].how.length).toBeGreaterThan(10);
      expect(Object.keys(ko.care.guideSteps)).toContain(PRODUCTS[id].step);
    }
  });
  it("high redness shows the expert-consult notice and prefers soothing", () => {
    const p = buildCarePlan(result({ cat: { rednessVisibility: 75, wrinkleVisibility: 80 } }), survey());
    expect(p.rednessNotice).toBe(true);
    expect(p.night).toBe("night_soothing");
  });
  it("admin-disabled routines are never recommended", () => {
    const p = buildCarePlan(result({ cat: { pigmentVisibility: 70 } }), survey(), { routinesEnabled: { night_brightening: false, day_makeup: false } });
    expect(p.night).not.toBe("night_brightening");
    expect(p.day).toBe("day_depuff");
  });
});

// ── 엔진: 합성 얼굴 ────────────────────────────────────────
function syntheticFace(mod?: (x: number, y: number, rgb: [number, number, number]) => void) {
  const w = 860, h = 940;
  const lm = new Float32Array(478 * 3);
  // canonical 모델을 얼굴 폭 640px 로 투영
  let minX = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < 468; i++) { minX = Math.min(minX, CANONICAL[3 * i]); maxX = Math.max(maxX, CANONICAL[3 * i]); maxY = Math.max(maxY, CANONICAL[3 * i + 1]); }
  const k = 640 / (CANONICAL[454 * 3] - CANONICAL[234 * 3]);
  for (let i = 0; i < 468; i++) { lm[3 * i] = (CANONICAL[3 * i] - minX) * k + 100; lm[3 * i + 1] = (maxY - CANONICAL[3 * i + 1]) * k + 110; lm[3 * i + 2] = -CANONICAL[3 * i + 2] * k; }
  const data = new Uint8ClampedArray(w * h * 4);
  let s = 12345;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const rgb: [number, number, number] = [205, 160, 135];
    const n = (rnd() - 0.5) * 6;
    rgb[0] += n; rgb[1] += n; rgb[2] += n;
    // 눈 위치에 선명한 경계(홍채·속눈썹 역할)를 그려 선명도 판정이 가능하게 한다 — 균일한 면만 있으면 엔진이 "흐림"으로 보고 값을 만들지 않는다
    for (const [a, b] of [[159, 145], [386, 374]]) {
      const ex = (lm[3 * a] + lm[3 * b]) / 2, ey = (lm[3 * a + 1] + lm[3 * b + 1]) / 2;
      if (Math.hypot(x - ex, (y - ey) * 2) < 34) { const v = ((x >> 1) + (y >> 1)) % 2 ? 30 : 235; rgb[0] = rgb[1] = rgb[2] = v; }
    }
    // 입술 위치에도 경계를 둔다 (입술은 분석 제외 부위)
    if (Math.hypot(x - lm[3 * 13], (y - (lm[3 * 13 + 1] + lm[3 * 14 + 1]) / 2) * 3) < 80) { const v = ((x >> 1) + (y >> 1)) % 2 ? 90 : 200; rgb[0] = v; rgb[1] = v * 0.5; rgb[2] = v * 0.5; }
    mod?.(x, y, rgb);
    const p = (y * w + x) * 4;
    data[p] = rgb[0]; data[p + 1] = rgb[1]; data[p + 2] = rgb[2]; data[p + 3] = 255;
  }
  return { raster: { width: w, height: h, data }, landmarks: lm, sourceScale: 1, pose: { yaw: 0, pitch: 0, roll: 0 } };
}
describe("analysis engine (synthetic face)", () => {
  const base = analyzeNormalized(syntheticFace());
  it("is deterministic", () => {
    const again = analyzeNormalized(syntheticFace());
    expect(again.overall).toBe(base.overall);
    expect(again.zones).toEqual(base.zones);
  });
  it("returns 13 zones with schema-conformant values", () => {
    expect(base.zones.map((z) => z.zone)).toEqual(FACE_ZONES.map((z) => z.id));
    for (const z of base.zones) for (const v of [z.texture, z.wrinkleVisibility, z.poreVisibility, z.toneUniformity, z.conditionIndex]) if (v !== null) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(100); }
    expect(base.overall).not.toBeNull();
  });
  const cheek = (o: ReturnType<typeof analyzeNormalized>) => o.zones.find((z) => z.zone === "right_cheek")!;
  const inCheek = (x: number, y: number) => x > 175 && x < 295 && y > 435 && y < 555;
  it("dark horizontal lines raise wrinkle visibility in that zone only", () => {
    const fh = (o: ReturnType<typeof analyzeNormalized>) => o.zones.find((z) => z.zone === "forehead")!;
    const o = analyzeNormalized(syntheticFace((x, y, rgb) => { if (x > 330 && x < 530 && y > 150 && y < 250 && y % 14 < 2) { rgb[0] -= 30; rgb[1] -= 27; rgb[2] -= 24; } }));
    expect(fh(o).wrinkleVisibility!).toBeGreaterThan(fh(base).wrinkleVisibility! + 15);
    expect(cheek(o).texture).toBe(cheek(base).texture);
    expect(o.zones.find((z) => z.zone === "chin")!.wrinkleVisibility).toBe(base.zones.find((z) => z.zone === "chin")!.wrinkleVisibility);
  });
  it("red patch raises redness; dark spots raise pigment visibility", () => {
    const red = analyzeNormalized(syntheticFace((x, y, rgb) => { if (inCheek(x, y)) { rgb[0] += 10; rgb[1] -= 7; rgb[2] -= 3; } }));
    expect(cheek(red).rednessVisibility!).toBeGreaterThan(cheek(base).rednessVisibility! + 10);
    const spots = analyzeNormalized(syntheticFace((x, y, rgb) => { if (inCheek(x, y) && (x % 24) < 6 && (y % 24) < 6) { rgb[0] -= 24; rgb[1] -= 21; rgb[2] -= 18; } }));
    expect(cheek(spots).pigmentVisibility!).toBeGreaterThan(cheek(base).pigmentVisibility! + 10);
  });
  it("occluded zone (non-skin colour) returns nulls instead of invented numbers", () => {
    const o = analyzeNormalized(syntheticFace((x, y, rgb) => { if (y > 640) { rgb[0] = 60; rgb[1] = 110; rgb[2] = 200; } }));
    const chin = o.zones.find((z) => z.zone === "chin")!;
    expect(chin.conditionIndex).toBeNull();
    expect(chin.texture).toBeNull();
    expect(chin.nullReason).toBe("occluded");
    expect(o.stats.lowerFaceCoverage).toBeLessThan(0.35);
  });
  it("simulation changes only skin pixels and never the geometry inputs", () => {
    const o = base.visual;
    const sim = simulate(o, "12weeks");
    const region = simRegion(o);
    let changedOutside = 0, changedInside = 0, nonSkin = 0;
    for (let i = 0; i < o.zoneMap.length; i++) {
      const d = Math.abs(sim[4 * i] - o.rgba[4 * i]) + Math.abs(sim[4 * i + 1] - o.rgba[4 * i + 1]) + Math.abs(sim[4 * i + 2] - o.rgba[4 * i + 2]);
      if (d > 1) (region[i] > 0 ? changedInside++ : changedOutside++);
      if (region[i] > 0 && !o.skinMask[i]) nonSkin++;
    }
    expect(changedInside).toBeGreaterThan(1000);
    // 적용 영역 밖과 피부가 아닌 픽셀(눈·입·머리카락·배경)은 바뀌지 않는다
    expect(changedOutside).toBe(0);
    expect(nonSkin).toBe(0);
    // 12주 연출은 원본과 뚜렷하게 달라야 하고, 4주 < 8주 < 12주 순으로 강해진다
    const diff = (x: Uint8ClampedArray) => { let t = 0; for (let i = 0; i < x.length; i += 4) t += Math.abs(x[i] - o.rgba[i]); return t; };
    const d4 = diff(simulate(o, "4weeks")), d8 = diff(simulate(o, "8weeks")), d12 = diff(sim);
    expect(d4).toBeLessThan(d8);
    expect(d8).toBeLessThan(d12);
    expect(sim.length).toBe(o.rgba.length);
  });
});
