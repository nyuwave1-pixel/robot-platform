// SPECIAL SOLDIER — entry point: boot, game-state machine and the frame loop.
import * as THREE from 'three';
import { G } from './core/ctx.js';
import { loadSave, storeSave } from './core/save.js';
import { Input } from './core/input.js';
import { AudioSys } from './core/audio.js';
import { World, initMaterials } from './world/world.js';
import { buildIsland, POI } from './world/build.js';
import { Sky, Post } from './world/sky.js';
import { FX } from './game/fx.js';
import { Player } from './game/player.js';
import { Weapons } from './game/weapons.js';
import { Enemies } from './game/enemies.js';
import { Squad } from './game/squad.js';
import { Gear } from './game/gear.js';
import { MissionSys, MISSIONS } from './game/missions.js';
import { Cine } from './game/cinematics.js';
import { Hud } from './ui/hud.js';
import { Menu } from './ui/menu.js';
import { clamp } from './core/util.js';
import { loadAssets, ASSETS } from './game/assets.js';
import { TunePanel } from './ui/tune.js';
import { makeSoldier, makeAPC, makeHeli, PALETTE, HOT } from './game/models.js';

const canvas = document.getElementById('game'), $ = (id) => document.getElementById(id);
const step = (pct, text) => new Promise((r) => { $('loadBar').style.width = pct + '%'; $('loadText').textContent = text; setTimeout(r, 30); });

G.pixelRatio = () => { const d = Math.min(devicePixelRatio || 1, 2), q = G.settings.quality; return (q === 'low' ? 0.75 : q === 'medium' ? 1 : q === 'high' ? Math.min(d, 1.5) : d) * G.settings.scale; };
G.applySettings = () => {
  const s = G.settings, r = G.renderer, pr = G.pixelRatio(); r.setPixelRatio(pr); r.setSize(innerWidth, innerHeight, false); G.post.resize(innerWidth, innerHeight, pr);
  r.shadowMap.enabled = s.shadows && s.quality !== 'low'; const ms = s.quality === 'ultra' ? 4096 : s.quality === 'high' ? 2048 : 1024; if (G.sky.sun.shadow.mapSize.x !== ms) { G.sky.sun.shadow.mapSize.set(ms, ms); if (G.sky.sun.shadow.map) { G.sky.sun.shadow.map.dispose(); G.sky.sun.shadow.map = null; } }
  G.sky.sun.castShadow = r.shadowMap.enabled; G.camera.aspect = innerWidth / innerHeight; G.camera.far = s.quality === 'low' ? 1500 : 3200; if (G.state !== 'playing') G.camera.fov = s.fov; G.camera.updateProjectionMatrix(); G.audio.setVolume();
  if (G._shadowState !== undefined && G._shadowState !== r.shadowMap.enabled) G.scene.traverse((o) => { if (o.material && o.isMesh) o.material.needsUpdate = true; }); // shadow toggle needs new shader variants; nothing else does
  G._shadowState = r.shadowMap.enabled;
  const tm = G.world && G.world.terrain && G.world.terrain.material; // low quality: terrain reads 4 textures instead of 8
  if (tm && tm.defines) { const far = s.quality !== 'low'; if ((tm.defines.SPLAT_FAR !== undefined) !== far) { if (far) tm.defines.SPLAT_FAR = 1; else delete tm.defines.SPLAT_FAR; tm.needsUpdate = true; } }
};

async function boot() {
  G.test = new URLSearchParams(location.search).has('test');
  G.save = loadSave(); G.settings = G.save.settings; if (G.test) G.settings.quality = new URLSearchParams(location.search).get('q') || 'low';
  await step(8, 'RENDERER');
  const r = (G.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })); r.info.autoReset = false; r.shadowMap.type = THREE.PCFSoftShadowMap; r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace;
  G.scene = new THREE.Scene(); G.camera = new THREE.PerspectiveCamera(G.settings.fov, innerWidth / innerHeight, 0.06, 3200); G.scene.add(G.camera);
  G.input = new Input(canvas); G.audio = new AudioSys();
  await step(14, 'BLENDER ASSETS'); await loadAssets();
  await step(20, 'TERRAIN — 1.2 KM ISLAND HEIGHTFIELD'); initMaterials(); G.world = new World();
  await step(40, 'SKY · OCEAN · WEATHER'); G.sky = new Sky(); G.post = new Post(); G.fx = new FX();
  await step(55, 'ZONES 01–05 — STRUCTURES & VEGETATION'); buildIsland();
  await step(75, 'OPERATORS · WEAPONS · AI'); G.player = new Player(); G.weapons = new Weapons(); G.enemies = new Enemies(); G.squad = new Squad(); G.gear = new Gear(); G.mission = new MissionSys(); G.cine = new Cine();
  await step(90, 'INTERFACE'); G.hud = new Hud(); G.hud.buildMap(); G.menu = new Menu(); G.weapons.equip(G.save.loadout); G.weapons.root.visible = false;
  G.tune = new TunePanel();
  G.applySettings(); addEventListener('resize', G.applySettings);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && G.state === 'playing' && !G.test) G.pause(); }); // hidden tab: pause instead of running a huge catch-up frame
  // shader warm-up: put one of every late-spawned material in view so first use never hitches mid-combat
  { const warm = new THREE.Group(); for (const k of Object.keys(PALETTE)) warm.add(makeSoldier(k)); warm.add(makeAPC(), makeHeli(), new THREE.Mesh(G.fx.nadeGeo, G.fx.nadeMat), new THREE.Mesh(G.fx.nadeGeo, HOT), new THREE.Mesh(G.fx.nadeGeo, new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 1 })));
    G.scene.add(warm); G.weapons.root.visible = true; r.compile(G.scene, G.camera); G.scene.remove(warm); G.weapons.root.visible = false; }
  await step(100, 'READY'); $('loading').style.display = 'none';
  G.toMenu(); last = performance.now(); requestAnimationFrame(frame);
}

