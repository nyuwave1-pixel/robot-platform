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
/** 실패·시간 초과 때 어느 단계였는지 (진단 표시·통계용) */
export let lastAnalysisStage: string = "idle";

export async function runFaceAnalysis(file: Blob, sessionId: string, config: AppConfig, onProgress?: (s: ProgressStage) => void): Promise<ProviderOutput> {
  // 사진 읽기부터 분석 끝까지 전체에 시간 제한을 둔다 — 어느 단계에서 멈춰도 진행 화면에 갇히지 않게
  lastAnalysisStage = "decoding";
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const st = lastAnalysisStage;
      // 모델 준비·얼굴 인식 중 멈췄다면 다음 시도 때 모델을 새로 만든다
      if (st === "loading_model" || st === "detecting") resetLandmarker();
      reject(new AnalysisError(st === "loading_model" || st === "detecting" ? "modelLoadFailed" : st === "decoding" ? "decodeFailed" : "analysisFailed", `timeout:${st}`));
    }, ANALYSIS_TIMEOUT_MS);
  });
  try {
    return await Promise.race([run(file, sessionId, config, onProgress), deadline]);
  } finally {
    clearTimeout(timer);
  }
}

async function run(file: Blob, sessionId: string, config: AppConfig, onProgress?: (s: ProgressStage) => void): Promise<ProviderOutput> {
  let canvas: HTMLCanvasElement;
  try {
    canvas = await blobToCanvas(file);
  } catch {
    throw new AnalysisError("decodeFailed", "decode");
  }
  try {
    lastAnalysisStage = "loading_model";
    const provider = await getProvider(config.provider.id);
    // 이미지를 기기 밖으로 보내는 Provider 는 별도 동의 플로우가 구현되기 전까지 실행하지 않는다
    if (provider.transmitsImage) throw new AnalysisError("analysisFailed");
    return await provider.analyze({ canvas, sessionId, calibration: config.calibration }, (st) => {
      lastAnalysisStage = st;
      onProgress?.(st);
    });
  } catch (e) {
    if (e instanceof AnalysisError) throw e;
    const msg = String((e as Error)?.message ?? e);
    throw new AnalysisError(/wasm|fetch|model|load|network/i.test(msg) ? "modelLoadFailed" : "analysisFailed", `error:${lastAnalysisStage}`);
  } finally {
    canvas.width = canvas.height = 0; // 원본 해상도 캔버스 메모리 즉시 해제
  }
}

export async function runNeckAnalysis(file: Blob, config: AppConfig): Promise<ZoneResult | null> {
  // 목 사진은 선택 항목 — 15초 안에 끝나지 않으면 목 결과 없이 진행한다
  return Promise.race([neck(file, config), new Promise<null>((r) => setTimeout(() => r(null), 15_000))]);
}

async function neck(file: Blob, config: AppConfig): Promise<ZoneResult | null> {
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
