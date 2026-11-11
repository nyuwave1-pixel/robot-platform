// Enemy AI: perception (vision cone + line of sight + hearing), awareness meter, finite state machine
// (PATROL → SUSPICIOUS → SEARCH → COMBAT ↔ RETREAT), cover selection, flanking, squad alerts and reinforcement
// calls. UE5 equivalent: AIController + Behavior Tree / StateTree + AIPerception + EQS cover queries.
import * as THREE from 'three';
import { G } from '../core/ctx.js';
import { clamp, angDiff, damp, TAU } from '../core/util.js';
import { DIFFICULTY } from '../core/save.js';
import { makeSoldier, makeAPC, poseSoldier, HOT } from './models.js';
import { raySphere } from './fx.js';

export const ST = { PATROL: 0, SUSPICIOUS: 1, SEARCH: 2, COMBAT: 3, RETREAT: 4 };
export const ST_NAME = ['PATROL', 'SUSPICIOUS', 'SEARCH', 'COMBAT', 'RETREAT'];
const gun = (dmg, vel = 520, range = [45, 160]) => ({ dmg, vel, range, minMul: 0.6, pellets: 1 });
export const ENEMY_TYPES = {
  guard:   { name: 'SENTRY',        hp: 90,  armor: 0,   speed: 3.6, spread: 3.3, burst: [2, 4],   rpm: 520, gun: gun(11), vision: 72,  fov: 1.9, react: 0.9,  behavior: 'cover',    score: 100 },
  assault: { name: 'ASSAULT',       hp: 110, armor: 35,  speed: 4.7, spread: 3.7, burst: [4, 7],   rpm: 680, gun: gun(10), vision: 78,  fov: 2.0, react: 0.7,  behavior: 'push',     score: 150 },
  sniper:  { name: 'SNIPER',        hp: 80,  armor: 0,   speed: 2.6, spread: 0.45, burst: [1, 1],  rpm: 30,  gun: gun(58, 800, [200, 500]), vision: 190, fov: 1.3, react: 1.7, behavior: 'hold', score: 200 },
  heavy:   { name: 'HEAVY GUNNER',  hp: 260, armor: 160, speed: 2.1, spread: 4.6, burst: [10, 18], rpm: 600, gun: gun(10), vision: 75,  fov: 1.9, react: 1.1,  behavior: 'suppress', score: 300, scale: 1.14, helmet: true },
  elite:   { name: 'COBRA ELITE',   hp: 150, armor: 90,  speed: 4.9, spread: 2.3, burst: [3, 5],   rpm: 700, gun: gun(13), vision: 92,  fov: 2.2, react: 0.5,  behavior: 'flank',    score: 350, grenades: true, helmet: true },
  apc:     { name: 'APC',           hp: 950, armor: 0,   speed: 0,   spread: 2.8, burst: [8, 14],  rpm: 520, gun: gun(14, 620), vision: 130, fov: 7, react: 1.3, behavior: 'hold',     score: 800, vehicle: true },
  boss:    { name: 'COMMANDER VIPER', hp: 950, armor: 320, speed: 4.3, spread: 2.5, burst: [6, 10], rpm: 660, gun: gun(14), vision: 120, fov: 3.0, react: 0.5, behavior: 'flank',    score: 2000, grenades: true, scale: 1.2, helmet: true, boss: true },
};
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3(), _m = new THREE.Vector3(), _list = [];
const ZONES = [[1.64, 0.15, 'head'], [1.3, 0.27, 'torso'], [0.98, 0.26, 'torso'], [0.55, 0.2, 'limb'], [0.2, 0.17, 'limb']];

