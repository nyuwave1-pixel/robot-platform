// Terrain heightfield, static collision (AABB spatial hash), ray casting and the prop/mesh factory.
// UE5 equivalent: Landscape + World Partition cells + Chaos static bodies / line traces.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { G } from '../core/ctx.js';
import { clamp, lerp, smooth, fbm, mulberry } from '../core/util.js';
import { geometry as assetGeo } from '../game/assets.js';
import { detailMap } from '../game/models.js';
import { photoMat, splatTerrain, propPhoto } from './textures.js';

export const SIZE = 1200, N = 240, CELL = SIZE / N;
export const FAC_Y = -60, FAC_H = 4.2;
const GC = 16; // collision grid cell (m)
export const FLATS = [
  { x0: -135, x1: 135, z0: -195, z1: 5, h: 16, m: 35, kind: 'base' },
  { x0: -70, x1: 270, z0: -335, z1: -240, h: 7, m: 30, kind: 'air' },
  { x0: -20, x1: 130, z0: -420, z1: -345, h: 2.2, m: 20, kind: 'port' },
  { x0: -175, x1: -105, z0: 115, z1: 185, h: 13, m: 25, kind: 'comms' },
];
function flatDist(f, x, z) { return Math.hypot(Math.max(f.x0 - x, 0, x - f.x1), Math.max(f.z0 - z, 0, z - f.z1)); }
export function rawHeight(x, z) {
  const r = Math.hypot(x, z), ang = Math.atan2(z, x);
  const R = 430 + 30 * Math.sin(ang * 3 + 1) + 18 * Math.sin(ang * 7);
  const rn = r / R;
  let h = -7 + smooth(1.0, 0.74, rn) * 9.2;
  const inland = smooth(0.8, 0.45, rn);
  h += inland * (fbm(x * 0.006 + 10, z * 0.006 + 7, 5) * 34 - 6) + inland * fbm(x * 0.03, z * 0.03, 3) * 3;
  h += smooth(-150, -300, x) * smooth(0.97, 0.7, rn) * 22;
  for (const f of FLATS) h = lerp(h, f.h, 1 - smooth(0, f.m, flatDist(f, x, z)));
  return h;
}

function canvasTex(base, vary, opts = {}) {
  const s = 128, c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d'), img = g.createImageData(s, s), rnd = mulberry(opts.seed || 7);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    let n = (fbm(x * 0.09 + (opts.seed || 0), y * 0.09, 3) - 0.5) * 2 * vary + (rnd() - 0.5) * vary * 0.6;
    if (opts.planks && (x % 32 < 2 || y % 64 < 2)) n -= 0.25;
    if (opts.panels && (x % 64 < 2 || y % 64 < 2)) n -= 0.18;
    if (opts.camo) { const k = fbm(x * 0.05 + 30, y * 0.05, 2); n += k > 0.55 ? -0.2 : k < 0.42 ? 0.12 : 0; }
    const i = (y * s + x) * 4;
    img.data[i] = clamp(base[0] * (1 + n), 0, 255); img.data[i + 1] = clamp(base[1] * (1 + n), 0, 255); img.data[i + 2] = clamp(base[2] * (1 + n), 0, 255); img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
const std = (tex, o = {}) => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0, ...o });
export const MAT = {};
export function initMaterials() {
  // photo textures: Poly Haven CC0, processed in Blender (tools/blender/textures.py)
  MAT.concrete = photoMat('conc', { color: 0xb8b6b0 }, 2);
  MAT.dark = photoMat('conc', { color: 0x5a5c60, roughness: 0.75 }, 2);
  MAT.metal = photoMat('metal', { color: 0x9aa4a2, roughness: 0.5, metalness: 0.6 }, 2);
  MAT.olive = std(canvasTex([70, 78, 50], 0.3, { seed: 4, camo: true }), { roughness: 0.8 });
  MAT.wood = photoMat('wood', { color: 0xc8b090 }, 2);
  MAT.sand = photoMat('sand', { color: 0xe6d8b4 }, 2);
  MAT.rust = photoMat('rust', { roughness: 0.7, metalness: 0.3 }, 2);
  MAT.blue = std(canvasTex([44, 70, 110], 0.25, { seed: 9, panels: true }), { roughness: 0.6, metalness: 0.3 });
  MAT.red = std(canvasTex([150, 40, 34], 0.25, { seed: 10 }), { roughness: 0.6 });
  MAT.rock = photoMat('rock', { color: 0xb0aca4 }, 2);
  MAT.rubber = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.95 });
  MAT.white = std(canvasTex([200, 205, 205], 0.1, { seed: 12, panels: true }), { roughness: 0.5 });
  MAT.glass = new THREE.MeshStandardMaterial({ color: 0x9fd0e0, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.6 });
  MAT.lamp = new THREE.MeshStandardMaterial({ color: 0xfff2c0, emissive: 0xffe9a0, emissiveIntensity: 3 });
  MAT.redLamp = new THREE.MeshStandardMaterial({ color: 0xff2a1a, emissive: 0xff2010, emissiveIntensity: 4 });
  MAT.screen = new THREE.MeshStandardMaterial({ color: 0x10301a, emissive: 0x30ff80, emissiveIntensity: 1.6 });
  MAT.prop = propPhoto(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0.1, map: detailMap('grunge', 1.5) }));
  MAT.fence = new THREE.MeshStandardMaterial({ color: 0x70787a, transparent: true, opacity: 0.45, roughness: 0.6, metalness: 0.7, side: THREE.DoubleSide });
}

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
let qStamp = 0;

