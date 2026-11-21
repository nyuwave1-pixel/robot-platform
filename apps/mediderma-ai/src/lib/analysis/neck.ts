import { blur, median, toLab } from "./raster";
import { toIndex, type Calibration } from "./calibration";
import type { Raster, ZoneResult } from "./types";

/**
 * 목 사진(별도 업로드) 분석 — 목에는 랜드마크 모델이 없으므로 화면 중앙 영역(가로 50%·세로 60%)만 본다.
 * 가로 방향에 가까운 어두운 선 구조의 가시성을 계산한다. 입력은 가로 512px 로 리샘플된 이미지.
 * 중앙 영역이 실제로 목인지 확인할 수 없으므로 신뢰도 상한을 0.6 으로 둔다.
 */
export function analyzeNeck(r: Raster, cal: Calibration): ZoneResult {
  const { width: w, height: h, data } = r;
  const { L, a, b } = toLab(data, w, h);
  const x0 = Math.round(w * 0.25), x1 = Math.round(w * 0.75), y0 = Math.round(h * 0.2), y1 = Math.round(h * 0.8);
  const bl: number[] = [], ba: number[] = [], bb: number[] = [];
  for (let y = y0; y < y1; y += 3) for (let x = x0; x < x1; x += 3) { const i = y * w + x; bl.push(L[i]); ba.push(a[i]); bb.push(b[i]); }
  const Lm = median(bl), am = median(ba), bm = median(bb);
  const res: ZoneResult = {
    zone: "neck", texture: null, wrinkleVisibility: null, nasolabialVisibility: null, poreVisibility: null, toneUniformity: null,
    pigmentVisibility: null, rednessVisibility: null, underEyeDarkness: null, shine: null, conditionIndex: null, confidence: 0,
  };
  let acc = 0, cnt = 0, total = 0, gsum = 0;
  for (const sigma of [1.6, 3.2]) {
    const s = blur(L, w, h, sigma);
    const norm = sigma * sigma;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = y * w + x;
        if (sigma === 1.6) {
          total++;
          gsum += Math.abs(L[i + 1] - L[i - 1]) + Math.abs(L[i + w] - L[i - w]);
        }
        if (Math.abs(a[i] - am) > 12 || Math.abs(b[i] - bm) > 16 || L[i] < Lm * 0.5) continue;
        if (sigma === 1.6) cnt++;
        const lxx = (s[i + 1] - 2 * s[i] + s[i - 1]) * norm;
        const lyy = (s[i + w] - 2 * s[i] + s[i - w]) * norm;
        // 가로 주름: 세로 방향 2차 미분이 크고 가로 방향은 작다
        const v = lyy - Math.abs(lxx) * 1.5 - 0.55;
        if (v > 0) acc += v;
      }
    }
  }
  const coverage = total ? cnt / total : 0;
  const sharp = total ? gsum / total : 0;
  const lightOk = Lm > 30 && Lm < 92;
  const conf = Math.min(0.6, coverage) * (lightOk ? 1 : 0.4) * (sharp > 0.6 ? 1 : 0.5);
  res.confidence = Math.round(conf * 100) / 100;
  if (conf < cal.minZoneConfidence || cnt < 2000) {
    res.nullReason = "low_confidence";
    return res;
  }
  res.wrinkleVisibility = toIndex(acc / cnt, cal.ranges.wrinkleVisibility);
  res.conditionIndex = 100 - res.wrinkleVisibility;
  return res;
}
