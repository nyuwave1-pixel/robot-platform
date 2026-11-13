/**
 * MEDIDERMA Local CV 엔진 — 정규화된 얼굴 크롭(얼굴 폭 ≈ 640px)에서 영역별 관찰 지표를 계산한다.
 * DOM 의존이 없어 브라우저와 Node(테스트) 양쪽에서 동일하게 동작하며 결정적(deterministic)이다.
 */
import { blur, clamp01, dilate, fillPolygon, maskedBlur, median, percentile, scalePolygon, toLab } from "./raster";
import { EXCLUSIONS, FACE_OVAL, FACE_ZONES, LM, NASOLABIAL, ZONE_INDEX, ZONE_METRICS, ZONE_WEIGHT } from "./zones";
import { DEFAULT_CALIBRATION, toIndex, type Calibration } from "./calibration";
import {
  HIGHER_IS_BETTER,
  type CategoryScores,
  type ConcernItem,
  type FaceZoneId,
  type MetricKey,
  type Raster,
  type VisualData,
  type ZoneResult,
} from "./types";

export const ENGINE_VERSION = "mediderma-localcv-0.1.0";
export const NORMALIZED_FACE_WIDTH = 640;

export interface NormalizedFace {
  raster: Raster;
  /** 크롭 좌표계 랜드마크 [x,y,z]×N (N ≥ 468) */
  landmarks: Float32Array;
  /** 원본 px → 크롭 px 배율. 1 보다 크면 확대된 것(세부 지표 신뢰도 하락) */
  sourceScale: number;
  pose: { yaw: number; pitch: number; roll: number };
}

export interface PhotoStats {
  skinMedianL: number;
  skinMedianA: number;
  skinMedianB: number;
  highlightL: number;
  clippedFraction: number;
  sideDeltaL: number;
  verticalDeltaL: number;
  sharpness: number;
  lowerFaceCoverage: number;
  eyeRegionCoverage: number;
  backgroundDeltaL: number | null;
  /** 피부 채도 중앙값 (흑백·강한 필터 판정용) */
  skinChroma: number;
  /** 눈 영역의 밝은 쪽(90퍼센타일) L* ÷ 피부 L*. 뜬 눈은 흰자·눈꺼풀 때문에 높고, 선글라스 등으로 가려지면 매우 낮다 */
  eyeBrightRatio: number;
}

export interface EngineOutput {
  zones: ZoneResult[];
  rawByZone: Record<FaceZoneId, Partial<Record<MetricKey, number>>>;
  categories: CategoryScores;
  overall: number | null;
  confidence: number | null;
  topConcerns: ConcernItem[];
  stats: PhotoStats;
  visual: VisualData;
}

const N_LM = 468;
const HAIR_TEXTURE = 2.7;
const HAIR_LINE = 0.3;

function polyPts(lm: Float32Array, idx: number[]): number[] {
  const out = new Array<number>(idx.length * 2);
  for (let i = 0; i < idx.length; i++) {
    out[2 * i] = lm[idx[i] * 3];
    out[2 * i + 1] = lm[idx[i] * 3 + 1];
  }
  return out;
}