// ---------------- state transitions ----------------
G.toMenu = () => { G.state = 'menu'; G.hud.show(false); G.hud.cinematic(false); G.cine.active = false; G.enemies.clear(); G.squad.clear(); G.fx.reset(); G.gear.reset(); G.input.unlock(); G.audio.hush(); if (G.audio.enabled) { G.audio.stopLoops(); } G.weapons.root.visible = false; G.post.fadeTarget = 0; if (G.mission.heli) { G.scene.remove(G.mission.heli); G.mission.heli = null; } G.cine.menuScene(); G.menu.main(); $('lockHint').style.display = 'none'; };
G.startMission = (i, skipIntro = false) => {
  G.audio.init(); G.audio.hush(); G.audio.stopLoops(); G.menu.hide(); G.hud.show(true); G.mission.load(i); const d = MISSIONS[i]; G.player.frozen = false;
  const go = () => { G.state = 'playing'; G.mission.begin(); if (!G.test) G.input.lock(); if (i === 0) G.hud.radio('REAPER: Feet wet. Move up the beach — quiet.'); G.player.updateCamera(0); };
  if (skipIntro) return go();
  const realtime = () => { if (d.intro === 'boat') G.cine.playBoatIntro(go); else G.cine.play(d.intro, go, { showSquad: true }); };
  playIntroVideo(i, go, realtime);
};
G.pause = () => { if (G.state !== 'playing') return; G.state = 'paused'; G.input.unlock(); G.audio.hush(); G.menu.pause(); };
G.resume = () => { if (G.state !== 'paused') return; G.menu.hide(); G.state = 'playing'; if (!G.test) G.input.lock(); };
G.respawn = () => { G.menu.hide(); G.mission.respawn(); G.state = 'playing'; if (!G.test) G.input.lock(); };
G.onPlayerDeath = (kind) => { G.state = 'dead'; deadT = 1.8; deathKind = kind; G.hud.toast('OPERATOR DOWN', true); if (G.gear.droneActive) G.gear.toggleDrone(); };
G.onMissionComplete = () => {
  const m = G.mission, st = m.stats, s = G.save, i = m.idx, acc = st.shots ? Math.round((st.hits / st.shots) * 100) : 0;
  let pts = 0; pts += acc >= 45 ? 2 : acc >= 25 ? 1 : 0; pts += st.alarms === 0 ? 2 : st.alarms === 1 ? 1 : 0; pts += st.deaths === 0 ? 2 : st.deaths === 1 ? 1 : 0; pts += st.headshots >= st.kills * 0.3 ? 1 : 0;
  const grade = pts >= 7 ? 'S' : pts >= 5 ? 'A' : pts >= 3 ? 'B' : 'C', first = s.progress <= i;
  const res = { code: m.def.code, name: m.def.name, grade, time: st.time, kills: st.kills, headshots: st.headshots, acc, hits: st.hits, shots: st.shots, alarms: st.alarms, deaths: st.deaths, score: Math.round(st.score), unlocks: first ? m.def.unlocks : [], last: i === MISSIONS.length - 1 };
  s.progress = Math.max(s.progress, i + 1); const old = s.best[i]; if (!old || 'CBAS'.indexOf(grade) >= 'CBAS'.indexOf(old.grade)) s.best[i] = { grade, time: Math.round(st.time), kills: st.kills, acc, alarms: st.alarms };
  s.stats.kills += st.kills; s.stats.headshots += st.headshots; s.stats.shots += st.shots; s.stats.hits += st.hits; s.stats.deaths += st.deaths; s.stats.time += st.time; storeSave(s);
  G.state = 'result'; G.lastResult = res; G.input.unlock(); G.audio.hush(); G.audio.stopLoops(); G.hud.show(false); G.player.frozen = false; G.menu.result(res);
};

