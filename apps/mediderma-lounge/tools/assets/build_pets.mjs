/**
 * 애니메이션 펫 모델 만들기: Quaternius Ultimate Animated Animals (CC0) glTF → public/models/pet_*.glb
 *   node tools/assets/build_pets.mjs   (원본: tools/assets/incoming/quaternius_animals/ — fetch_free_assets.py 가 받는다)
 * 게임에 쓰는 동작만 남기고(Idle·Walk·Eating·Idle_2_HeadLow·Jump_ToIdle), 키 0.42m 로 줄이고, 색을 파스텔 쪽으로 살짝 밝힌다.
 * 그다음 optimize_models.mjs 로 meshopt 압축한다.
 */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, dedup } from "@gltf-transform/functions";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const src = join(root, "tools/assets/incoming/quaternius_animals");
const KEEP = new Set(["Idle", "Walk", "Eating", "Idle_2_HeadLow", "Jump_ToIdle"]);
/** 게임 파일 이름 · 원본 · 목표 높이(m) */
const PETS = [["pet_shiba", "ShibaInu.gltf", 0.42], ["pet_husky", "Husky.gltf", 0.46], ["pet_fox", "Fox.gltf", 0.4]];

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const [name, file, height] of PETS) {
  const doc = await io.read(join(src, file));
  const r = doc.getRoot();
  for (const a of r.listAnimations()) if (!KEEP.has(a.getName())) a.dispose();
  // 높이 맞추기: 장면 최상위 노드에 배율을 곱한다
  let maxY = 0;
  for (const m of r.listMeshes()) for (const p of m.listPrimitives()) { const pos = p.getAttribute("POSITION"); if (pos) maxY = Math.max(maxY, pos.getMax([])[1]); }
  const k = height / maxY;
  for (const n of r.listScenes()[0].listChildren()) n.setScale(n.getScale().map((v) => v * k));
  // 파스텔 보정: 기본 색을 흰색 쪽으로 15% 섞는다 (눈 등 아주 어두운 색은 그대로)
  for (const m of r.listMaterials()) {
    const c = m.getBaseColorFactor();
    const lum = (c[0] + c[1] + c[2]) / 3;
    if (lum > 0.05) m.setBaseColorFactor([c[0] + (1 - c[0]) * 0.15, c[1] + (1 - c[1]) * 0.15, c[2] + (1 - c[2]) * 0.15, c[3]]);
    m.setRoughnessFactor(0.85).setMetallicFactor(0);
  }
  await doc.transform(prune(), dedup());
  await io.write(join(root, "public/models", `${name}.glb`), doc);
  console.log(name, "scale", k.toFixed(3), "anims", r.listAnimations().map((a) => a.getName()).join(","));
}