/** 품질 판정용 통계만 필요한 경우에도 같은 함수를 쓰도록 qualityFactors 는 호출부에서 넘긴다. */
export function analyzeNormalized(
  face: NormalizedFace,
  opts: { calibration?: Calibration; qualityFactor?: number } = {},
): EngineOutput {
  const cal = opts.calibration ?? DEFAULT_CALIBRATION;
  const { width: w, height: h, data } = face.raster;
  const n = w * h;
  const lm = face.landmarks;
  if (lm.length < N_LM * 3) throw new Error("landmarks: expected at least 468 points");
  const faceW = Math.hypot(lm[LM.faceLeft * 3] - lm[LM.faceRight * 3], lm[LM.faceLeft * 3 + 1] - lm[LM.faceRight * 3 + 1]);
  const u = faceW / NORMALIZED_FACE_WIDTH; // 스케일 단위 (정상적으로는 ≈1)

  const lab = toLab(data, w, h);
  const { L, a, b } = lab;

  // ── 마스크 ────────────────────────────────────────────────
  const zoneMapFull = new Uint8Array(n); // 표시용 (축소 없음)
  const zoneMap = new Uint8Array(n); // 분석용 (경계 8% 축소)
  FACE_ZONES.forEach((z, i) => {
    const pts = polyPts(lm, z.polygon);
    fillPolygon(zoneMapFull, w, h, pts, i + 1);
    fillPolygon(zoneMap, w, h, scalePolygon(pts, 0.92), i + 1);
  });
  const nasoMask = new Uint8Array(n);
  fillPolygon(nasoMask, w, h, polyPts(lm, NASOLABIAL.left), ZONE_INDEX.left_cheek + 1);
  fillPolygon(nasoMask, w, h, polyPts(lm, NASOLABIAL.right), ZONE_INDEX.right_cheek + 1);
  const oval = new Uint8Array(n);
  fillPolygon(oval, w, h, polyPts(lm, FACE_OVAL), 1);

  let excl: Uint8Array = new Uint8Array(n);
  for (const e of EXCLUSIONS) {
    const m = new Uint8Array(n);
    fillPolygon(m, w, h, polyPts(lm, e.polygon), 1);
    const d = dilate(m, w, h, Math.round(e.dilate * faceW));
    for (let i = 0; i < n; i++) if (d[i]) excl[i] = 1;
  }

  // 얼굴 기준 피부색 (볼·이마·코의 중앙값)
  const refIdx = new Set([ZONE_INDEX.left_cheek + 1, ZONE_INDEX.right_cheek + 1, ZONE_INDEX.forehead + 1, ZONE_INDEX.nose + 1]);
  const bufL = new Float32Array(n);
  const bufA = new Float32Array(n);
  const bufB = new Float32Array(n);
  let rc = 0;
  for (let i = 0; i < n; i++) {
    if (refIdx.has(zoneMap[i]) && !excl[i]) {
      bufL[rc] = L[i];
      bufA[rc] = a[i];
      bufB[rc] = b[i];
      rc++;
    }
  }
  const Lm = median(bufL, rc);
  const am = median(bufA, rc);
  const bm = median(bufB, rc);
  const chromaM = Math.hypot(am, bm);

  // 피부 마스크: 얼굴 타원 내부 · 제외 부위 아님 · 기준 피부색과 유사 (머리카락·안경테·마스크 제외)
  const skin = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (!oval[i] || excl[i]) continue;
    if (Math.abs(a[i] - am) > 13 || Math.abs(b[i] - bm) > 18) continue;
    if (L[i] < Lm * 0.45) continue;
    skin[i] = 1;
  }

  // ── 필터 ────────────────────────────────────────────────
  const L25 = blur(L, w, h, 2.5 * u);
  const L18 = blur(L, w, h, 1.8 * u);
  const L10 = maskedBlur(L, skin, w, h, 10 * u);
  const L5 = maskedBlur(L, skin, w, h, 5 * u);
  const L28 = maskedBlur(L, skin, w, h, 28 * u);
  const a5 = maskedBlur(a, skin, w, h, 5 * u);
  const a28 = maskedBlur(a, skin, w, h, 28 * u);
  const b5 = maskedBlur(b, skin, w, h, 5 * u);
  const b28 = maskedBlur(b, skin, w, h, 28 * u);

  // 헤시안 기반 어두운 선(주름)·어두운 점(모공) 응답
  const lineMap = new Float32Array(n);
  const blobMap = new Float32Array(n);
  const hessian = (sigma: number, wantBlob: boolean) => {
    const s = blur(L, w, h, sigma);
    const norm = sigma * sigma;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (!skin[i]) continue;
        const lxx = (s[i + 1] - 2 * s[i] + s[i - 1]) * norm;
        const lyy = (s[i + w] - 2 * s[i] + s[i - w]) * norm;
        const lxy = ((s[i + w + 1] - s[i + w - 1] - s[i - w + 1] + s[i - w - 1]) / 4) * norm;
        const tr = (lxx + lyy) / 2;
        const det = Math.sqrt(((lxx - lyy) / 2) ** 2 + lxy * lxy);
        const l1 = tr + det;
        const l2 = tr - det;
        if (wantBlob) {
          if (l2 > 0) blobMap[i] = l2;
        } else if (l1 > 0) {
          const v = l1 - Math.abs(l2) * 1.5;
          if (v > lineMap[i]) lineMap[i] = v;
        }
      }
    }
  };
  hessian(1.6 * u, false);
  hessian(3.2 * u, false);
  hessian(1.3 * u, true);

  // 정반사(번들거림) 마스크
  const spec = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (!skin[i]) continue;
    if (L[i] > L28[i] + 13 && Math.hypot(a[i], b[i]) < chromaM * 0.82) spec[i] = 1;
  }

  // ── 영역별 원시값 ─────────────────────────────────────────
  const nz = FACE_ZONES.length;
  const acc = Array.from({ length: nz }, () => ({
    avail: 0,
    skin: 0,
    tex: 0,
    line: 0,
    pores: 0,
    pig: 0,
    red: 0,
    spec: 0,
    sL: 0,
    sL2: 0,
    sA: 0,
    sA2: 0,
    sB: 0,
    sB2: 0,
    nasoN: 0,
    nasoLine: 0,
  }));
  const zoneLvals: number[][] = Array.from({ length: nz }, () => []);
  const T_LINE = 0.55;
  const T_BLOB = 0.9;
  const T_PIG = 2.4;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const nzv = nasoMask[i];
      if (nzv && skin[i]) {
        const an = acc[nzv - 1];
        an.nasoN++;
        if (lineMap[i] > T_LINE) an.nasoLine += lineMap[i] - T_LINE;
      }
      const z = zoneMap[i];
      if (!z || excl[i]) continue;
      acc[z - 1].avail++;
      if (!skin[i]) continue;
      const A = acc[z - 1];
      A.skin++;
      if ((A.skin & 7) === 0) zoneLvals[z - 1].push(L[i]);
      if (spec[i]) {
        A.spec++;
        continue;
      }
      A.tex += Math.abs(L[i] - L25[i]);
      const lv = lineMap[i];
      if (lv > T_LINE) A.line += lv - T_LINE;
      const bv = blobMap[i];
      if (
        bv > T_BLOB &&
        bv >= blobMap[i - 1] &&
        bv >= blobMap[i + 1] &&
        bv >= blobMap[i - w] &&
        bv >= blobMap[i + w] &&
        bv > blobMap[i - w - 1] &&
        bv > blobMap[i + w + 1]
      ) {
        A.pores++;
      }
      // 색소: 주변보다 어두운 스팟 스케일 영역 (선 구조·푸른 그림자 제외)
      if (L18[i] - L10[i] < -T_PIG && lv < 1.2 && b5[i] - b28[i] > -1.5) A.pig++;
      const red = a5[i] - am;
      if (red > 0) A.red += red;
      const dl = L5[i] - L28[i];
      const da = a5[i] - a28[i];
      const db = b5[i] - b28[i];
      A.sL += dl;
      A.sL2 += dl * dl;
      A.sA += da;
      A.sA2 += da * da;
      A.sB += db;
      A.sB2 += db * db;
    }
  }

  const zoneMedianL = zoneLvals.map((v) => (v.length ? median(v) : NaN));

  const rawByZone = {} as Record<FaceZoneId, Partial<Record<MetricKey, number>>>;
  const coverage: number[] = [];
  FACE_ZONES.forEach((z, i) => {
    const A = acc[i];
    // 커버리지 = 제외 부위(눈·입술 등)를 뺀 영역 면적 중 피부색으로 판정된 비율
    coverage[i] = A.avail > 80 ? A.skin / A.avail : 0;
    const m = Math.max(1, A.skin - A.spec);
    const varOf = (s: number, s2: number) => Math.max(0, s2 / m - (s / m) ** 2);
    const raw: Partial<Record<MetricKey, number>> = {
      texture: A.tex / m,
      wrinkleVisibility: A.line / m,
      poreVisibility: (A.pores / m) * 1000,
      toneUniformity: Math.sqrt(varOf(A.sL, A.sL2) + varOf(A.sA, A.sA2) + varOf(A.sB, A.sB2)),
      pigmentVisibility: A.pig / m,
      rednessVisibility: A.red / m,
      shine: A.spec / Math.max(1, A.skin),
    };
    if (A.nasoN > 50) raw.nasolabialVisibility = A.nasoLine / A.nasoN;
    rawByZone[z.id] = raw;
  });
  // 눈밑 어두운 영역: 같은 쪽 볼의 L* 중앙값 대비
  for (const side of ["left", "right"] as const) {
    const ue = ZONE_INDEX[`${side}_under_eye`];
    const ck = ZONE_INDEX[`${side}_cheek`];
    if (Number.isFinite(zoneMedianL[ue]) && Number.isFinite(zoneMedianL[ck])) {
      rawByZone[`${side}_under_eye`].underEyeDarkness = zoneMedianL[ck] - zoneMedianL[ue];
    }
  }

  // ── 촬영 통계 ─────────────────────────────────────────────
  const eyeMask = new Uint8Array(n);
  for (const e of EXCLUSIONS) if (e.id.endsWith("_eye")) fillPolygon(eyeMask, w, h, polyPts(lm, e.polygon), 1);
  const stats = computeStats(L, skin, oval, eyeMask, zoneMedianL, coverage, w, h, Lm, am, bm);

  // ── 신뢰도 ────────────────────────────────────────────────
  const q = cal.quality;
  const sharpF = clamp01((stats.sharpness - q.minSharpness * 0.6) / (q.warnSharpness * 1.4 - q.minSharpness * 0.6));
  const lightF = 1 - 0.45 * clamp01((stats.sideDeltaL - q.warnSideDeltaL) / (q.maxSideDeltaL - q.warnSideDeltaL));
  const resF = face.sourceScale <= 1 ? 1 : clamp01(1.25 - 0.35 * face.sourceScale);
  const globalF = Math.min(1, (0.35 + 0.65 * sharpF) * lightF * (0.4 + 0.6 * resF)) * (opts.qualityFactor ?? 1);
  const yaw = face.pose.yaw;
  // 고개를 돌리면 먼 쪽 얼굴이 2D 에서 좁아진다 — 부호 규약에 의존하지 않도록 랜드마크 폭으로 판정
  const dR = Math.abs(lm[LM.noseTip * 3] - lm[LM.faceRight * 3]);
  const dL = Math.abs(lm[LM.faceLeft * 3] - lm[LM.noseTip * 3]);
  const farSide: "left" | "right" | null = dL < dR * 0.85 ? "left" : dR < dL * 0.85 ? "right" : null;

  const zones: ZoneResult[] = FACE_ZONES.map((z, i) => {
    const covF = clamp01((coverage[i] - 0.3) / 0.45);
    let poseF = 1;
    const far = (farSide === "left" && z.id.startsWith("left_")) || (farSide === "right" && z.id.startsWith("right_"));
    if (far) poseF = 1 - 0.7 * clamp01((Math.abs(yaw) - 8) / 14);
    const conf = Math.round(covF * globalF * poseF * 100) / 100;
    const res: ZoneResult = {
      zone: z.id,
      texture: null,
      wrinkleVisibility: null,
      nasolabialVisibility: null,
      poreVisibility: null,
      toneUniformity: null,
      pigmentVisibility: null,
      rednessVisibility: null,
      underEyeDarkness: null,
      shine: null,
      conditionIndex: null,
      confidence: conf,
    };
    if (conf < cal.minZoneConfidence) {
      res.nullReason = coverage[i] < 0.45 ? "occluded" : "low_confidence";
      return res;
    }
    const raw = rawByZone[z.id];
    // 수염·머리카락이 덮인 영역은 결·주름·모공 응답이 비정상적으로 커진다 → 피부 관찰값을 만들지 않는다
    if ((raw.texture ?? 0) > HAIR_TEXTURE && (raw.wrinkleVisibility ?? 0) > HAIR_LINE) {
      res.nullReason = "facial_hair";
      return res;
    }
    const spec = ZONE_METRICS[z.id];
    let ws = 0;
    let sum = 0;
    for (const key of Object.keys(spec) as MetricKey[]) {
      const r = raw[key];
      if (r === undefined || !Number.isFinite(r)) continue;
      // 모공·잔주름 등 세부 지표는 확대된(저해상도) 이미지에서는 만들지 않는다
      if ((key === "poreVisibility" || key === "texture") && face.sourceScale > 1.6) continue;
      const vis = toIndex(r, cal.ranges[key]);
      const value = HIGHER_IS_BETTER[key] ? 100 - vis : vis;
      res[key] = value;
      const wgt = spec[key] ?? 0;
      if (wgt > 0) {
        ws += wgt;
        sum += wgt * (HIGHER_IS_BETTER[key] ? value : 100 - value);
      }
    }
    res.conditionIndex = ws > 0 ? Math.round(sum / ws) : null;
    return res;
  });

  // ── 카테고리·종합 ─────────────────────────────────────────
  const avg = (key: MetricKey, ids?: FaceZoneId[]): number | null => {
    let s = 0;
    let ww = 0;
    for (const z of zones) {
      if (ids && !ids.includes(z.zone as FaceZoneId)) continue;
      const v = z[key];
      if (v === null || z.confidence === null) continue;
      const wgt = (ZONE_METRICS[z.zone as FaceZoneId][key] ?? 0.5) * z.confidence;
      s += v * wgt;
      ww += wgt;
    }
    return ww > 0 ? Math.round(s / ww) : null;
  };
  const cond = (ids: FaceZoneId[]): number | null => {
    const vs = zones.filter((z) => ids.includes(z.zone as FaceZoneId) && z.conditionIndex !== null);
    return vs.length === ids.length ? Math.round(vs.reduce((s, z) => s + (z.conditionIndex as number), 0) / vs.length) : null;
  };
  const valid = zones.filter((z) => z.conditionIndex !== null);
  let overall: number | null = null;
  let confidence: number | null = null;
  if (valid.length >= cal.minValidZones) {
    let s = 0;
    let ww = 0;
    let cs = 0;
    for (const z of valid) {
      const wgt = ZONE_WEIGHT[z.zone as FaceZoneId] * (z.confidence as number);
      s += (z.conditionIndex as number) * wgt;
      ww += wgt;
      cs += z.confidence as number;
    }
    overall = Math.round(s / ww);
    confidence = Math.round((cs / zones.length) * 100) / 100;
  } else {
    confidence = Math.round((zones.reduce((s, z) => s + (z.confidence ?? 0), 0) / zones.length) * 100) / 100;
  }
  const categories: CategoryScores = {
    textureUniformity: avg("texture"),
    wrinkleVisibility: avg("wrinkleVisibility"),
    poreVisibility: avg("poreVisibility"),
    toneUniformity: avg("toneUniformity"),
    pigmentVisibility: avg("pigmentVisibility"),
    rednessVisibility: avg("rednessVisibility"),
    eyeAreaCondition: cond(["left_eye_corner", "right_eye_corner", "left_under_eye", "right_under_eye"]),
    cheekTexture: avg("texture", ["left_cheek", "right_cheek"]),
    jawlineTexture: avg("texture", ["left_jawline", "right_jawline"]),
    overallCondition: overall,
  };

  // 고민 TOP: (지표, 영역) 조합 중 고민 강도가 높은 순. 좌우 영역은 더 높은 쪽만 남긴다.
  const concerns: ConcernItem[] = [];
  for (const z of zones) {
    if (z.conditionIndex === null) continue;
    for (const key of Object.keys(ZONE_METRICS[z.zone as FaceZoneId]) as MetricKey[]) {
      if (key === "shine") continue;
      const v = z[key];
      if (v === null) continue;
      const severity = HIGHER_IS_BETTER[key] ? 100 - v : v;
      concerns.push({ metric: key, zone: z.zone, severity });
    }
  }
  concerns.sort((p, q2) => q2.severity - p.severity);
  const seen = new Set<string>();
  const topConcerns: ConcernItem[] = [];
  for (const c of concerns) {
    const k = `${c.metric}:${c.zone.replace(/^(left|right)_/, "")}`;
    if (seen.has(k) || c.severity < 30) continue;
    seen.add(k);
    topConcerns.push(c);
    if (topConcerns.length === 5) break;
  }

  // ── 히트맵 ────────────────────────────────────────────────
  const hm = (fn: (i: number) => number, smooth = 0): Float32Array => {
    const m = new Float32Array(n);
    for (let i = 0; i < n; i++) if (skin[i] && zoneMapFull[i]) m[i] = clamp01(fn(i));
    return smooth > 0 ? blur(m, w, h, smooth) : m;
  };
  const heatmaps: VisualData["heatmaps"] = {
    wrinkleVisibility: hm((i) => (lineMap[i] - T_LINE) / 2.5, 1.2),
    poreVisibility: hm((i) => (blobMap[i] - T_BLOB) / 1.6, 1.5),
    pigmentVisibility: hm((i) => (lineMap[i] < 1.2 ? (L10[i] - L18[i] - T_PIG * 0.6) / 5 : 0), 1.5),
    rednessVisibility: hm((i) => (a5[i] - am - 1) / 8),
    texture: hm((i) => (spec[i] ? 0 : Math.abs(L[i] - L25[i]) / 5), 3),
    toneUniformity: hm((i) => Math.hypot(L5[i] - L28[i], a5[i] - a28[i], b5[i] - b28[i]) / 9),
    shine: hm((i) => (spec[i] ? 1 : 0), 2),
  };

  return {
    zones,
    rawByZone,
    categories,
    overall,
    confidence,
    topConcerns,
    stats,
    visual: { width: w, height: h, rgba: data, landmarks: lm, zoneMap: zoneMapFull, skinMask: skin, heatmaps },
  };
}

