"use client";
import { blobToCanvas, resetLandmarker } from "../analysis/detect";
import { analyzeNeck } from "../analysis/neck";
import { getProvider, type ProgressStage, type ProviderOutput } from "../analysis/provider";
import type { ZoneResult } from "../analysis/types";
import type { AppConfig } from "../appConfig";

export class AnalysisError extends Error {
  /** detail: 통계용 짧은 원인 (예: "timeout:analyzing") */
  constructor(public code: "decodeFailed" | "modelLoadFailed" | "analysisFailed", public detail?: string) {
    super(code);
  }
}

/** 분석 전체 제한 시간 — 넘기면 진행 화면에 멈춰 있지 않고 다시 시도 화면으로 보낸다 */
const ANALYSIS_TIMEOUT_MS = 60_000;

/** 파일 1장 → Provider 분석. 오류는 사용자에게 보여줄 코드로 정규화한다. */
export async function runFaceAnalysis(file: Blob, sessionId: string, config: AppConfig, onProgress?: (s: ProgressStage) => void): Promise<ProviderOutput> {
  let canvas: HTMLCanvasElement;
  try {
    canvas = await blobToCanvas(file);
  } catch {
    throw new AnalysisError("decodeFailed");
  }
  try {
    const provider = await getProvider(config.provider.id);
    // 이미지를 기기 밖으로 보내는 Provider 는 별도 동의 플로우가 구현되기 전까지 실행하지 않는다
    if (provider.transmitsImage) throw new AnalysisError("analysisFailed");
    let last: ProgressStage = "loading_model";
    const track = (s: ProgressStage) => {
      last = s;
      onProgress?.(s);
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        provider.analyze({ canvas, sessionId, calibration: config.calibration }, track),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            if (last === "loading_model") resetLandmarker();
            reject(new AnalysisError(last === "loading_model" ? "modelLoadFailed" : "analysisFailed", `timeout:${last}`));
          }, ANALYSIS_TIMEOUT_MS);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  } catch (e) {
    if (e instanceof AnalysisError) throw e;
    const msg = String((e as Error)?.message ?? e);
    throw new AnalysisError(/wasm|fetch|model|load|network/i.test(msg) ? "modelLoadFailed" : "analysisFailed");
  } finally {
    canvas.width = canvas.height = 0; // 원본 해상도 캔버스 메모리 즉시 해제
  }
}

export async function runNeckAnalysis(file: Blob, config: AppConfig): Promise<ZoneResult | null> {
  try {
    const src = await blobToCanvas(file);
    const w = 512;
    const h = Math.round((src.height / src.width) * w);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    src.width = src.height = 0;
    return analyzeNeck({ width: w, height: h, data: img.data }, config.calibration);
  } catch {
    return null;
  }
}
