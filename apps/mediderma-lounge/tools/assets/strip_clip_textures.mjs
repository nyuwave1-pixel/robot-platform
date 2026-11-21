/**
 * 동작 클립 GLB(walk/sit/wave/dance) 는 뼈 애니메이션만 쓰므로 텍스처를 뺀다 (저장소 용량 ↓).
 * 메시·뼈대·스킨은 그대로라 빌드 스크립트가 같은 리그로 읽는다.
 *   node tools/assets/strip_clip_textures.mjs tools/assets/source/higgsfield_x/walk.glb ...
 */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const p of process.argv.slice(2)) {
  const doc = await io.read(p);
  const n = doc.getRoot().listTextures().length;
  for (const t of doc.getRoot().listTextures()) t.dispose();
  await io.write(p, doc);
  console.log(`${p}: ${n} textures removed`);
}
