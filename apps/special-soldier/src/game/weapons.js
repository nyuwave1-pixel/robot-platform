// Player weapon handling: inventory slots, fire modes, recoil + spread model, ADS, reloads, grenades and the
// procedural first-person view model (arms + gun). UE5: weapon actors + GAS abilities + Control Rig procedural recoil.
import * as THREE from 'three';
import { G } from '../core/ctx.js';
import { clamp, damp, lerp } from '../core/util.js';
import { WEAPONS } from '../config/weapons.js';
import { ASSETS, rebuild } from './assets.js';
import { GUN_MAT, detailNormal, detailMap } from './models.js';
import { photoDetail, fabricPhoto } from '../world/textures.js';

const M = (c, r = 0.6, m = 0.4) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
const mGun = M(0x1c1e20, 0.45, 0.7), mPoly = M(0x2b2d2a, 0.8, 0.1), mTan = M(0x6a5c44, 0.8, 0.1), mSleeve = M(0x3d4630, 0.95, 0), mGlove = M(0x15171a, 0.9, 0), mLens = new THREE.MeshStandardMaterial({ color: 0x203040, roughness: 0.1, metalness: 0.9, emissive: 0x081828 });
const mDot = new THREE.MeshBasicMaterial({ color: 0xff2a1a });
const SHAPE = { // per-weapon view model proportions (metres): body length, barrel length, mag, stock, sight type
  m4: { L: 0.42, B: 0.3, mag: [0.05, 0.2, 0.07], stock: 0.24, sight: 'dot', body: mGun },
  arx: { L: 0.46, B: 0.32, mag: [0.05, 0.19, 0.08], stock: 0.24, sight: 'dot', body: mTan },
  kr5: { L: 0.4, B: 0.24, mag: [0.05, 0.24, 0.07], stock: 0.2, sight: 'iron', body: mPoly },
  smg: { L: 0.3, B: 0.14, mag: [0.04, 0.24, 0.05], stock: 0.16, sight: 'iron', body: mGun },
  shotgun: { L: 0.46, B: 0.42, mag: null, stock: 0.26, sight: 'iron', body: mPoly, pump: true },
  lmg: { L: 0.5, B: 0.42, mag: [0.14, 0.16, 0.16], stock: 0.26, sight: 'dot', body: mGun, bipod: true },
  bolt: { L: 0.5, B: 0.55, mag: [0.04, 0.07, 0.09], stock: 0.3, sight: 'scope', body: mTan },
  dmr: { L: 0.48, B: 0.46, mag: [0.05, 0.14, 0.08], stock: 0.28, sight: 'scope', body: mGun },
  pistol: { L: 0.19, B: 0.14, mag: null, stock: 0, sight: 'iron', body: mGun, pistol: true },
  gl: { L: 0.36, B: 0.2, mag: null, stock: 0.22, sight: 'iron', body: mPoly, drum: true },
};
function box(g, sx, sy, sz, x, y, z, m) { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); b.position.set(x, y, z); g.add(b); return b; }
function cyl(g, r, len, x, y, z, m) { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), m); c.rotation.x = Math.PI / 2; c.position.set(x, y, z); g.add(c); return c; }
const FP_GUN_MAT = photoDetail(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.75 }), 'gun', 5, 0.4);
function gunFromAsset(id) {
  const src = rebuild('W_' + id, FP_GUN_MAT, (n, m, kept) => (kept ? null : m.color.clone().multiplyScalar(2.2).addScalar(0.015))); if (!src) return null; // lifted so the dark finish still reads at night
  const g = new THREE.Group(); src.rotation.y = Math.PI; g.add(src); g.updateMatrixWorld(true); // Blender model points +Z; the view model looks down -Z
  const at = (n) => { const o = src.getObjectByName(n); return o ? o.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(); };
  const mz = at('muzzle'), st = at('sight'), gp = at('gripL');
  g.userData.sightY = st.y; g.userData.muzzle = mz; g.userData.len = -mz.z; g.userData.grip2 = gp.add(new THREE.Vector3(0, -0.01, 0));
  g.userData.mag = src.getObjectByName('mag') || null; const pump = src.getObjectByName('pump'); if (pump && pump.children.length) { g.userData.pump = pump; g.userData.pumpZ = pump.position.z; }
  if (g.userData.mag && !g.userData.mag.children.length) g.userData.mag = null;
  g.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  return g;
}
export function buildGun(id) {
  if (ASSETS.ready) { const a = gunFromAsset(id); if (a) return a; }
  const s = SHAPE[id], g = new THREE.Group(); let sightY = 0.055;
  if (s.pistol) { box(g, 0.032, 0.04, s.L, 0, 0.02, -s.L / 2, s.body); box(g, 0.03, 0.11, 0.045, 0, -0.05, -0.03, mPoly).rotation.x = 0.2; cyl(g, 0.017, s.B, 0, 0.022, -s.L - s.B / 2, mGun); box(g, 0.008, 0.012, 0.008, 0, 0.046, -s.L + 0.01, mGun); box(g, 0.02, 0.012, 0.008, 0, 0.046, -0.015, mGun); sightY = 0.052; g.userData.grip2 = new THREE.Vector3(0.0, -0.06, -0.02); }
  else {
    box(g, 0.05, 0.075, s.L, 0, 0, -s.L / 2, s.body); cyl(g, 0.011, s.B, 0, 0.012, -s.L - s.B / 2, mGun); box(g, 0.058, 0.058, s.L * 0.45, 0, 0.004, -s.L * 0.78, mPoly);
    box(g, 0.036, 0.1, 0.045, 0, -0.08, -0.07, mPoly).rotation.x = 0.3; if (s.stock) { box(g, 0.036, 0.05, s.stock, 0, -0.005, s.stock / 2, mPoly); box(g, 0.04, 0.11, 0.03, 0, -0.03, s.stock, mPoly); }
    if (s.mag) { const mg = box(g, s.mag[0], s.mag[1], s.mag[2], 0, -0.04 - s.mag[1] / 2, -s.L * 0.42, mGun); mg.rotation.x = id === 'lmg' ? 0 : 0.12; g.userData.mag = mg; }
    if (s.pump) { g.userData.pump = box(g, 0.06, 0.05, 0.16, 0, -0.03, -s.L - 0.12, mTan); cyl(g, 0.013, s.B * 0.9, 0, -0.022, -s.L - s.B * 0.45, mGun); }
    if (s.drum) cyl(g, 0.065, 0.11, 0, -0.03, -s.L * 0.55, mGun);
    if (s.bipod) { box(g, 0.012, 0.16, 0.012, 0.03, -0.09, -s.L - 0.2, mGun); box(g, 0.012, 0.16, 0.012, -0.03, -0.09, -s.L - 0.2, mGun); }
    if (s.sight === 'dot') { box(g, 0.04, 0.012, 0.07, 0, 0.044, -s.L * 0.45, mGun); const fr = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 6, 14), mGun); fr.position.set(0, 0.075, -s.L * 0.45); g.add(fr); const d = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 6, 6), mDot); d.position.set(0, 0.075, -s.L * 0.45); g.add(d); sightY = 0.075; }
    else if (s.sight === 'scope') { cyl(g, 0.024, 0.26, 0, 0.078, -s.L * 0.45, mGun); cyl(g, 0.03, 0.05, 0, 0.078, -s.L * 0.45 - 0.14, mGun); const l = new THREE.Mesh(new THREE.CircleGeometry(0.022, 12), mLens); l.position.set(0, 0.078, -s.L * 0.45 + 0.131); g.add(l); sightY = 0.078; }
    else { box(g, 0.008, 0.03, 0.008, 0, 0.052, -s.L - s.B * 0.8, mGun); box(g, 0.03, 0.022, 0.01, 0, 0.048, -0.03, mGun); sightY = 0.06; }
    g.userData.grip2 = new THREE.Vector3(0, -0.04, -s.L * 0.8);
  }
  g.userData.sightY = sightY; g.userData.muzzle = new THREE.Vector3(0, 0.012, -s.L - s.B); g.userData.len = s.L + s.B;
  g.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  return g;
}

