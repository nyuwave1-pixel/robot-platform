import type { Calibration } from "./calibration";
import type { AnalysisResult, VisualData } from "./types";

/**
 * AI Provider 어댑터 — 분석 백엔드를 교체할 수 있도록 하는 단일 인터페이스.
 * 새 Provider(예: 서버 FastAPI/PyTorch 모델, 외부 Vision API)는 이 인터페이스만 구현하면 된다.
 */
export interface AnalysisInput {
  /** EXIF 방향이 반영된 원본 캔버스 (브라우저) */
  canvas: HTMLCanvasElement;
  sessionId: string;
  calibration: Calibration;
}

export interface ProviderOutput {
  result: AnalysisResult;
  /** 히트맵·영역 맵 등 시각화 데이터. 품질 미달로 분석이 중단되면 null */
  visual: VisualData | null;
}

export type ProgressStage = "loading_model" | "detecting" | "quality" | "analyzing" | "done";

export interface SkinAnalysisProvider {
  id: string;
  version: string;
  kind: "on-device" | "remote" | "mock";
  /** true 이면 이미지가 기기 밖으로 전송된다 → 호출 전 별도 동의가 반드시 필요 */
  transmitsImage: boolean;
  analyze(input: AnalysisInput, onProgress?: (stage: ProgressStage) => void): Promise<ProviderOutput>;
}

const registry = new Map<string, () => Promise<SkinAnalysisProvider>>();

export function registerProvider(id: string, loader: () => Promise<SkinAnalysisProvider>): void {
  registry.set(id, loader);
}

export async function getProvider(id: string): Promise<SkinAnalysisProvider> {
  const loader = registry.get(id);
  if (!loader) throw new Error(`unknown_provider:${id}`);
  return loader();
}

export function listProviders(): string[] {
  return [...registry.keys()];
}

registerProvider("local-cv", async () => (await import("./providers/localCv")).localCvProvider);
// Mock Provider 는 개발 환경에서만 등록된다. 결과에는 isMock=true 가 붙고 UI 가 MOCK 배너를 강제 표시한다.
if (process.env.NODE_ENV !== "production") {
  registerProvider("mock", async () => (await import("./providers/mock")).mockProvider);
}

export const DEFAULT_PROVIDER = "local-cv";
