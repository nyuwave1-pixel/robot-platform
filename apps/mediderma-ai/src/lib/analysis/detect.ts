"use client";
/**
 * 브라우저 전용: MediaPipe Face Landmarker(자체 호스팅 WASM·모델)로 얼굴을 검출하고
 * 분석 엔진이 쓰는 정규화 크롭을 만든다. 이미지는 이 과정에서 기기 밖으로 전송되지 않는다.
 */
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { FACE_OVAL, LM } from "./zones";
import { NORMALIZED_FACE_WIDTH, type NormalizedFace } from "./engine";
import type { DetectionInfo } from "./quality";

export const LANDMARK_MODEL = "mediapipe-face-landmarker-float16-v1";
const MAX_SIDE = 2048;

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

export function getLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks("/mediapipe");
      return FaceLandmarker.createFromOptions(fileset, {
        // CPU 델리게이트: 기기·GPU 에 따른 결과 편차를 없애 동일 이미지 → 동일 결과를 보장
        baseOptions: { modelAssetPath: "/models/face_landmarker.task", delegate: "CPU" },
        runningMode: "IMAGE",
        numFaces: 3,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      });
    })();
    landmarkerPromise.catch(() => {
      landmarkerPromise = null;
    });
  }
  return landmarkerPromise;
}

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** 파일/Blob → EXIF 방향이 반영된 캔버스 (긴 변 최대 2048px) */
export async function blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
  } catch {
    throw new Error("decode_failed");
  }
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return c;
}

export interface Detection {
  info: DetectionInfo;
  /** 원본 캔버스 px 좌표 랜드마크 [x,y,z]×478 (얼굴이 1개 이상일 때 첫 번째 얼굴) */
  landmarksPx: Float32Array | null;
}

function poseFromMatrix(m: ArrayLike<number>): { yaw: number; pitch: number; roll: number } {
  // column-major 4x4. 회전 성분에서 오일러 각(도) 추출
  const r02 = m[8];
  const r12 = m[9];
  const r22 = m[10];
  const r10 = m[1];
  const r11 = m[5];
  const d = 180 / Math.PI;
  return {
    yaw: Math.atan2(r02, r22) * d,
    pitch: Math.asin(Math.max(-1, Math.min(1, -r12))) * d,
    roll: Math.atan2(r10, r11) * d,
  };
}

export async function detectFace(canvas: HTMLCanvasElement): Promise<Detection> {
  const lmk = await getLandmarker();
  const res = lmk.detect(canvas);
  const W = canvas.width;
  const H = canvas.height;
  const faceCount = res.faceLandmarks.length;
  if (faceCount === 0) {
    return {
      info: { faceCount: 0, imageSize: { width: W, height: H }, faceWidthPx: null, pose: null, cutOffFraction: 0, blendshapes: null },
      landmarksPx: null,
    };
  }
  const pts = res.faceLandmarks[0];
  const lm = new Float32Array(pts.length * 3);
  for (let i = 0; i < pts.length; i++) {
    lm[3 * i] = pts[i].x * W;
    lm[3 * i + 1] = pts[i].y * H;
    lm[3 * i + 2] = pts[i].z * W;
  }
  let out = 0;
  for (const i of FACE_OVAL) {
    const x = pts[i].x;
    const y = pts[i].y;
    if (x < 0 || x > 1 || y < 0 || y > 1) out++;
  }
  const faceWidthPx = Math.hypot(lm[LM.faceLeft * 3] - lm[LM.faceRight * 3], lm[LM.faceLeft * 3 + 1] - lm[LM.faceRight * 3 + 1]);
  const mat = res.facialTransformationMatrixes?.[0]?.data;
  const pose = mat ? poseFromMatrix(mat) : { yaw: 0, pitch: 0, roll: (Math.atan2(lm[LM.leftEyeOuter * 3 + 1] - lm[LM.rightEyeOuter * 3 + 1], lm[LM.leftEyeOuter * 3] - lm[LM.rightEyeOuter * 3]) * 180) / Math.PI };
  const blendshapes: Record<string, number> = {};
  for (const c of res.faceBlendshapes?.[0]?.categories ?? []) blendshapes[c.categoryName] = c.score;
  return {
    info: { faceCount, imageSize: { width: W, height: H }, faceWidthPx, pose, cutOffFraction: out / FACE_OVAL.length, blendshapes },
    landmarksPx: lm,
  };
}

/** 얼굴 폭이 NORMALIZED_FACE_WIDTH 가 되도록 얼굴 주변을 잘라 리샘플링한다. */
export function normalizeFace(canvas: HTMLCanvasElement, lm: Float32Array, pose: { yaw: number; pitch: number; roll: number }): NormalizedFace {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < 468; i++) {
    minX = Math.min(minX, lm[3 * i]);
    maxX = Math.max(maxX, lm[3 * i]);
    minY = Math.min(minY, lm[3 * i + 1]);
    maxY = Math.max(maxY, lm[3 * i + 1]);
  }
  const faceW = Math.hypot(lm[LM.faceLeft * 3] - lm[LM.faceRight * 3], lm[LM.faceLeft * 3 + 1] - lm[LM.faceRight * 3 + 1]);
  const pad = faceW * 0.16;
  const sx = minX - pad;
  const sy = minY - pad;
  const sw = maxX - minX + 2 * pad;
  const sh = maxY - minY + 2 * pad;
  const k = NORMALIZED_FACE_WIDTH / faceW;
  const ow = Math.round(sw * k);
  const oh = Math.round(sh * k);

  // 큰 축소는 절반씩 단계적으로 줄여 앨리어싱을 막는다
  let src: HTMLCanvasElement = canvas;
  let srcScale = 1;
  while (k / srcScale < 0.5) {
    const t = document.createElement("canvas");
    t.width = Math.max(1, Math.round(src.width / 2));
    t.height = Math.max(1, Math.round(src.height / 2));
    const tc = t.getContext("2d")!;
    tc.imageSmoothingQuality = "high";
    tc.drawImage(src, 0, 0, t.width, t.height);
    src = t;
    srcScale /= 2;
  }
  const out = document.createElement("canvas");
  out.width = ow;
  out.height = oh;
  const ctx = out.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, ow, oh);
  ctx.drawImage(src, sx * srcScale, sy * srcScale, sw * srcScale, sh * srcScale, 0, 0, ow, oh);
  const img = ctx.getImageData(0, 0, ow, oh);
  const nl = new Float32Array(lm.length);
  for (let i = 0; i < lm.length / 3; i++) {
    nl[3 * i] = (lm[3 * i] - sx) * k;
    nl[3 * i + 1] = (lm[3 * i + 1] - sy) * k;
    nl[3 * i + 2] = lm[3 * i + 2] * k;
  }
  return { raster: { width: ow, height: oh, data: img.data }, landmarks: nl, sourceScale: k, pose };
}
