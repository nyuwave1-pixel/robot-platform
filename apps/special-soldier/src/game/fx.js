// Ballistics (simulated projectiles with gravity + falloff), grenades, explosions, and pooled VFX
// (smoke/dust sprites, debris + shell casings, tracers, bullet-hole decals). UE5: Niagara + Chaos + projectile movement.
import * as THREE from 'three';
import { G } from '../core/ctx.js';
import { clamp } from '../core/util.js';
import { damageAt, BODY_MULT } from '../config/weapons.js';

const NP = 170, ND = 260, NT = 70, NDEC = 220, GRAV = 9.81;
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _s = new THREE.Vector3(), _z = new THREE.Vector3(0, 0, 1), _c = new THREE.Color();
export function raySphere(o, d, cx, cy, cz, r, max) { const ox = cx - o.x, oy = cy - o.y, oz = cz - o.z, t = ox * d.x + oy * d.y + oz * d.z; if (t < 0 || t > max + r) return -1; const d2 = ox * ox + oy * oy + oz * oz - t * t; if (d2 > r * r) return -1; return Math.max(0, t - Math.sqrt(r * r - d2)); }

export class FX {
  constructor() {
    const S = G.scene, cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    this.tex = new THREE.CanvasTexture(cv);
    this.puffs = []; for (let i = 0; i < NP; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex, transparent: true, depthWrite: false })); s.visible = false; S.add(s); this.puffs.push({ s, life: 0, v: new THREE.Vector3() }); } this.pi = 0;
    this.debrisMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.3 }), ND); this.debrisMesh.frustumCulled = false; this.debrisMesh.castShadow = true; S.add(this.debrisMesh);
    this.deb = []; for (let i = 0; i < ND; i++) { this.deb.push({ p: new THREE.Vector3(0, -999, 0), v: new THREE.Vector3(), r: new THREE.Vector3(), life: 0, s: 0.1 }); this.debrisMesh.setColorAt(i, _c.set(0xffffff)); } this.di = 0;
    this.tracers = []; const tg = new THREE.BoxGeometry(1, 1, 1); for (let i = 0; i < NT; i++) { const m = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ color: 0xffd890, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); m.visible = false; S.add(m); this.tracers.push(m); }
    this.decals = new THREE.InstancedMesh(new THREE.CircleGeometry(0.07, 8), new THREE.MeshBasicMaterial({ color: 0x0a0a0a, transparent: true, opacity: 0.85, polygonOffset: true, polygonOffsetFactor: -4, depthWrite: false }), NDEC); this.decals.count = 0; this.decals.frustumCulled = false; S.add(this.decals); this.deci = 0;
    this.lights = []; for (let i = 0; i < 3; i++) { const l = new THREE.PointLight(0xffa040, 0, 60, 1.6); S.add(l); this.lights.push({ l, life: 0 }); } this.li = 0;
    this.bullets = []; this.nades = []; this.smokes = [];
    this.nadeGeo = new THREE.SphereGeometry(0.07, 8, 6); this.nadeMat = new THREE.MeshStandardMaterial({ color: 0x2a3320, roughness: 0.6 });
  }
  reset() { for (const b of this.bullets) if (b.tr) b.tr.visible = false; this.bullets.length = 0; for (const n of this.nades) G.scene.remove(n.mesh); this.nades.length = 0; this.smokes.length = 0; this.decals.count = 0; this.deci = 0; for (const p of this.puffs) { p.life = 0; p.s.visible = false; } }
  puff(x, y, z, color, size, life, opacity = 0.5, vx = 0, vy = 0.4, vz = 0, add = false, grav = 0, grow = 1.6) {
    const p = this.puffs[this.pi = (this.pi + 1) % NP]; p.s.position.set(x, y, z); p.s.material.color.set(color); p.s.material.blending = add ? THREE.AdditiveBlending : THREE.NormalBlending; p.o = opacity; p.size = size; p.grow = grow; p.life = p.max = life; p.v.set(vx, vy, vz); p.g = grav; p.s.visible = true; p.s.scale.setScalar(size);
  }
  sparks(x, y, z, n = 6, nx = 0, ny = 1, nz = 0) { for (let i = 0; i < n; i++) this.puff(x, y, z, 0xffc060, 0.09, 0.25 + Math.random() * 0.25, 1, nx * 4 + (Math.random() - 0.5) * 6, ny * 4 + Math.random() * 4, nz * 4 + (Math.random() - 0.5) * 6, true, 14, 0.6); }
  debris(x, y, z, n, color, speed = 4, sx = 0.5, sy = 0.5, sz = 0.5, size = 0.14) {
    for (let i = 0; i < n; i++) { const k = this.di = (this.di + 1) % ND, d = this.deb[k]; d.p.set(x + (Math.random() - 0.5) * sx, y + (Math.random() - 0.5) * sy, z + (Math.random() - 0.5) * sz); d.v.set((Math.random() - 0.5) * speed, Math.random() * speed, (Math.random() - 0.5) * speed); d.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); d.life = 3 + Math.random() * 2; d.s = size * (0.5 + Math.random()); this.debrisMesh.setColorAt(k, _c.set(color)); }
    this.debrisMesh.instanceColor.needsUpdate = true;
  }
  shell(pos, right, up) { const k = this.di = (this.di + 1) % ND, d = this.deb[k]; d.p.copy(pos); d.v.copy(right).multiplyScalar(2.2 + Math.random()).addScaledVector(up, 1.6 + Math.random()); if (G.player) d.v.add(G.player.vel); d.r.set(Math.random() * 6, Math.random() * 6, 0); d.life = 2.5; d.s = 0.028; this.debrisMesh.setColorAt(k, _c.set(0xd9a441)); this.debrisMesh.instanceColor.needsUpdate = true; }
  decal(h) { if (!h || (h.c && h.c.mesh)) return; const i = this.deci % NDEC; this.deci++; _a.set(h.nx, h.ny, h.nz); _q.setFromUnitVectors(_z, _a); _m.compose(_b.set(h.x + h.nx * 0.012, h.y + h.ny * 0.012, h.z + h.nz * 0.012), _q, _s.set(1, 1, 1)); this.decals.setMatrixAt(i, _m); this.decals.count = Math.min(NDEC, this.deci); this.decals.instanceMatrix.needsUpdate = true; }
  flashLight(x, y, z, color, intensity, life) { const L = this.lights[this.li = (this.li + 1) % 3]; L.l.position.set(x, y, z); L.l.color.set(color); L.l.intensity = L.i0 = intensity; L.life = L.max = life; }
  impact(h, surf) {
    const s = surf || h.surf || 'concrete';
    if (s === 'water') { this.puff(h.x, 0.2, h.z, 0xdfefff, 0.5, 0.5, 0.7, 0, 3, 0, false, 9, 2.2); G.audio.play('impact:water', h); return; }
    const col = { sand: 0xcbb98a, grass: 0x5a5236, wood: 0x9a7a4a, metal: 0x999999, concrete: 0xaaaaaa, glass: 0xddeeff, flesh: 0x7a0c0c }[s] || 0xaaaaaa;
    this.puff(h.x + h.nx * 0.1, h.y + h.ny * 0.1, h.z + h.nz * 0.1, col, 0.3, 0.45, 0.55, h.nx * 1.5, h.ny * 1.5 + 0.5, h.nz * 1.5, false, 0, 2.6);
    if (s === 'metal' || s === 'concrete') this.sparks(h.x, h.y, h.z, s === 'metal' ? 5 : 2, h.nx, h.ny, h.nz);
    if (s !== 'flesh') this.decal(h);
    G.audio.play('impact:' + s, h);
  }
  /** Spawn a bullet. spec: {dmg, range:[a,b], minMul, vel, pellets?, explosive?}; owner: 'player' | 'squad' | 'enemy'. */
  fire(o, dir, spec, owner, src) {
    if (spec.explosive) { this.grenade(o, _a.copy(dir).multiplyScalar(spec.vel).add(_b.set(0, 4, 0)), owner, { fuse: 4, impact: true, radius: spec.explosive, dmg: spec.dmg }); return; }
    const b = { p: o.clone(), v: dir.clone().multiplyScalar(spec.vel), spec, owner, src, dist: 0, tr: null, age: 0 };
    for (const t of this.tracers) if (!t.visible) { b.tr = t; t.visible = true; t.scale.set(0.001, 0.001, 0.001); t.material.color.set(owner === 'enemy' ? 0xff7050 : 0xffd890); break; }
    this.bullets.push(b);
  }
  grenade(o, vel, owner, opt = {}) {
    const mesh = new THREE.Mesh(this.nadeGeo, this.nadeMat); mesh.position.copy(o); G.scene.add(mesh);
    this.nades.push({ p: o.clone(), v: vel.clone(), fuse: opt.fuse ?? 2.8, owner, mesh, impact: opt.impact, radius: opt.radius || 7.5, dmg: opt.dmg || 170, smoke: opt.smoke });
  }
  explode(x, y, z, radius, owner, dmg = 170) {
    this.flashLight(x, y + 1, z, 0xffa040, 900, 0.5); G.audio.play('explosion', { x, y, z });
    for (let i = 0; i < 9; i++) this.puff(x + (Math.random() - 0.5) * 2, y + 0.6 + Math.random() * 1.5, z + (Math.random() - 0.5) * 2, i < 4 ? 0xffb050 : 0xff6a20, 2.2 + Math.random() * 2, 0.35 + Math.random() * 0.3, 1, (Math.random() - 0.5) * 6, 2 + Math.random() * 4, (Math.random() - 0.5) * 6, true, 0, 2.2);
    for (let i = 0; i < 10; i++) this.puff(x + (Math.random() - 0.5) * 3, y + 1 + Math.random() * 2, z + (Math.random() - 0.5) * 3, 0x2a2a2a, 3 + Math.random() * 2, 2.5 + Math.random() * 2, 0.6, (Math.random() - 0.5) * 2, 1.2 + Math.random() * 2, (Math.random() - 0.5) * 2, false, 0, 2.4);
    this.sparks(x, y + 0.5, z, 16); this.debris(x, y + 0.5, z, 16, 0x3a3a34, 11, 1, 1, 1, 0.2);
    const pl = G.player, hurt = (tx, ty, tz, r) => { const d = Math.hypot(tx - x, ty - y, tz - z); if (d > r) return 0; let k = 1 - d / r; if (d > 1.5 && !G.world.los(_a.set(x, y + 0.6, z), _b.set(tx, ty, tz))) k *= 0.25; return dmg * k; };
    if (pl && pl.alive) { const d = Math.hypot(pl.pos.x - x, pl.pos.y - y, pl.pos.z - z); pl.shake = Math.max(pl.shake, clamp(1.6 - d / 30, 0, 1.4)); const h = hurt(pl.pos.x, pl.pos.y + 1, pl.pos.z, radius); if (h > 1) pl.damage(h * (owner === 'player' ? 0.6 : 1), x, z, 'explosion'); if (d < 25) G.post.flash = Math.max(G.post.flash, 0.5 - d / 50); }
    if (G.enemies) for (const e of G.enemies.list) if (e.alive) { const h = hurt(e.pos.x, e.pos.y + 1, e.pos.z, radius * (e.type.vehicle ? 1.4 : 1)); if (h > 1) G.enemies.damage(e, h * (e.type.vehicle ? 2.2 : 1), 'torso', owner, true); }
    if (G.squad && owner === 'enemy') for (const m of G.squad.list) { const h = hurt(m.pos.x, m.pos.y + 1, m.pos.z, radius); if (h > 1) G.squad.damage(m, h * 0.5); }
    for (const c of G.world.near(x, z, radius, [])) { if (c.hp === undefined) continue; const cx = clamp(x, c.min.x, c.max.x), cy = clamp(y, c.min.y, c.max.y), cz = clamp(z, c.min.z, c.max.z), d = Math.hypot(cx - x, cy - y, cz - z); if (d < radius) { const dd = dmg * (1 - d / radius) * 1.5; if (c.explosive && c.hp - dd <= 0) { c.hp = 999; setTimeout(() => { c.hp = 0; G.world.damageCollider(c, 1); }, 120 + Math.random() * 250); } else G.world.damageCollider(c, dd); } }
    if (G.enemies) G.enemies.hear(x, y, z, 170, 'explosion');
    if (y > -30 && G.world.heightAt(x, z) < 0.3) for (let i = 0; i < 6; i++) this.puff(x, 0.5, z, 0xeaf6ff, 2, 1.2, 0.8, (Math.random() - 0.5) * 4, 7 + Math.random() * 5, (Math.random() - 0.5) * 4, false, 12, 2);
  }
  update(dt) {
    const W = G.world, cam = G.camera.position;
    // ---- bullets ----
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i]; let dead = false; b.age += dt;
      b.v.y -= GRAV * dt; b.v.multiplyScalar(1 - 0.00012 * b.v.length() * dt); const sp = b.v.length(); // gravity + air drag
      let len = sp * dt; _d.copy(b.v).multiplyScalar(1 / sp);
      const wh = W.raycast(b.p, _d, len, { bullet: true, water: true }); let tHit = wh ? wh.t : len, target = null;
      if (b.owner !== 'enemy') { const eh = G.enemies.hitTest(b.p, _d, tHit); if (eh) { tHit = eh.t; target = eh; } }
      else {
        const pl = G.player; if (pl.alive) { const hh = pl.height; for (const [oy, r, zone] of [[hh - 0.12, 0.17, 'head'], [hh * 0.62, 0.3, 'torso'], [hh * 0.28, 0.26, 'limb']]) { const t = raySphere(b.p, _d, pl.pos.x, pl.pos.y + oy, pl.pos.z, r, tHit); if (t >= 0 && t < tHit) { tHit = t; target = { player: true, zone }; } }
          if (!target && !b.whiz) { _a.copy(pl.eye).sub(b.p); const t = _a.dot(_d); if (t > 0 && t < len) { const dd = _a.addScaledVector(_d, -t).length(); if (dd < 1.6) { b.whiz = true; G.audio.play('whiz'); pl.suppress = Math.min(1, pl.suppress + 0.25); } } } }
        const sh = G.squad.hitTest(b.p, _d, tHit); if (sh) { tHit = sh.t; target = sh; }
      }
      const dmgBase = damageAt(b.spec, b.dist + tHit);
      if (target) {
        const hx = b.p.x + _d.x * tHit, hy = b.p.y + _d.y * tHit, hz = b.p.z + _d.z * tHit; dead = true;
        if (target.enemy) { G.enemies.damage(target.enemy, dmgBase * BODY_MULT[target.zone], target.zone, b.owner); this.puff(hx, hy, hz, target.enemy.type.vehicle ? 0xaaaaaa : 0x8a0e0e, 0.35, 0.35, 0.7, _d.x, 0.5, _d.z, false, 3); if (target.enemy.type.vehicle) this.sparks(hx, hy, hz, 4, -_d.x, 0.5, -_d.z); G.audio.play(target.enemy.type.vehicle ? 'impact:metal' : 'impact:flesh', { x: hx, y: hy, z: hz }); }
        else if (target.player) G.player.damage(dmgBase * (target.zone === 'head' ? 1.5 : target.zone === 'limb' ? 0.8 : 1), b.p.x - _d.x * b.dist, b.p.z - _d.z * b.dist, 'bullet');
        else if (target.mate) G.squad.damage(target.mate, dmgBase * 0.35);
      } else if (wh) {
        if (wh.c && wh.c.hp !== undefined) { const glass = wh.c.kind === 'glass'; W.damageCollider(wh.c, dmgBase, wh); if (!glass) { this.impact(wh); dead = true; } else { b.p.addScaledVector(_d, wh.t + 0.05); len = 0; } }
        else { this.impact(wh); dead = true; }
      }
      b.dist += tHit; if (len > 0) b.p.addScaledVector(_d, dead ? tHit : len);
      if (b.tr) { const tl = Math.min(b.dist, b.owner === 'player' ? 9 : 14), th = clamp(_a.copy(b.p).sub(cam).length() * 0.0016, 0.012, 0.09); b.tr.position.copy(b.p).addScaledVector(_d, -tl / 2); b.tr.quaternion.setFromUnitVectors(_z, _d); b.tr.scale.set(th, th, Math.max(0.01, tl)); b.tr.visible = b.dist > (b.owner === 'player' ? 2.5 : 0.5); }
      if (dead || b.dist > 900 || b.age > 3) { if (b.tr) b.tr.visible = false; this.bullets.splice(i, 1); }
    }
    // ---- grenades (bouncing rigid points) ----
    for (let i = this.nades.length - 1; i >= 0; i--) {
      const n = this.nades[i]; n.fuse -= dt; n.v.y -= GRAV * dt; const sp = n.v.length(); let boom = n.fuse <= 0;
      if (sp > 0.01) { _d.copy(n.v).multiplyScalar(1 / sp); const h = W.raycast(n.p, _d, sp * dt + 0.08, { water: false });
        if (h) { if (n.impact) boom = true; else { n.p.set(h.x + h.nx * 0.09, h.y + h.ny * 0.09, h.z + h.nz * 0.09); const dn = n.v.x * h.nx + n.v.y * h.ny + n.v.z * h.nz; n.v.x -= 2 * dn * h.nx; n.v.y -= 2 * dn * h.ny; n.v.z -= 2 * dn * h.nz; n.v.multiplyScalar(0.38); if (Math.abs(dn) > 2) G.audio.play('impact:' + (h.surf || 'concrete'), n.p); } }
        else n.p.addScaledVector(n.v, dt); }
      if (!boom && n.impact && n.owner !== 'enemy' && G.enemies.hitTest(n.p, _d, 1.2)) boom = true;
      n.mesh.position.copy(n.p); n.mesh.rotation.x += dt * 9;
      if (boom) { G.scene.remove(n.mesh); this.nades.splice(i, 1); if (n.smoke) { this.smokes.push({ x: n.p.x, y: n.p.y, z: n.p.z, life: 70, color: n.smoke }); G.audio.play('splash', n.p); } else this.explode(n.p.x, n.p.y, n.p.z, n.radius, n.owner, n.dmg); }
    }
    for (let i = this.smokes.length - 1; i >= 0; i--) { const s = this.smokes[i]; s.life -= dt; if (Math.random() < dt * 14) this.puff(s.x + (Math.random() - 0.5), s.y + 0.4, s.z + (Math.random() - 0.5), s.color, 1.6, 5, 0.55, G.sky.wind * 0.8, 1.6, 0.3, false, 0, 3.2); if (s.life <= 0) this.smokes.splice(i, 1); }
    // ---- particles ----
    for (const p of this.puffs) { if (p.life <= 0) continue; p.life -= dt; if (p.life <= 0) { p.s.visible = false; continue; } const k = p.life / p.max; p.v.y -= p.g * dt; p.s.position.addScaledVector(p.v, dt); p.s.material.opacity = p.o * k; p.s.scale.setScalar(p.size * (1 + (1 - k) * p.grow)); }
    for (let i = 0; i < ND; i++) { const d = this.deb[i]; if (d.life <= 0) continue; d.life -= dt; if (d.life <= 0) d.p.y = -999; else { d.v.y -= GRAV * dt; d.p.addScaledVector(d.v, dt); const g = W.groundAt(d.p.x, d.p.z, d.p.y + 0.3); if (d.p.y < g + d.s * 0.5) { d.p.y = g + d.s * 0.5; d.v.y *= -0.35; d.v.x *= 0.6; d.v.z *= 0.6; if (Math.abs(d.v.y) < 0.4) d.v.set(0, 0, 0); } else { d.r.x += dt * 8; d.r.y += dt * 6; } } _q.setFromEuler(_e.set(d.r.x, d.r.y, d.r.z)); _m.compose(d.p, _q, _s.setScalar(d.s)); this.debrisMesh.setMatrixAt(i, _m); }
    this.debrisMesh.instanceMatrix.needsUpdate = true;
    for (const L of this.lights) if (L.life > 0) { L.life -= dt; L.l.intensity = L.life > 0 ? L.i0 * (L.life / L.max) : 0; }
  }
}
const _e = new THREE.Euler();