// Optional pre-rendered intro (e.g. made in Google Flow / Veo): drop video/m1-intro.mp4 … m5-intro.mp4 (or .webm)
// into public/ and it replaces that mission's real-time cinematic. No file → the real-time cinematic plays.
function playIntroVideo(i, done, fallback) {
  const v = $('introVideo'), tries = [`./video/m${i + 1}-intro.mp4`, `./video/m${i + 1}-intro.webm`]; let k = 0, settled = false, started = false, timer = 0; G.state = 'video'; G.hud.show(false); G.post.fade = G.post.fadeTarget = 1; // black while probing for a file
  const wrapDone = done, wrapFb = fallback; done = () => { G.hud.show(true); G.post.fadeTarget = 0; wrapDone(); }; fallback = () => { G.hud.show(true); wrapFb(); };
  const cleanup = () => { clearTimeout(timer); v.oncanplay = v.onerror = v.onended = null; removeEventListener('keydown', skip); v.onclick = null; v.pause(); v.removeAttribute('src'); v.load(); v.style.display = 'none'; };
  const finish = (fn) => { if (settled) return; settled = true; cleanup(); fn(); };
  const skip = (e) => { if (!e.code || e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape') finish(done); };
  const next = () => { if (k >= tries.length) return finish(fallback); v.src = tries[k++]; v.load(); clearTimeout(timer); timer = setTimeout(next, 700); };
  v.onerror = next;
  v.oncanplay = () => { clearTimeout(timer); if (settled || started) return; started = true; v.style.display = 'block'; v.volume = G.settings.volume; v.play().catch(() => finish(fallback)); addEventListener('keydown', skip); v.onclick = skip; };
  v.onended = () => finish(done);
  next();
}

// ---------------- frame loop ----------------
let last = 0, deadT = 0, deathKind = '', ambT = 0, acc = 0;
function ambient(dt) {
  if ((ambT -= dt) > 0 || !G.audio.enabled) return; ambT = 0.3; const A = G.audio, c = G.camera.position, under = c.y < -30, shore = under ? 0 : clamp(1.15 - Math.abs(Math.hypot(c.x, c.z) - 390) / 160, 0.05, 1);
  A.loop('ocean', shore * 0.4); A.loop('rain', G.sky.rainAmt * 0.3); A.loop('wind', under ? 0 : 0.05 + G.sky.wind * 0.07); A.loop('hum', under ? 0.16 : 0);
  const jungle = !under && G.world.heightAt(c.x, c.z) > 3 && c.z > 20 ? 1 : 0; A.loop('jungle', jungle * 0.05 * (1 - G.sky.rainAmt * 0.6));
}
function frame(now) {
  requestAnimationFrame(frame);
  const cap = G.settings.fpsCap; if (cap > 0) { acc += now - last; if (acc < 1000 / cap - 0.5) { last = now; return; } }
  const raw = cap > 0 ? acc / 1000 : (now - last) / 1000; acc = 0; last = now; tick(clamp(raw, 0.001, 0.05));
}
function tick(dt) {
  const st = G.state; G.dt = dt; G.frame++;
  if (st !== 'paused' && st !== 'result') G.time += dt;
  if (st === 'menu') { G.cine.updateMenu(dt); G.cine.update(dt); G.world.update(dt); G.sky.update(dt); G.fx.update(dt); }
  else if (st === 'cinematic') { G.cine.update(dt); G.world.update(dt); if (G.cine.showSquad) G.squad.update(dt); G.sky.update(dt); G.fx.update(dt); ambient(dt); }
  else if (st === 'playing' || st === 'dead') {
    G.player.update(dt); G.weapons.update(dt); G.gear.update(dt); G.enemies.update(dt); G.squad.update(dt); G.fx.update(dt); if (st === 'playing') G.mission.update(dt);
    G.cine.update(dt); G.world.update(dt); G.sky.update(dt); if (G.state === 'playing' || G.state === 'dead') G.hud.update(dt); ambient(dt);
    if (st === 'dead' && (deadT -= dt) <= 0 && G.state === 'dead') { G.state = 'deadMenu'; G.input.unlock(); G.menu.death(deathKind); }
    if (G.test && G.input.pressed('Escape')) G.pause(); G.tune.update();
    $('lockHint').style.display = !G.input.locked && !G.test && G.state === 'playing' ? 'block' : 'none';
  }
  G.audio.listener(G.camera);
  if (!G.skipRender) { G.stats = { calls: G.renderer.info.render.calls, tris: G.renderer.info.render.triangles }; G.renderer.info.reset(); G.post.render(dt); } G.input.endFrame();
}
G.tick = tick; G.POI = POI; G.THREE = THREE; G.assets = ASSETS;
window.SS = G;
boot().catch((e) => { console.error(e); $('loadText').textContent = 'BOOT FAILED: ' + e.message; });
