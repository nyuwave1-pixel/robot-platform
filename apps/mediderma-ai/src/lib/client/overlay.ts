"use client";
import { FACE_ZONES } from "../analysis/zones";
import type { MetricKey, VisualData } from "../analysis/types";

export const HEAT_COLORS: Record<MetricKey, [number, number, number]> = {
  wrinkleVisibility: [80, 220, 255],
  nasolabialVisibility: [80, 220, 255],
  poreVisibility: [190, 130, 255],
  pigmentVisibility: [255, 180, 60],
  rednessVisibility: [255, 70, 90],
  texture: [90, 150, 255],
  toneUniformity: [60, 230, 190],
  underEyeDarkness: [150, 150, 255],
  shine: [255, 255, 255],
};
/** 히트맵을 제공하는 지표 */
export const HEATMAP_METRICS: MetricKey[] = ["wrinkleVisibility", "poreVisibility", "pigmentVisibility", "rednessVisibility", "texture", "toneUniformity", "shine"];

export interface OverlayOptions {
  heatmap: MetricKey | null;
  /** FACE_ZONES 인덱스 */
  selected: number | null;
  showZones: boolean;
  /** 원본 대신 그릴 RGBA (시뮬레이션 등) */
  base?: Uint8ClampedArray;
}

/** 사진 + 히트맵 + 영역 윤곽을 한 캔버스에 그린다 (2D 화면과 3D 텍스처가 공유) */
export function renderOverlay(v: VisualData, o: OverlayOptions, target?: HTMLCanvasElement): HTMLCanvasElement {
  const c = target ?? document.createElement("canvas");
  c.width = v.width;
  c.height = v.height;
  const ctx = c.getContext("2d")!;
  const img = new ImageData(new Uint8ClampedArray(o.base ?? v.rgba), v.width, v.height);
  const hm = o.heatmap ? v.heatmaps[o.heatmap] : undefined;
  if (hm && o.heatmap) {
    const [r, g, b] = HEAT_COLORS[o.heatmap];
    const d = img.data;
    for (let i = 0, p = 0; i < hm.length; i++, p += 4) {
      const k = hm[i];
      // 관찰 영역 밖은 살짝 어둡게 해서 히트맵이 있는 곳을 구분
      if (!v.zoneMap[i]) {
        d[p] *= 0.55; d[p + 1] *= 0.55; d[p + 2] *= 0.55;
        continue;
      }
      if (k <= 0.02) continue;
      const al = Math.min(0.85, k * 1.1);
      d[p] = d[p] * (1 - al) + r * al;
      d[p + 1] = d[p + 1] * (1 - al) + g * al;
      d[p + 2] = d[p + 2] * (1 - al) + b * al;
    }
  }
  ctx.putImageData(img, 0, 0);
  const lm = v.landmarks;
  const path = (poly: number[]) => {
    ctx.beginPath();
    poly.forEach((idx, k) => (k ? ctx.lineTo(lm[3 * idx], lm[3 * idx + 1]) : ctx.moveTo(lm[3 * idx], lm[3 * idx + 1])));
    ctx.closePath();
  };
  if (o.showZones) {
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = "rgba(127,224,255,0.55)";
    FACE_ZONES.forEach((z) => {
      path(z.polygon);
      ctx.stroke();
    });
  }
  if (o.selected !== null && FACE_ZONES[o.selected]) {
    path(FACE_ZONES[o.selected].polygon);
    ctx.fillStyle = "rgba(79,182,255,0.22)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#7fe0ff";
    ctx.stroke();
  }
  return c;
}

/** RGBA 위에 가상 이미지 워터마크를 넣은 캔버스 */
export function simCanvas(rgba: Uint8ClampedArray, w: number, h: number, label: string, align: "left" | "right" = "left"): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), w, h), 0, 0);
  const fs = Math.max(14, Math.round(w / 34));
  ctx.font = `600 ${fs}px sans-serif`;
  ctx.textBaseline = "bottom";
  const pad = fs * 0.6;
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = "rgba(0,0,0,0.62)";
  const x0 = align === "right" ? w - tw - pad * 2 : 0;
  ctx.fillRect(x0, h - fs - pad * 2, tw + pad * 2, fs + pad * 2);
  ctx.fillStyle = "#7fe0ff";
  ctx.fillText(label, x0 + pad, h - pad);
  return c;
}
