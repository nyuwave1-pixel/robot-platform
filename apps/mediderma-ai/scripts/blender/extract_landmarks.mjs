/**
 * 사진 → 얼굴 랜드마크(478점) + 텍스처 이미지.  사이트와 같은 MediaPipe 엔진을 브라우저(Playwright)에서 실행한다.
 *   ENABLE_DEV_HARNESS=1 로 띄운 앱이 필요하다 (기본 http://localhost:3200).
 *   node scripts/blender/extract_landmarks.mjs <photo.jpg> <outDir> [baseUrl]
 * 출력: <outDir>/landmarks.json { width, height, landmarksPx:[x,y,z,...] },  <outDir>/texture.jpg
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright");
const [photo, outDir, base = "http://localhost:3200"] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const ext = path.extname(photo).slice(1).toLowerCase().replace("jpg", "jpeg");
const dataUrl = `data:image/${ext};base64,` + readFileSync(photo).toString("base64");
const b = await chromium.launch();
const p = await b.newPage();
await p.goto(base + "/dev/harness");
await p.waitForFunction(() => typeof window.__landmarks === "function", null, { timeout: 30000 });
const r = await p.evaluate((d) => window.__landmarks(d), dataUrl);
await b.close();
if (!r) throw new Error("얼굴을 찾지 못했습니다");
writeFileSync(path.join(outDir, "texture.jpg"), Buffer.from(r.image.split(",")[1], "base64"));
delete r.image;
writeFileSync(path.join(outDir, "landmarks.json"), JSON.stringify(r));
console.log("landmarks", r.landmarksPx.length / 3, r.width, r.height);