export class Enemies {
  constructor() {
    this.list = []; this.thermal = false; this.maxDetect = 0; this.inCombat = 0; this.alarmT = -1;
    this.laser = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.7, fog: false })); this.laser.frustumCulled = false; this.laser.visible = false; G.scene.add(this.laser);
  }
  clear() { for (const e of this.list) G.scene.remove(e.model); this.list.length = 0; this.inCombat = 0; this.maxDetect = 0; this.laser.visible = false; }
  spawn(kind, x, z, o = {}) {
    const type = ENEMY_TYPES[kind], W = G.world, y = o.y ?? W.heightAt(x, z);
    const model = type.vehicle ? makeAPC() : makeSoldier(kind, type.scale || 1); model.position.set(x, y, z); G.scene.add(model);
    const e = { kind, type, model, pos: new THREE.Vector3(x, y, z), yaw: o.yaw ?? Math.random() * TAU, home: new THREE.Vector3(x, y, z), homeYaw: o.yaw ?? 0, state: ST.PATROL, stateT: 0,
      hp: type.hp, armor: type.armor, alive: true, group: o.group || 'main', squad: o.squad || o.group || 'main', patrol: o.patrol || null, pi: 0, waitT: Math.random() * 3,
      detect: 0, see: false, seeAny: false, tgt: null, lk: new THREE.Vector3(x, y, z), lastSeen: -99, inv: new THREE.Vector3(), goal: null, atGoal: true, cover: false, hide: false, peekT: 0, planT: 0,
      think: Math.random() * 0.3, reactT: 0, burstLeft: 0, shotT: 0, pauseT: 1, aimT: 0, nadeCool: 4 + Math.random() * 6, walk: Math.random() * 6, moveK: 0, crouch: 0, stuckT: 0, side: Math.random() < 0.5 ? 1 : -1, sideT: 0,
      lastFire: -99, marked: -99, hold: !!o.hold || type.behavior === 'hold', alerted: false, retreated: false, called: false, callT: 0, deadT: 0, loot: true, phase: 1, flinch: 0, turret: 0, speedNow: 0 };
    if (this.thermal) this.applyThermal(e, true);
    if (o.alert) { e.state = ST.SEARCH; e.alerted = true; e.lk.copy(G.player.pos); e.goal = e.lk.clone(); e.atGoal = false; e.detect = 0.6; }
    this.list.push(e); return e;
  }
  count(group) { let n = 0; for (const e of this.list) if (e.alive && (!group || e.group === group)) n++; return n; }
  applyThermal(e, on) { for (const m of e.model.userData.parts.meshes) m.material = on && e.alive ? HOT : m.userData.mat; }
  setThermal(on) { this.thermal = on; for (const e of this.list) this.applyThermal(e, on); }
  // ---- hit testing / damage ----
  hitTest(o, d, max) {
    let best = null, bt = max;
    for (const e of this.list) {
      if (!e.alive) continue; const dx = e.pos.x - o.x, dz = e.pos.z - o.z; if (dx * dx + dz * dz > (max + 4) * (max + 4)) continue;
      if (e.type.vehicle) { for (const oz of [-1.9, 0, 1.9]) { const t = raySphere(o, d, e.pos.x + Math.sin(e.yaw) * oz, e.pos.y + 1.5, e.pos.z + Math.cos(e.yaw) * oz, 1.75, bt); if (t >= 0 && t < bt) { bt = t; best = { enemy: e, zone: 'torso', t }; } } continue; }
      const sc = (e.type.scale || 1), cr = 1 - e.crouch * 0.3;
      for (const [zy, r, zone] of ZONES) { const t = raySphere(o, d, e.pos.x, e.pos.y + zy * sc * (zy > 0.6 ? cr : 1), e.pos.z, r * sc, bt); if (t >= 0 && t < bt) { bt = t; best = { enemy: e, zone, t }; } }
    }
    return best;
  }
  damage(e, dmg, zone, owner, explosive = false) {
    if (!e.alive) return;
    if (e.type.vehicle && !explosive) dmg *= 0.1;
    if (zone === 'head' && e.type.helmet) dmg *= 0.62;
    if (zone === 'torso' && e.armor > 0 && !e.type.vehicle) { const a = Math.min(e.armor, dmg * 0.5); e.armor -= a; dmg -= a; }
    e.hp -= dmg; e.flinch = 0.25;
    const byPlayer = owner === 'player';
    if (byPlayer) { G.mission.stats.hits++; G.hud.hitMarker(zone === 'head', e.hp <= 0); G.audio.play(e.hp <= 0 ? 'kill' : 'hit'); }
    if (e.hp <= 0) return this.kill(e, zone, owner);
    if (e.state !== ST.COMBAT) { e.lk.copy(G.player.pos); this.engage(e, false); }
    if (e.type.boss && e.phase === 1 && e.hp < e.type.hp * 0.5) { e.phase = 2; G.mission.event('bossPhase2', e); }
  }
  kill(e, zone, owner) {
    e.alive = false; e.deadT = 0; this.applyThermal(e, false);
    const st = G.mission.stats; st.kills++; if (zone === 'head') st.headshots++; st.score += e.type.score * (zone === 'head' ? 1.5 : 1);
    if (owner === 'player') G.hud.killFeed(e.type.name, zone === 'head');
    if (e.type.vehicle) { G.fx.explode(e.pos.x, e.pos.y + 1.5, e.pos.z, 9, 'none', 120); e.model.traverse((o) => { if (o.isMesh) o.material = BURNT; }); }
    else if (Math.random() < 0.5) G.audio.play('voice', e.pos);
    // nearby allies notice the death
    for (const o of this.list) if (o.alive && o !== e && o.state < ST.SEARCH && o.pos.distanceToSquared(e.pos) < 30 * 30 && G.world.los(_a.copy(o.pos).setY(o.pos.y + 1.6), _b.copy(e.pos).setY(e.pos.y + 1))) { o.state = ST.SEARCH; o.stateT = 0; o.alerted = true; o.goal = e.pos.clone(); o.atGoal = false; o.detect = Math.max(o.detect, 0.5); }
    G.mission.event('kill', e);
  }
  /** Sound stimulus: gunshots, explosions. */
  hear(x, y, z, radius, kind) {
    const indoor = y < -30;
    for (const e of this.list) { if (!e.alive || e.state >= ST.COMBAT || (e.pos.y < -30) !== indoor) continue; const d = Math.hypot(e.pos.x - x, e.pos.z - z); if (d > radius) continue;
      e.inv.set(x, y, z); e.alerted = true;
      if (d < radius * 0.55 || kind === 'explosion') { e.state = ST.SEARCH; e.stateT = 0; e.goal = e.hold ? null : new THREE.Vector3(x, y, z); e.atGoal = !e.goal; e.detect = Math.max(e.detect, 0.5); e.lk.set(x, y, z); }
      else if (e.state === ST.PATROL) { e.state = ST.SUSPICIOUS; e.stateT = 0; } }
  }
  engage(e, spotted) {
    if (e.state === ST.COMBAT) return; const first = !e.alerted || e.state < ST.SEARCH;
    e.state = ST.COMBAT; e.stateT = 0; e.detect = 1; e.alerted = true; e.planT = 0; e.lastSeen = G.time;
    e.reactT = e.type.react * DIFFICULTY[G.settings.difficulty].react * (0.7 + Math.random() * 0.6) * (spotted ? 1 : 0.6);
    if (first) { if (!e.type.vehicle) G.audio.play('voice', e.pos); this.alertSquad(e, 48); if (!e.called) { e.called = true; e.callT = 5; } }
    G.squad.weaponsFree(); G.mission.event('combat', e);
  }
  alertSquad(src, radius) {
    for (const o of this.list) { if (!o.alive || o === src || o.state >= ST.COMBAT) continue; if ((o.pos.y < -30) !== (src.pos.y < -30)) continue; const near = o.pos.distanceToSquared(src.pos) < radius * radius; if (!near && o.squad !== src.squad) continue; if (o.squad === src.squad && o.pos.distanceToSquared(src.pos) > 140 * 140) continue;
      o.alerted = true; o.lk.copy(src.lk); o.detect = Math.max(o.detect, 0.7); o.state = ST.SEARCH; o.stateT = 0; o.goal = o.hold ? null : src.lk.clone().add(_a.set((Math.random() - 0.5) * 12, 0, (Math.random() - 0.5) * 12)); o.atGoal = !o.goal; }
  }
  // ---- perception ----
  perceive(e, tdt) {
    const P = G.player, W = G.world, D = DIFFICULTY[G.settings.difficulty], t = e.type, crouch = e.crouch > 0.5;
    _a.set(e.pos.x, e.pos.y + (t.vehicle ? 2.6 : crouch ? 1.05 : 1.6), e.pos.z);
    const dx = P.pos.x - e.pos.x, dz = P.pos.z - e.pos.z, dist = Math.hypot(dx, dz, P.pos.y - e.pos.y); e.dist = dist;
    let vr = t.vision * (1 - G.sky.night * 0.5) * [1, 0.72, 0.5][P.stance] * D.detect * (e.alerted ? 1.25 : 1) * (G.gear.light ? 1.5 : 1) * (1 - Math.min(0.3, G.sky.rainAmt * 0.2));
    if (e.state === ST.COMBAT) vr = Math.max(vr, t.vision * 0.9);
    let see = false;
    if (P.alive && dist < vr && !G.noTarget) { const ang = Math.abs(angDiff(Math.atan2(dx, dz), e.yaw + e.turret)); if (e.state >= ST.COMBAT || ang < t.fov / 2 || dist < 3.5) see = W.los(_a, _b.copy(P.eye).setY(P.eye.y - 0.15)); }
    e.see = see; e.seeAny = see; e.tgt = P;
    if (see) { e.lk.copy(P.pos); e.lastSeen = G.time; if (e.state < ST.COMBAT) e.detect += tdt * (1.35 - dist / vr) * 0.95 * D.detect / t.react * (e.alerted ? 1.8 : 1) * (P.sprinting ? 1.5 : 1); }
    else { e.detect = Math.max(0, e.detect - tdt * 0.18); // squad mates are valid targets too
      if (e.alerted || G.squad.free) for (const m of G.squad.list) { if (m.down) continue; const md = m.pos.distanceTo(e.pos); if (md < Math.min(vr * 1.2, 70) && W.los(_a, _b.copy(m.pos).setY(m.pos.y + 1.4))) { e.tgt = m; e.seeAny = true; e.lk.copy(m.pos); e.lastSeen = G.time; if (e.state < ST.COMBAT) e.detect += tdt * 1.2; break; } } }
    if (P.alive && P.noise > 0 && dist < P.noise * D.detect && e.state < ST.COMBAT && !G.noTarget) { e.detect = Math.max(e.detect, 0.42) + tdt * 0.5; e.inv.copy(P.pos); }
    // transitions
    if (e.state < ST.COMBAT && e.detect >= 1) this.engage(e, true);
    else if (e.state === ST.PATROL && e.detect > 0.35) { e.state = ST.SUSPICIOUS; e.stateT = 0; if (see) e.inv.copy(P.pos); }
    else if (e.state === ST.SUSPICIOUS) { e.stateT += tdt; if (e.stateT > 2.2) { if (e.detect > 0.3 && !e.hold) { e.state = ST.SEARCH; e.stateT = 0; e.goal = e.inv.clone(); e.atGoal = false; } else if (e.stateT > 5) { e.state = ST.PATROL; } } }
    else if (e.state === ST.SEARCH) { e.stateT += tdt; if (e.atGoal && !e.hold && e.stateT < 14 && Math.random() < tdt * 0.35) { e.goal = e.lk.clone().add(_m.set((Math.random() - 0.5) * 22, 0, (Math.random() - 0.5) * 22)); e.atGoal = false; } if (e.stateT > 18) { e.state = ST.PATROL; e.goal = e.patrol ? null : e.home.clone(); e.atGoal = !e.goal; e.cover = false; e.hide = false; } }
    else if (e.state === ST.COMBAT) { e.stateT += tdt; if (!e.seeAny && G.time - e.lastSeen > (e.hold ? 12 : 6)) { e.state = ST.SEARCH; e.stateT = 0; e.cover = false; e.hide = false; e.goal = e.hold ? null : e.lk.clone(); e.atGoal = !e.goal; } else this.plan(e, tdt, dist); }
    else if (e.state === ST.RETREAT) { e.stateT += tdt; if (e.stateT > 7) { e.state = ST.COMBAT; e.planT = 0; } }
    // radio call for reinforcements: must survive a few seconds after first contact
    if (e.callT > 0 && e.state >= ST.COMBAT) { e.callT -= tdt; if (e.callT <= 0) G.mission.event('alarm', e); }
  }
  findCover(e, threat, cx, cz, R, wantDist) {
    const W = G.world; let best = null, bs = 1e9; W.near(cx, cz, R, _list);
    for (const c of _list) {
      if (c.pass || c.thin || c.kind === 'tree' || c.kind === 'glass' || c.kind === 'camera' || c.max.y - c.min.y < 0.95 || c.min.y > e.pos.y + 0.6 || c.max.y < e.pos.y + 0.8) continue;
      const hx = (c.max.x - c.min.x) / 2, hz = (c.max.z - c.min.z) / 2; if (hx > 16 || hz > 16) continue; const ccx = c.min.x + hx, ccz = c.min.z + hz;
      let ax = ccx - threat.x, az = ccz - threat.z; const al = Math.hypot(ax, az) || 1; ax /= al; az /= al;
      const ext = Math.min(hx / Math.max(1e-3, Math.abs(ax)), hz / Math.max(1e-3, Math.abs(az))) + 0.75, px = ccx + ax * ext, pz = ccz + az * ext;
      if (e.pos.y > -30 && W.heightAt(px, pz) < 0.2) continue;
      let taken = false; for (const o of this.list) if (o !== e && o.alive && o.goal && Math.hypot(o.goal.x - px, o.goal.z - pz) < 1.6) { taken = true; break; } if (taken) continue;
      const s = Math.hypot(px - e.pos.x, pz - e.pos.z) + Math.abs(Math.hypot(px - threat.x, pz - threat.z) - wantDist) * 0.6; if (s < bs) { bs = s; best = _m.set(px, e.pos.y, pz).clone(); }
    }
    return best;
  }
  plan(e, tdt, dist) {
    const t = e.type; e.planT -= tdt; if (e.hold || t.vehicle) return;
    const T = e.tgt.pos, P = G.player;
    if (e.hp < t.hp * 0.33 && !e.retreated && (t.behavior === 'cover' || t.behavior === 'push') && Math.random() < 0.7) { // fall back + call for help
      e.retreated = true; e.state = ST.RETREAT; e.stateT = 0; const ax = e.pos.x - T.x, az = e.pos.z - T.z, al = Math.hypot(ax, az) || 1; const c = this.findCover(e, T, e.pos.x + (ax / al) * 18, e.pos.z + (az / al) * 18, 16, dist + 18);
      e.goal = c || new THREE.Vector3(e.pos.x + (ax / al) * 20, e.pos.y, e.pos.z + (az / al) * 20); e.atGoal = false; e.cover = !!c; e.hide = false; this.alertSquad(e, 80); G.audio.play('voice', e.pos); return; }
    if (e.planT > 0) return; e.planT = 2.5 + Math.random() * 3;
    let goal = null;
    if (t.behavior === 'cover') { if (!e.cover || !e.atGoal || e.see === false || dist < 8) goal = this.findCover(e, T, e.pos.x, e.pos.z, 24, clamp(dist, 18, 45)); if (!goal && !e.cover) goal = _m.set(e.pos.x + Math.cos(e.yaw) * 4 * e.side, e.pos.y, e.pos.z - Math.sin(e.yaw) * 4 * e.side).clone(); e.side *= -1; }
    else if (t.behavior === 'push') { if (dist > 16) { const k = Math.min(14, dist - 12) / dist; goal = this.findCover(e, T, e.pos.x + (T.x - e.pos.x) * k, e.pos.z + (T.z - e.pos.z) * k, 12, 14) || _m.set(e.pos.x + (T.x - e.pos.x) * k, e.pos.y, e.pos.z + (T.z - e.pos.z) * k).clone(); } else goal = this.findCover(e, T, e.pos.x, e.pos.z, 12, 12); }
    else if (t.behavior === 'flank') { const a = Math.atan2(e.pos.x - T.x, e.pos.z - T.z) + e.side * (0.7 + Math.random() * 0.5), r = clamp(dist * 0.75, 12, 26), fx = T.x + Math.sin(a) * r, fz = T.z + Math.cos(a) * r; goal = this.findCover(e, T, fx, fz, 12, r) || _m.set(fx, e.pos.y, fz).clone(); if (Math.random() < 0.3) e.side *= -1; }
    else if (t.behavior === 'suppress') { if (dist > 24) goal = _m.set(e.pos.x + (T.x - e.pos.x) * 0.3, e.pos.y, e.pos.z + (T.z - e.pos.z) * 0.3).clone(); }
    if (goal) { e.goal = goal; e.atGoal = false; e.cover = t.behavior !== 'suppress'; e.hide = false; e.peekT = 0; }
    // grenades flush the player out of cover
    if (t.grenades && e.tgt === P && (e.nadeCool -= 3) <= 0 && dist > 9 && dist < 34 && (P.inCover || (!e.see && G.time - e.lastSeen < 8))) { e.nadeCool = 14; const tt = 1.5; _a.set(e.pos.x, e.pos.y + 1.6, e.pos.z); G.fx.grenade(_a, _b.set((e.lk.x - e.pos.x) / tt, (e.lk.y - e.pos.y - 1.2 + 0.5 * 9.81 * tt * tt) / tt, (e.lk.z - e.pos.z) / tt), 'enemy', { fuse: 2.9 }); G.hud.toast('GRENADE!', true); }
  }
  shoot(e) {
    const t = e.type, D = DIFFICULTY[G.settings.difficulty], T = e.tgt, P = G.player, isP = T === P, yawNow = e.yaw + e.turret;
    _a.set(e.pos.x + Math.sin(yawNow) * (t.vehicle ? 3.2 : 0.7), e.pos.y + (t.vehicle ? 2.85 : (1.45 - e.crouch * 0.42) * (t.scale || 1)), e.pos.z + Math.cos(yawNow) * (t.vehicle ? 3.2 : 0.7));
    const th = isP ? P.height * 0.62 : 1.1, lead = e.dist / t.gun.vel * 0.7; _b.set(T.pos.x + (isP ? P.vel.x * lead : 0), T.pos.y + th, T.pos.z + (isP ? P.vel.z * lead : 0));
    _d.subVectors(_b, _a).normalize();
    let s = t.spread * D.acc * (isP ? (P.inCover ? 1.7 : 1) * (1 + P.speedNow * 0.07) * [1, 0.95, 1.2][P.stance] : 1.2) * (e.speedNow > 0.5 ? 1.6 : 1) * (e.stateT < 1.2 ? 1.8 : 1) * (1 + G.sky.night * 0.25);
    s = (s * Math.PI) / 180; const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * Math.tan(s); _m.set(-_d.z, 0, _d.x).normalize(); _d.addScaledVector(_m, Math.cos(a) * r); _d.y += Math.sin(a) * r; _d.normalize();
    G.fx.fire(_a, _d, t.gun, 'enemy', e); e.lastFire = G.time;
    G.fx.puff(_a.x, _a.y, _a.z, 0xffc070, t.vehicle ? 1.1 : 0.55, 0.06, 1, 0, 0, 0, true, 0, 0.5);
    G.audio.play('shot:' + (e.kind === 'sniper' ? 'SNIPER RIFLE' : e.kind === 'heavy' || t.vehicle ? 'LMG' : 'ENEMY'), e.pos);
  }
  update(dt) {
    const P = G.player, W = G.world; let maxD = 0, combat = 0, laserOn = false;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const e = this.list[i], t = e.type, parts = e.model.userData.parts;
      if (!e.alive) { e.deadT += dt; if (!t.vehicle) { const k = Math.min(1, e.deadT * 2.6); e.model.rotation.x = -k * 1.45 * (e.side); e.model.rotation.z = k * 0.2; e.model.position.y = e.pos.y + k * 0.12; }
        if (e.loot && !t.vehicle && e.deadT > 0.6 && P.alive && Math.hypot(P.pos.x - e.pos.x, P.pos.z - e.pos.z) < 1.8) { e.loot = false; const s = G.weapons.slot; const n = Math.ceil(s.w.mag * 0.6); s.reserve = Math.min(s.w.reserve + s.w.mag * 2, s.reserve + n); G.hud.toast(`+${n} ${s.w.name} AMMO`); G.audio.play('click'); }
        if (e.deadT > 40 && !t.vehicle) { G.scene.remove(e.model); this.list.splice(i, 1); } continue; }
      const dist = Math.hypot(P.pos.x - e.pos.x, P.pos.z - e.pos.z); e.model.visible = dist < 460;
      if (dist > 400 && e.state < ST.COMBAT) continue;
      if ((e.think -= dt) <= 0) { const td = dist < 130 || e.state >= ST.SEARCH ? 0.13 : 0.45; e.think = td; this.perceive(e, td); }
      if (e.state < ST.COMBAT) maxD = Math.max(maxD, e.detect); else combat++;
      e.flinch = Math.max(0, e.flinch - dt);
      // ---- vehicle turret ----
      if (t.vehicle) { if (e.state >= ST.SEARCH) { const want = angDiff(Math.atan2(e.lk.x - e.pos.x, e.lk.z - e.pos.z), e.yaw); e.turret += clamp(angDiff(want, e.turret), -1.3 * dt, 1.3 * dt); } parts.turret.rotation.y = e.turret; this.fireLogic(e, dt, Math.abs(angDiff(Math.atan2(e.tgt ? e.tgt.pos.x - e.pos.x : 0, e.tgt ? e.tgt.pos.z - e.pos.z : 1), e.yaw + e.turret)) < 0.12); continue; }
      // ---- movement ----
      let speed = 0, wantYaw = e.yaw, wantCrouch = 0;
      if (e.state === ST.PATROL) { if (e.patrol) { if (e.atGoal) { if ((e.waitT -= dt) <= 0) { e.pi = (e.pi + 1) % e.patrol.length; e.goal = new THREE.Vector3(e.patrol[e.pi][0], e.pos.y, e.patrol[e.pi][1]); e.atGoal = false; e.waitT = 2 + Math.random() * 4; } else wantYaw = e.yaw + Math.sin(G.time * 0.5 + i) * 0.6 * dt; } speed = 1.5; } else if (e.goal && !e.atGoal) speed = 1.8; else wantYaw = e.homeYaw + Math.sin(G.time * 0.35 + i * 1.7) * 0.9; }
      else if (e.state === ST.SUSPICIOUS) wantYaw = Math.atan2(e.inv.x - e.pos.x, e.inv.z - e.pos.z);
      else if (e.state === ST.SEARCH) { speed = 2.7; if (e.atGoal || !e.goal) wantYaw = e.yaw + Math.sin(G.time * 0.9 + i) * 1.6 * dt; }
      else { speed = t.speed * (e.state === ST.RETREAT ? 1.1 : 1); if (e.flinch > 0) speed *= 0.4; }
      let moving = false;
      if (e.goal && !e.atGoal && !e.hold && speed > 0) {
        let gx = e.goal.x - e.pos.x, gz = e.goal.z - e.pos.z; const gl = Math.hypot(gx, gz);
        if (gl < 0.7) { e.atGoal = true; e.peekT = 0.5 + Math.random(); }
        else { gx /= gl; gz /= gl; if (e.sideT > 0) { e.sideT -= dt; const sx = -gz * e.side, sz = gx * e.side; gx = gx * 0.3 + sx; gz = gz * 0.3 + sz; }
          const px = e.pos.x, pz = e.pos.z, step = speed * dt; const nx = px + gx * step, nz = pz + gz * step;
          if (e.pos.y > -30 && W.heightAt(nx, nz) < 0.15) { e.atGoal = true; } else { W.moveCircle(e.pos, gx * step, gz * step, 0.36, 1.7); }
          const moved = Math.hypot(e.pos.x - px, e.pos.z - pz); if (moved < step * 0.45) { e.stuckT += dt; if (e.stuckT > 0.35) { e.sideT = 0.7 + Math.random() * 0.5; e.side *= Math.random() < 0.7 ? 1 : -1; e.stuckT = 0; e.stuckN = (e.stuckN || 0) + 1; if (e.stuckN > 5) { e.atGoal = true; e.stuckN = 0; e.planT = 0; } } } else { e.stuckT = 0; }
          moving = true; if (e.state < ST.COMBAT || !e.seeAny) wantYaw = Math.atan2(gx, gz); }
        e.pos.y = damp(e.pos.y, W.groundAt(e.pos.x, e.pos.z, e.pos.y + 0.6), 14, dt);
      }
      e.speedNow = moving ? speed : 0;
      if (e.state >= ST.COMBAT && (e.seeAny || G.time - e.lastSeen < 3)) wantYaw = Math.atan2(e.lk.x - e.pos.x, e.lk.z - e.pos.z);
      e.yaw += clamp(angDiff(wantYaw, e.yaw), -5 * dt, 5 * dt);
      // ---- cover peek cycle ----
      if (e.state >= ST.COMBAT && e.cover && e.atGoal) { e.peekT -= dt; if (e.peekT <= 0) { e.hide = !e.hide; e.peekT = e.hide ? 0.9 + Math.random() * 1.8 : 1.4 + Math.random() * 1.6; } wantCrouch = e.hide ? 1 : 0; } else e.hide = false;
      if (e.state === ST.RETREAT && e.atGoal) wantCrouch = 1;
      e.crouch = damp(e.crouch, wantCrouch, 9, dt);
      // ---- weapons ----
      const facing = Math.abs(angDiff(Math.atan2(e.lk.x - e.pos.x, e.lk.z - e.pos.z), e.yaw)) < 0.35;
      if (e.state === ST.COMBAT) {
        if (e.kind === 'sniper') { if (e.seeAny && facing) { e.aimT += dt; laserOn = this.drawLaser(e) || laserOn; if (e.aimT > 1.9 * DIFFICULTY[G.settings.difficulty].react) { this.shoot(e); e.aimT = -1.6; } } else e.aimT = Math.min(0, e.aimT); }
        else this.fireLogic(e, dt, facing && !e.hide && e.flinch <= 0);
      }
      // ---- animation ----
      e.moveK = damp(e.moveK, moving ? 1 : 0, 8, dt); e.walk += speed * dt * 2.6 * e.moveK;
      const aim = e.state >= ST.COMBAT && e.tgt ? clamp(Math.atan2(e.tgt.pos.y + 1.1 - e.pos.y - 1.4, Math.max(2, e.dist || 10)), -0.6, 0.6) : -0.25;
      poseSoldier(e.model, { walk: e.walk, moveK: e.moveK, crouch: e.crouch, aim });
      e.model.position.copy(e.pos); e.model.rotation.set(0, e.yaw, 0);
    }
    this.maxDetect = maxD; this.inCombat = combat; this.laser.visible = laserOn;
  }
  fireLogic(e, dt, canFire) {
    const t = e.type; if (e.state !== ST.COMBAT) return; e.reactT -= dt; if (e.reactT > 0) return;
    if (e.burstLeft > 0) { if ((e.shotT -= dt) <= 0) { if (e.seeAny || G.time - e.lastSeen < 1.2) this.shoot(e); e.burstLeft--; e.shotT = 60 / t.rpm; if (e.burstLeft === 0) e.pauseT = (t.behavior === 'suppress' ? 0.5 : 0.7 + Math.random() * 1.3) * DIFFICULTY[G.settings.difficulty].react; } }
    else if ((e.pauseT -= dt) <= 0 && canFire && (e.seeAny || (t.behavior === 'suppress' && G.time - e.lastSeen < 2.5))) { e.burstLeft = t.burst[0] + Math.floor(Math.random() * (t.burst[1] - t.burst[0] + 1)); e.shotT = 0; }
  }
  drawLaser(e) { if (e.tgt !== G.player || e.aimT < 0) return false; const p = this.laser.geometry.attributes.position; p.setXYZ(0, e.pos.x, e.pos.y + 1.5, e.pos.z); const P = G.player, k = clamp(1 - e.aimT / 1.9, 0, 1); p.setXYZ(1, P.eye.x + Math.sin(G.time * 3) * k * 0.8, P.eye.y - 0.3 + Math.cos(G.time * 2.3) * k * 0.6, P.eye.z); p.needsUpdate = true; return true; }
}
const BURNT = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 1 });
