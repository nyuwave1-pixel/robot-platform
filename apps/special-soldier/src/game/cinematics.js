// In-engine cinematics: shot-list camera sequencer (position/look-at tracks, subtitles, per-shot callbacks),
// the boat infiltration opening and the live main-menu backdrop. UE5 equivalent: Level Sequencer + Cine Camera.
import * as THREE from 'three';
import { G } from '../core/ctx.js';
import { lerp, clamp, smooth } from '../core/util.js';
import { makeBoat, makeSoldier, poseSoldier } from './models.js';
import { waveHeight } from '../world/sky.js';

const _p = new THREE.Vector3(), _l = new THREE.Vector3();
import { ASSETS } from './assets.js';
const SEATS_OLD = [[0.75, 1.5], [-0.75, 1.5], [0.75, 0.1], [-0.75, 0.1], [0.75, -0.9], [-0.3, -2.4]], SEATS_NEW = [[1.02, 2.5], [-1.02, 2.5], [1.02, 1.1], [-1.02, 1.1], [1.02, -0.3], [0, -1.75]];
export class Cine {
  constructor() {
    this.active = false; this.showSquad = false; this.shots = []; this.i = 0; this.t = 0; this.total = 0;
    this.boat = makeBoat(); this.boat.rotation.y = Math.PI; G.scene.add(this.boat); this.crew = [];
    const NEW = ASSETS.ready; this.draft = NEW ? 0.3 : 0; (NEW ? SEATS_NEW : SEATS_OLD).forEach(([x, z], i) => { const s = makeSoldier('squad'); s.position.set(x, NEW ? 0.7 : 0.62, z); s.rotation.y = i === 5 ? 0 : x > 0 ? (NEW ? -1.25 : -0.5) : NEW ? 1.25 : 0.5; poseSoldier(s, { sit: true }); if (i === 5) { poseSoldier(s, {}); s.position.y = NEW ? 0.6 : 0.5; } this.boat.add(s); this.crew.push(s); });
    this.boatPos = new THREE.Vector3(0, 0, 640); this.boatSpeed = 0; this.menuA = 0;
  }
  /** shots: [{dur, from, to, look | cam(k), fov, text, radio, start(), update(k,dt)}] */
  play(shots, onEnd, opts = {}) {
    this.shots = shots; this.onEnd = onEnd; this.opts = opts; this.i = -1; this.t = 0; this.total = 0; this.active = true; this.showSquad = !!opts.showSquad; this.after = opts.after || 'playing';
    G.state = 'cinematic'; G.hud.cinematic(true); G.weapons.root.visible = false; if (G.gear.droneActive) G.gear.toggleDrone(); this.next();
  }
  next() { this.i++; this.t = 0; const s = this.shots[this.i]; if (!s) return this.end(); if (s.start) s.start(); G.hud.subtitle(s.text || ''); if (s.radio) G.hud.radio(s.radio); }
  skip() { if (!this.active || this.opts.noSkip) return; for (let k = this.i + 1; k < this.shots.length; k++) if (this.shots[k].start && this.opts.runStarts) this.shots[k].start(); this.end(); }
  end() { if (!this.active) return; this.active = false; G.hud.cinematic(false); G.camera.fov = G.settings.fov; G.camera.updateProjectionMatrix(); G.post.fadeTarget = 0; G.state = this.after; const f = this.onEnd; this.onEnd = null; if (f) f(); if (G.state === 'playing') { G.player.updateCamera(0); if (!G.test) G.input.lock(); } }
  update(dt) {
    this.updateBoat(dt);
    if (!this.active) return; const s = this.shots[this.i]; if (!s) return;
    this.t += dt; this.total += dt; const k = clamp(this.t / s.dur, 0, 1), e = k * k * (3 - 2 * k);
    if (this.opts.tick) this.opts.tick(dt, this.total); if (s.update) s.update(k, dt);
    let p, l; if (s.cam) { const c = s.cam(k, e); p = c.p; l = c.l; } else { p = [lerp(s.from[0], s.to[0], e), lerp(s.from[1], s.to[1], e), lerp(s.from[2], s.to[2], e)]; l = typeof s.look === 'function' ? s.look(k) : s.look; }
    const cam = G.camera; cam.position.set(p[0], p[1], p[2]); cam.rotation.order = 'YXZ'; cam.lookAt(_l.set(l[0], l[1], l[2]));
    const fov = s.fov || 50; if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    const last = this.i === this.shots.length - 1; G.post.fadeTarget = (this.i === 0 && this.t < 0.25) || (last && s.dur - this.t < 0.7) ? 1 : 0;
    if (G.input.pressed('Enter') || G.input.pressed('Space')) return this.skip();
    if (this.t >= s.dur) this.next();
  }
  // ---- boat ----
  updateBoat(dt) {
    const b = this.boat; if (!b.visible) return; const p = this.boatPos, t = G.time, ground = G.world.heightAt(p.x, p.z);
    if (this.beached) { b.position.set(p.x, Math.max(ground + 0.12, waveHeight(p.x, p.z, t) * 0.15 - 0.1) - this.draft, p.z); b.rotation.set(0.04, Math.PI + 0.12, 0.03); return; }
    const w = waveHeight(p.x, p.z, t) * 0.55, wf = waveHeight(p.x, p.z - 3, t), wb = waveHeight(p.x, p.z + 3, t), wl = waveHeight(p.x - 1.5, p.z, t), wr = waveHeight(p.x + 1.5, p.z, t), sp = this.boatSpeed;
    b.position.set(p.x, Math.max(w + 0.05 + sp * 0.006, ground + 0.15) - this.draft, p.z); b.rotation.set((wf - wb) * 0.09 - sp * 0.006 + Math.sin(t * 7) * 0.004 * sp * 0.1, Math.PI, (wl - wr) * 0.12, 'YXZ');
    if (sp > 2 && Math.random() < dt * 40) { const fx = G.fx; fx.puff(p.x + (Math.random() - 0.5) * 1.6, 0.3, p.z + 4.6 + Math.random() * 2, 0xeaf4ff, 0.8, 1.1, 0.22, (Math.random() - 0.5) * 2, 1.4, sp * 0.25, false, 3, 2.6); if (Math.random() < 0.5) fx.puff(p.x + (Math.random() < 0.5 ? -1.4 : 1.4), 0.5, p.z - 3.4, 0xf2f8ff, 0.45, 0.6, 0.3, (Math.random() - 0.5) * 5, 2.6, 2, false, 8, 2); }
  }
  placeBoat(beached) { this.boat.visible = beached; this.beached = beached; this.boatSpeed = 0; if (beached) { this.boatPos.set(3.2, 0, 331.5); this.crew.forEach((c, i) => (c.visible = i === 5 || i === 4)); } }
  menuScene() { this.boat.visible = true; this.beached = false; this.boatPos.set(0, 0, 610); this.boatSpeed = 5; this.crew.forEach((c) => (c.visible = true)); G.sky.set('night', true); }
  updateMenu(dt) { this.menuA += dt * 0.07; const b = this.boatPos, a = this.menuA, cam = G.camera; cam.position.set(b.x + Math.sin(a) * 11 + 3, 2.4 + Math.sin(a * 1.7) * 0.6, b.z + 7 + Math.cos(a) * 5); cam.rotation.order = 'YXZ'; cam.lookAt(_l.set(b.x - 2.5, 1.2, b.z - 14)); if (cam.fov !== 42) { cam.fov = 42; cam.updateProjectionMatrix(); } }
  /** SCENE 01 — DEEP SEA INFILTRATION → SCENE 02 — BEACH LANDING */
  playBoatIntro(onEnd) {
    const T = 35, Z0 = 760, Z1 = 331.5, B = this.boatPos; this.boat.visible = true; this.beached = false; this.crew.forEach((c) => (c.visible = true)); B.set(0, 0, Z0); let tt = 0, prevZ = Z0;
    const R = (dx, dy, dz) => [B.x + dx, Math.max(0.9, this.boat.position.y + dy), B.z + dz];
    G.audio.loop('boat', 0.5); G.audio.loop('ocean', 0.35);
    const shots = [
      { dur: 6.5, fov: 46, text: 'PACIFIC OCEAN · 04:30 — 2 KM SOUTH OF THE TARGET ISLAND', cam: (k) => ({ p: R(26 - k * 6, 13 - k * 3, 44 - k * 8), l: R(0, 0, -70) }) },
      { dur: 6, fov: 38, radio: 'COMMAND: Bravo Team, this is Command. Your mission begins now.', text: 'COMMAND: "Bravo Team, this is Command. Your mission begins now."', cam: (k) => ({ p: R(4 - k * 7, 1.5, -13 + k * 2), l: R(0, 1.1, 0) }) },
      { dur: 6, fov: 42, text: 'SQUAD 07 — SIX OPERATORS · ASSAULT BOAT "MAKO"', cam: (k) => ({ p: R(-10 + k * 1.5, 1.3 + k * 0.8, 3 - k * 7), l: R(0, 0.9, -0.5) }) },
      { dur: 6.5, fov: 50, radio: 'COMMAND: Approaching enemy territory. Maintain radio silence.', text: 'COMMAND: "Approaching enemy territory. Maintain radio silence."', cam: (k) => ({ p: R(1.6 - k * 0.6, 2.7, 8.5 - k * 2), l: R(0, 2.2, -60) }) },
      { dur: 4.5, fov: 34, text: 'REAPER: "Night vision on. Weapons tight until the boss says otherwise."', cam: (k) => ({ p: R(0.25 + k * 0.3, 1.55, -3.6), l: R(0.4, 1.25, 1) }), start: () => G.audio.play('nvg') },
      { dur: 5.5, fov: 55, text: 'SOUTH BEACH — ENEMY COAST AHEAD', cam: (k) => ({ p: R(-4.5 + k, 2.2 + k * 0.6, 8 - k * 2), l: R(0, 1.4, -30) }) },
    ];
    this.play(shots, () => { G.audio.loop('boat', 0); this.placeBoat(true); if (onEnd) onEnd(); }, { tick: (dt) => { tt = Math.min(T, tt + dt); const k = tt / T; B.z = Z0 - (Z0 - Z1) * (k * (1.7 - 0.7 * k)); B.x = Math.sin(k * 3.2) * 5 * (1 - k) + 3.2 * smooth(0.7, 1, k); this.boatSpeed = (prevZ - B.z) / Math.max(dt, 1e-3); prevZ = B.z; G.audio.loop('boat', 0.2 + clamp(this.boatSpeed / 22, 0, 0.5)); } });
  }
}
