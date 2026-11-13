import type { AnalysisResult, CareGoal, CareRecommendation, MetricKey, SurveyAnswers, ZoneId, ZoneResult } from "../analysis/types";
import { GOAL_ROUTINE, ROUTINES, type ProductId, type RoutineId } from "./knowledge";

export interface CarePlan {
  /** 사용자가 '사용하면 안 되는 경우'에 해당한다고 표시 → 기기 루틴을 추천하지 않는다 */
  deviceBlocked: boolean;
  night: RoutineId | null;
  alternativeNight: RoutineId | null;
  day: RoutineId | null;
  /** 주간 권장 빈도 키 (kb.frequency.*) */
  frequency: "standard" | "gentle";
  /** 루틴 선택 근거 점수 (투명성: 리포트에 그대로 노출) */
  drivers: { brightening: number; wrinkle: number; soothing: number };
  /** 관찰값이 높아 방향 안내에서 강조할 부위 */
  focusAreas: ("jaw" | "cheek" | "nose" | "forehead" | "eye" | "neck")[];
  recommendations: CareRecommendation[];
  products: ProductId[];
  /** 관찰된 붉은 기가 높아 전문가 상담 안내를 함께 표시 */
  rednessNotice: boolean;
}

const EMPTY_SURVEY: SurveyAnswers = {
  dryness: null, oiliness: null, sensitivity: null, tightness: null, troubleFrequency: null,
  goals: [], routineLevel: null, currentProducts: [], deviceContraindication: false,
};

function zoneMax(zones: ZoneResult[], ids: ZoneId[], key: MetricKey): { value: number; zone: ZoneId } | null {
  let best: { value: number; zone: ZoneId } | null = null;
  for (const z of zones) {
    if (!ids.includes(z.zone)) continue;
    const v = z[key];
    if (v === null) continue;
    if (!best || v > best.value) best = { value: v, zone: z.zone };
  }
  return best;
}
function zoneMinGood(zones: ZoneResult[], ids: ZoneId[], key: MetricKey): { value: number; zone: ZoneId } | null {
  let best: { value: number; zone: ZoneId } | null = null;
  for (const z of zones) {
    if (!ids.includes(z.zone)) continue;
    const v = z[key];
    if (v === null) continue;
    if (!best || v < best.value) best = { value: v, zone: z.zone };
  }
  return best;
}

const CHEEKS: ZoneId[] = ["left_cheek", "right_cheek"];
const JAW: ZoneId[] = ["left_jawline", "right_jawline", "chin"];
const EYES: ZoneId[] = ["left_eye_corner", "right_eye_corner", "left_under_eye", "right_under_eye"];

/**
 * 규칙 기반 추천. 입력은 (사진 관찰 지수, 설문, 관리 목표)이며 출력의 모든 추천에는 근거(reasons)가 붙는다.
 * 추천 대상은 공식 CARE GUIDE 에 실제로 존재하는 루틴뿐이다.
 */
