// Procedural placeholder character / vehicle models (soldier, RHIB assault boat, helicopter, APC).
// These stand in for skeletal meshes + Control Rig animation in the UE5 production build.
import * as THREE from 'three';
import { ASSETS, rebuild, geometry } from './assets.js';

const cache = new Map();
const mat = (c, r = 0.9, m = 0) => { const k = c + '_' + r + '_' + m; if (!cache.has(k)) cache.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m })); return cache.get(k); };
const G1 = new THREE.BoxGeometry(1, 1, 1);
function part(parent, sx, sy, sz, x, y, z, m) { const b = new THREE.Mesh(G1, m); b.scale.set(sx, sy, sz); b.position.set(x, y, z); b.castShadow = true; parent.add(b); return b; }
export const HOT = new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 5, 5), fog: false, toneMapped: false });
export const PALETTE = {
  squad:  { cloth: 0x5c5c42, vest: 0x45452f, skin: 0x8a6a50, helmet: 0x45452f, nvg: true }, // multi-terrain camo, coyote plate carrier
  guard:  { cloth: 0x5a5a4a, vest: 0x2a2a26, skin: 0x8a6a50, helmet: 0x1a1a1a, cap: true },
  assault:{ cloth: 0x3a3a3c, vest: 0x161618, skin: 0x8a6a50, helmet: 0x222224 },
  sniper: { cloth: 0x3f4a2c, vest: 0x2c3420, skin: 0x7a5a44, helmet: 0x3a4428, hood: true },
  heavy:  { cloth: 0x2a2a2a, vest: 0x4a1a14, skin: 0x8a6a50, helmet: 0x101010, bulky: true },
  elite:  { cloth: 0x101216, vest: 0x1c1e24, skin: 0x8a6a50, helmet: 0x0c0c0e, visor: 0xff3020 },
  boss:   { cloth: 0x1a0c0c, vest: 0x5a1010, skin: 0x9a7a60, helmet: 0x300808, visor: 0xffb020, bulky: true, beret: true },
};
/** Returns a group (origin at feet, facing +Z) with userData.parts for animation. */
/** Tileable micro-detail normal map (fabric weave / cast metal / paint) generated once on a canvas. */
export function detailNormal(kind, repeat) {
  if (typeof document === 'undefined') return null;
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), img = g.createImageData(S, S), h = new Float32Array(S * S);
  let seed = kind.length * 7919; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { let v = rnd() * 0.5; if (kind === 'fabric') v = Math.sin((x * Math.PI) / 2) * Math.sin((y * Math.PI) / 2) * 0.9 + rnd() * 0.35 + Math.sin((x + y) * 0.2) * 0.3; else if (kind === 'metal') v = rnd() * 0.45 + Math.sin(y * 1.9 + Math.sin(x * 0.07) * 3) * 0.12; else v = rnd() * 0.3 + Math.sin(x * 0.19) * Math.sin(y * 0.23) * 0.5; h[y * S + x] = v; }
  const H = (x, y) => h[((y + S) % S) * S + ((x + S) % S)];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const i = (y * S + x) * 4; img.data[i] = 128 + (H(x - 1, y) - H(x + 1, y)) * 90; img.data[i + 1] = 128 + (H(x, y - 1) - H(x, y + 1)) * 90; img.data[i + 2] = 255; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 4; return t;
}
/** Tileable albedo multiplier (vertex colour × this): 'camo' = three-tone disruptive pattern, 'grunge' = dirt, streaks and edge scratches. UVs are in metres. */
export function detailMap(kind, perMetre) {
  if (typeof document === 'undefined') return null;
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), img = g.createImageData(S, S);
  let seed = kind === 'camo' ? 4242 : 977; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const G = 16, grid = new Float32Array(G * G * 3); for (let i = 0; i < grid.length; i++) grid[i] = rnd();
  const noise = (x, y, ch, f) => { const fx = (x / S) * G * f, fy = (y / S) * G * f, x0 = Math.floor(fx), y0 = Math.floor(fy), u = fx - x0, v = fy - y0, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v), at = (a, b) => grid[((((b % G) + G) % G) * G + (((a % G) + G) % G)) * 3 + ch]; return (at(x0, y0) * (1 - su) + at(x0 + 1, y0) * su) * (1 - sv) + (at(x0, y0 + 1) * (1 - su) + at(x0 + 1, y0 + 1) * su) * sv; };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { let v;
    if (kind === 'camo') { // multi-terrain pattern: tan base, green and brown macro blotches, dark and pale micro elements (RGB multiplier / 1.3)
      const a = noise(x, y, 0, 0.5) + noise(x, y, 1, 1) * 0.5, b = noise(x + 90, y + 40, 2, 0.5) + noise(x, y, 0, 2) * 0.25, m = noise(x + 31, y + 77, 1, 4), m2 = noise(x + 150, y + 9, 2, 4);
      let t = a > 0.9 ? [0.8, 0.95, 0.62] : b > 0.74 ? [0.82, 0.66, 0.5] : a < 0.5 ? [1.22, 1.16, 0.98] : [1.0, 1.0, 0.92];
      if (m > 0.74) t = [0.46, 0.47, 0.42]; else if (m2 > 0.76) t = [1.3, 1.26, 1.12]; else if (m2 < 0.2) t = [0.7, 0.82, 0.56];
      const n = 0.95 + rnd() * 0.1, i = (y * S + x) * 4; for (let k = 0; k < 3; k++) img.data[i + k] = Math.max(0, Math.min(255, (t[k] * n / 1.3) * 255)); img.data[i + 3] = 255; continue; }
    else { const d = noise(x, y, 0, 0.5) * 0.6 + noise(x, y, 1, 2) * 0.3 + noise(x, y * 0.2, 2, 4) * 0.25; v = 0.98 - Math.max(0, d - 0.5) * 0.9 + (rnd() - 0.5) * 0.06; if (rnd() < 0.0016) v = 1.35; }
    const i = (y * S + x) * 4, k = Math.max(0, Math.min(255, v * 238)); img.data[i] = img.data[i + 1] = img.data[i + 2] = k; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  if (kind === 'grunge') { g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1; for (let i = 0; i < 26; i++) { const x = rnd() * S, y = rnd() * S, l = 4 + rnd() * 18, a = rnd() * 6.28; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(perMetre, perMetre); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const NS = (v) => new THREE.Vector2(v, v);
const CLOTH_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, map: detailMap('camo', 1.5), normalMap: detailNormal('fabric', 45), normalScale: NS(0.6) });
CLOTH_MAT.color.setScalar(1.3); // the camo map stores multiplier / 1.3
const CHAR_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0.02, normalMap: detailNormal('fabric', 45), normalScale: NS(0.3) });
const VEH_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.35, map: detailMap('grunge', 0.45), normalMap: detailNormal('paint', 6), normalScale: NS(0.35) });
export const GUN_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.7, map: detailMap('grunge', 5), normalMap: detailNormal('metal', 30), normalScale: NS(0.3) });
const KIT = { // headgear / armour set and weapon per soldier type (nodes modelled in Blender)
  squad: { acc: ['acc_helmet', 'acc_nvg'], gun: 'm4' }, guard: { acc: ['acc_cap'], gun: 'kr5' }, assault: { acc: ['acc_helmet'], gun: 'm4' }, sniper: { acc: ['acc_hood'], gun: 'bolt' },
  heavy: { acc: ['acc_helmet', 'acc_heavy'], gun: 'lmg' }, elite: { acc: ['acc_helmet', 'acc_visor'], gun: 'arx' }, boss: { acc: ['acc_beret', 'acc_visor', 'acc_heavy'], gun: 'lmg' },
};
const templates = new Map(), C = (h) => new THREE.Color(h);
function soldierTemplate(kind) {
  if (templates.has(kind)) return templates.get(kind);
  const p = PALETTE[kind], kit = KIT[kind], col = { cloth: C(p.cloth), vest: C(p.vest), skin: C(p.skin), helmet: C(p.helmet), boots: C(0x0b0b0c), gear: C(0x16171a), accent: C(0x8a1010) };
  const glow = p.visor ? new THREE.MeshStandardMaterial({ color: 0x111111, emissive: p.visor, emissiveIntensity: 2.5 }) : null;
  const g = rebuild('Soldier', (n) => (n === 'cloth' || n === 'vest' ? CLOTH_MAT : CHAR_MAT), (n, m, kept) => (kept ? (n === 'visor' && glow) || null : col[n] || null), (n) => n.startsWith('acc_') && !kit.acc.includes(n));
  const gg = geometry('W_' + kit.gun); if (gg) { const one = new THREE.Mesh(gg, GUN_MAT); one.castShadow = true; g.getObjectByName('gun').add(one); }
  templates.set(kind, g); return g;
}
function soldierFromAsset(kind, scale) {
  const g = soldierTemplate(kind).clone(true); g.scale.setScalar(scale);
  const meshes = []; g.traverse((o) => { if (o.isMesh) { meshes.push(o); o.userData.mat = o.material; } });
  const n = (k) => g.getObjectByName(k);
  g.userData.parts = { body: n('body'), legL: n('legL'), legR: n('legR'), upper: n('upper'), head: n('head'), arms: n('arms'), gun: n('gun'), meshes };
  return g;
}
function vehicleFromAsset(name) { const g = rebuild(name, VEH_MAT); const meshes = []; g.traverse((o) => { if (o.isMesh) { meshes.push(o); o.userData.mat = o.material; o.castShadow = true; } }); g.userData.parts = { meshes }; return g; }
export function makeSoldier(kind, scale = 1) {
  if (ASSETS.ready) return soldierFromAsset(kind, scale);
  const p = PALETTE[kind], g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const cl = mat(p.cloth), vs = mat(p.vest, 0.8), sk = mat(p.skin, 0.7), hm = mat(p.helmet, 0.6, 0.2), bt = mat(0x111111), gm = mat(0x18191b, 0.5, 0.6);
  const legL = new THREE.Group(), legR = new THREE.Group(); legL.position.set(0.12, 0.92, 0); legR.position.set(-0.12, 0.92, 0);
  for (const l of [legL, legR]) { part(l, 0.18, 0.82, 0.2, 0, -0.41, 0, cl); part(l, 0.19, 0.14, 0.3, 0, -0.85, 0.04, bt); body.add(l); }
  const upper = new THREE.Group(); upper.position.y = 0.92; body.add(upper);
  const bw = p.bulky ? 0.56 : 0.46; part(upper, bw, 0.62, 0.27, 0, 0.32, 0, cl); part(upper, bw + 0.05, 0.42, 0.33, 0, 0.36, 0, vs); part(upper, 0.3, 0.16, 0.12, 0, 0.2, 0.2, vs);
  part(upper, 0.36, 0.3, 0.14, 0, 0.36, -0.2, vs); // pack
  const head = new THREE.Group(); head.position.y = 0.76; upper.add(head); part(head, 0.2, 0.24, 0.22, 0, 0, 0, sk);
  if (p.beret) part(head, 0.26, 0.08, 0.26, 0.03, 0.15, 0, mat(0x8a1010)); else if (p.cap) part(head, 0.22, 0.08, 0.3, 0, 0.14, 0.03, hm); else part(head, 0.26, 0.15, 0.28, 0, 0.11, -0.01, hm);
  if (p.hood) part(head, 0.3, 0.3, 0.2, 0, -0.02, -0.08, cl);
  if (p.visor) { const v = part(head, 0.21, 0.06, 0.04, 0, 0.02, 0.11, new THREE.MeshStandardMaterial({ color: 0x111111, emissive: p.visor, emissiveIntensity: 2.5 })); v.castShadow = false; }
  if (p.nvg) { part(head, 0.06, 0.06, 0.1, 0.05, 0.14, 0.16, bt); part(head, 0.06, 0.06, 0.1, -0.05, 0.14, 0.16, bt); }
  const arms = new THREE.Group(); arms.position.set(0, 0.52, 0.05); upper.add(arms);
  part(arms, 0.11, 0.11, 0.5, 0.25, -0.06, 0.2, cl).rotation.y = -0.25; part(arms, 0.11, 0.11, 0.52, -0.24, -0.04, 0.22, cl).rotation.y = 0.5;
  const gun = part(arms, 0.06, 0.11, kind === 'heavy' || kind === 'boss' ? 1.0 : kind === 'sniper' ? 1.15 : 0.78, 0.1, -0.02, 0.52, gm); part(arms, 0.045, 0.2, 0.07, 0.1, -0.15, 0.42, gm);
  g.scale.setScalar(scale);
  const meshes = []; g.traverse((o) => { if (o.isMesh) { meshes.push(o); o.userData.mat = o.material; } });
  g.userData.parts = { body, legL, legR, upper, head, arms, gun, meshes };
  return g;
}
export function poseSoldier(g, { walk = 0, moveK = 0, crouch = 0, aim = 0, sit = false, dead = 0 }) {
  const p = g.userData.parts, sw = Math.sin(walk) * 0.75 * moveK;
  if (sit) { p.legL.rotation.x = p.legR.rotation.x = -1.45; p.body.position.y = -0.52; p.upper.rotation.x = 0.12; p.arms.rotation.x = 0.35; return; }
  p.legL.rotation.x = sw - crouch * 1.1; p.legR.rotation.x = -sw + crouch * 0.5; p.body.position.y = -crouch * 0.42 + Math.abs(Math.sin(walk)) * 0.04 * moveK;
  p.upper.rotation.x = crouch * 0.25 + moveK * 0.1; p.arms.rotation.x = -aim - crouch * 0.2;
  g.rotation.x = -dead * 1.5; g.position.y += 0;
}
export function makeBoat() {
  if (ASSETS.ready) return vehicleFromAsset('Boat');
  const g = new THREE.Group(), hull = mat(0x1a1d1f, 0.7, 0.1), tube = mat(0x24282a, 0.9), mt = mat(0x2a2c2e, 0.5, 0.6);
  part(g, 2.3, 0.5, 7.6, 0, 0.25, 0, hull); part(g, 1.5, 0.45, 1.8, 0, 0.3, 4.3, hull).rotation.x = -0.25;
  for (const sx of [-1, 1]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 8, 10), tube); t.rotation.x = Math.PI / 2; t.position.set(sx * 1.25, 0.62, 0.2); t.castShadow = true; g.add(t); const n = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.38, 1.9, 10), tube); n.rotation.x = Math.PI / 2; n.rotation.z = sx * 0.55; n.position.set(sx * 0.72, 0.66, 4.9); g.add(n); }
  part(g, 0.9, 1.1, 0.8, 0, 1.0, -1.6, mt); part(g, 1.0, 0.5, 0.06, 0, 1.7, -1.25, mat(0x334455, 0.2, 0.5)); // console + windscreen
  for (const sx of [-0.45, 0.45]) { part(g, 0.5, 1.2, 0.7, sx, 0.9, -4.1, mt); part(g, 0.3, 0.3, 0.5, sx, 0.1, -4.4, mt); } // twin outboards
  part(g, 0.08, 1.5, 0.08, 0.3, 1.9, -1.6, mt); // antenna
  return g;
}
export function makeHeli() {
  if (ASSETS.ready) { const h = vehicleFromAsset('Heli'); h.userData.rotor = h.getObjectByName('rotor'); h.userData.tail = h.getObjectByName('tail'); h.userData.light = h.getObjectByName('light'); return h; }
  const g = new THREE.Group(), body = mat(0x23282a, 0.6, 0.3), dk = mat(0x121416, 0.5, 0.5), gl = mat(0x30404a, 0.15, 0.7);
  part(g, 2.4, 2.2, 6.5, 0, 2.2, 0, body); part(g, 2.0, 1.4, 2.2, 0, 2.3, 4.0, gl).rotation.x = 0.25; part(g, 0.7, 0.8, 7, 0, 2.8, -6.2, body); part(g, 0.15, 2.2, 1.2, 0, 3.8, -9.3, body); part(g, 2.6, 0.12, 0.8, 0, 3.0, -9.2, body);
  part(g, 1.6, 0.6, 3, 0, 3.6, 0, dk); for (const sx of [-1.3, 1.3]) { part(g, 0.12, 0.12, 4.5, sx, 0.35, 0.4, dk); part(g, 0.08, 0.9, 0.08, sx, 0.8, 1.6, dk); part(g, 0.08, 0.9, 0.08, sx, 0.8, -0.8, dk); }
  const rotor = new THREE.Group(); rotor.position.set(0, 4.05, 0); for (let i = 0; i < 4; i++) { const b = part(rotor, 0.35, 0.05, 7.5, 0, 0, 3.75, dk); const h = new THREE.Group(); h.rotation.y = (i * Math.PI) / 2; h.add(b); rotor.add(h); } g.add(rotor);
  const tail = new THREE.Group(); tail.position.set(0.25, 3.9, -9.3); for (let i = 0; i < 2; i++) { const h = new THREE.Group(); h.rotation.x = (i * Math.PI) / 2; part(h, 0.04, 0.2, 2.2, 0, 0, 0, dk); tail.add(h); } g.add(tail);
  const l1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), new THREE.MeshStandardMaterial({ color: 0xff2010, emissive: 0xff2010, emissiveIntensity: 5 })); l1.position.set(0, 1.0, 0); g.add(l1);
  g.userData.rotor = rotor; g.userData.tail = tail; g.userData.light = l1;
  return g;
}
export function makeAPC() {
  if (ASSETS.ready) { const v = vehicleFromAsset('APC'); v.userData.parts.turret = v.getObjectByName('turret'); return v; }
  const g = new THREE.Group(), ol = mat(0x3a4030, 0.8, 0.2), dk = mat(0x15171a, 0.9), gm = mat(0x1a1b1d, 0.5, 0.6);
  part(g, 3, 1.4, 6.6, 0, 1.35, 0, ol); part(g, 2.6, 0.5, 5.2, 0, 2.2, -0.3, ol); part(g, 3, 0.8, 1.2, 0, 1.15, 3.5, ol).rotation.x = 0.5;
  for (const sx of [-1.5, 1.5]) for (const z of [-2.3, -0.8, 0.8, 2.3]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.45, 12), dk); w.rotation.z = Math.PI / 2; w.position.set(sx, 0.62, z); w.castShadow = true; g.add(w); }
  const turret = new THREE.Group(); turret.position.set(0, 2.45, 0.2); part(turret, 1.5, 0.7, 1.7, 0, 0.35, 0, ol); const brl = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 8), gm); brl.rotation.x = Math.PI / 2; brl.position.set(0, 0.4, 2.1); turret.add(brl); g.add(turret);
  const meshes = []; g.traverse((o) => { if (o.isMesh) { meshes.push(o); o.userData.mat = o.material; } });
  g.userData.parts = { turret, meshes };
  return g;
}