export class World {
  constructor() {
    this.heights = new Float32Array((N + 1) * (N + 1));
    this.colliders = []; this.grid = new Map(); this.statics = []; this.animated = []; this.interactables = [];
    this.group = new THREE.Group(); G.scene.add(this.group);
    for (let r = 0; r <= N; r++) for (let c = 0; c <= N; c++) this.heights[r * (N + 1) + c] = rawHeight(-SIZE / 2 + c * CELL, -SIZE / 2 + r * CELL);
    this.buildTerrain();
  }
  heightAt(x, z) {
    const fx = clamp((x + SIZE / 2) / CELL, 0, N - 0.001), fz = clamp((z + SIZE / 2) / CELL, 0, N - 0.001);
    const c = fx | 0, r = fz | 0, u = fx - c, v = fz - r, H = this.heights, i = r * (N + 1) + c;
    return lerp(lerp(H[i], H[i + 1], u), lerp(H[i + N + 1], H[i + N + 2], u), v);
  }
  surfaceAt(x, z, y) {
    if (y < -30) return 'metal';
    const h = this.heightAt(x, z);
    if (h < 0.15) return 'water';
    for (const f of FLATS) if (flatDist(f, x, z) < 2) return 'concrete';
    return h < 3 ? 'sand' : 'grass';
  }
  buildTerrain() {
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, N, N); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), spl = new Float32Array(pos.count * 4), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), h = this.heights[i]; pos.setY(i, h);
      const slope = Math.abs(rawHeight(x + 3, z) - h) + Math.abs(rawHeight(x, z + 3) - h);
      const n = fbm(x * 0.05, z * 0.05, 3);
      if (h < 2.6) c.setRGB(0.72 + n * 0.1, 0.66 + n * 0.08, 0.48 + n * 0.06); else if (slope > 3.4) c.setRGB(0.36 + n * 0.1, 0.35 + n * 0.1, 0.32 + n * 0.1); else c.setRGB(0.1 + n * 0.12, 0.27 + n * 0.16, 0.08 + n * 0.06);
      if (h < 0.4) c.multiplyScalar(0.7);
      for (const f of FLATS) { const d = flatDist(f, x, z); if (d < 6) { const k = f.kind === 'air' ? 0.2 : f.kind === 'comms' ? 0.34 : 0.4; c.lerp(new THREE.Color(k + n * 0.05, k + n * 0.05, k + n * 0.04), 1 - d / 6); } }
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      let wS = smooth(3.4, 2.0, h), wR = (1 - wS) * smooth(2.6, 4.2, slope), wC = 0; for (const f of FLATS) { const d = flatDist(f, x, z); if (d < 6) wC = Math.max(wC, 1 - d / 6); }
      wS *= 1 - wC; wR *= 1 - wC; spl[i * 4] = wS; spl[i * 4 + 1] = Math.max(0, 1 - wS - wR - wC); spl[i * 4 + 2] = wR; spl[i * 4 + 3] = wC;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('splat', new THREE.BufferAttribute(spl, 4)); geo.computeVertexNormals();
    this.terrain = new THREE.Mesh(geo, splatTerrain(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }), SIZE / 2.5)); // one photo tile ≈ 2.5 m
    this.terrain.receiveShadow = true; this.group.add(this.terrain);
  }
  // ---- collision ----------------------------------------------------------
  addCollider(c) {
    c.alive = true; c._q = 0; this.colliders.push(c);
    for (let gx = Math.floor(c.min.x / GC); gx <= Math.floor(c.max.x / GC); gx++) for (let gz = Math.floor(c.min.z / GC); gz <= Math.floor(c.max.z / GC); gz++) {
      const k = gx * 4096 + gz; let a = this.grid.get(k); if (!a) this.grid.set(k, (a = [])); a.push(c);
    }
    return c;
  }
  near(x, z, r, out = []) {
    out.length = 0; const s = ++qStamp;
    for (let gx = Math.floor((x - r) / GC); gx <= Math.floor((x + r) / GC); gx++) for (let gz = Math.floor((z - r) / GC); gz <= Math.floor((z + r) / GC); gz++) {
      const a = this.grid.get(gx * 4096 + gz); if (!a) continue;
      for (const c of a) if (c.alive && c._q !== s) { c._q = s; out.push(c); }
    }
    return out;
  }
  groundAt(x, z, y) {
    let g = y < -30 ? FAC_Y : this.heightAt(x, z);
    const a = this.grid.get(Math.floor(x / GC) * 4096 + Math.floor(z / GC));
    if (a) for (const c of a) if (c.alive && !c.noStand && x > c.min.x - 0.2 && x < c.max.x + 0.2 && z > c.min.z - 0.2 && z < c.max.z + 0.2 && c.max.y <= y + 0.6 && c.max.y > g) g = c.max.y;
    return g;
  }
  /** Circle-vs-AABB move with axis separation (gives wall sliding). pos = feet. Returns true if blocked. */
  moveCircle(pos, dx, dz, radius, height) {
    let blocked = false; const list = this.near(pos.x + dx, pos.z + dz, radius + 1, this._tmpA || (this._tmpA = []));
    const test = (px, pz) => { for (const c of list) { if (c.max.y < pos.y + 0.55 || c.min.y > pos.y + height || c.pass) continue; const cx = clamp(px, c.min.x, c.max.x), cz = clamp(pz, c.min.z, c.max.z); if ((px - cx) ** 2 + (pz - cz) ** 2 < radius * radius) return true; } return false; };
    if (!test(pos.x + dx, pos.z)) pos.x += dx; else blocked = true;
    if (!test(pos.x, pos.z + dz)) pos.z += dz; else blocked = true;
    return blocked;
  }
  /** Ray cast against terrain + colliders. o,d: Vector3 (d normalised). Returns hit or null. */
  raycast(o, d, max, opt = {}) {
    let best = max, hit = null; const s = ++qStamp;
    // DDA over the collision grid
    let gx = Math.floor(o.x / GC), gz = Math.floor(o.z / GC);
    const sx = d.x > 0 ? 1 : -1, sz = d.z > 0 ? 1 : -1;
    const tdx = d.x !== 0 ? Math.abs(GC / d.x) : Infinity, tdz = d.z !== 0 ? Math.abs(GC / d.z) : Infinity;
    let tmx = d.x !== 0 ? ((d.x > 0 ? (gx + 1) * GC - o.x : o.x - gx * GC)) / Math.abs(d.x) : Infinity;
    let tmz = d.z !== 0 ? ((d.z > 0 ? (gz + 1) * GC - o.z : o.z - gz * GC)) / Math.abs(d.z) : Infinity;
    let t = 0;
    for (let guard = 0; guard < 400 && t <= best; guard++) {
      const a = this.grid.get(gx * 4096 + gz);
      if (a) for (const c of a) {
        if (!c.alive || c._q === s || (opt.sight && c.seeThrough) || (opt.bullet && c.thin)) continue; c._q = s;
        let t0 = 0, t1 = best, ax = -1, sgn = 0, ok = true;
        for (let i = 0; i < 3; i++) {
          const oi = i === 0 ? o.x : i === 1 ? o.y : o.z, di = i === 0 ? d.x : i === 1 ? d.y : d.z;
          const mn = i === 0 ? c.min.x : i === 1 ? c.min.y : c.min.z, mx = i === 0 ? c.max.x : i === 1 ? c.max.y : c.max.z;
          if (Math.abs(di) < 1e-9) { if (oi < mn || oi > mx) { ok = false; break; } continue; }
          let a0 = (mn - oi) / di, a1 = (mx - oi) / di, sg = -1; if (a0 > a1) { const q = a0; a0 = a1; a1 = q; sg = 1; }
          if (a0 > t0) { t0 = a0; ax = i; sgn = sg; } if (a1 < t1) t1 = a1; if (t0 > t1) { ok = false; break; }
        }
        if (ok && ax >= 0 && t0 < best) { best = t0; hit = { t: t0, c, nx: ax === 0 ? sgn : 0, ny: ax === 1 ? sgn : 0, nz: ax === 2 ? sgn : 0 }; }
      }
      if (tmx < tmz) { t = tmx; tmx += tdx; gx += sx; } else { t = tmz; tmz += tdz; gz += sz; }
    }
    // terrain / facility shell
    if (o.y < -30) {
      for (const py of [FAC_Y, FAC_Y + FAC_H]) if (Math.abs(d.y) > 1e-6) { const tt = (py - o.y) / d.y; if (tt > 0 && tt < best) { best = tt; hit = { t: tt, c: null, nx: 0, ny: py === FAC_Y ? 1 : -1, nz: 0, surf: 'metal' }; } }
    } else {
      const step = opt.sight ? 4 : 2; let pt = 0, prevAbove = true;
      for (let tt = step; tt < best + step; tt += step) {
        const q = Math.min(tt, best), x = o.x + d.x * q, y = o.y + d.y * q, z = o.z + d.z * q, h = Math.max(this.heightAt(x, z), opt.water ? 0 : -99);
        if (y < h && prevAbove) { let lo = pt, hi = q; for (let i = 0; i < 5; i++) { const m = (lo + hi) / 2; if (o.y + d.y * m < Math.max(this.heightAt(o.x + d.x * m, o.z + d.z * m), opt.water ? 0 : -99)) hi = m; else lo = m; } if (hi < best) { best = hi; hit = { t: hi, c: null, nx: 0, ny: 1, nz: 0, surf: this.surfaceAt(o.x + d.x * hi, o.z + d.z * hi, 0) }; } break; }
        pt = q; if (q >= best) break;
      }
    }
    if (hit) { hit.x = o.x + d.x * hit.t; hit.y = o.y + d.y * hit.t; hit.z = o.z + d.z * hit.t; if (hit.c) hit.surf = hit.c.mat; }
    return hit;
  }
  los(a, b) { const d = _v.subVectors(b, a), len = d.length(); if (len < 0.01) return true; d.multiplyScalar(1 / len); return !this.raycast(a, d, len - 0.3, { sight: true }); }

  // ---- prop factory -------------------------------------------------------
  /** Box prop. y = bottom. opts: {mat (surface name), hp, kind, noCol, dynamic, thin, pass, seeThrough, onDestroy} */
  box(x, y, z, sx, sy, sz, material, opts = {}) {
    const ag = opts.geo ? assetGeo(opts.geo) : null; // Blender prop modelled in a unit cube → scaled to the collider
    if (opts.hidden) return this.addCollider({ min: new THREE.Vector3(x - sx / 2, y, z - sz / 2), max: new THREE.Vector3(x + sx / 2, y + sy, z + sz / 2), mat: opts.mat || 'concrete', mesh: null, kind: opts.kind, thin: opts.thin, pass: opts.pass, seeThrough: opts.seeThrough, noStand: opts.noStand }); // collider only: the visual is a separate Blender mesh
    const m = new THREE.Mesh(ag || boxGeo, ag ? MAT.prop : material); if (ag && opts.tint) m.userData.tint = opts.tint; m.position.set(x, y + sy / 2, z); if (ag && opts.rot90) { m.rotation.y = Math.PI / 2; m.scale.set(sz, sy, sx); } else m.scale.set(sx, sy, sz); m.castShadow = !opts.noShadow; m.receiveShadow = true;
    const dynamic = opts.dynamic || opts.hp !== undefined;
    if (dynamic) this.group.add(m); else this.statics.push(m);
    if (opts.noCol) return { mesh: m };
    return this.addCollider({ min: new THREE.Vector3(x - sx / 2, y, z - sz / 2), max: new THREE.Vector3(x + sx / 2, y + sy, z + sz / 2), mat: opts.mat || 'concrete', mesh: dynamic ? m : null, hp: opts.hp, kind: opts.kind, thin: opts.thin, pass: opts.pass, seeThrough: opts.seeThrough, noStand: opts.noStand, onDestroy: opts.onDestroy, explosive: opts.explosive });
  }
  /** Static Blender mesh (merged into the batch at finalize). y = bottom for unit-cube props, origin for full models (pass origin:true). */
  addStatic(geoName, x, y, z, sx = 1, sy = 1, sz = 1, rotY = 0, tint = null, origin = false) {
    const g = assetGeo(geoName); if (!g) return false; const m = new THREE.Mesh(g, MAT.prop); m.position.set(x, origin ? y : y + sy / 2, z); m.rotation.y = rotY; m.scale.set(sx, sy, sz); if (tint) m.userData.tint = tint; this.statics.push(m); return true;
  }
  /** Rectangular wall ring with door gaps. gaps: {n:[[a,b]],s:[],e:[],w:[]} in world coords along the wall. */
  walls(x0, z0, x1, z1, y, h, material, gaps = {}, th = 0.5, mat = 'concrete') {
    const panel = material === MAT.concrete ? { geo: 'P_wall_concrete' } : material === MAT.dark ? { geo: 'P_wall_concrete', tint: [0.5, 0.5, 0.52] } : material === MAT.white ? { geo: 'P_wall_concrete', tint: [1.7, 1.72, 1.72] } : material === MAT.metal ? { geo: 'P_wall_metal' } : material === MAT.olive ? { geo: 'P_wall_metal', tint: [0.85, 0.95, 0.6] } : material === MAT.wood ? { geo: 'P_wall_wood' } : null;
    const seg = (a0, a1, fixed, horiz, g = []) => {
      let cur = a0; const gs = [...g].sort((p, q) => p[0] - q[0]);
      for (const [ga, gb] of [...gs, [a1, a1]]) { if (ga > cur + 0.01) { const len = ga - cur, mid = (cur + ga) / 2;
        if (panel && assetGeo(panel.geo)) { // one collider, Blender wall panels tiled along it (≈4 m each)
          horiz ? this.box(mid, y, fixed, len, h, th, material, { mat, hidden: true }) : this.box(fixed, y, mid, th, h, len, material, { mat, hidden: true });
          const n = Math.max(1, Math.round(len / 4)), w = len / n; for (let i = 0; i < n; i++) { const c = cur + w * (i + 0.5); horiz ? this.addStatic(panel.geo, c, y, fixed, w, h, th * 1.12, 0, panel.tint) : this.addStatic(panel.geo, fixed, y, c, w, h, th * 1.12, Math.PI / 2, panel.tint); }
        } else horiz ? this.box(mid, y, fixed, len, h, th, material, { mat }) : this.box(fixed, y, mid, th, h, len, material, { mat }); } cur = Math.max(cur, gb); }
    };
    seg(x0, x1, z0, true, gaps.n); seg(x0, x1, z1, true, gaps.s); seg(z0, z1, x0, false, gaps.w); seg(z0, z1, x1, false, gaps.e);
  }
  /** Merge all static boxes per material → a handful of draw calls (GPU batching / HLOD stand-in). */
  finalize() {
    const by = new Map();
    for (const m of this.statics) { m.updateMatrix(); const g = m.geometry.clone().applyMatrix4(m.matrix); if (!g.attributes.color && m.material === MAT.prop) continue; if (m.userData.tint) { const c = g.attributes.color, t = m.userData.tint; for (let i = 0; i < c.count; i++) c.setXYZ(i, c.getX(i) * t[0], c.getY(i) * t[1], c.getZ(i) * t[2]); } const uv = g.attributes.uv; if (m.material === MAT.prop && !g.index) { const p = g.attributes.position; // Blender props: re-project UVs in world metres after scaling (unit-cube props are stretched to their collider)
        for (let i = 0; i < p.count; i += 3) { const ax = p.getX(i), ay = p.getY(i), az = p.getZ(i), ux = p.getX(i + 1) - ax, uy = p.getY(i + 1) - ay, uz = p.getZ(i + 1) - az, vx = p.getX(i + 2) - ax, vy = p.getY(i + 2) - ay, vz = p.getZ(i + 2) - az, nx = Math.abs(uy * vz - uz * vy), ny = Math.abs(uz * vx - ux * vz), nz = Math.abs(ux * vy - uy * vx);
          for (let k = i; k < i + 3; k++) { const x = p.getX(k), y = p.getY(k), z = p.getZ(k); if (nx >= ny && nx >= nz) uv.setXY(k, z, y); else if (ny >= nz) uv.setXY(k, x, z); else uv.setXY(k, x, y); } } }
      else { const s = Math.max(m.scale.x, m.scale.z) / 4, t = m.scale.y / 4; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(1, s), uv.getY(i) * Math.max(1, t)); } if (!by.has(m.material)) by.set(m.material, []); by.get(m.material).push(g); }
    for (const [mat, geos] of by) { const mesh = new THREE.Mesh(mergeGeometries(geos), mat); mesh.castShadow = !mat.transparent; mesh.receiveShadow = true; this.group.add(mesh); geos.forEach((g) => g.dispose()); }
    this.staticCount = this.statics.length; this.statics.length = 0;
  }
  damageCollider(c, dmg, point) {
    if (!c || !c.alive || c.hp === undefined) return false;
    c.hp -= dmg; if (c.hp > 0) return false;
    c.alive = false; if (c.mesh) c.mesh.visible = false;
    const cx = (c.min.x + c.max.x) / 2, cy = (c.min.y + c.max.y) / 2, cz = (c.min.z + c.max.z) / 2;
    if (c.kind === 'glass') { G.fx.debris(cx, cy, cz, 14, 0xbfe8f0, 3, c.max.x - c.min.x, c.max.y - c.min.y, c.max.z - c.min.z); G.audio.play('glass', { x: cx, y: cy, z: cz }); }
    else if (c.explosive) G.fx.explode(cx, cy, cz, c.explosive, 'player');
    else { G.fx.debris(cx, cy, cz, 10, 0x8a6a3a, 4, 1, 1, 1); G.audio.play('wood', { x: cx, y: cy, z: cz }); }
    if (c.onDestroy) c.onDestroy(c);
    return true;
  }
  update(dt) { for (const a of this.animated) a(dt, G.time); }
}
const _v = new THREE.Vector3();