export class Weapons {
  constructor() {
    this.root = new THREE.Group(); G.camera.add(this.root); this.slots = []; this.cur = 0; this.adsT = 0; this.zoomNow = 1; this.weight = 3;
    this.flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: G.fx.tex, color: 0xffc060, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, depthTest: false })); this.flash.visible = false; this.root.add(this.flash);
    this.flashLight = new THREE.PointLight(0xffb060, 0, 22, 1.6); G.camera.add(this.flashLight); this.flashLight.position.set(0.2, -0.1, -1);
    // arms
    this.armR = new THREE.Group(); this.armL = new THREE.Group();
    for (const a of [this.armR, this.armL]) { const arm = ASSETS.ready ? rebuild('Arm', fabricPhoto(new THREE.MeshStandardMaterial({ vertexColors: true, color: new THREE.Color(1.3, 1.3, 1.3), roughness: 0.9, map: detailMap('camo', 1.5) }))) : null; if (arm) { arm.rotation.y = Math.PI; arm.traverse((o) => { if (o.isMesh) o.castShadow = false; }); a.add(arm); } else { box(a, 0.075, 0.075, 0.46, 0, 0, 0.3, mSleeve); box(a, 0.07, 0.055, 0.1, 0, 0, 0.03, mGlove); } this.root.add(a); }
    this.grenades = 4; this.reset();
  }
  reset() { this.cool = 0; this.reloading = false; this.reloadT = 0; this.switchT = 0; this.pending = -1; this.bloom = 0; this.kick = 0; this.kickRot = 0; this.burstLeft = 0; this.sprintOut = 0; this.swayX = this.swayY = 0; this.triggerHeld = false; this.pumpT = 0; this.shotsSince = 0; this.lastShot = -9; this.throwT = 0; }
  equip(loadout) {
    for (const s of this.slots) this.root.remove(s.model);
    this.slots = [loadout.primary, loadout.secondary, loadout.sidearm].map((id) => { const w = WEAPONS[id], model = buildGun(id); model.visible = false; this.root.add(model); return { id, w, model, mag: w.mag, reserve: w.reserve, mode: w.modes[0] }; });
    // weapon layer: the gun and arms are drawn into the nearest slice of the depth range, so they never clip into walls (water, glass and particles still sort correctly)
    const near = (r) => r.getContext().depthRange(0, 0.06), full = (r) => r.getContext().depthRange(0, 1); this.root.traverse((o) => { if (o.isMesh || o.isSprite) { o.onBeforeRender = near; o.onAfterRender = full; } });
    this.cur = 0; this.grenades = 4; this.reset(); this.show();
  }
  get slot() { return this.slots[this.cur]; }
  show() { this.slots.forEach((s, i) => (s.model.visible = i === this.cur)); this.weight = this.slot.w.weight; }
  resupply() { for (const s of this.slots) s.reserve = s.w.reserve; this.grenades = 4; G.hud.toast('AMMUNITION RESUPPLIED'); G.audio.play('reload'); }
  switchTo(i) { if (i === this.cur || i >= this.slots.length || this.switchT > 0) return; this.pending = i; this.switchT = 0.5; this.reloading = false; this.burstLeft = 0; }
  startReload() { const s = this.slot; if (this.reloading || s.mag >= s.w.mag || s.reserve <= 0 || this.switchT > 0) return; this.reloading = true; this.reloadT = s.w.reload; this.burstLeft = 0; G.audio.play('reload', null, { t2: s.w.reload * 0.55 }); }
  spreadDeg() { const s = this.slot.w, p = G.player; return (lerp(s.spread, s.adsSpread, this.adsT) * [1, 0.8, 0.6][p.stance] * (1 + p.speedNow * 0.22 * (1 - this.adsT * 0.6)) * (p.grounded ? 1 : 2.2) + this.bloom + p.suppress * 1.2); }
  fireOne() {
    const s = this.slot, w = s.w, p = G.player, cam = G.camera;
    if (s.mag <= 0) { G.audio.play('click'); this.burstLeft = 0; if (s.reserve > 0) this.startReload(); return; }
    s.mag--; this.cool = 60 / w.rpm; this.lastShot = G.time; this.shotsSince++;
    const sp = (this.spreadDeg() * Math.PI) / 180;
    cam.getWorldDirection(_dir); _right.setFromMatrixColumn(cam.matrixWorld, 0); _up.setFromMatrixColumn(cam.matrixWorld, 1);
    for (let i = 0; i < w.pellets; i++) { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * Math.tan(sp); _d.copy(_dir).addScaledVector(_right, Math.cos(a) * r).addScaledVector(_up, Math.sin(a) * r).normalize(); G.fx.fire(_o.copy(p.eye).addScaledVector(_dir, 0.3), _d, w, 'player'); }
    G.mission.stats.shots += 1;
    // recoil: part permanent climb, part self-recovering kick; horizontal drift alternates as the burst continues
    const stance = [1, 0.8, 0.62][p.stance] * (this.adsT > 0.5 ? 0.82 : 1.1), climb = (w.recoilV * (0.8 + Math.random() * 0.4) * stance * Math.PI) / 180;
    p.pitch = clamp(p.pitch + climb * 0.55, -1.5, 1.5); p.recoilOff += climb * 0.45; p.yaw += ((w.recoilH * (Math.random() - 0.5 + Math.sin(this.shotsSince * 0.9) * 0.35) * stance * Math.PI) / 180) * 1.6;
    this.bloom = Math.min(3.5, this.bloom + (lerp(w.spread, w.adsSpread, this.adsT) + 0.25) * 0.16); this.kick = Math.min(0.09, this.kick + 0.022 + w.recoilV * 0.006); this.kickRot += 0.02 + w.recoilV * 0.008; p.shake = Math.max(p.shake, 0.06 + w.recoilV * 0.02);
    // fx
    this.flash.visible = true; this.flashT = 0.045; this.flash.material.rotation = Math.random() * 6; const fs = w.cls === 'SIDEARM' ? 0.06 : 0.16 + w.recoilV * 0.02; this.flash.scale.set(fs, fs, 1); this.flashLight.intensity = w.cls === 'SIDEARM' ? 3 : 26;
    if (!w.shellReload && !w.explosive && w.cls !== 'SNIPER RIFLE' || id(s) === 'dmr') G.fx.shell(_o.copy(p.eye).addScaledVector(_dir, 0.4).addScaledVector(_right, 0.16).addScaledVector(_up, -0.1), _right, _up);
    if (w.shellReload || s.id === 'bolt') { this.pumpT = 60 / w.rpm; if (s.id === 'bolt') G.audio.play('bolt'); }
    G.audio.play('shot:' + w.cls); G.enemies.hear(p.pos.x, p.pos.y, p.pos.z, w.loud, 'shot'); G.squad.weaponsFree();
    if (w.cls !== 'SIDEARM') G.fx.puff(p.eye.x + _dir.x * 1.1, p.eye.y + _dir.y * 1.1 - 0.08, p.eye.z + _dir.z * 1.1, 0x999999, 0.18, 0.5, 0.18, _dir.x, 0.4, _dir.z, false, 0, 4);
  }
  throwGrenade() { if (this.grenades <= 0 || this.throwT > 0) return; this.grenades--; this.throwT = 0.9; const cam = G.camera; cam.getWorldDirection(_dir); G.fx.grenade(_o.copy(G.player.eye).addScaledVector(_dir, 0.5), _d.copy(_dir).multiplyScalar(17).add(_up.set(0, 4.5, 0)).add(G.player.vel), 'player'); G.audio.play('step:sand', null, { g: 0.3 }); }
  update(dt) {
    const I = G.input, p = G.player, s = this.slot, w = s.w, active = p.alive && !G.gear.droneActive && !p.frozen;
    this.cool -= dt; this.throwT -= dt; this.bloom = Math.max(0, this.bloom - dt * (3 + this.bloom * 2)); if (G.time - this.lastShot > 0.3) this.shotsSince = 0;
    // switching
    if (active) { for (let i = 0; i < 3; i++) if (I.pressed('Digit' + (i + 1))) this.switchTo(i); if (I.wheel) this.switchTo((this.cur + (I.wheel > 0 ? 1 : 2)) % 3); if (I.pressed('KeyQ')) this.switchTo(this.cur === 0 ? 1 : 0); }
    if (this.switchT > 0) { const before = this.switchT; this.switchT -= dt; if (before > 0.25 && this.switchT <= 0.25 && this.pending >= 0) { this.cur = this.pending; this.pending = -1; this.show(); G.audio.play('click'); } }
    // ADS
    const wantAds = active && I.btn[2] && !this.reloading && this.switchT <= 0 && !p.sprinting && this.sprintOut <= 0;
    this.adsT = clamp(this.adsT + (wantAds ? dt : -dt * 1.4) / w.ads, 0, 1); this.zoomNow = w.zoom;
    // sprint-to-fire delay
    if (p.sprinting) this.sprintOut = 0.12 + w.weight * 0.028; else this.sprintOut = Math.max(0, this.sprintOut - dt);
    // fire mode / reload / grenade
    if (active && I.pressed('KeyV') && w.modes.length > 1) { s.mode = w.modes[(w.modes.indexOf(s.mode) + 1) % w.modes.length]; G.audio.play('click'); G.hud.toast('FIRE MODE: ' + s.mode.toUpperCase()); }
    if (active && I.pressed('KeyR')) this.startReload();
    if (active && I.pressed('KeyG')) this.throwGrenade();
    if (this.reloading) { this.reloadT -= dt; if (this.reloadT <= 0) { if (w.shellReload) { s.mag++; s.reserve--; if (s.mag < w.mag && s.reserve > 0 && !I.btn[0]) { this.reloadT = w.reload; G.audio.play('click'); } else this.reloading = false; } else { const n = Math.min(w.mag - s.mag, s.reserve); s.mag += n; s.reserve -= n; this.reloading = false; } } }
    // trigger
    const trig = active && I.btn[0] && (I.locked || G.test), canFire = this.cool <= 0 && !this.reloading && this.switchT <= 0 && this.sprintOut <= 0 && this.throwT <= 0.4;
    if (trig && p.sprinting) p.sprinting = false;
    if (this.burstLeft > 0 && canFire) { this.fireOne(); this.burstLeft--; }
    else if (trig && canFire) { if (s.mode === 'auto') this.fireOne(); else if (!this.triggerHeld) { this.fireOne(); if (s.mode === 'burst') this.burstLeft = 2; } }
    if (trig && this.reloading && w.shellReload && s.mag > 0) this.reloading = false;
    this.triggerHeld = trig;
    // ---- view model animation ----
    this.pumpT = Math.max(0, this.pumpT - dt); this.kick = damp(this.kick, 0, 14, dt); this.kickRot = damp(this.kickRot, 0, 12, dt);
    this.swayX = damp(this.swayX, clamp(-I.mx * 0.0006, -0.03, 0.03), 8, dt); this.swayY = damp(this.swayY, clamp(I.my * 0.0006, -0.03, 0.03), 8, dt);
    const m = s.model, a = this.adsT, ea = a * a * (3 - 2 * a), bobK = (1 - a * 0.85) * Math.min(1, p.speedNow / 4) * (p.grounded ? 1 : 0);
    const sprintK = damp(this._sp || 0, p.sprinting ? 1 : 0, 9, dt); this._sp = sprintK;
    let lower = 0; if (this.switchT > 0) lower = 1 - Math.abs(this.switchT - 0.25) / 0.25; if (this.reloading) { const k = 1 - this.reloadT / (w.shellReload ? w.reload : w.reload); lower = Math.max(lower, Math.sin(clamp(k, 0, 1) * Math.PI) * 0.75); } if (this.throwT > 0) lower = Math.max(lower, Math.sin((this.throwT / 0.9) * Math.PI));
    const hipX = s.w.slot === 'sidearm' ? 0.11 : 0.13, sy = m.userData.sightY;
    m.position.set(lerp(hipX, 0, ea) + this.swayX + Math.cos(p.bob) * 0.012 * bobK - sprintK * 0.06, lerp(-0.15, -sy, ea) + this.swayY + Math.abs(Math.sin(p.bob)) * 0.014 * bobK - lower * 0.22 - sprintK * 0.05 - p.landed * 0.1, lerp(-0.4, -0.24, ea) + this.kick + (this.pumpT > 0 ? 0.03 * Math.sin((this.pumpT / (60 / w.rpm)) * Math.PI) : 0));
    m.rotation.set(this.kickRot * (1 - ea * 0.6) - lower * 0.9 - sprintK * 0.25, sprintK * 0.7 + this.swayX * 2, -this.swayX * 3 + sprintK * 0.25 + (this.reloading ? Math.sin(G.time * 9) * 0.03 : 0));
    if (m.userData.mag) m.userData.mag.visible = !(this.reloading && this.reloadT / w.reload > 0.35 && this.reloadT / w.reload < 0.75);
    if (m.userData.pump) { const k = this.pumpT > 0 ? Math.sin((this.pumpT / (60 / w.rpm)) * Math.PI) * 0.09 : 0; if (m.userData.pumpZ !== undefined) m.userData.pump.position.z = m.userData.pumpZ - k; else m.userData.pump.position.z = -SHAPE.shotgun.L - 0.12 + k; }
    const scoped = w.scope && a > 0.92; this.root.visible = !scoped && !G.gear.droneActive && G.state !== 'cinematic'; this.scoped = scoped;
    // arms follow the gun
    const pistol = w.slot === 'sidearm'; _o.set(0, pistol ? -0.07 : -0.1, pistol ? -0.02 : -0.06).applyEuler(m.rotation).add(m.position); this.armR.position.copy(_o); this.armR.quaternion.setFromUnitVectors(_zf, _d.set(0.3, -0.42, 0.25).sub(_o).normalize());
    _o.copy(m.userData.grip2).applyEuler(m.rotation).add(m.position); if (this.reloading && !w.shellReload) _o.y -= lower * 0.12; this.armL.position.copy(_o); this.armL.quaternion.setFromUnitVectors(_zf, _d.set(-0.3, -0.45, 0.2).sub(_o).normalize());
    // muzzle flash
    if (this.flash.visible) { this.flashT -= dt; _o.copy(m.userData.muzzle).applyEuler(m.rotation).add(m.position); this.flash.position.copy(_o); if (this.flashT <= 0) { this.flash.visible = false; this.flashLight.intensity = 0; } }
    // camera FOV
    const cam = G.camera, fov = G.settings.fov / lerp(1, w.zoom, ea) + sprintK * 4; if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = damp(cam.fov, fov, 18, dt); cam.updateProjectionMatrix(); }
  }
}
const id = (s) => s.id, _zf = new THREE.Vector3(0, 0, 1);
const _dir = new THREE.Vector3(), _right = new THREE.Vector3(), _up = new THREE.Vector3(), _d = new THREE.Vector3(), _o = new THREE.Vector3();
