import { blur, clamp01, labToRgb, maskedBlur, toLab } from "./raster";
import type { VisualData } from "./types";

export type SimPeriod = "4weeks" | "8weeks" | "12weeks";

/**
 * 가상 표현 강도 프리셋. 임상 데이터에서 나온 값이 아니라 "시각적 연출 단계"이며,
 * 기간별 개선량을 예측하거나 수치로 표시하지 않는다.
 */
const PRESET: Record<SimPeriod, { texture: number; tone: number }> = {
  "4weeks": { texture: 0.22, tone: 0.12 },
  "8weeks": { texture: 0.38, tone: 0.22 },
  "12weeks": { texture: 0.52, tone: 0.32 },
};

/**
 * 시각적 가상 시뮬레이션 (결정적 이미지 처리, 생성형 AI 아님).
 * - 피부 마스크 내부의 밝기·색 성분만 조정한다 → 얼굴형·이목구비·정체성은 구조적으로 바뀌지 않는다.
 * - (1) 미세 결(고주파) 진폭 축소 = 피부결·잔주름이 덜 보이는 표현
 *   (2) 중간 주파수의 어두운/붉은 편차 축소 = 피부톤이 균일해 보이는 표현
 * 결과는 가상 이미지이며 실제 효능 예측이 아니다. 호출부는 반드시 워터마크와 고지를 표시해야 한다.
 */
export function simulate(v: VisualData, period: SimPeriod): Uint8ClampedArray {
  const { width: w, height: h, rgba, skinMask, zoneMap } = v;
  const n = w * h;
  const p = PRESET[period];
  const { L, a, b } = toLab(rgba, w, h);

  // 적용 마스크: 분석 영역 내부의 피부 픽셀, 경계는 부드럽게
  const m0 = new Float32Array(n);
  for (let i = 0; i < n; i++) if (skinMask[i] && zoneMap[i]) m0[i] = 1;
  const m = blur(m0, w, h, 5);

  const Llow = maskedBlur(L, skinMask, w, h, 4);
  const Lmid = maskedBlur(L, skinMask, w, h, 8);
  const Lbase = maskedBlur(L, skinMask, w, h, 30);
  const amid = maskedBlur(a, skinMask, w, h, 8);
  const abase = maskedBlur(a, skinMask, w, h, 30);

  const out = new Uint8ClampedArray(rgba);
  for (let i = 0, q = 0; i < n; i++, q += 4) {
    const k = m[i];
    if (k < 0.02) continue;
    const detail = L[i] - Llow[i];
    // 강한 경계(코·턱 윤곽 등)는 보존한다
    const keep = clamp01(Math.abs(detail) / 9);
    let Ln = Llow[i] + detail * (1 - p.texture * (1 - keep));
    const dMid = Lmid[i] - Lbase[i];
    if (dMid < 0) Ln -= dMid * p.tone * 0.8; // 주변보다 어두운 얼룩만 완화 (하이라이트·입체감 유지)
    const dA = amid[i] - abase[i];
    const an = dA > 0 ? a[i] - dA * p.tone : a[i];
    const Lf = L[i] + (Ln - L[i]) * k;
    const af = a[i] + (an - a[i]) * k;
    labToRgb(Lf, af, b[i], out, q);
  }
  return out;
}
