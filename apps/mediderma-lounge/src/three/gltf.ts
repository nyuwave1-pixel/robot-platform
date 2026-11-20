/** 공용 GLTF 로더: meshopt 압축(EXT_meshopt_compression)을 푼다. 모델은 tools/assets/optimize_models.mjs 로 압축한다 */
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

export function makeGLTFLoader() {
  const l = new GLTFLoader();
  l.setMeshoptDecoder(MeshoptDecoder);
  return l;
}
