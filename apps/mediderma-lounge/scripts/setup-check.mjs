/** 개발 환경 점검: 무엇이 준비됐고 무엇이 선택 사항인지 알려 준다 (npm run setup) */
import { existsSync } from "node:fs";
import { createRequire } from "node:module";

const ok = (b) => (b ? "OK " : "-- ");
const node = +process.versions.node.split(".")[0];
let pw = false;
try { createRequire(import.meta.url)("playwright"); pw = true; } catch { /* 선택 */ }
const rows = [
  [node >= 20, `Node ${process.versions.node} (20 이상)`, "필수"],
  [existsSync("node_modules/vite"), "npm 의존성 (npm ci)", "필수"],
  [existsSync("public/models/real_female.glb"), "게임 모델 (저장소에 포함)", "필수"],
  [existsSync(".bl"), "Blender 가상환경 .bl (scripts/setup --blender)", "모델을 다시 만들 때만"],
  [existsSync("tools/assets/incoming/quaternius_ubc"), "무료 에셋 원본 (scripts/setup --assets)", "모델을 다시 만들 때만"],
  [existsSync("tools/assets/source/higgsfield_signature/base.glb"), "시그니처 캐릭터 원본 (저장소에 포함)", "시그니처를 다시 만들 때만"],
  [pw, "Playwright (scripts/setup --smoke)", "npm run smoke 에만"],
];
for (const [b, label, need] of rows) console.log(`${ok(b)} ${label}  · ${need}`);
console.log("\n바로 시작: npm run dev  →  http://localhost:3200   ·   테스트: npm test");
if (node < 20 || !existsSync("node_modules/vite")) process.exitCode = 1;
