import type { Calibration } from "./calibration";
import { HIGHER_IS_BETTER, type AnalysisResult, type MetricKey, type ZoneId } from "./types";

export type ChangeVerdict = "no_change" | "improved" | "worsened" | "not_comparable";
export type ConditionIssue = "lighting_level" | "white_balance" | "light_direction" | "sharpness" | "pose" | "resolution" | "missing";

export interface MetricChange {
  metric: MetricKey;
  before: number | null;
  after: number | null;
  /** after - before (지수 단위). 비교 불가 시 null */
  delta: number | null;
  verdict: ChangeVerdict;
}
export interface ZoneChange {
  zone: ZoneId;
  conditionBefore: number | null;
  conditionAfter: number | null;
  verdict: ChangeVerdict;
  metrics: MetricChange[];
}
export interface CompareResult {
  /** 촬영 조건 차이. 비어 있으면 모든 지표 비교 가능 */
  conditionIssues: ConditionIssue[];
  /** 조건 차이의 실제 측정값 */
  conditionDeltas: { skinL: number; skinA: number; skinB: number; sideDeltaL: number; sharpnessRatio: number; yaw: number; pitch: number; faceWidthRatio: number } | null;
  categories: MetricChange[];
  zones: ZoneChange[];
  noiseBand: number;
}

/** 색·밝기에 민감한 지표 / 선명도·해상도에 민감한 지표 */
const COLOR_METRICS: MetricKey[] = ["toneUniformity", "pigmentVisibility", "rednessVisibility", "underEyeDarkness", "shine"];
const DETAIL_METRICS: MetricKey[] = ["texture", "poreVisibility", "wrinkleVisibility", "nasolabialVisibility"];

function verdictOf(metric: MetricKey, delta: number, band: number): ChangeVerdict {
  if (Math.abs(delta) <= band) return "no_change";
  const better = HIGHER_IS_BETTER[metric] ? delta > 0 : delta < 0;
  return better ? "improved" : "worsened";
}

/**
 * 사용 전/후 분석 결과 비교.
 * - 촬영 조건(밝기·색온도·조명 방향·선명도·자세·해상도)이 크게 다르면 해당 지표를 "비교 불가"로 표시한다.
 * - 지수 변화가 잡음 범위(noiseBand, 동일 사진의 밝기·압축 변형에서 측정한 변동폭) 이내면 "변화 없음".
 * - 확인되지 않은 개선을 개선으로 표시하지 않는다.
 */
