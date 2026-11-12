// Photo textures (Poly Haven, CC0) prepared by tools/blender/textures.py. Inlined as data URIs so they load from file:// too.
import * as THREE from 'three';
import sandT from '../assets/tex/sand_t.jpg'; import grassT from '../assets/tex/grass_t.jpg'; import rockT from '../assets/tex/rock_t.jpg'; import concT from '../assets/tex/concrete_t.jpg';
import sandD from '../assets/tex/sand_d.jpg'; import sandN from '../assets/tex/sand_n.jpg'; import rockD from '../assets/tex/rock_d.jpg'; import rockN from '../assets/tex/rock_n.jpg';
import concD from '../assets/tex/concrete_d.jpg'; import concN from '../assets/tex/concrete_n.jpg'; import rustD from '../assets/tex/rust_d.jpg'; import rustN from '../assets/tex/rust_n.jpg';
import woodD from '../assets/tex/wood_d.jpg'; import woodN from '../assets/tex/wood_n.jpg'; import metalD from '../assets/tex/metal_d.jpg'; import metalN from '../assets/tex/metal_n.jpg';

import woodT from '../assets/tex/wood_t.jpg'; import rustT from '../assets/tex/rust_t.jpg'; import fabricT from '../assets/tex/fabric_t.jpg'; import fabricN from '../assets/tex/fabric_n.jpg';
import gunT from '../assets/tex/gun_t.jpg'; import gunN from '../assets/tex/gun_n.jpg'; import paintT from '../assets/tex/paint_t.jpg'; import paintN from '../assets/tex/paint_n.jpg'; import barkT from '../assets/tex/bark_t.jpg'; import barkN from '../assets/tex/bark_n.jpg';
const URL = { woodT, rustT, fabricT, fabricN, gunT, gunN, paintT, paintN, barkT, barkN, sandT, grassT, rockT, concT, sandD, sandN, rockD, rockN, concD, concN, rustD, rustN, woodD, woodN, metalD, metalN };
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

/** Like photo(), but the texel at uv (0,0) is forced neutral (tint 1.0 / flat normal): parts whose UVs are collapsed to 0 (kit sharing the cloth material) stay untextured. */
export function photoNeutral(key, repeat = 1) {
  if (!loader) return null; const k = key + '/n/' + repeat; if (cache.has(k)) return cache.get(k);
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'), nrm = key.endsWith('N'); g.fillStyle = nrm ? 'rgb(128,128,255)' : 'rgb(206,206,206)'; g.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 8; if (!nrm) t.colorSpace = THREE.SRGBColorSpace;
  const img = new Image(); img.onload = () => { g.drawImage(img, 0, 0, 512, 512); for (const [x, y] of [[0, 0], [506, 0], [0, 506], [506, 506]]) g.fillRect(x, y, 6, 6); t.needsUpdate = true; }; img.src = URL[key];
  cache.set(k, t); return t;
}
/** Props / structures built from Blender meshes: vertex attribute `cls` picks concrete, painted metal, wood or rust photo detail (albedo multiplier + normal). UVs are in metres. */
export function propPhoto(mat) {
  if (!loader) return mat;
  const u = { pT0: { value: photo('concT') }, pT1: { value: photo('paintT') }, pT2: { value: photo('woodT') }, pT3: { value: photo('rustT') }, pN0: { value: photo('concN') }, pN1: { value: photo('paintN') }, pN2: { value: photo('woodN') }, pN3: { value: photo('rustN') } };
  mat.normalMap = photo('concN'); mat.normalScale = new THREE.Vector2(0.7, 0.7); // enables the normal-map path; the sampler is replaced below
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float cls; varying float vCls; varying vec2 vPuv;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvCls = cls; vPuv = uv * 0.5;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying float vCls; varying vec2 vPuv; uniform sampler2D pT0, pT1, pT2, pT3, pN0, pN1, pN2, pN3;
      vec4 propTex(sampler2D a, sampler2D b, sampler2D c, sampler2D d) { vec2 dx = dFdx(vPuv), dy = dFdy(vPuv); return vCls < 0.5 ? textureGrad(a, vPuv, dx, dy) : vCls < 1.5 ? textureGrad(b, vPuv, dx, dy) : vCls < 2.5 ? textureGrad(c, vPuv, dx, dy) : textureGrad(d, vPuv, dx, dy); }`)
      .replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb *= propTex(pT0, pT1, pT2, pT3).rgb * 1.6;')
      .replace('texture2D( normalMap, vNormalMapUv )', 'propTex(pN0, pN1, pN2, pN3)');
  };
  mat.customProgramCacheKey = () => 'prop-photo';
  return mat;
}
/** Soldier cloth: real fabric weave (albedo multiplier + normal) under the camo pattern. */
export function fabricPhoto(mat) {
  if (!loader) return mat;
  const u = { tFab: { value: photoNeutral('fabricT') } }; mat.normalMap = photoNeutral('fabricN', 9); mat.normalScale = new THREE.Vector2(0.8, 0.8);
  mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, u);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tFab;').replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb *= texture2D(tFab, vMapUv * 6.0).rgb * 1.6;'); };
  mat.customProgramCacheKey = () => 'fabric-photo';
  return mat;
}
/** Swap a vertex-coloured material's procedural detail for a tint-normalised photo set (guns, vehicles, bark). */
export function photoDetail(mat, name, repeat, normalScale = 0.6) {
  if (!loader) return mat; mat.map = photo(name + 'T', repeat); mat.normalMap = photo(name + 'N', repeat); mat.normalScale = new THREE.Vector2(normalScale, normalScale); mat.color.multiplyScalar(1.6); return mat;
}