function computeStats(
  L: Float32Array,
  skin: Uint8Array,
  oval: Uint8Array,
  eyeMask: Uint8Array,
  zoneMedianL: number[],
  coverage: number[],
  w: number,
  h: number,
  Lm: number,
  am: number,
  bm: number,
): PhotoStats {
  const n = w * h;
  // 얼굴 타원 내부(눈·치아 포함)의 밝은 쪽 퍼센타일 — 피부톤과 무관하게 노출 부족을 판정하기 위함
  const buf = new Float32Array(Math.ceil(n / 4) + 1);
  let c = 0;
  let clipped = 0;
  let skinN = 0;
  for (let i = 0; i < n; i++) {
    if (oval[i] && (i & 3) === 0) buf[c++] = L[i];
    if (skin[i]) {
      skinN++;
      if (L[i] > 97) clipped++;
    }
  }
  const highlightL = percentile(buf, c, 0.98);

  // 선명도: 얼굴 타원 내부 그래디언트 크기의 상위 퍼센타일 (눈·눈썹 경계가 선명할수록 큼)
  const g = new Float32Array(Math.ceil(n / 2) + 1);
  let gc = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1 + (y & 1); x < w - 1; x += 2) {
      const i = y * w + x;
      if (!oval[i]) continue;
      const gx = L[i + 1] - L[i - 1];
      const gy = L[i + w] - L[i - w];
      g[gc++] = Math.hypot(gx, gy) / 2;
    }
  }
  const sharpness = percentile(g, gc, 0.985);

  // 배경 밝기 (얼굴 타원 밖)
  let bgN = 0;
  let bgS = 0;
  for (let i = 0; i < n; i += 7) {
    if (!oval[i]) {
      bgS += L[i];
      bgN++;
    }
  }
  const lc = zoneMedianL[ZONE_INDEX.left_cheek];
  const rcv = zoneMedianL[ZONE_INDEX.right_cheek];
  const fh = zoneMedianL[ZONE_INDEX.forehead];
  const ch = zoneMedianL[ZONE_INDEX.chin];
  const cov = (id: FaceZoneId) => coverage[ZONE_INDEX[id]];
  const eb = new Float32Array(n);
  let ec = 0;
  for (let i = 0; i < n; i++) if (eyeMask[i]) eb[ec++] = L[i];
  const eyeBrightRatio = ec > 50 && Lm > 0 ? percentile(eb, ec, 0.9) / Lm : 1;
  return {
    skinMedianL: Lm,
    skinMedianA: am,
    skinMedianB: bm,
    highlightL,
    clippedFraction: skinN ? clipped / skinN : 0,
    sideDeltaL: Number.isFinite(lc) && Number.isFinite(rcv) ? Math.abs(lc - rcv) : 99,
    verticalDeltaL: Number.isFinite(fh) && Number.isFinite(ch) ? Math.abs(fh - ch) : 0,
    sharpness,
    lowerFaceCoverage: Math.min(cov("mouth_area"), cov("chin"), cov("nose")),
    eyeRegionCoverage: Math.min(cov("left_under_eye"), cov("right_under_eye")),
    backgroundDeltaL: bgN > 200 ? bgS / bgN - Lm : null,
    skinChroma: Math.hypot(am, bm),
    eyeBrightRatio,
  };
}
