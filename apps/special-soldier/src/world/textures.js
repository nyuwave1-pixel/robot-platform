// Photo textures (Poly Haven, CC0) prepared by tools/blender/textures.py. Inlined as data URIs so they load from file:// too.
import * as THREE from 'three';
import sandT from '../assets/tex/sand_t.jpg'; import grassT from '../assets/tex/grass_t.jpg'; import rockT from '../assets/tex/rock_t.jpg'; import concT from '../assets/tex/concrete_t.jpg';
import sandD from '../assets/tex/sand_d.jpg'; import sandN from '../assets/tex/sand_n.jpg'; import rockD from '../assets/tex/rock_d.jpg'; import rockN from '../assets/tex/rock_n.jpg';
import concD from '../assets/tex/concrete_d.jpg'; import concN from '../assets/tex/concrete_n.jpg'; import rustD from '../assets/tex/rust_d.jpg'; import rustN from '../assets/tex/rust_n.jpg';
import woodD from '../assets/tex/wood_d.jpg'; import woodN from '../assets/tex/wood_n.jpg'; import metalD from '../assets/tex/metal_d.jpg'; import metalN from '../assets/tex/metal_n.jpg';

const URL = { sandT, grassT, rockT, concT, sandD, sandN, rockD, rockN, concD, concN, rustD, rustN, woodD, woodN, metalD, metalN };
const cache = new Map(), loader = typeof document !== 'undefined' ? new THREE.TextureLoader() : null;
/** Repeating photo texture by key (e.g. 'concD' albedo, 'concN' normal, 'grassT' tint-normalised albedo). */
export function photo(key, repeat = 1) {
  if (!loader) return null; const k = key + '/' + repeat; if (cache.has(k)) return cache.get(k);
  const t = loader.load(URL[key]); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 8; if (!key.endsWith('N')) t.colorSpace = THREE.SRGBColorSpace; cache.set(k, t); return t;
}
/** Standard material from a photo set; tint multiplies the albedo. */
export const photoMat = (name, o = {}, repeat = 1) => new THREE.MeshStandardMaterial({ map: photo(name + 'D', repeat), normalMap: photo(name + 'N', repeat), roughness: 0.9, metalness: 0, ...o });

/** Terrain splat: vertex attribute `splat` (sand, grass, rock, concrete weights) blends four tint-normalised photo textures; vertex colours keep the hue. */
export function splatTerrain(mat, tiles) {
  const u = { tSand: { value: photo('sandT') }, tGrass: { value: photo('grassT') }, tRock: { value: photo('rockT') }, tConc: { value: photo('concT') }, uTiles: { value: tiles } };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 splat; varying vec4 vSplat; varying vec2 vTuv; uniform float uTiles;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvSplat = splat; vTuv = uv * uTiles;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec4 vSplat; varying vec2 vTuv; uniform sampler2D tSand, tGrass, tRock, tConc;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        vec2 fUv = vTuv * 0.137; // second, larger octave hides the tiling at distance
        vec3 sp = (texture2D(tSand, vTuv).rgb + texture2D(tSand, fUv).rgb) * vSplat.x + (texture2D(tGrass, vTuv).rgb + texture2D(tGrass, fUv).rgb) * vSplat.y
                + (texture2D(tRock, vTuv * 0.5).rgb + texture2D(tRock, fUv).rgb) * vSplat.z + (texture2D(tConc, vTuv).rgb + texture2D(tConc, fUv).rgb) * vSplat.w;
        diffuseColor.rgb *= sp * 0.8;`); // 1.6 (storage scale) / 2 octaves
  };
  mat.customProgramCacheKey = () => 'terrain-splat';
  return mat;
}
