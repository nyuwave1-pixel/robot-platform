/**
 * 웹 최적화: public/models/*.glb 를 meshopt 로 압축한다 (EXT_meshopt_compression · 정점 양자화).
 * 게임은 src/three/gltf.ts 의 MeshoptDecoder 로 푼다. 이미 압축된 파일은 건너뛴다.
 *   node tools/assets/optimize_models.mjs [파일...]
 */
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const dir = join(root, "public/models");
const bin = join(root, "node_modules/.bin/gltf-transform");
const files = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(dir).filter((f) => f.endsWith(".glb")).map((f) => join(dir, f));

function compressed(p) {
  const b = readFileSync(p);
  const len = b.readUInt32LE(12);
  const json = JSON.parse(b.subarray(20, 20 + len).toString("utf8"));
  return (json.extensionsUsed ?? []).includes("EXT_meshopt_compression");
}
let before = 0, after = 0;
for (const p of files) {
  const s0 = statSync(p).size;
  before += s0;
  if (compressed(p)) { after += s0; continue; }
  execFileSync(bin, ["meshopt", p, p, "--level", "medium"], { stdio: "ignore" });
  const s1 = statSync(p).size;
  after += s1;
  console.log(`${p.split("/").pop()}: ${(s0 / 1024).toFixed(0)} KB -> ${(s1 / 1024).toFixed(0)} KB`);
}
console.log(`total ${(before / 1048576).toFixed(2)} MB -> ${(after / 1048576).toFixed(2)} MB`);
