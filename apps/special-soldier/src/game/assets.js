// Blender-authored assets (tools/blender/build.py → src/assets/assets.glb). The GLB is inlined into the bundle
// as a data URI so it also loads from file:// (Electron). Everything falls back to the procedural models if
// the file is missing or fails to parse.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import glbUrl from '../assets/assets.glb?inline';

const roots = new Map();
export const ASSETS = { ready: false, tris: 0, count: 0 };
const clean = (n) => n.replace(/_\d+$/, ''); // GLTFLoader de-duplicates node names with a numeric suffix
export function find(root, name) { let hit = null; root.traverse((o) => { if (!hit && o !== root && clean(o.name) === name) hit = o; }); return hit; }
export function has(name) { return roots.has(name); }
export function clone(name) { const r = roots.get(name); return r ? r.clone(true) : null; }
export function raw(name) { return roots.get(name); }

export async function loadAssets() {
  try {
    const gltf = await new GLTFLoader().loadAsync(glbUrl);
    for (const o of [...gltf.scene.children]) { o.position.set(0, 0, 0); o.updateMatrixWorld(true); roots.set(o.name, o); o.traverse((m) => { if (m.isMesh) { ASSETS.tris += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; m.castShadow = true; m.receiveShadow = true; } }); }
    ASSETS.count = roots.size; ASSETS.ready = roots.size > 0;
  } catch (e) { console.warn('Blender assets unavailable, using procedural models:', e.message); }
  return ASSETS.ready;
}
/** Direct mesh primitives of a node (not those of child pivots). */
export const NODES = new Set(['body', 'legL', 'legR', 'upper', 'head', 'arms', 'gun', 'eye', 'mag', 'pump', 'rotor', 'tail', 'light', 'turret', 'trunk', 'canopy', 'muzzle', 'sight', 'gripL', 'acc_helmet', 'acc_nvg', 'acc_cap', 'acc_beret', 'acc_hood', 'acc_visor', 'acc_heavy']);
const isNode = (c) => { const n = clean(c.name); return NODES.has(n) || n.endsWith('__d') || n.startsWith('acc_'); }; // '__d' = detail (LOD) child, 'acc_' = optional kit set
function ownMeshes(node) { const out = node.isMesh ? [node] : []; for (const c of node.children) if (c.isMesh && !isNode(c)) out.push(c); return out; }
function withColor(geo, color, matrix) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone(); const ao = g.attributes.color || null; // COLOR_0 = ambient occlusion baked in Blender
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  if (matrix) g.applyMatrix4(matrix);
  const n = g.attributes.position.count, c = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const k = ao ? ao.getX(i) : 1; c[i * 3] = color.r * k; c[i * 3 + 1] = color.g * k; c[i * 3 + 2] = color.b * k; } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g;
}
/** Merge a node's primitives into one vertex-coloured geometry. colorOf(materialName, material) → THREE.Color | null (null = keep as separate mesh). */
export function mergeNode(node, colorOf, deep = false, pick = null, noDetail = false) {
  const buckets = new Map(), geos = [], keep = [], inv = new THREE.Matrix4().copy(node.matrixWorld).invert(), list = deep ? [] : ownMeshes(node);
  if (deep) node.traverse((m) => { if (m.isMesh && !(noDetail && (clean(m.name).endsWith('__d') || (m.parent && clean(m.parent.name).endsWith('__d'))))) list.push(m); });
  for (const m of list) { const col = colorOf(m.material.name, m.material); if (!col) { keep.push(m); continue; } const g = withColor(m.geometry, col, m === node ? null : new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld)); geos.push(g); if (pick) { const k = pick(m.material.name, m.material); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(g); } }
  return { geo: !pick && geos.length ? mergeGeometries(geos) : null, parts: [...buckets].map(([key, list]) => ({ key, geo: mergeGeometries(list) })), keep };
}
const linear = (m) => m.color.clone();
/** One merged, vertex-coloured geometry for a whole asset (props, vegetation parts, vehicles' static bodies). */
export function geometry(name, child, tint, noDetail = false) {
  const key = `${name}/${child || ''}/${noDetail ? 'b' : ''}`; if (geoCache.has(key)) return geoCache.get(key);
  const r = roots.get(name); if (!r) return null; const node = child ? find(r, child) : r; if (!node) return null; r.updateMatrixWorld(true);
  const { geo } = mergeNode(node, (n, m) => (tint ? linear(m).multiply(tint) : linear(m)), true, null, noDetail); geoCache.set(key, geo); return geo;
}
const geoCache = new Map();

const special = (m) => m.transparent || (m.emissiveIntensity > 0 && m.emissive && m.emissive.getHex() > 0);
/** Rebuild an asset as a clean pivot hierarchy: one vertex-coloured mesh per animated node (few draw calls),
 *  emissive / transparent parts kept as their own meshes. colorOf may override colours by material name. */
export function rebuild(name, material, colorOf, skip) {
  const src = typeof name === 'string' ? roots.get(name) : name; if (!src) return null; src.updateMatrixWorld(true);
  const walk = (node) => {
    const g = new THREE.Group(); g.name = clean(node.name); g.position.copy(node.position); g.quaternion.copy(node.quaternion); g.scale.copy(node.scale);
    const byName = typeof material === 'function'; // material(matName) → one mesh per distinct material (e.g. camo cloth vs plain kit)
    const { geo, parts, keep } = mergeNode(node, (n, m) => (special(m) ? null : (colorOf && colorOf(n, m)) || m.color), false, byName ? (n) => material(n) : null);
    for (const part of byName ? parts : geo ? [{ key: material, geo }] : []) { const mesh = new THREE.Mesh(part.geo, part.key); mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh); }
    for (const k of keep) { const mesh = new THREE.Mesh(k.geometry, (colorOf && colorOf(k.material.name, k.material, true)) || k.material); if (k !== node) { mesh.position.copy(k.position); mesh.quaternion.copy(k.quaternion); } g.add(mesh); }
    for (const c of node.children) if ((isNode(c) || !c.isMesh) && !(skip && skip(clean(c.name)))) g.add(walk(c));
    return g;
  };
  const out = walk(src); out.position.set(0, 0, 0); return out;
}
