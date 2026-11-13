"use client";
/** 개발·E2E 검증용 하네스: window.__analyze(dataUrl) 로 실제 파이프라인을 실행해 JSON 을 돌려준다. */
import { useEffect, useState } from "react";
import { blobToCanvas, detectFace, normalizeFace } from "@/lib/analysis/detect";
import { analyzeNormalized } from "@/lib/analysis/engine";
import { DEFAULT_CALIBRATION } from "@/lib/analysis/calibration";
import { getProvider } from "@/lib/analysis/provider";

export default function Harness() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__analyze = async (dataUrl: string) => {
      const blob = await (await fetch(dataUrl)).blob();
      const canvas = await blobToCanvas(blob);
      const provider = await getProvider("local-cv");
      const t0 = performance.now();
      const { result } = await provider.analyze({ canvas, sessionId: "harness", calibration: DEFAULT_CALIBRATION });
      return { result, ms: Math.round(performance.now() - t0) };
    };
    w.__raw = async (dataUrl: string) => {
      const blob = await (await fetch(dataUrl)).blob();
      const canvas = await blobToCanvas(blob);
      const det = await detectFace(canvas);
      if (!det.landmarksPx || !det.info.pose) return { info: det.info };
      const face = normalizeFace(canvas, det.landmarksPx, det.info.pose);
      const out = analyzeNormalized(face);
      return { info: det.info, raw: out.rawByZone, stats: out.stats, overall: out.overall, confidence: out.confidence, sourceScale: face.sourceScale };
    };
    // 원본 이미지 px 기준 얼굴·눈 위치 (E2E 에서 가림 합성 위치를 잡는 데 사용)
    w.__facebox = async (dataUrl: string) => {
      const blob = await (await fetch(dataUrl)).blob();
      const canvas = await blobToCanvas(blob);
      const det = await detectFace(canvas);
      const lm = det.landmarksPx;
      if (!lm) return null;
      const p = (i: number) => ({ x: lm[3 * i], y: lm[3 * i + 1] });
      return { scale: 1, left: p(234), right: p(454), top: p(10), chin: p(152), eyeR: p(33), eyeL: p(263), nose: p(1), browR: p(105), underR: p(119), canvasW: canvas.width };
    };
    w.__crop = async (dataUrl: string) => {
      const blob = await (await fetch(dataUrl)).blob();
      const canvas = await blobToCanvas(blob);
      const det = await detectFace(canvas);
      if (!det.landmarksPx || !det.info.pose) return null;
      const face = normalizeFace(canvas, det.landmarksPx, det.info.pose);
      const out = analyzeNormalized(face);
      const v = out.visual;
      const c = document.createElement("canvas");
      c.width = v.width;
      c.height = v.height;
      const ctx = c.getContext("2d")!;
      const img = new ImageData(new Uint8ClampedArray(v.rgba), v.width, v.height);
      const cols = [[255,0,0],[0,200,0],[0,0,255],[255,160,0],[200,0,200],[0,200,200]];
      for (let i = 0; i < v.zoneMap.length; i++) {
        const z = v.zoneMap[i];
        if (!z) continue;
        const col = cols[z % 6];
        const al = v.skinMask[i] ? 0.35 : 0.08;
        for (let k = 0; k < 3; k++) img.data[4 * i + k] = img.data[4 * i + k] * (1 - al) + col[k] * al;
      }
      ctx.putImageData(img, 0, 0);
      return c.toDataURL("image/jpeg", 0.85);
    };
    setReady(true);
  }, []);
  return <main style={{ padding: 24 }}>harness {ready ? "ready" : "loading"}</main>;
}
