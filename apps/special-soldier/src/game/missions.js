// Campaign: five operations, objective state machine, checkpoints, scripted events (alarms, reinforcements,
// C4 detonation, uplink defence, boss phases, extraction). UE5: GameMode + data-asset missions + Sequencer triggers.
import * as THREE from 'three';
import { G } from '../core/ctx.js';
import { fmtTime, clamp } from '../core/util.js';
import { POI } from '../world/build.js';
import { FAC_Y } from '../world/world.js';
import { ST } from './enemies.js';
import { WEAPONS } from '../config/weapons.js';
import { makeHeli } from './models.js';

const E = () => G.enemies, sp = (k, x, z, o) => G.enemies.spawn(k, x, z, o);
const top = (x, z) => G.world.groundAt(x, z, 999);
const wave = (list, group, tx, tz) => list.forEach(([k, x, z, y]) => { const e = sp(k, x, z, { group, squad: group, alert: true, y }); if (tx !== undefined) { e.lk.set(tx, e.pos.y, tz); e.goal = e.lk.clone(); } });

export const MISSIONS = [
  { code: 'MISSION 01', name: 'SILENT LANDING', zone: 'ZONE 01 · BEACH', sky: 'night', spawn: () => ({ x: 0, z: 328.5, yaw: 0 }),
    brief: ['04:30 — SQUAD 07 inserts by assault boat on the southern beach.', 'BLACK COBRA sentries hold two sandbag posts, a watch tower and a coastal radar.', 'Stay low: crouch, use the suppressed P9 [3] and night vision [N]. A sentry who survives five seconds after spotting you calls in a quick reaction force.', 'Eliminate the beach sentries, then move to the jungle trail head.'],
    unlocks: ['VIPER-9 SMG', 'M24 LONGBOW', 'RECON DRONE [B]'], intro: 'boat',
    setup() { const g = 'beach';
      sp('guard', -40, 304, { group: g, patrol: [[-40, 304], [-12, 309], [-40, 304], [-58, 300]] }); sp('guard', -44, 297.5, { group: g, yaw: 0.4 }); sp('guard', 46, 298, { group: g, yaw: -0.3 }); sp('guard', 50, 289, { group: g, patrol: [[50, 289], [22, 302], [50, 289], [66, 286]] });
      sp('guard', 14, 311, { group: g, patrol: [[14, 311], [-18, 310], [14, 311], [30, 308]] }); sp('sniper', 10, 284, { group: g, y: top(10, 284), yaw: 0 }); sp('guard', 68, 288, { group: g, yaw: 0.2 }); sp('assault', -6, 272, { group: g, yaw: 0 }); sp('assault', 7, 268, { group: g, patrol: [[7, 268], [-20, 276], [7, 268], [26, 272]] }); },
    objectives: [
      { type: 'kill', group: 'beach', text: 'Eliminate the beach sentries', marker: () => ({ x: 10, z: 290 }) },
      { type: 'reach', x: 0, z: 240, r: 10, text: 'Move to the jungle trail head', radio: 'COMMAND: Beach is secure. Push inland to the trail head.' } ],
    alarm() { G.hud.radio('NOMAD: They got a call out — QRF coming down the trail!'); wave([['assault', -6, 236], ['assault', 5, 232], ['guard', 0, 228]], 'qrf'); } },

  { code: 'MISSION 02', name: 'DEEP JUNGLE', zone: 'ZONE 02 · JUNGLE', sky: 'dawn', spawn: () => ({ x: 0, z: 236, yaw: 0.5 }),
    brief: ['05:40 — First light. Fog and rain are covering your approach.', 'A relay station in the western jungle links the island to BLACK COBRA command. Patrols sweep the trails between you and it.', 'Launch the recon drone [B] to tag hostiles before you commit.', 'Clear the station, plant C4 on the mast, get clear and hold against the counter-attack.'],
    unlocks: ['ARX-17 TACTICAL', 'M90 BREACHER', 'THERMAL IMAGER [T]'],
    intro: [{ from: [-60, 62, 250], to: [-110, 44, 200], look: [-140, 22, 150], dur: 6, text: 'ZONE 02 — JUNGLE · 05:40' }, { from: [-118, 21, 176], to: [-128, 30, 168], look: [-140, 36, 150], dur: 5, text: 'OBJECTIVE: BLACK COBRA COMMS RELAY' }],
    setup() { const c = POI.comms;
      for (const [k, x, z] of [['guard', -28, 204], ['assault', -32, 200], ['guard', -24, 198]]) sp(k, x, z, { group: 'patrolA', patrol: [[x, z], [x - 44, z - 16], [x - 20, z + 22]] });
      for (const [k, x, z] of [['guard', 62, 192], ['guard', 66, 188], ['assault', 58, 186]]) sp(k, x, z, { group: 'patrolB', patrol: [[x, z], [x + 60, z - 24], [x + 20, z - 50]] });
      sp('sniper', -86, 214, { group: 'patrolA', yaw: 1.6 });
      const g = 'comms'; sp('guard', c.x + 18, c.z + 20, { group: g, yaw: 0.6 }); sp('guard', c.x - 4, c.z + 24, { group: g, yaw: 0.2 }); sp('guard', c.x + 22, c.z + 4, { group: g, yaw: 1.5 }); sp('assault', c.x + 6, c.z + 12, { group: g, patrol: [[c.x + 6, c.z + 12], [c.x + 20, c.z - 8], [c.x - 10, c.z - 12], [c.x - 18, c.z + 16]] });
      sp('assault', c.x - 10, c.z - 6, { group: g }); sp('sniper', c.x + 26, c.z + 26, { group: g, y: top(c.x + 26, c.z + 26), yaw: 0.8 }); sp('heavy', c.x + 4, c.z + 2, { group: g, yaw: 0.5 }); sp('guard', c.x - 12, c.z + 8, { group: g, y: G.world.heightAt(c.x - 12, c.z + 8) }); },
    objectives: [
      { type: 'reach', x: -108, z: 186, r: 24, text: 'Infiltrate through the jungle to the comms relay', marker: () => ({ x: POI.comms.x, z: POI.comms.z }) },
      { type: 'kill', group: 'comms', text: 'Clear the comms relay', marker: () => ({ x: POI.comms.x, z: POI.comms.z }) },
      { type: 'interact', at: () => ({ x: POI.comms.x + 2, y: G.world.heightAt(POI.comms.x, POI.comms.z) + 1, z: POI.comms.z + 1.5 }), label: 'PLANT C4 CHARGE', hold: 3, text: 'Plant C4 on the relay mast' },
      { type: 'custom', text: 'Get clear of the blast (30 m)', check: (M) => Math.hypot(G.player.pos.x - POI.comms.x, G.player.pos.z - POI.comms.z) > 30, done: (M) => M.detonateTower() },
      { type: 'kill', group: 'reinf', text: 'Repel the counter-attack', start() { const c = POI.comms; G.hud.radio('ATLAS: Movement north! They are coming for the relay!'); wave([['assault', c.x + 30, c.z - 60], ['assault', c.x + 20, c.z - 66], ['elite', c.x + 40, c.z - 62], ['guard', c.x - 10, c.z - 64], ['assault', c.x + 60, c.z - 40]], 'reinf'); } } ],
    alarm() { G.hud.radio('REAPER: Patrols are converging on us!'); for (const e of E().list) if (e.alive && e.group.startsWith('patrol') && e.state < ST.SEARCH) { e.state = ST.SEARCH; e.stateT = 0; e.alerted = true; e.goal = G.player.pos.clone(); e.atGoal = false; } } },

  { code: 'MISSION 03', name: 'BLACK COBRA BASE', zone: 'ZONE 03 · MILITARY BASE', sky: 'storm', spawn: () => ({ x: 0, z: 46, yaw: 0 }),
    brief: ['09:10 — A thunderstorm is rolling over the island. Thunder masks gunfire; rain cuts their sight lines.', 'The base is walled, with snipers in the corner towers and an APC in the motor pool. Small arms barely scratch armour — use grenades [G] or explosive barrels.', 'Breach the south gate, eliminate HQ security and pull the facility access data from the HQ terminal.', 'When the alarm goes, get to the bunker elevator on the east side.'],
    unlocks: ['MG-48 LMG', 'SR-25 MARKSMAN'],
    intro: [{ from: [-30, 60, 90], to: [30, 48, 50], look: [0, 18, -80], dur: 6, text: 'ZONE 03 — BLACK COBRA BASE · 09:10' }, { from: [40, 24, -100], to: [20, 22, -112], look: [0, 18, -130], dur: 5, text: 'OBJECTIVE: HQ INTEL TERMINAL' }],
    setup() { const b = 'base', y = 16;
      sp('guard', -8, -8, { group: b, yaw: 3.1 }); sp('guard', 10, -10, { group: b, yaw: 3.1 }); sp('sniper', -112, -8, { group: b, y: top(-112, -8), yaw: 2.4 }); sp('sniper', 112, -8, { group: b, y: top(112, -8), yaw: -2.4 });
      sp('guard', -20, -42, { group: b, patrol: [[-20, -42], [22, -44], [22, -84], [-20, -80]] }); sp('assault', 44, -46, { group: b, yaw: -1.6 }); sp('assault', 46, -62, { group: b, patrol: [[46, -62], [46, -92], [80, -92]] }); sp('assault', 60, -40, { group: b, y, yaw: -1.5 });
      sp('guard', -50, -48, { group: b, yaw: 1.6 }); sp('heavy', -64, -46, { group: b, y, yaw: 1.6 }); sp('guard', -50, -96, { group: b, yaw: 0.5 }); sp('guard', -74, -150, { group: b, y, yaw: 1.5 });
      sp('apc', -14, -96, { group: 'armor', yaw: 0.3 });
      const h = 'hq'; sp('heavy', 0, -116, { group: h, yaw: 3.1 }); sp('elite', -7, -128, { group: h, y, yaw: 3 }); sp('elite', 9, -129, { group: h, y, yaw: 3.2 }); sp('guard', -9, -137, { group: h, y }); sp('guard', 18, -118, { group: h, yaw: 2.6 }); },
    objectives: [
      { type: 'reach', x: 0, z: -16, r: 13, text: 'Breach the south gate', marker: () => ({ x: 0, z: -2 }) },
      { type: 'kill', group: 'hq', text: 'Eliminate HQ security', marker: () => POI.hq },
      { type: 'interact', at: () => POI.intel, label: 'DOWNLOAD FACILITY ACCESS DATA', hold: 4, text: 'Download the intel from the HQ terminal', done(M) { G.audio.play('alarm', POI.hq); G.hud.radio('COMMAND: Data received. The whole base just lit up — get to the bunker!'); wave([['assault', -4, -178], ['assault', 4, -180], ['elite', 0, -176], ['assault', -30, -170], ['heavy', 30, -172]], 'qrf', POI.hq.x, POI.hq.z); M.flags.alarmed = true; } },
      { type: 'reach', x: 91, z: -150, r: 3.2, text: 'Reach the bunker elevator', marker: () => POI.bunker } ],
    alarm(M) { G.hud.radio('NOMAD: Base alarm! Armour is waking up!'); G.audio.play('alarm', POI.hq); wave([['assault', 70, -70], ['assault', 76, -74]], 'qrf'); for (const e of E().list) if (e.alive && e.type.vehicle) { e.state = ST.SEARCH; e.lk.copy(G.player.pos); e.alerted = true; } } },

  { code: 'MISSION 04', name: 'UNDERGROUND ZERO', zone: 'ZONE 04 · UNDERGROUND FACILITY', sky: 'facility', spawn: () => ({ x: POI.facSpawn.x, z: POI.facSpawn.z, y: FAC_Y, yaw: 0 }),
    brief: ['Sublevel 3 — the bio-research facility runs on emergency power.', 'Security cameras cover the access corridor. Shoot them out (the suppressed P9 will not be heard) or the whole level is alerted.', 'Override the security door, clear the laboratory, secure the bio-sample from the vault and start a data uplink in the server room.', 'The uplink takes 45 seconds. Hold the room, then take the north lift to the surface.'],
    unlocks: ['KR-5 RAPID', 'MGL-32 LAUNCHER'],
    intro: [{ from: [90, -57.4, -152], to: [90, -57.8, -160], look: [90, -58.5, -190], dur: 5, text: 'ZONE 04 — SUBLEVEL 3 · BIO-RESEARCH' }],
    setup(M) { const L = POI.facL, y = FAC_Y, s = (k, x, z, o = {}) => { const [wx, wz] = L(x, z); return sp(k, wx, wz, { y, ...o }); };
      s('guard', 0, -30, { group: 'corr', yaw: 0, patrol: [L(0, -22), L(0, -42)] });
      s('elite', -8, -56, { group: 'lab', yaw: 0 }); s('elite', 8, -66, { group: 'lab', yaw: 0 }); s('assault', -10, -70, { group: 'lab', yaw: 0 }); s('assault', 9, -50, { group: 'lab', yaw: 0 }); s('guard', 0, -72, { group: 'lab', yaw: 0, patrol: [L(0, -72), L(-10, -64), L(10, -64)] });
      s('heavy', 24, -61, { group: 'vault', squad: 'lab', yaw: -1.57 }); s('guard', 30, -56, { group: 'vault', squad: 'lab', yaw: -1.57 });
      s('elite', -6.8, -100, { group: 'srv', yaw: 0 }); s('elite', 6.8, -108, { group: 'srv', yaw: 0 }); s('heavy', 0, -112, { group: 'srv', yaw: 0 });
      POI.secDoor.alive = true; POI.secDoor.mesh.visible = true; POI.secDoor.mesh.position.y = FAC_Y + 2.1; POI.sample.mesh.visible = true; for (const c of POI.cameras) { c.detect = 0; if (!c.col.alive) { c.col.alive = true; c.col.hp = 10; c.dead = false; c.g.visible = true; } } },
    tick(M, dt) { if (M.flags.camAlarm) return; const P = G.player; for (const c of POI.cameras) { if (c.dead) continue; const dx = P.pos.x - c.x, dz = P.pos.z - c.z, d = Math.hypot(dx, dz); let see = false; if (d < 15 && !G.noTarget) { const a = Math.atan2(dx, dz) - c.g.rotation.y; if (Math.cos(a) > 0.55 && G.world.los(_a.set(c.x, c.y - 0.2, c.z), P.eye)) see = true; }
        c.detect = clamp((c.detect || 0) + (see ? dt * (P.stance ? 0.5 : 0.9) : -dt * 0.4), 0, 1.5); M.camDetect = Math.max(M.camDetect || 0, c.detect); if (c.detect >= 1.2) { M.flags.camAlarm = true; M.stats.alarms++; G.audio.play('alarm', c); G.hud.toast('CAMERA ALERT — FACILITY ON LOCKDOWN', true); G.hud.radio('COMMAND: You have been made. Expect resistance.'); for (const e of E().list) if (e.alive && e.state < ST.SEARCH) { e.state = ST.SEARCH; e.alerted = true; e.stateT = 0; e.lk.copy(P.pos); if (!e.hold) { e.goal = P.pos.clone(); e.atGoal = false; } } } } },
    objectives: [
      { type: 'interact', at: () => POI.secDoorPos, label: 'OVERRIDE SECURITY DOOR', hold: 2.5, text: 'Override the security door (avoid or destroy the cameras)', done() { POI.secDoor.alive = false; G.audio.play('beep', POI.secDoorPos, { f: 700 }); const m = POI.secDoor.mesh, t0 = G.time; G.world.animated.push(() => { if (!POI.secDoor.alive) m.position.y = FAC_Y + 2.1 + Math.min(4, (G.time - t0) * 2.5); }); } },
      { type: 'kill', group: 'lab', text: 'Clear the laboratory', marker: () => ({ x: POI.fac.x, z: POI.fac.z - 61 }) },
      { type: 'interact', at: () => POI.sample, label: 'SECURE BIO-SAMPLE', hold: 2, text: 'Secure the bio-sample in the vault', done() { POI.sample.mesh.visible = false; G.hud.radio('ATLAS: Sample is secure. That stuff should never leave this island.'); } },
      { type: 'interact', at: () => POI.server, label: 'START DATA UPLINK', hold: 1.5, text: 'Start the data uplink in the server room' },
      { type: 'defend', time: 45, text: 'Defend the uplink', marker: () => POI.server, start(M) { M.waveT = 2; G.audio.play('alarm', POI.server); G.hud.radio('COMMAND: Uplink started. Forty-five seconds — hold that room!'); }, tick(M, dt) { if ((M.waveT -= dt) <= 0 && E().count('wave') < 5) { M.waveT = 11; const L = POI.facL, [x, z] = L(0, -74), [x2, z2] = L(1.2, -71); wave([['assault', x, z, FAC_Y], [Math.random() < 0.5 ? 'elite' : 'assault', x2, z2, FAC_Y]], 'wave'); } } },
      { type: 'reach', at: () => POI.exitLift, r: 2.6, text: 'Take the north lift to the surface', radio: 'COMMAND: We have it all. Extraction is at the airfield — move!' } ],
    alarm() {} },

  { code: 'MISSION 05', name: 'LAST EXTRACTION', zone: 'ZONE 05 · AIRFIELD & PORT', sky: 'dusk', spawn: () => ({ x: 40, z: -257, y: 7, yaw: -1.2 }),
    brief: ['18:50 — The lift opens into the airfield hangar. A storm front is closing in.', 'COMMANDER VIPER, leader of BLACK COBRA, is on the runway with his elite guard and an APC, between you and the helipad.', 'VIPER wears heavy armour and throws grenades when you sit still — keep moving between cover. The MGL-32 and frag grenades deal with the APC.', 'Kill VIPER, pop smoke on the helipad and hold the landing zone until the helicopter arrives.'],
    unlocks: ['CAMPAIGN COMPLETE'],
    intro: [{ from: [70, 12, -278], to: [96, 9.5, -288], look: [120, 8.6, -296], dur: 5, text: 'ZONE 05 — AIRFIELD · 18:50' }, { from: [116, 8.9, -289], to: [118.5, 8.8, -291.5], look: [120, 8.9, -296], dur: 4.5, text: 'TARGET: COMMANDER VIPER — BLACK COBRA' }],
    setup(M) { const y = 7;
      M.boss = sp('boss', 120, -296, { group: 'boss', squad: 'air', yaw: -1.57 });
      sp('elite', 106, -301, { group: 'air', yaw: -1.5 }); sp('elite', 134, -292, { group: 'air', yaw: -1.5 }); sp('elite', 118, -308, { group: 'air', yaw: -1.5 }); sp('assault', 97, -284, { group: 'air', yaw: -1.5 }); sp('assault', 64, -306, { group: 'air', yaw: -1.2 }); sp('guard', 144, -300, { group: 'air' }); sp('guard', 150, -284, { group: 'air' });
      sp('sniper', 232, -300, { group: 'air', y: top(232, -300), yaw: -1.57 }); sp('apc', 166, -297, { group: 'air', yaw: -1.57 }); sp('heavy', 126, -284, { group: 'air', yaw: -1.5 }); },
    objectives: [
      { type: 'kill', group: 'boss', text: 'Eliminate COMMANDER VIPER', marker: () => (G.mission.boss ? { x: G.mission.boss.pos.x, z: G.mission.boss.pos.z } : POI.runway), done() { G.hud.radio('REAPER: VIPER is down! I say again, VIPER is down!'); } },
      { type: 'reach', at: () => ({ ...POI.helipad, y: 8 }), r: 9, text: 'Get to the helipad', radio: 'COMMAND: Angel One-Two is inbound. Mark the LZ.' },
      { type: 'interact', at: () => ({ x: POI.helipad.x, y: 8, z: POI.helipad.z }), label: 'POP SMOKE — SIGNAL EXTRACTION', text: 'Signal the helicopter with smoke', r: 4, done() { G.fx.smokes.push({ x: POI.helipad.x + 6, y: 7.2, z: POI.helipad.z + 5, life: 160, color: 0x40d060 }); } },
      { type: 'defend', time: 60, text: 'Hold the landing zone', marker: () => POI.helipad, start(M) { M.waveT = 1; G.hud.radio('ANGEL 1-2: Green smoke in sight. Sixty seconds out — hold on!'); }, tick(M, dt) { if ((M.waveT -= dt) <= 0 && E().count('lz') < 7) { M.waveT = 9; const src = [[120, -300], [150, -338], [238, -262], [160, -270]][Math.random() * 4 | 0]; wave([['assault', src[0], src[1]], ['assault', src[0] + 3, src[1] + 2], [Math.random() < 0.4 ? 'elite' : 'guard', src[0] - 3, src[1] + 3]], 'lz', POI.helipad.x, POI.helipad.z); } }, done: (M) => M.heliArrive() },
      { type: 'interact', at: () => ({ x: POI.helipad.x - 2.5, y: 8.4, z: POI.helipad.z }), label: 'BOARD HELICOPTER', r: 5, text: 'Board the helicopter', enabled: () => G.mission.heliLanded, done: (M) => M.ending() } ],
    alarm() {} },
];
const _a = new THREE.Vector3();

