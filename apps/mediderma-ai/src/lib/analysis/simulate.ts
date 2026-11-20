import { blur, clamp01, labToRgb, maskedBlur, toLab } from "./raster";
import type { VisualData } from "./types";

export type SimPeriod = "4weeks" | "8weeks" | "12weeks";

/**
 * 가상 표현 강도 프리셋. 임상 데이터에서 나온 값이 아니라 "시각적 연출 단계"이며,
 * 기간별 개선량을 예측하거나 수치로 표시하지 않는다.
 * 원본과의 차이가 한눈에 보이도록 연출 강도를 높게 잡았다 (v2).
 *  fine  : 미세 결(모공·잔결) 진폭 축소 비율
 *  mid   : 중간 크기의 어두운 선·점(주름·모공 그림자·잡티) 완화 비율
 *  shade : 넓은 어두운 영역(눈밑·팔자 그늘·얼룩) 완화 비율
 *  red   : 붉은 편차 완화 비율
 *  lift  : 피부 전체 밝기(L*) 상승량
 *  glow  : 넓은 하이라이트(광채) 강조 비율
 */
const PRESET: Record<SimPeriod, { fine: number; mid: number; shade: number; red: number; lift: number; glow: number }> = {
  "4weeks": { fine: 0.5, mid: 0.4, shade: 0.35, red: 0.4, lift: 2.0, glow: 0.1 },
  "8weeks": { fine: 0.75, mid: 0.68, shade: 0.6, red: 0.65, lift: 4.0, glow: 0.2 },
  "12weeks": { fine: 0.92, mid: 0.9, shade: 0.82, red: 0.85, lift: 6.0, glow: 0.3 },
};

/**
 * 시각적 가상 시뮬레이션 (결정적 이미지 처리, 생성형 AI 아님).
 * - 피부 마스크 내부의 밝기·색 성분만 조정한다 → 얼굴형·이목구비·정체성은 구조적으로 바뀌지 않는다.
 * - 밝기를 3개 대역(미세 결 / 중간 선·점 / 넓은 음영)으로 나눠 각각 완화하고,
 *   붉은 편차를 줄이고, 피부 밝기와 넓은 하이라이트를 올린다.
 * - 강한 경계(눈·코·입·안경테 주변)는 보존한다.
 * 결과는 가상 이미지이며 실제 효능 예측이 아니다. 호출부는 반드시 워터마크와 고지를 표시해야 한다.
 */
/**
 * 시뮬레이션 적용 영역 (0~1) = 얼굴 윤곽 안의 피부 픽셀 전체 (눈·눈썹·입술·콧구멍·머리카락 제외).
 * 분석 영역별로 따로 처리하면 경계가 조각처럼 보이므로 얼굴 피부를 하나로 다룬다.
 * 경계는 안쪽으로만 부드럽게 줄인다. 0 인 픽셀은 절대 바뀌지 않는다.
 */
export function simRegion(v: VisualData): Float32Array {
  const { width: w, height: h, skinMask } = v;
  const n = w * h;
  const r = new Float32Array(n);
  for (let i = 0; i < n; i++) if (skinMask[i]) r[i] = 1;
  const rb = blur(r, w, h, 14);
  for (let i = 0; i < n; i++) r[i] = r[i] ? clamp01((rb[i] - 0.5) * 2.2) : 0;
  return r;
}

export function simulate(v: VisualData, period: SimPeriod): Uint8ClampedArray {
  const { width: w, height: h, rgba, skinMask } = v;
  const n = w * h;
  const p = PRESET[period];
  const { L, a, b } = toLab(rgba, w, h);

  const m = simRegion(v);

  const L1 = maskedBlur(L, skinMask, w, h, 2.5);
  const L2 = maskedBlur(L, skinMask, w, h, 9);
  const L3 = maskedBlur(L, skinMask, w, h, 30);
  const a2 = maskedBlur(a, skinMask, w, h, 6);
  const a3 = maskedBlur(a, skinMask, w, h, 30);

  const out = new Uint8ClampedArray(rgba);
  for (let i = 0, q = 0; i < n; i++, q += 4) {
    const k = m[i];
    if (k < 0.02) continue;
    const dFine = L[i] - L1[i];
    const dMid = L1[i] - L2[i];
    const dShade = L2[i] - L3[i];
    // 강한 경계(이목구비·안경테 윤곽)는 보존한다
    const keepFine = clamp01((Math.abs(dFine) - 10) / 12);
    const keepMid = clamp01((Math.abs(dMid) - 13) / 12);
    let Ln = L3[i];
    // 넓은 음영: 어두운 쪽만 완화 (입체감을 만드는 밝은 쪽은 유지·강조)
    Ln += dShade < 0 ? dShade * (1 - p.shade) : dShade * (1 + p.glow);
    // 중간 대역: 어두운 선·점은 강하게 완화, 밝은 쪽(콧등 하이라이트 등)은 거의 유지
    Ln += dMid * (1 - (dMid < 0 ? p.mid : p.mid * 0.15) * (1 - keepMid));
    Ln += dFine * (1 - p.fine * (1 - keepFine));
    Ln += p.lift * (1 - clamp01((L[i] - 82) / 12)); // 이미 밝은 곳은 덜 올려 날아가지 않게
    // 붉은 편차 완화 + 전체 붉은 기를 약간 낮춘다
    const dA = a2[i] - a3[i];
    let an = dA > 0 ? a[i] - dA * p.red : a[i];
    an -= Math.max(0, an - 8) * 0.12 * p.red;
    const Lf = L[i] + (Ln - L[i]) * k;
    const af = a[i] + (an - a[i]) * k;
    labToRgb(Lf > 100 ? 100 : Lf, af, b[i], out, q);
  }
  return out;
}
