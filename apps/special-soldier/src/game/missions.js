// Campaign: five operations, objective state machine, checkpoints, scripted events (alarms, reinforcements,
// C4 detonation, uplink defence, boss phases, extraction). UE5: GameMode + data-asset missions + Sequencer triggers.
import * as THREE from 'three';
import { G } from '../core/ctx.js';
import { fmtTime, clamp } from '../core/util.js';
import { POI } from '../world/build.js';
import { FAC_Y, MAT } from '../world/world.js';
import { ST } from './enemies.js';
import { WEAPONS } from '../config/weapons.js';
import { makeHeli } from './models.js';
import { INTEL } from '../config/intel.js';
import { storeSave } from '../core/save.js';

const E = () => G.enemies, sp = (k, x, z, o) => G.enemies.spawn(k, x, z, o);
const top = (x, z) => G.world.groundAt(x, z, 999);
const wave = (list, group, tx, tz) => list.forEach(([k, x, z, y]) => { const e = sp(k, x, z, { group, squad: group, alert: true, y }); if (tx !== undefined) { e.lk.set(tx, e.pos.y, tz); e.goal = e.lk.clone(); } });

// ---- BOOT CAMP: firing range at the east end of the runway (separate from campaign progress) ----
// Teaches move / sprint / crouch / hip-fire / ADS / reload / grenade, then a timed run that recommends a difficulty.
export const RANGE = { x: 235, z: -247 };
let boardMat = null;
function boardMaterial() {
  if (boardMat) return boardMat;
  const c = document.createElement('canvas'); c.width = 64; c.height = 176; const g = c.getContext('2d');
  g.fillStyle = '#e6dfca'; g.fillRect(0, 0, 64, 176); g.fillStyle = '#2f3829'; g.beginPath(); g.arc(32, 28, 14, 0, 6.3); g.fill(); g.fillRect(13, 44, 38, 72); g.fillRect(17, 116, 12, 58); g.fillRect(35, 116, 12, 58);
  g.strokeStyle = '#c8372b'; g.lineWidth = 3; for (const r of [6, 13]) { g.beginPath(); g.arc(32, 74, r, 0, 6.3); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (boardMat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }));
}
function rangeProp(m, group, x, z, sx, sy, sz, mat, hp, extra = {}) {
  const y = G.world.groundAt(x, z, 999), c = G.world.box(x, y, z, sx, sy, sz, mat, { hp, kind: 'target', mat: 'wood', ...extra });
  c.maxHp = hp; c.alive = false; c.mesh.visible = false; (m.trainGroups[group] = m.trainGroups[group] || []).push(c); m.trainProps.push(c); return c;
}
// MISSION 02 backup-power outpost: a generator on the jungle flank that feeds the relay. Built once, then stays as scenery.
// Added after the world's static batch is finalised, so the props must be dynamic (own meshes) or they would never draw.
export const GEN = { x: -170, z: 220 };
let genBuilt = false;
function buildGenOutpost() {
  if (genBuilt) return; genBuilt = true; const W = G.world, H = (x, z) => W.heightAt(x, z), g = GEN;
  W.box(g.x, H(g.x, g.z) - 0.05, g.z, 3, 2.2, 2, MAT.olive, { mat: 'metal', kind: 'cover', geo: 'P_generator', dynamic: true });
  for (const [dx, dz, len, ax] of [[0, 3.4, 4.2, true], [-3.6, 0, 3.2, false]]) { const x = g.x + dx, z = g.z + dz; W.box(x, H(x, z) - 0.15, z, ax ? len : 0.8, 1.15, ax ? 0.8 : len, MAT.sand, { mat: 'sand', kind: 'cover', geo: 'P_sandbags', rot90: !ax, dynamic: true }); }
  for (const [dx, dz] of [[3.4, -1.2], [3.4, 0.2]]) { const x = g.x + dx, z = g.z + dz; W.box(x, H(x, z) - 0.05, z, 0.75, 1.15, 0.75, MAT.red, { mat: 'metal', hp: 25, kind: 'barrel', explosive: 6, geo: 'P_barrel' }); }
}
const RM = (t) => 'RANGE MASTER: ' + t;
export const TRAINING = {
  code: 'BOOT CAMP', name: 'FIRING RANGE', zone: 'TRAINING · AIRFIELD RANGE', sky: 'dawn', training: true, noSquad: true, unlocks: [],
  spawn: () => ({ x: RANGE.x, z: RANGE.z, yaw: 0 }),
  brief: ['Eight short drills on the airfield range: movement, sprint, crouch, hip-fire, aiming down sights, reloading and grenades.', 'The last drill is timed. Your time and accuracy recommend a campaign difficulty.', 'No enemies are live on the range. Press Esc to pause or quit at any time.'],
  setup(m) {
    const R = RANGE, B = boardMaterial();
    for (const dx of [-5, 0, 5]) rangeProp(m, 'near', R.x + dx, R.z - 39, 0.6, 1.75, 0.08, B, 1);
    for (const dx of [-12, 0, 12]) rangeProp(m, 'far', R.x + dx, R.z - 78, 0.6, 1.75, 0.08, B, 1);
    for (const [dx, dz] of [[-1.1, 0], [0, 0], [1.1, 0], [-0.5, -1.1], [0.6, -1.1]]) rangeProp(m, 'crate', R.x + 8 + dx, R.z - 54 + dz, 1, 0.9, 1, MAT.wood, 400, { geo: 'P_crate' });
    for (const [dx, dz] of [[-14, -33], [-8, -48], [-3, -30], [3, -58], [7, -36], [12, -50], [17, -31], [-18, -55]]) rangeProp(m, 'run', R.x + dx, R.z + dz, 0.6, 1.75, 0.08, B, 1);
  },
  objectives: [
    { type: 'reach', x: RANGE.x, z: RANGE.z - 11, r: 2.4, text: 'Walk to the marker  [W A S D · mouse to look]', radio: RM('Welcome to boot camp, operator. Walk to the first marker.') },
    { type: 'custom', text: 'Sprint to the firing line  [SHIFT]', marker: () => ({ x: RANGE.x, z: RANGE.z - 25 }), radio: RM('Hold Shift to sprint. You cannot fire while sprinting.'),
      start: (m) => { m.flags.spr = false; }, check: (m) => { const P = G.player; if (P.sprinting) m.flags.spr = true; return m.flags.spr && Math.hypot(P.pos.x - RANGE.x, P.pos.z - (RANGE.z - 25)) < 3.2; } },
    { type: 'custom', text: 'Crouch at the firing line  [CTRL / C]', marker: () => ({ x: RANGE.x, z: RANGE.z - 25 }), radio: RM('Crouching steadies your aim and makes you harder to spot.'), check: () => G.player.stance === 1 },
    { type: 'custom', text: 'Hip-fire: knock down the 3 close targets  [LEFT MOUSE]', marker: () => ({ x: RANGE.x, z: RANGE.z - 39 }), radio: RM('Targets up. Fire from the hip — fast, but the spread is wide.'),
      start: (m) => m.showRange('near'), check: (m) => m.rangeLeft('near') === 0 },
    { type: 'custom', text: 'Aim down sights and hit the 3 far targets  [RIGHT + LEFT MOUSE]', marker: () => ({ x: RANGE.x, z: RANGE.z - 78 }), radio: RM('Hold right mouse to aim down sights. Breathe, then squeeze.'),
      start: (m) => m.showRange('far'), check: (m) => m.rangeLeft('far') === 0 },
    { type: 'custom', text: 'Reload your weapon  [R]', radio: RM('Never walk into a room on half a magazine. Reload.'), start: (m) => { m.flags.rl = false; }, check: (m) => { if (G.weapons.reloading) m.flags.rl = true; return m.flags.rl && !G.weapons.reloading; } },
    { type: 'custom', text: 'Throw a grenade at the crates  [G]', marker: () => ({ x: RANGE.x + 8, z: RANGE.z - 54 }), radio: RM('Frag out! Aim high to throw farther.'),
      start: (m) => { m.flags.boom = false; m.showRange('crate'); G.weapons.grenades = Math.max(G.weapons.grenades, 2); }, check: (m) => m.flags.boom },
    { type: 'custom', text: 'Final run: clear the 8 pop-up targets as fast as you can', radio: RM('Last drill. Eight targets, the clock is running. Go!'),
      start: (m) => { m.showRange('run'); m.runT0 = m.stats.time; m.runShots0 = m.stats.shots; for (const s of G.weapons.slots) s.mag = s.w.mag; },
      check: (m) => m.rangeLeft('run') === 0, done: (m) => { m.trainResult = { time: m.stats.time - m.runT0, shots: m.stats.shots - m.runShots0, targets: 8 }; } },
  ],
  alarm() {},
};

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
    unlocks: ['ARX-17 TACTICAL', 'M90 BREACHER', 'R-44 MAGNUM', 'THERMAL IMAGER [T]'],
    intro: [{ from: [-60, 62, 250], to: [-110, 44, 200], look: [-140, 22, 150], dur: 6, text: 'ZONE 02 — JUNGLE · 05:40' }, { from: [-118, 21, 176], to: [-128, 30, 168], look: [-140, 36, 150], dur: 5, text: 'OBJECTIVE: BLACK COBRA COMMS RELAY' }],
    setup() { const c = POI.comms;
      for (const [k, x, z] of [['guard', -28, 204], ['assault', -32, 200], ['guard', -24, 198]]) sp(k, x, z, { group: 'patrolA', patrol: [[x, z], [x - 44, z - 16], [x - 20, z + 22]] });
      for (const [k, x, z] of [['guard', 62, 192], ['guard', 66, 188], ['assault', 58, 186]]) sp(k, x, z, { group: 'patrolB', patrol: [[x, z], [x + 60, z - 24], [x + 20, z - 50]] });
      sp('sniper', -86, 214, { group: 'patrolA', yaw: 1.6 });
      const g = 'comms'; sp('guard', c.x + 18, c.z + 20, { group: g, yaw: 0.6 }); sp('guard', c.x - 4, c.z + 24, { group: g, yaw: 0.2 }); sp('guard', c.x + 22, c.z + 4, { group: g, yaw: 1.5 }); sp('assault', c.x + 6, c.z + 12, { group: g, patrol: [[c.x + 6, c.z + 12], [c.x + 20, c.z - 8], [c.x - 10, c.z - 12], [c.x - 18, c.z + 16]] });
      sp('assault', c.x - 10, c.z - 6, { group: g }); sp('sniper', c.x + 26, c.z + 26, { group: g, y: top(c.x + 26, c.z + 26), yaw: 0.8 }); sp('heavy', c.x + 4, c.z + 2, { group: g, yaw: 0.5 }); sp('guard', c.x - 12, c.z + 8, { group: g, y: G.world.heightAt(c.x - 12, c.z + 8) });
      buildGenOutpost(); sp('guard', GEN.x + 6, GEN.z + 5, { group: 'gen', yaw: 2.4 }); sp('assault', GEN.x - 5, GEN.z + 6, { group: 'gen', patrol: [[GEN.x - 5, GEN.z + 6], [GEN.x - 14, GEN.z - 10], [GEN.x + 8, GEN.z - 8]] }); },
    objectives: [
      { type: 'reach', x: -108, z: 186, r: 24, text: 'Infiltrate through the jungle to the comms relay', marker: () => ({ x: POI.comms.x, z: POI.comms.z }) },
      { type: 'any', text: 'Two tasks — any order', radio: 'NOMAD: The relay runs off a backup generator up on the north-west ridge. Cut it first and they cannot call in a full counter-attack — or hit the station now. Your call.', parts: [
        { type: 'kill', group: 'comms', text: 'Clear the comms relay', marker: () => ({ x: POI.comms.x, z: POI.comms.z }) },
        { type: 'interact', at: () => ({ x: GEN.x + 1.8, y: G.world.heightAt(GEN.x, GEN.z) + 1, z: GEN.z - 1.4 }), label: 'CUT BACKUP POWER', hold: 3, text: 'Cut the backup generator',
          done(M) { M.flags.powerCut = G.enemies.count('comms') > 0; G.hud.radio(M.flags.powerCut ? 'ATLAS: Backup power is down. When the relay goes, they will only get half a call out.' : 'ATLAS: Power is down — but the station already sent its distress call. Expect company.'); } } ] },
      { type: 'interact', at: () => ({ x: POI.comms.x + 2, y: G.world.heightAt(POI.comms.x, POI.comms.z) + 1, z: POI.comms.z + 1.5 }), label: 'PLANT C4 CHARGE', hold: 3, text: 'Plant C4 on the relay mast' },
      { type: 'custom', text: 'Get clear of the blast (30 m)', check: (M) => Math.hypot(G.player.pos.x - POI.comms.x, G.player.pos.z - POI.comms.z) > 30, done: (M) => M.detonateTower() },
      { type: 'kill', group: 'reinf', text: 'Repel the counter-attack', start(M) { const c = POI.comms, full = [['assault', c.x + 30, c.z - 60], ['assault', c.x + 20, c.z - 66], ['elite', c.x + 40, c.z - 62], ['guard', c.x - 10, c.z - 64], ['assault', c.x + 60, c.z - 40]];
        if (M && M.flags.powerCut) { G.hud.radio('ATLAS: Only one squad heard the call — they are coming for the relay!'); wave(full.slice(0, 3), 'reinf'); } else { G.hud.radio('ATLAS: Movement north! They are coming for the relay!'); wave(full, 'reinf'); } } } ],
    alarm() { G.hud.radio('REAPER: Patrols are converging on us!'); for (const e of E().list) if (e.alive && e.group.startsWith('patrol') && e.state < ST.SEARCH) { e.state = ST.SEARCH; e.stateT = 0; e.alerted = true; e.goal = G.player.pos.clone(); e.atGoal = false; } } },

  { code: 'MISSION 03', name: 'BLACK COBRA BASE', zone: 'ZONE 03 · MILITARY BASE', sky: 'storm', spawn: () => ({ x: 0, z: 46, yaw: 0 }),
    brief: ['09:10 — A thunderstorm is rolling over the island. Thunder masks gunfire; rain cuts their sight lines.', 'The base is walled, with snipers in the corner towers and an APC in the motor pool. Small arms barely scratch armour — use grenades [G] or explosive barrels.', 'Breach the south gate, eliminate HQ security and pull the facility access data from the HQ terminal.', 'When the alarm goes, get to the bunker elevator on the east side.'],
    unlocks: ['MG-48 LMG', 'SR-25 MARKSMAN', 'FB-21 BULLPUP'],
    intro: [{ from: [-30, 60, 90], to: [30, 48, 50], look: [0, 18, -80], dur: 6, text: 'ZONE 03 — BLACK COBRA BASE · 09:10' }, { from: [40, 24, -100], to: [20, 22, -112], look: [0, 18, -130], dur: 5, text: 'OBJECTIVE: HQ INTEL TERMINAL' }],
    setup() { const b = 'base', y = 16;
      sp('guard', -8, -8, { group: b, yaw: 3.1 }); sp('guard', 10, -10, { group: b, yaw: 3.1 }); sp('sniper', -112, -8, { group: b, y: top(-112, -8), yaw: 2.4 }); sp('sniper', 112, -8, { group: b, y: top(112, -8), yaw: -2.4 });
      sp('guard', -20, -42, { group: b, patrol: [[-20, -42], [22, -44], [22, -84], [-20, -80]] }); sp('assault', 44, -46, { group: b, yaw: -1.6 }); sp('assault', 46, -62, { group: b, patrol: [[46, -62], [46, -92], [80, -92]] }); sp('assault', 60, -40, { group: b, y, yaw: -1.5 });
      sp('guard', -50, -48, { group: b, yaw: 1.6 }); sp('heavy', -64, -46, { group: b, y, yaw: 1.6 }); sp('guard', -50, -96, { group: b, yaw: 0.5 }); sp('guard', -74, -150, { group: b, y, yaw: 1.5 });
      sp('apc', -14, -96, { group: 'armor', yaw: 0.3 });
      const h = 'hq'; sp('heavy', 0, -116, { group: h, yaw: 3.1 }); sp('elite', -7, -128, { group: h, y, yaw: 3 }); sp('elite', 9, -129, { group: h, y, yaw: 3.2 }); sp('guard', -9, -137, { group: h, y }); sp('guard', 18, -118, { group: h, yaw: 2.6 }); },
    objectives: [
      { type: 'reach', x: 0, z: -16, r: 13, text: 'Breach the south gate', marker: () => ({ x: 0, z: -2 }) },
      { type: 'any', text: 'Two tasks — any order', radio: 'REAPER: Two jobs before the terminal. Hit the motor pool first and their armour never leaves the shed — or go straight for HQ. Your call.', parts: [
        { type: 'kill', group: 'hq', text: 'Eliminate HQ security', marker: () => POI.hq },
        { type: 'interact', at: () => ({ x: POI.motor.x, y: G.world.heightAt(POI.motor.x, POI.motor.z) + 1, z: POI.motor.z }), label: 'SET CHARGE ON THE FUEL BOWSER', hold: 3, text: 'Sabotage the motor pool',
          done(M) { const p = POI.motor, y = G.world.heightAt(p.x, p.z); G.fx.explode(p.x, y + 1, p.z, 9, 'player', 0); setTimeout(() => G.fx.explode(p.x + 4, y + 1, p.z - 3, 7, 'player', 0), 300);
            for (const e of E().list) if (e.alive && e.type.vehicle && Math.hypot(e.pos.x - p.x, e.pos.z - p.z) < 70) E().kill(e, 'torso', 'player');
            M.flags.sabotage = true; G.hud.radio('NOMAD: Fuel went up — that APC is scrap. Nice.'); } } ] },
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
const lapMat = { base: new THREE.MeshStandardMaterial({ color: 0x2a2d30, roughness: 0.5, metalness: 0.4 }), screen: new THREE.MeshStandardMaterial({ color: 0x0a1a12, emissive: 0x38ff9a, emissiveIntensity: 1.6 }) };
/** Rugged laptop with a glowing screen and a soft ground ring so the player can spot it. */
function laptop() {
  const g = new THREE.Group(), base = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.03, 0.27), lapMat.base); base.position.y = 0.015; g.add(base);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.27, 0.014), lapMat.base); lid.position.set(0, 0.15, -0.135); lid.rotation.x = -0.32; g.add(lid);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.33, 0.22), lapMat.screen); scr.position.set(0, 0.15, -0.126); scr.rotation.x = -0.32; g.add(scr);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.55, 28), new THREE.MeshBasicMaterial({ color: 0x38ff9a, transparent: true, opacity: 0.5, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; g.add(ring);
  g.traverse((o) => { if (o.isMesh && o !== ring) o.castShadow = true; }); return g;
}

export class MissionSys {
  constructor() { this.idx = -1; this.def = null; this.interactables = []; this.stats = this.newStats(); this.flags = {}; this.objs = []; this.oi = 0; this.heli = null; }
  newStats() { return { kills: 0, headshots: 0, shots: 0, hits: 0, score: 0, time: 0, alarms: 0, deaths: 0 }; }
  /** Build the level state for mission i (enemies, sky, player, squad) without starting play. */
  load(i) {
    for (const c of this.trainProps || []) { c.alive = false; if (c.mesh) G.world.group.remove(c.mesh); } this.trainProps = []; this.trainGroups = {}; this.trainResult = null;
    const d = (this.def = i === 'training' ? TRAINING : MISSIONS[i]); this.idx = i; this.flags = {}; this.stats = this.newStats(); this.interactables.length = 0; this.oi = -1; this.objs = d.objectives; this.boss = null; this.heliLanded = false; this.camDetect = 0; this.waveT = 0; this.defT = 0; this.completeT = -1;
    if (this.heli) { G.scene.remove(this.heli); this.heli = null; G.audio.loop('heli', 0); }
    G.enemies.clear(); G.fx.reset(); G.sky.set(d.sky, true); this.restoreWorld();
    const s = d.spawn(), P = G.player; P.reset(); P.medkits = 2; P.place(s.x, s.z, s.yaw, s.y); this.checkpoint = { x: s.x, z: s.z, y: s.y, yaw: s.yaw, oi: 0 };
    G.weapons.equip(G.save.loadout); G.gear.reset(); G.squad.spawn(3); d.setup(this); if (d.noSquad) G.squad.clear();
    G.cine.placeBoat(i === 0); this.spawnIntel();
  }
  /** Intel laptops for this mission that the player has not collected yet (auto-pickup within 1.8 m). */
  spawnIntel() {
    for (const it of this.intelItems || []) G.scene.remove(it.mesh); this.intelItems = []; this.stats.intel = 0;
    const set = INTEL[this.idx]; if (!set) return; const got = (G.save.intel && G.save.intel[this.idx]) || [];
    set.at().forEach(([x, z, y], k) => { if (got.includes(k)) return; const gy = y !== undefined ? y : G.world.heightAt(x, z), mesh = laptop(); mesh.position.set(x, gy, z); mesh.rotation.y = k * 1.7; G.scene.add(mesh); this.intelItems.push({ k, x, y: gy, z, mesh }); });
  }
  updateIntel(dt) {
    const P = G.player; for (let i = this.intelItems.length - 1; i >= 0; i--) { const it = this.intelItems[i]; it.mesh.children[3].material.opacity = 0.35 + 0.25 * Math.sin(G.time * 4 + it.k);
      if (Math.hypot(P.pos.x - it.x, P.pos.z - it.z) < 1.8 && Math.abs(P.pos.y - it.y) < 2.5) { G.scene.remove(it.mesh); this.intelItems.splice(i, 1); const s = G.save; s.intel = s.intel || {}; const got = (s.intel[this.idx] = s.intel[this.idx] || []); if (!got.includes(it.k)) got.push(it.k); storeSave(s); this.stats.intel++;
        G.hud.toast(`INTEL ACQUIRED — ${INTEL[this.idx].docs[it.k][0]} (${got.length}/${INTEL[this.idx].docs.length})`); G.audio.play('ui:ok'); } }
  }
  showRange(k) { for (const c of this.trainGroups[k] || []) { c.alive = true; c.hp = c.maxHp; c.mesh.visible = true; } }
  rangeLeft(k) { return (this.trainGroups[k] || []).filter((c) => c.alive).length; }
  onExplosion(x, z) { if (this.def && this.def.training && Math.hypot(x - (RANGE.x + 8), z - (RANGE.z - 54)) < 9) this.flags.boom = true; }
  restoreWorld() { const t = POI.commsTower; if (t) { t.group.rotation.set(0, 0, 0); t.group.visible = true; t.col.alive = true; } for (const it of G.world.interactables) { it.done = false; it.cool = 0; } }
  begin() { this.advance(); G.hud.banner(this.def.code + ' — ' + this.def.name, this.def.zone); }
  get obj() { return this.objs[this.oi]; }
  advance() {
    const prev = this.obj; if (prev && prev.done) prev.done(this);
    if (this.completeT >= 0) return; this.oi++; this.interactables.length = 0;
    const o = this.obj; if (!o) { this.completeT = 2.2; return; }
    const P = G.player; if (this.oi > 0 && !this.def.training) { this.checkpoint = { x: P.pos.x, z: P.pos.z, y: P.pos.y, yaw: P.yaw, oi: this.oi }; G.hud.toast('CHECKPOINT REACHED'); G.audio.play('ui:ok'); }
    if (o.type === 'interact') { const a = o.at(); this.interactables.push({ x: a.x, y: a.y, z: a.z, r: o.r || 2.6, label: o.label, hold: o.hold, once: true, enabled: o.enabled, act: () => this.advance() }); }
    if (o.type === 'defend') this.defT = o.time;
    if (o.type === 'any') { this.parts = o.parts.map((p) => ({ ...p, ok: false })); this.parts.forEach((p, k) => { if (p.type === 'interact') { const a = p.at(); this.interactables.push({ x: a.x, y: a.y, z: a.z, r: p.r || 2.6, label: p.label, hold: p.hold, once: true, act: () => this.partDone(k) }); } }); }
    if (o.start) o.start(this); if (o.radio) G.hud.radio(o.radio);
    G.hud.objective(this.objText(), true);
  }
  /** One task of an any-order objective finished; the objective completes when every task is done. */
  partDone(k) { const p = this.parts && this.parts[k]; if (!p || p.ok) return; p.ok = true; if (p.done) p.done(this); G.audio.play('ui:ok');
    if (this.parts.every((q) => q.ok)) this.advance(); else { G.hud.toast('TASK COMPLETE — ' + p.text.toUpperCase()); G.hud.objective(this.objText(), true); } }
  objText() { const o = this.obj; if (!o) return 'Mission complete';
    if (o.type === 'any' && this.parts) return o.text + ': ' + this.parts.map((p) => (p.ok ? '✓ ' : '○ ') + (p.type === 'kill' && !p.ok ? `${p.text} (${G.enemies.count(p.group)})` : p.text)).join('   '); if (o.type === 'kill') return `${o.text} — ${G.enemies.count(o.group)} left`; if (o.type === 'defend') return `${o.text} — ${fmtTime(this.defT)}`; return o.text; }
  marker() { let o = this.obj; if (!o) return null;
    if (o.type === 'any' && this.parts) { const P = G.player.pos; let best = null, bd = 1e9; for (const p of this.parts) { if (p.ok) continue; const m = p.marker ? p.marker() : p.at ? p.at() : p; const d = Math.hypot(m.x - P.x, m.z - P.z); if (d < bd) { bd = d; best = m; } } return best; } if (o.marker) return o.marker(); if (o.at) return o.at(); if (o.x !== undefined) return o; if (o.type === 'kill') { let best = null, bd = 1e9; for (const e of G.enemies.list) if (e.alive && e.group === o.group) { const d = e.pos.distanceToSquared(G.player.pos); if (d < bd) { bd = d; best = e.pos; } } return best; } return null; }
  event(name, e) {
    if (name === 'alarm' && !this.flags.alarm) { this.flags.alarm = true; this.stats.alarms++; G.hud.toast('ENEMY CALLED FOR REINFORCEMENTS', true); this.def.alarm(this, e); }
    if (name === 'bossPhase2') { G.hud.radio('VIPER: All units — converge on the runway! Kill them all!'); G.audio.play('alarm', e.pos); wave([['elite', 60, -336], ['elite', 66, -340], ['assault', 54, -334], ['assault', 200, -270]], 'air', e.pos.x, e.pos.z); e.type = { ...e.type, speed: 5.2, spread: 2.1 }; }
  }
  update(dt) {
    if (this.completeT >= 0) { this.completeT -= dt; if (this.completeT < 0) { this.completeT = -1; this.finish(); } return; }
    if (this.intelItems && this.intelItems.length) this.updateIntel(dt);
    const o = this.obj, P = G.player; if (!o) return; this.stats.time += dt; if (this.def.tick) this.def.tick(this, dt);
    if (o.type === 'kill') { if (G.enemies.count(o.group) === 0) this.advance(); }
    else if (o.type === 'reach') { const a = o.at ? o.at() : o; if (Math.hypot(P.pos.x - a.x, P.pos.z - a.z) < o.r && (a.y === undefined || Math.abs(P.pos.y - a.y) < 6)) this.advance(); }
    else if (o.type === 'custom') { if (o.check(this)) this.advance(); }
    else if (o.type === 'any' && this.parts) { this.parts.forEach((p, k) => { if (p.ok) return; if ((p.type === 'kill' && G.enemies.count(p.group) === 0) || (p.type === 'reach' && Math.hypot(P.pos.x - p.x, P.pos.z - p.z) < p.r) || (p.type === 'custom' && p.check(this))) this.partDone(k); }); }
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