export function compareResults(before: AnalysisResult, after: AnalysisResult, cal: Calibration): CompareResult {
  const band = cal.compareNoiseBand;
  const issues = new Set<ConditionIssue>();
  const cb = before.imageQuality.capture;
  const ca = after.imageQuality.capture;
  const pb = before.imageQuality.pose;
  const pa = after.imageQuality.pose;
  let deltas: CompareResult["conditionDeltas"] = null;
  if (!cb || !ca || !pb || !pa || !before.imageQuality.faceWidthPx || !after.imageQuality.faceWidthPx) {
    issues.add("missing");
  } else {
    const fr = Math.min(before.imageQuality.faceWidthPx, after.imageQuality.faceWidthPx) / Math.max(before.imageQuality.faceWidthPx, after.imageQuality.faceWidthPx);
    deltas = {
      skinL: ca.skinL - cb.skinL,
      skinA: ca.skinA - cb.skinA,
      skinB: ca.skinB - cb.skinB,
      sideDeltaL: ca.sideDeltaL - cb.sideDeltaL,
      sharpnessRatio: cb.sharpness > 0 ? ca.sharpness / cb.sharpness : 0,
      yaw: pa.yaw - pb.yaw,
      pitch: pa.pitch - pb.pitch,
      faceWidthRatio: fr,
    };
    if (Math.abs(deltas.skinL) > 10) issues.add("lighting_level");
    if (Math.abs(deltas.skinA) > 5 || Math.abs(deltas.skinB) > 7) issues.add("white_balance");
    if (Math.abs(deltas.sideDeltaL) > 8) issues.add("light_direction");
    if (deltas.sharpnessRatio < 0.65 || deltas.sharpnessRatio > 1.55) issues.add("sharpness");
    if (Math.abs(deltas.yaw) > 10 || Math.abs(deltas.pitch) > 12) issues.add("pose");
    // 한쪽만 저해상도(확대 분석)인 경우 세부 지표 비교 불가
    if (fr < 0.6 && Math.min(before.imageQuality.faceWidthPx, after.imageQuality.faceWidthPx) < 520) issues.add("resolution");
  }
  const colorBlocked = issues.has("lighting_level") || issues.has("white_balance") || issues.has("light_direction") || issues.has("pose") || issues.has("missing");
  const detailBlocked = issues.has("sharpness") || issues.has("resolution") || issues.has("pose") || issues.has("missing") || issues.has("lighting_level");
  const blocked = (m: MetricKey) => (COLOR_METRICS.includes(m) ? colorBlocked : DETAIL_METRICS.includes(m) ? detailBlocked : colorBlocked || detailBlocked);

  const change = (metric: MetricKey, b: number | null, a: number | null): MetricChange => {
    if (b === null || a === null || blocked(metric)) return { metric, before: b, after: a, delta: null, verdict: "not_comparable" };
    const delta = a - b;
    return { metric, before: b, after: a, delta, verdict: verdictOf(metric, delta, band) };
  };

  const cbc = before.analysis.categories;
  const cac = after.analysis.categories;
  const categories: MetricChange[] = [
    change("texture", cbc.textureUniformity, cac.textureUniformity),
    change("wrinkleVisibility", cbc.wrinkleVisibility, cac.wrinkleVisibility),
    change("toneUniformity", cbc.toneUniformity, cac.toneUniformity),
    change("poreVisibility", cbc.poreVisibility, cac.poreVisibility),
    change("pigmentVisibility", cbc.pigmentVisibility, cac.pigmentVisibility),
    change("rednessVisibility", cbc.rednessVisibility, cac.rednessVisibility),
  ];

  const zones: ZoneChange[] = before.analysis.zones.map((zb) => {
    const za = after.analysis.zones.find((z) => z.zone === zb.zone);
    const metrics: MetricChange[] = [];
    for (const key of Object.keys(HIGHER_IS_BETTER) as MetricKey[]) {
      const b = zb[key];
      const a = za ? za[key] : null;
      if (b === null && a === null) continue;
      metrics.push(change(key, b, a));
    }
    const comparable = metrics.filter((m) => m.verdict !== "not_comparable");
    let verdict: ChangeVerdict = "not_comparable";
    if (comparable.length && zb.conditionIndex !== null && za && za.conditionIndex !== null && !(colorBlocked && detailBlocked)) {
      const d = za.conditionIndex - zb.conditionIndex;
      verdict = Math.abs(d) <= band ? "no_change" : d > 0 ? "improved" : "worsened";
    }
    return { zone: zb.zone, conditionBefore: zb.conditionIndex, conditionAfter: za?.conditionIndex ?? null, verdict, metrics };
  });

  return { conditionIssues: [...issues], conditionDeltas: deltas, categories, zones, noiseBand: band };
}

/** after 랜드마크를 before 좌표계로 옮기는 닮음 변환(회전·균등 스케일·이동)의 최소제곱 해 */
export function similarityTransform(from: Float32Array, to: Float32Array, indices: number[]): { a: number; b: number; tx: number; ty: number } {
  let mx = 0, my = 0, nx = 0, ny = 0;
  const n = indices.length;
  for (const i of indices) {
    mx += from[3 * i]; my += from[3 * i + 1];
    nx += to[3 * i]; ny += to[3 * i + 1];
  }
  mx /= n; my /= n; nx /= n; ny /= n;
  let sxx = 0, sxy = 0, den = 0;
  for (const i of indices) {
    const x = from[3 * i] - mx, y = from[3 * i + 1] - my;
    const u = to[3 * i] - nx, v = to[3 * i + 1] - ny;
    sxx += x * u + y * v;
    sxy += x * v - y * u;
    den += x * x + y * y;
  }
  const a = sxx / den;
  const b = sxy / den;
  // [u,v] = [a -b; b a][x,y] + t
  return { a, b, tx: nx - (a * mx - b * my), ty: ny - (b * mx + a * my) };
}

/** 표정에 덜 민감한 정렬 기준점 (눈꼬리·눈머리·콧등·코끝·얼굴 윤곽 일부) */
export const ALIGN_POINTS = [33, 133, 362, 263, 168, 6, 1, 2, 234, 454, 10, 152, 127, 356];