export function buildCarePlan(
  result: AnalysisResult,
  surveyIn: SurveyAnswers | null,
  opts: { notice?: number; routinesEnabled?: Partial<Record<RoutineId, boolean>>; extraZones?: ZoneResult[] } = {},
): CarePlan {
  /** 관찰값을 "고민"으로 취급하는 기준 (가시성 지수) — 관리자 설정 가능 */
  const NOTICE = opts.notice ?? 40;
  const enabled = (r: RoutineId) => opts.routinesEnabled?.[r] !== false;
  const survey = surveyIn ?? EMPTY_SURVEY;
  const c = result.analysis.categories;
  const zones = [...result.analysis.zones, ...(opts.extraZones ?? [])];
  const goals = new Set<CareGoal>(survey.goals);
  const lvl = (v: number | null) => v ?? 0;

  // 루틴 드라이버 (0~100+): 관찰값 + 설문 + 목표
  const brightening =
    Math.max(c.pigmentVisibility ?? 0, c.toneUniformity !== null ? 100 - c.toneUniformity : 0, c.poreVisibility ?? 0) +
    (goals.has("brightening") ? 25 : 0) + (goals.has("pore_texture") ? 15 : 0);
  const naso = zoneMax(zones, CHEEKS, "nasolabialVisibility");
  const wrinkle =
    Math.max(c.wrinkleVisibility ?? 0, naso?.value ?? 0) + (goals.has("wrinkle_firming") ? 25 : 0) + (goals.has("contour") ? 20 : 0);
  const soothing =
    (c.rednessVisibility ?? 0) + lvl(survey.sensitivity) * 15 + lvl(survey.troubleFrequency) * 8 +
    (goals.has("soothing") ? 25 : 0) + (goals.has("moisture") ? 10 : 0) + (lvl(survey.dryness) + lvl(survey.tightness)) * 4;
  const drivers = { brightening: Math.round(brightening), wrinkle: Math.round(wrinkle), soothing: Math.round(soothing) };

  const sensitive = lvl(survey.sensitivity) >= 2;
  const rednessNotice = (c.rednessVisibility ?? 0) >= 60;
  const deviceBlocked = survey.deviceContraindication;

  // 민감하거나 붉은 기가 높으면 진정 버전을 우선한다 (안전 우선)
  let ranked: RoutineId[];
  if (sensitive || rednessNotice) {
    ranked = ["night_soothing", brightening >= wrinkle ? "night_brightening" : "night_wrinkle"];
  } else {
    const order: [RoutineId, number][] = [
      ["night_brightening", brightening],
      ["night_wrinkle", wrinkle],
      ["night_soothing", soothing],
    ];
    order.sort((a, b) => b[1] - a[1]);
    ranked = order.map((o) => o[0]);
    // 관찰·설문 근거가 전혀 없으면 첫 번째 관리 목표를 따른다
    if (order[0][1] < 20 && survey.goals.length) ranked = [GOAL_ROUTINE[survey.goals[0]], ...ranked.filter((r) => r !== GOAL_ROUTINE[survey.goals[0]])];
  }
  ranked = ranked.filter(enabled);
  const night = deviceBlocked ? null : ranked[0] ?? null;
  const alternativeNight = deviceBlocked ? null : ranked[1] ?? null;
  const ue = zoneMax(zones, ["left_under_eye", "right_under_eye"], "underEyeDarkness");
  const dayPref: RoutineId = night === "night_brightening" && !goals.has("contour") && (ue?.value ?? 0) < 60 ? "day_makeup" : "day_depuff";
  const dayAlt: RoutineId = dayPref === "day_makeup" ? "day_depuff" : "day_makeup";
  const day: RoutineId | null = deviceBlocked ? null : enabled(dayPref) ? dayPref : enabled(dayAlt) ? dayAlt : null;

  // 강조 부위
  const focus: CarePlan["focusAreas"] = [];
  const cheekWorst = Math.max(zoneMax(zones, CHEEKS, "pigmentVisibility")?.value ?? 0, zoneMax(zones, CHEEKS, "poreVisibility")?.value ?? 0, naso?.value ?? 0);
  if (cheekWorst >= NOTICE) focus.push("cheek");
  if ((zoneMax(zones, ["forehead", "glabella"], "wrinkleVisibility")?.value ?? 0) >= NOTICE) focus.push("forehead");
  if ((zoneMax(zones, EYES, "wrinkleVisibility")?.value ?? 0) >= NOTICE || (ue?.value ?? 0) >= NOTICE) focus.push("eye");
  const jawTex = zoneMinGood(zones, JAW, "texture");
  if ((jawTex && jawTex.value <= 100 - NOTICE) || goals.has("contour")) focus.push("jaw");
  if ((zoneMax(zones, ["nose"], "poreVisibility")?.value ?? 0) >= NOTICE) focus.push("nose");
  if (zones.some((z) => z.zone === "neck" && z.wrinkleVisibility !== null)) focus.push("neck");

  // 기능별 추천 (근거 포함)
  const recs: CareRecommendation[] = [];
  const baseCautions = ["applyProductFirst", "lowerIntensity"];
  if (!deviceBlocked) {
    // 이온토포레시스: 볼 피부결·톤 + 건조/보습 설문
    {
      const reasons: CareRecommendation["reasons"] = [];
      const tex = zoneMinGood(zones, CHEEKS, "texture");
      if (tex && tex.value <= 100 - NOTICE + 10) reasons.push({ type: "observation", metric: "texture", zone: tex.zone, value: tex.value });
      const tone = zoneMinGood(zones, [...CHEEKS, "forehead"], "toneUniformity");
      if (tone && tone.value <= 100 - NOTICE + 10) reasons.push({ type: "observation", metric: "toneUniformity", zone: tone.zone, value: tone.value });
      const pig = zoneMax(zones, [...CHEEKS, "forehead"], "pigmentVisibility");
      if (pig && pig.value >= NOTICE) reasons.push({ type: "observation", metric: "pigmentVisibility", zone: pig.zone, value: pig.value });
      if (lvl(survey.dryness) >= 2) reasons.push({ type: "survey", key: "dryness" });
      if (lvl(survey.tightness) >= 2) reasons.push({ type: "survey", key: "tightness" });
      if (goals.has("moisture")) reasons.push({ type: "goal", key: "moisture" });
      if (goals.has("brightening")) reasons.push({ type: "goal", key: "brightening" });
      if (reasons.length) {
        recs.push({
          id: "ionto_absorb", technology: "iontophoresis", routineId: night, zones: [...CHEEKS, "forehead"], reasons,
          cautions: [...baseCautions, "iontoExcludeEyes"], priority: 60 + reasons.length * 5,
        });
      }
    }
    // RF: 턱선·팔자 + 탄력/윤곽 목표
    {
      const reasons: CareRecommendation["reasons"] = [];
      if (naso && naso.value >= NOTICE) reasons.push({ type: "observation", metric: "nasolabialVisibility", zone: naso.zone, value: naso.value });
      const fw = zoneMax(zones, ["forehead", "glabella", "mouth_area"], "wrinkleVisibility");
      if (fw && fw.value >= NOTICE) reasons.push({ type: "observation", metric: "wrinkleVisibility", zone: fw.zone, value: fw.value });
      if (jawTex && jawTex.value <= 100 - NOTICE) reasons.push({ type: "observation", metric: "texture", zone: jawTex.zone, value: jawTex.value });
      if (goals.has("wrinkle_firming")) reasons.push({ type: "goal", key: "wrinkle_firming" });
      if (goals.has("contour")) reasons.push({ type: "goal", key: "contour" });
      if (reasons.length) {
        recs.push({
          id: "rf_firming", technology: "rf", routineId: sensitive ? "night_soothing" : "night_wrinkle", zones: [...JAW, ...CHEEKS], reasons,
          cautions: [...baseCautions, "frequency", ...(sensitive ? ["sensitiveLowest"] : [])], priority: 55 + reasons.length * 5,
        });
      }
    }
    // 울트라소닉: 윤곽 목표 / 진정(젤과 함께) / 붓기
    {
      const reasons: CareRecommendation["reasons"] = [];
      const red = zoneMax(zones, [...CHEEKS, "nose", "chin"], "rednessVisibility");
      if (red && red.value >= NOTICE) reasons.push({ type: "observation", metric: "rednessVisibility", zone: red.zone, value: red.value });
      if (sensitive) reasons.push({ type: "survey", key: "sensitivity" });
      if (goals.has("contour")) reasons.push({ type: "goal", key: "contour" });
      if (goals.has("soothing")) reasons.push({ type: "goal", key: "soothing" });
      if (ue && ue.value >= NOTICE) reasons.push({ type: "observation", metric: "underEyeDarkness", zone: ue.zone, value: ue.value });
      if (reasons.length) {
        recs.push({
          id: "us_massage", technology: "ultrasonic", routineId: red || sensitive ? "night_soothing" : day, zones: [...CHEEKS, ...JAW], reasons,
          cautions: [...baseCautions, "frequency", "oneDirection"], priority: 50 + reasons.length * 5,
        });
      }
    }
  }
  // 눈가: 기능 추천이 아니라 저자극 관리·주의 안내
  {
    const reasons: CareRecommendation["reasons"] = [];
    const ew = zoneMax(zones, EYES, "wrinkleVisibility");
    if (ew && ew.value >= NOTICE) reasons.push({ type: "observation", metric: "wrinkleVisibility", zone: ew.zone, value: ew.value });
    if (ue && ue.value >= NOTICE) reasons.push({ type: "observation", metric: "underEyeDarkness", zone: ue.zone, value: ue.value });
    if (reasons.length) {
      recs.push({ id: "eye_gentle", technology: "general", routineId: null, zones: EYES, reasons, cautions: ["eyeGentle", "iontoExcludeEyes"], priority: 45 });
    }
  }
  // 목 (별도 사진을 제공한 경우에만)
  const neck = zones.find((z) => z.zone === "neck");
  if (neck && neck.wrinkleVisibility !== null) {
    recs.push({
      id: "neck_care", technology: "general", routineId: deviceBlocked ? null : "night_wrinkle", zones: ["neck"],
      reasons: [{ type: "observation", metric: "wrinkleVisibility", zone: "neck", value: neck.wrinkleVisibility }],
      cautions: ["neckDirection", "applyProductFirst"], priority: 40,
    });
  }
  if (deviceBlocked) {
    recs.push({ id: "device_blocked", technology: "general", routineId: null, zones: [], reasons: [{ type: "survey", key: "deviceContraindication" }], cautions: ["consultExpert"], priority: 100 });
  }
  recs.sort((a, b) => b.priority - a.priority);

  const products = new Set<ProductId>();
  for (const r of [night, day]) if (r) for (const s of ROUTINES[r].steps) products.add(s.product);
  products.add("mist");
  if (!deviceBlocked) products.add("device");
  if (deviceBlocked) {
    // 기기 없이도 쓸 수 있는 공식 스킨케어 제품만 안내
    products.add(lvl(survey.sensitivity) >= 2 ? "boostingGel" : "cream");
  }

  return {
    deviceBlocked, night, alternativeNight, day,
    frequency: sensitive || rednessNotice ? "gentle" : "standard",
    drivers, focusAreas: focus, recommendations: recs, products: [...products], rednessNotice,
  };
}