export class MissionSys {
  constructor() { this.idx = -1; this.def = null; this.interactables = []; this.stats = this.newStats(); this.flags = {}; this.objs = []; this.oi = 0; this.heli = null; }
  newStats() { return { kills: 0, headshots: 0, shots: 0, hits: 0, score: 0, time: 0, alarms: 0, deaths: 0 }; }
  /** Build the level state for mission i (enemies, sky, player, squad) without starting play. */
  load(i) {
    const d = (this.def = MISSIONS[i]); this.idx = i; this.flags = {}; this.stats = this.newStats(); this.interactables.length = 0; this.oi = -1; this.objs = d.objectives; this.boss = null; this.heliLanded = false; this.camDetect = 0; this.waveT = 0; this.defT = 0; this.completeT = -1;
    if (this.heli) { G.scene.remove(this.heli); this.heli = null; G.audio.loop('heli', 0); }
    G.enemies.clear(); G.fx.reset(); G.sky.set(d.sky, true); this.restoreWorld();
    const s = d.spawn(), P = G.player; P.reset(); P.medkits = 2; P.place(s.x, s.z, s.yaw, s.y); this.checkpoint = { x: s.x, z: s.z, y: s.y, yaw: s.yaw, oi: 0 };
    G.weapons.equip(G.save.loadout); G.gear.reset(); G.squad.spawn(3); d.setup(this);
    G.cine.placeBoat(i === 0);
  }
  restoreWorld() { const t = POI.commsTower; if (t) { t.group.rotation.set(0, 0, 0); t.group.visible = true; t.col.alive = true; } for (const it of G.world.interactables) { it.done = false; it.cool = 0; } }
  begin() { this.advance(); G.hud.banner(this.def.code + ' — ' + this.def.name, this.def.zone); }
  get obj() { return this.objs[this.oi]; }
  advance() {
    const prev = this.obj; if (prev && prev.done) prev.done(this);
    if (this.completeT >= 0) return; this.oi++; this.interactables.length = 0;
    const o = this.obj; if (!o) { this.completeT = 2.2; return; }
    const P = G.player; if (this.oi > 0) { this.checkpoint = { x: P.pos.x, z: P.pos.z, y: P.pos.y, yaw: P.yaw, oi: this.oi }; G.hud.toast('CHECKPOINT REACHED'); G.audio.play('ui:ok'); }
    if (o.type === 'interact') { const a = o.at(); this.interactables.push({ x: a.x, y: a.y, z: a.z, r: o.r || 2.6, label: o.label, hold: o.hold, once: true, enabled: o.enabled, act: () => this.advance() }); }
    if (o.type === 'defend') this.defT = o.time;
    if (o.start) o.start(this); if (o.radio) G.hud.radio(o.radio);
    G.hud.objective(this.objText(), true);
  }
  objText() { const o = this.obj; if (!o) return 'Mission complete'; if (o.type === 'kill') return `${o.text} — ${G.enemies.count(o.group)} left`; if (o.type === 'defend') return `${o.text} — ${fmtTime(this.defT)}`; return o.text; }
  marker() { const o = this.obj; if (!o) return null; if (o.marker) return o.marker(); if (o.at) return o.at(); if (o.x !== undefined) return o; if (o.type === 'kill') { let best = null, bd = 1e9; for (const e of G.enemies.list) if (e.alive && e.group === o.group) { const d = e.pos.distanceToSquared(G.player.pos); if (d < bd) { bd = d; best = e.pos; } } return best; } return null; }
  event(name, e) {
    if (name === 'alarm' && !this.flags.alarm) { this.flags.alarm = true; this.stats.alarms++; G.hud.toast('ENEMY CALLED FOR REINFORCEMENTS', true); this.def.alarm(this, e); }
    if (name === 'bossPhase2') { G.hud.radio('VIPER: All units — converge on the runway! Kill them all!'); G.audio.play('alarm', e.pos); wave([['elite', 60, -336], ['elite', 66, -340], ['assault', 54, -334], ['assault', 200, -270]], 'air', e.pos.x, e.pos.z); e.type = { ...e.type, speed: 5.2, spread: 2.1 }; }
  }
  update(dt) {
    if (this.completeT >= 0) { this.completeT -= dt; if (this.completeT < 0) { this.completeT = -1; this.finish(); } return; }
    const o = this.obj, P = G.player; if (!o) return; this.stats.time += dt; if (this.def.tick) this.def.tick(this, dt);
    if (o.type === 'kill') { if (G.enemies.count(o.group) === 0) this.advance(); }
    else if (o.type === 'reach') { const a = o.at ? o.at() : o; if (Math.hypot(P.pos.x - a.x, P.pos.z - a.z) < o.r && (a.y === undefined || Math.abs(P.pos.y - a.y) < 6)) this.advance(); }
    else if (o.type === 'custom') { if (o.check(this)) this.advance(); }
    else if (o.type === 'defend') { this.defT -= dt; if (o.tick) o.tick(this, dt); if (this.defT <= 0) this.advance(); }
    if (this.heli) this.updateHeli(dt);
    if ((this.hudT = (this.hudT || 0) - dt) <= 0) { this.hudT = 0.25; G.hud.objective(this.objText(), false); }
  }
  respawn() { // restart from the last checkpoint: hostiles keep their losses but lose track of you
    const c = this.checkpoint, P = G.player; this.stats.deaths++; P.reset(); P.place(c.x, c.z, c.yaw, c.y); P.medkits = Math.max(P.medkits, 1); G.weapons.reset(); for (const s of G.weapons.slots) { s.mag = s.w.mag; s.reserve = Math.max(s.reserve, Math.floor(s.w.reserve * 0.6)); } G.weapons.grenades = Math.max(G.weapons.grenades, 2);
    G.fx.reset(); G.gear.reset(); G.squad.regroup(); for (const m of G.squad.list) { m.down = false; m.hp = 200; }
    for (const e of G.enemies.list) if (e.alive) { e.state = ST.PATROL; e.detect = 0; e.burstLeft = 0; e.goal = e.patrol ? null : e.home.clone(); e.atGoal = !e.goal; e.cover = false; e.hide = false; if (e.pos.distanceTo(P.pos) < 25 && !e.hold && !e.type.vehicle) { e.pos.copy(e.home); } }
    G.squad.free = false; G.hud.objective(this.objText(), true);
  }
  finish() { G.onMissionComplete(); }
  // ---- scripted set pieces ----
  detonateTower() {
    const t = POI.commsTower, c = POI.comms, y = G.world.heightAt(c.x, c.z), fx = G.fx; let fall = 0;
    G.cine.play([{ from: [c.x + 34, y + 9, c.z + 30], to: [c.x + 40, y + 11, c.z + 36], look: [c.x, y + 14, c.z], dur: 6.5, text: 'RELAY MAST DESTROYED — BLACK COBRA COMMS OFFLINE',
      start: () => { fx.explode(c.x, y + 1, c.z, 12, 'none', 200); setTimeout(() => fx.explode(c.x + 1, y + 9, c.z, 8, 'none', 0), 350); setTimeout(() => fx.explode(c.x - 8, y + 1, c.z + 2, 8, 'none', 100), 700); },
      update: (k, dt) => { if (k > 0.12) { fall = Math.min(1.5, fall + dt * (0.15 + fall * 1.4)); t.group.rotation.z = fall; if (fall >= 1.5 && t.col.alive) { t.col.alive = false; fx.explode(c.x - 26, y + 1, c.z, 9, 'none', 0); G.player.shake = 1; } } } }],
      () => { t.group.rotation.z = 1.5; t.col.alive = false; }, { showSquad: true });
  }
  heliArrive() {
    const h = (this.heli = makeHeli()), p = POI.helipad; G.scene.add(h); this.heliT = 0; this.heliMode = 'in'; G.hud.radio('ANGEL 1-2: On final. Get your people ready!');
    G.cine.play([{ from: [p.x - 26, 12, p.z + 22], to: [p.x - 20, 10.5, p.z + 16], look: () => [h.position.x, h.position.y + 2, h.position.z], dur: 9, text: 'ANGEL 1-2 — EXTRACTION' }], null, { showSquad: true, tick: (dt) => this.updateHeli(dt) });
  }
  updateHeli(dt) {
    const h = this.heli, p = POI.helipad; this.heliT += dt; h.userData.rotor.rotation.y += dt * 26; h.userData.tail.rotation.x += dt * 40; h.userData.light.visible = Math.sin(G.time * 8) > 0;
    if (this.heliMode === 'in') { const k = clamp(this.heliT / 8.5, 0, 1), e = 1 - (1 - k) ** 3; h.position.set(p.x + (1 - e) * 240, 7.2 + (1 - e) * 70 + (k < 1 ? Math.sin(G.time * 2) * 0.3 : 0), p.z - (1 - e) * 120); h.rotation.set(-(1 - k) * 0.25, -1.9 + e * 0.35, 0); if (k >= 1 && !this.heliLanded) { this.heliLanded = true; G.hud.toast('HELICOPTER LANDED — BOARD NOW'); } if (Math.random() < 0.5 && k > 0.6) G.fx.puff(p.x + (Math.random() - 0.5) * 18, 7.4, p.z + (Math.random() - 0.5) * 18, 0x8a8478, 2.2, 1.2, 0.25, (Math.random() - 0.5) * 9, 0.6, (Math.random() - 0.5) * 9); }
    else { const k = this.heliT; h.position.y = 7.2 + k * k * 1.3; h.position.x += dt * k * 4; h.position.z += dt * k * 2.4; h.rotation.x = Math.min(0.2, k * 0.03); h.rotation.y += dt * 0.12; }
    const d = h.position.distanceTo(G.camera.position); G.audio.loop('heli', clamp(1.4 - d / 220, 0, 1));
  }
  ending() {
    const h = this.heli; this.heliMode = 'out'; this.heliT = 0; G.squad.clear(); G.enemies.clear(); G.player.frozen = true;
    G.hud.radio('ANGEL 1-2: All souls aboard. SQUAD 07 is feet dry — heading home.');
    G.cine.play([
      { from: [POI.helipad.x - 14, 9, POI.helipad.z + 12], to: [POI.helipad.x - 22, 14, POI.helipad.z + 20], look: () => [h.position.x, h.position.y + 2, h.position.z], dur: 7, text: 'OPERATION: ISLAND INVASION — COMPLETE' },
      { from: [320, 120, 60], to: [420, 150, 200], look: [0, 10, -100], dur: 8, text: 'BLACK COBRA island facility neutralised. Bio-sample secured.' }],
      () => { G.audio.loop('heli', 0); this.completeT = 0.01; }, { tick: (dt) => this.updateHeli(dt), noSkipEnd: true });
  }
}
export function unlockedWeapons(progress) { return Object.keys(WEAPONS).filter((id) => WEAPONS[id].unlock <= progress); }
