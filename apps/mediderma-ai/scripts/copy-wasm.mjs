// MediaPipe WASM 런타임을 node_modules 에서 public/mediapipe 로 복사한다 (자체 호스팅 — 제3자 CDN 요청 없음).
import { cpSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "node_modules/@mediapipe/tasks-vision/wasm");
const dst = path.join(root, "public/mediapipe");
if (!existsSync(src)) { console.error("[copy-wasm] @mediapipe/tasks-vision not installed"); process.exit(1); }
mkdirSync(dst, { recursive: true });
cpSync(src, dst, { recursive: true });
console.log("[copy-wasm] copied MediaPipe wasm → public/mediapipe");
