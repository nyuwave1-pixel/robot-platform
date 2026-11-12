// Scripted dev/QA scenarios used by tests/shots.mjs
export async function play({ page, sim, shot }) {
  await page.evaluate(() => { SS.startMission(0, true); });
  await sim(0.5); await shot('p0');
  console.log(await page.evaluate(() => JSON.stringify({ n: SS.enemies.count(), flags: SS.mission.flags, states: SS.enemies.list.map((e) => e.kind + ':' + e.state + ':' + e.detect.toFixed(2) + ':' + e.pos.distanceTo(SS.player.pos).toFixed(0)) })));
  await page.evaluate(() => { SS.player.stance = 1; }); await sim(6);
  console.log(await page.evaluate(() => JSON.stringify({ n: SS.enemies.count(), flags: SS.mission.flags, hp: SS.player.health, states: SS.enemies.list.map((e) => e.kind + ':' + e.state + ':' + e.detect.toFixed(2) + ':' + e.pos.distanceTo(SS.player.pos).toFixed(0)) })));
  // aim at nearest enemy and fire
  await page.evaluate(() => { const P = SS.player; let b = null, bd = 1e9; for (const e of SS.enemies.list) { const d = e.pos.distanceTo(P.pos); if (e.alive && d < bd) { bd = d; b = e; } } window._t = b; P.pos.set(b.pos.x + 3, 0, b.pos.z + 14); P.pos.y = SS.world.groundAt(P.pos.x, P.pos.z, 99); P.stance = 0; P.updateCamera(0); const dx = b.pos.x - P.pos.x, dz = b.pos.z - P.pos.z, dy = b.pos.y + 1.2 - P.eye.y; P.yaw = Math.atan2(-dx, -dz); P.pitch = Math.atan2(dy, Math.hypot(dx, dz)); SS.gear.use('nvg'); });
  await sim(0.3); await shot('p1');
  await page.evaluate(() => { SS.input.btn[2] = true; }); await sim(0.5); await shot('p2');
  await page.evaluate(() => { SS.input.btn[0] = true; }); await sim(0.25); await shot('p3'); await sim(1.2);
  await page.evaluate(() => { SS.input.btn[0] = false; SS.input.btn[2] = false; SS.gear.use('nvg'); }); await sim(0.5); await shot('p4');
  console.log(await page.evaluate(() => JSON.stringify({ target: _t.alive, hp: _t.hp, stats: SS.mission.stats, mag: SS.weapons.slot.mag, playerHp: SS.player.health, combat: SS.enemies.inCombat })));
}
// helper injected into the page: aim-bot + movement used by automated play-throughs
export const HELPERS = () => {
  const SS = window.SS, T = SS.THREE;
  window.QA = {
    nearest(group) { let b = null, bd = 1e9; for (const e of SS.enemies.list) { if (!e.alive || (group && e.group !== group)) continue; const d = e.pos.distanceTo(SS.player.pos); if (d < bd) { bd = d; b = e; } } return b; },
    aim(e) { const P = SS.player; P.updateCamera(0); const h = e.type.vehicle ? 1.6 : (1.3 - e.crouch * 0.35) * (e.type.scale || 1), dx = e.pos.x - P.eye.x, dz = e.pos.z - P.eye.z, dy = e.pos.y + h - P.eye.y; P.yaw = Math.atan2(-dx, -dz); P.pitch = Math.atan2(dy, Math.hypot(dx, dz)) - P.recoilOff; P.updateCamera(0); },
    tp(x, z, y) { const P = SS.player; P.pos.set(x, y ?? SS.world.heightAt(x, z), z); P.vel.set(0, 0, 0); SS.squad.regroup(); },
    /** fight until `group` is dead (or timeout): aims at the nearest visible hostile and fires; throws grenades at vehicles */
    fight(group, maxSec = 60, dt = 1 / 30) { SS.skipRender = true; let t = 0; const I = SS.input; for (; t < maxSec && SS.enemies.count(group) > 0 && SS.state === 'playing'; t += dt) { const e = QA.nearest(group); if (e) { const P = SS.player, d = e.pos.distanceTo(P.pos); if (d > 55) { const k = (d - 30) / d; QA.tp(P.pos.x + (e.pos.x - P.pos.x) * k, P.pos.z + (e.pos.z - P.pos.z) * k, P.pos.y < -30 ? -60 : undefined); } QA.aim(e); const vis = SS.world.los(P.eye, new T.Vector3(e.pos.x, e.pos.y + 1.2, e.pos.z)); I.btn[2] = true; I.btn[0] = vis && Math.floor(t * 5) % 2 === 0; if (!vis && Math.floor(t * 30) % 60 === 0) { const a = Math.random() * 6.28, r = e.pos.y - SS.world.heightAt(e.pos.x, e.pos.z) > 3 ? 26 : 5 + Math.random() * 6; QA.tp(e.pos.x + Math.sin(a) * r, e.pos.z + Math.cos(a) * r, P.pos.y < -30 ? -60 : undefined); } if (e.type.vehicle && Math.floor(t * 30) % 45 === 0) { SS.weapons.grenades = 4; P.pitch += 0.12; SS.weapons.throwGrenade(); } if (SS.weapons.slot.reserve < 30) SS.weapons.resupply(); } SS.tick(dt); } I.btn[0] = I.btn[2] = false; SS.skipRender = false; return +t.toFixed(1); },
    run(sec, dt = 1 / 30) { SS.skipRender = true; for (let t = 0; t < sec; t += dt) SS.tick(dt); SS.skipRender = false; SS.tick(0.001); },
    key(code) { SS.input.hit.add(code); },
    info() { const m = SS.mission; return { state: SS.state, mission: m.def && m.def.code, oi: m.oi, obj: m.objText(), hp: Math.round(SS.player.health), enemies: SS.enemies.count(), stats: m.stats, pos: SS.player.pos.toArray().map((v) => +v.toFixed(1)) }; },
  };
};
export async function combat({ page, sim, shot }) {
  await page.evaluate(HELPERS); await page.evaluate(() => { SS.startMission(0, true); });
  await sim(0.5); await shot('k0');
  const t = await page.evaluate(() => QA.fight('beach', 120)); await sim(0.2); await shot('k1');
  console.log('fight time', t, await page.evaluate(() => JSON.stringify(QA.info())));
}
export async function dbg({ page, sim, shot }) {
  await page.evaluate(HELPERS); await page.evaluate(() => { SS.startMission(0, true); }); await sim(0.3);
  console.log(await page.evaluate(() => { const e = QA.nearest('beach'), P = SS.player, T = SS.THREE; QA.aim(e); P.updateCamera(0); const d = new T.Vector3(); SS.camera.getWorldDirection(d); const to = new T.Vector3(e.pos.x - P.eye.x, e.pos.y + 1.3 - P.eye.y, e.pos.z - P.eye.z); const dist = to.length(); to.normalize();
    const ht = SS.enemies.hitTest(P.eye, to, dist + 5), wr = SS.world.raycast(P.eye, to, dist + 5, { bullet: true, water: true });
    return JSON.stringify({ camDir: d.toArray().map((v) => +v.toFixed(3)), want: to.toArray().map((v) => +v.toFixed(3)), dist, ht: ht && { zone: ht.zone, t: ht.t }, wr: wr && { t: wr.t, surf: wr.surf, kind: wr.c && wr.c.kind, y: wr.y }, eye: P.eye.toArray(), epos: e.pos.toArray(), frozen: P.frozen, drone: SS.gear.droneActive, yaw: P.yaw, pitch: P.pitch }); }));
  console.log(await page.evaluate(() => { SS.skipRender = true; const e = QA.nearest('beach'); const out = []; for (let i = 0; i < 12; i++) { QA.aim(e); SS.input.btn[0] = true; SS.tick(1 / 30); out.push(SS.fx.bullets.map((b) => b.p.toArray().map((v) => +v.toFixed(1)).join(',') + ' d' + b.dist.toFixed(0)).join(' | ') + ' hits' + SS.mission.stats.hits + ' mag' + SS.weapons.slot.mag); } SS.input.btn[0] = false; return out.join('\n'); }));
}
export async function dbg2({ page, sim, shot }) {
  await page.evaluate(HELPERS); await page.evaluate(() => { SS.startMission(0, true); }); await sim(0.3);
  console.log(await page.evaluate(() => { SS.skipRender = true; const out = [], T = SS.THREE, P = SS.player; SS.input.btn[2] = true; for (let i = 0; i < 40; i++) { const e = QA.nearest('beach'); QA.aim(e); SS.input.btn[0] = true; const n0 = SS.fx.bullets.length; SS.tick(1 / 30);
    if (i % 3 === 0) { const d = new T.Vector3(); SS.camera.getWorldDirection(d); const to = new T.Vector3(e.pos.x - P.eye.x, e.pos.y + 1.3 - P.eye.y, e.pos.z - P.eye.z); const dist = to.length(); to.normalize(); out.push(`i${i} ads${SS.weapons.adsT.toFixed(2)} spread${SS.weapons.spreadDeg().toFixed(2)} angErr${(Math.acos(Math.min(1, d.dot(to))) * 57.3).toFixed(2)}deg dist${dist.toFixed(0)} grounded${P.grounded} recoilOff${P.recoilOff.toFixed(3)} hits${SS.mission.stats.hits} shots${SS.mission.stats.shots} estate${e.state} bullets${SS.fx.bullets.length}`); } } return out.join('\n'); }));
}
export async function dbg3({ page, sim, shot }) {
  await page.evaluate(HELPERS); await page.evaluate(() => { SS.startMission(0, true); }); await sim(0.3);
  console.log(await page.evaluate(() => { SS.skipRender = true; const out = [], P = SS.player; const orig = SS.enemies.hitTest.bind(SS.enemies); SS.enemies.hitTest = (o, d, max) => { const r = orig(o, d, max); const e = QA.nearest('beach'); out.push(`hitTest o=${o.toArray().map((v) => v.toFixed(1))} d=${d.toArray().map((v) => v.toFixed(3))} max=${max.toFixed(1)} -> ${r ? r.zone + '@' + r.t.toFixed(1) : null} | enemy ${e.pos.toArray().map((v) => v.toFixed(1))} alive=${e.alive} crouch=${e.crouch.toFixed(2)}`); return r; };
    SS.input.btn[2] = true; for (let i = 0; i < 14; i++) { const e = QA.nearest('beach'); QA.aim(e); SS.input.btn[0] = i > 8; SS.tick(1 / 30); } return out.slice(0, 6).join('\n'); }));
}
export async function m4({ page, sim, shot }) {
  await page.evaluate(HELPERS); await page.evaluate(() => { SS.save.progress = 5; SS.godMode = true; SS.startMission(3, true); const m = SS.mission; while (m.oi < 4) m.advance(); const s = SS.POI.server; QA.tp(s.x, s.z, -60); });
  for (let i = 0; i < 30; i++) { const t0 = Date.now(); const r = await Promise.race([page.evaluate(() => { const t = QA.fight(null, 1); return JSON.stringify({ t, n: SS.enemies.count(), def: SS.mission.defT.toFixed(1), st: SS.state, oi: SS.mission.oi, nades: SS.fx.nades.length, bullets: SS.fx.bullets.length }); }), new Promise((r) => setTimeout(() => r('HANG'), 20000))]); console.log(i, Date.now() - t0, 'ms', r); if (r === 'HANG') break; await page.evaluate(() => QA.run(1)); }
}
export async function prof({ page }) {
  await page.evaluate(HELPERS); await page.evaluate(() => { SS.save.progress = 5; SS.godMode = true; SS.startMission(3, true); const m = SS.mission; while (m.oi < 4) m.advance(); const s = SS.POI.server; QA.tp(s.x, s.z, -60);
    window.PROF = {}; const wrap = (obj, name, label) => { const f = obj[name].bind(obj); obj[name] = (...a) => { const t = performance.now(); const r = f(...a); const d = performance.now() - t; const p = PROF[label] || (PROF[label] = { max: 0, sum: 0, n: 0 }); p.max = Math.max(p.max, d); p.sum += d; p.n++; return r; }; };
    for (const k of ['player', 'weapons', 'gear', 'enemies', 'squad', 'fx', 'mission', 'cine', 'world', 'sky', 'hud']) wrap(SS[k], 'update', k);
    wrap(SS.world, 'raycast', 'raycast'); wrap(SS.world, 'near', 'near'); wrap(SS.world, 'moveCircle', 'moveCircle'); wrap(SS.fx, 'explode', 'explode'); wrap(SS.enemies, 'findCover', 'findCover'); wrap(SS.enemies, 'perceive', 'perceive'); wrap(SS.squad, 'regroup', 'regroup'); wrap(SS.audio, 'play', 'audio.play'); wrap(SS.hud, 'toast', 'toast'); wrap(SS.hud, 'radio', 'radio'); });
  for (let i = 0; i < 14; i++) { const r = await Promise.race([page.evaluate(() => { QA.fight(null, 2); return 1; }), new Promise((r) => setTimeout(() => r('HANG'), 25000))]); if (r === 'HANG') { console.log('HANG at chunk', i); break; } }
  const cdp = await page.context().newCDPSession(page); // PROF is readable even while the page is busy? no — so read what we can
  console.log(await Promise.race([page.evaluate(() => Object.entries(PROF).filter(([, p]) => p.max > 30).map(([k, p]) => `${k}: max ${p.max.toFixed(0)} ms, total ${p.sum.toFixed(0)} ms, calls ${p.n}`).join('\n') || 'nothing over 30 ms'), new Promise((r) => setTimeout(() => r('page still busy'), 60000))]));
}
export async function look({ page, sim, shot }) {
  await page.evaluate(HELPERS);
  await page.evaluate(() => { SS.startMission(0, true); SS.noTarget = true; SS.godMode = true; }); await sim(0.4);
  await page.evaluate(() => { const m = SS.squad.list[0], P = SS.player; QA.tp(m.pos.x + 1.2, m.pos.z + 2.6); const dx = m.pos.x - P.pos.x, dz = m.pos.z - P.pos.z; P.yaw = Math.atan2(-dx, -dz); P.pitch = -0.08; }); await sim(0.3); await shot('L1-squad');
  await page.evaluate(() => { SS.startMission(2, true); SS.noTarget = true; QA.tp(-22, -92); SS.player.yaw = -1.2; }); await sim(1.0); await shot('L2-base');
  await page.evaluate(() => { const e = SS.enemies.list.find((e) => e.type.vehicle), P = SS.player; QA.tp(e.pos.x + 7, e.pos.z + 9); const dx = e.pos.x - P.pos.x, dz = e.pos.z - P.pos.z; P.yaw = Math.atan2(-dx, -dz); P.pitch = 0.02; }); await sim(0.5); await shot('L3-apc');
  await page.evaluate(() => { SS.startMission(4, true); SS.noTarget = true; QA.tp(150, -270); SS.player.yaw = -1.2; SS.input.btn[2] = false; }); await sim(1.0); await shot('L4-air');
  await page.evaluate(() => SS.toMenu()); await sim(1.5); await shot('L5-menu');
}
export async function video({ page }) {
  const st = () => page.evaluate(() => SS.state + '|' + getComputedStyle(document.getElementById('introVideo')).display);
  await page.evaluate(() => SS.startMission(0)); await page.waitForTimeout(1800); console.log('m1 with file   :', await st());
  await page.waitForTimeout(4000); console.log('after it ends  :', await st());
  await page.evaluate(() => { SS.toMenu(); SS.startMission(1); }); await page.waitForTimeout(2500); console.log('m2 without file:', await st());
}
export async function tune({ page, sim, shot }) {
  await page.evaluate(HELPERS); await page.evaluate(() => SS.startMission(0, true)); await sim(0.3);
  await page.keyboard.press('F2'); const open = await page.evaluate(() => document.getElementById('tune').classList.contains('on'));
  const before = await page.evaluate(() => SS.weapons.slot.w.rpm);
  await page.evaluate(() => { const i = document.querySelector('#tune input[data-k="rpm"]'); i.value = 300; i.dispatchEvent(new Event('input', { bubbles: true })); const g = document.querySelector('#tune input[data-k="moveSpeed"]'); g.value = 1.5; g.dispatchEvent(new Event('input', { bubbles: true })); });
  console.log(JSON.stringify({ open, before, after: await page.evaluate(() => SS.weapons.slot.w.rpm), sum: await page.textContent('#tuneSum'), state: await page.evaluate(() => SS.state) })); await shot('T-tune');
  await page.evaluate(() => { SS.weapons.slot.w.rpm = 800; });
}
export async function structs({ page, sim, shot }) {
  await page.evaluate(HELPERS);
  const view = async (mi, x, z, yaw, pitch, name) => { await page.evaluate(([mi, x, z, yaw, pitch]) => { if (SS.mission.idx !== mi || SS.state !== 'playing') { SS.startMission(mi, true); SS.noTarget = true; SS.godMode = true; } QA.tp(x, z); SS.player.yaw = yaw; SS.player.pitch = pitch; }, [mi, x, z, yaw, pitch]); await sim(0.6); await shot(name); };
  await view(2, -45, -108, 2.2, 0.05, 'S1-trucks');      // motor pool trucks + containers
  await view(2, 20, -105, 0.15, 0.1, 'S2-hq');           // HQ building walls / roof
  await view(2, -95, -22, 2.5, 0.35, 'S3-tower');        // corner watchtower
  await view(1, -112, 178, 2.45, 0.5, 'S4-comms');       // comms mast
  console.log(await page.evaluate(() => JSON.stringify({ assets: SS.assets.count, draws: SS.stats.calls, tris: SS.stats.tris })));
}
export async function structs2({ page, sim, shot }) {
  await page.evaluate(HELPERS);
  const view = async (mi, x, z, yaw, pitch, name, y) => { await page.evaluate(([mi, x, z, yaw, pitch, y]) => { if (SS.mission.idx !== mi || SS.state !== 'playing') { SS.startMission(mi, true); SS.noTarget = true; SS.godMode = true; } QA.tp(x, z, y); SS.player.yaw = yaw; SS.player.pitch = pitch; }, [mi, x, z, yaw, pitch, y ?? null]); await sim(0.6); await shot(name); };
  await view(4, 60, -372, 0.0, 0.18, 'U1-port');                          // ship + crane from the quay
  await page.evaluate(() => { const L = SS.POI.facL; SS.startMission(3, true); SS.noTarget = true; SS.godMode = true; const [x, z] = L(-1, -93); QA.tp(x, z, -60); SS.player.yaw = 0.25; SS.player.pitch = 0.02; }); await sim(0.6); await shot('U2-servers');
  await page.evaluate(() => { const L = SS.POI.facL; const [x, z] = L(-2, -49); QA.tp(x, z, -60); SS.player.yaw = 0.5; SS.player.pitch = -0.05; }); await sim(0.6); await shot('U3-lab');
  await view(0, -20, 334, -0.4, 0.0, 'U4-beach');
}

// v0.6: structure models (pier, tower cab, fence, cliff, flagpole, window frames, blast door) and the detailed soldier kit
export async function structs3({ page, sim, shot }) {
  await page.evaluate(HELPERS);
  const view = async (mi, x, z, tx, tz, pitch, name, y) => { await page.evaluate(([mi, x, z, tx, tz, pitch, y]) => { if (SS.mission.idx !== mi || SS.state !== 'playing') { SS.startMission(mi, true); SS.noTarget = true; SS.godMode = true; } QA.tp(x, z, y); SS.player.yaw = Math.atan2(-(tx - x), -(tz - z)); SS.player.pitch = pitch; }, [mi, x, z, tx, tz, pitch, y ?? null]); await sim(0.6); await shot(name); };
  await view(4, 18, -412, 50, -436, -0.02, 'V1-pier');
  await view(4, 120, -238, 120, -262, 0.38, 'V2-tower');
  await view(4, 4, -204, 12, -214, 0.0, 'V3-fence');
  await view(4, 5, -50, 0, -60, 0.35, 'V6-flag');
  await view(4, -4, -112, -8, -123, 0.0, 'V5-windows');
  const wf = await page.evaluate(() => [SS.POI.waterfall.x, SS.POI.waterfall.z]);
  await view(4, wf[0] + 4, wf[1] + 16, wf[0], wf[1] - 8, 0.25, 'V4-cliff');
  // squad mate close-up, front and back
  for (const [name, back] of [['V8-soldier', 0], ['V9-soldier-back', 1]]) {
    await page.evaluate((back) => { const P = SS.player, m = SS.squad.list[0], fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw); m.pos.set(P.pos.x + fx * 2.1, P.pos.y, P.pos.z + fz * 2.1); m.yaw = back ? P.yaw : P.yaw + Math.PI; m.model.position.copy(m.pos); m.model.rotation.y = m.yaw; P.pitch = -0.08; SS.weapons && SS.weapons.fx && 0; }, back);
    await shot(name);
  }
  const d = await page.evaluate(() => { SS.startMission(3, true); SS.noTarget = true; SS.godMode = true; const L = SS.POI.facL, [x, z] = L(1.5, -38), [tx, tz] = L(0, -46); QA.tp(x, z, -60); SS.player.yaw = Math.atan2(-(tx - x), -(tz - z)); SS.player.pitch = 0; return [x, z]; });
  await sim(0.6); await shot('V7-door');
}

// daylight close-ups of a squad mate and an enemy (uniform / kit check)
export async function kit({ page, sim, shot }) {
  await page.evaluate(HELPERS);
  const day = await page.evaluate(() => { SS.startMission(0, true); SS.noTarget = true; SS.godMode = true; const k = Object.keys(SS.sky.constructor.PRESETS || {}); return k; });
  await page.evaluate(() => { const names = ['day', 'noon', 'clear', 'dawn', 'overcast']; for (const n of names) { try { SS.sky.set(n, true); if (SS.sky.target) break; } catch (e) {} } SS.sky.refreshEnv && SS.sky.refreshEnv(); QA.tp(-20, 318); SS.player.yaw = 0; });
  await sim(0.4);
  for (const [name, back, dist] of [['K1-front', 0, 2.0], ['K2-back', 1, 2.0], ['K3-close', 0, 1.2]]) {
    await page.evaluate(([back, dist]) => { const P = SS.player, m = SS.squad.list[0], fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw); m.pos.set(P.pos.x + fx * dist, P.pos.y, P.pos.z + fz * dist); m.yaw = back ? P.yaw : P.yaw + Math.PI; m.model.position.copy(m.pos); m.model.rotation.y = m.yaw; P.pitch = dist < 1.5 ? 0.12 : -0.1; }, [back, dist]);
    await shot(name);
  }
  console.log('presets', day, await page.evaluate(() => SS.sky.presetName));
}

// v0.7: every soldier type side by side (character kits), plus near/far triangle counts for the LOD
export async function types({ page, sim, shot }) {
  await page.evaluate(HELPERS);
  await page.evaluate(() => { SS.startMission(0, true); SS.noTarget = true; SS.godMode = true; SS.sky.set('dawn', true); SS.sky.refreshEnv && SS.sky.refreshEnv(); QA.tp(-20, 318); SS.player.yaw = 0; SS.player.pitch = -0.1; for (const m of SS.squad.list) m.model.visible = false; });
  await sim(0.4);
  const place = (kinds, dist, gap) => page.evaluate(([kinds, dist, gap]) => { const P = SS.player; for (const e of (window.__e || [])) { SS.scene.remove(e.model); e.model.visible = false; const i = SS.enemies.list.indexOf(e); if (i >= 0) SS.enemies.list.splice(i, 1); } window.__e = kinds.map((k, i) => { const x = P.pos.x + (i - (kinds.length - 1) / 2) * gap, z = P.pos.z - dist; const e = SS.enemies.spawn(k, x, z, { yaw: 0 }); e.model.rotation.set(0, 0, 0); return e; }); for (const m of SS.squad.list) m.model.visible = false; }, [kinds, dist, gap]);
  await place(['guard', 'assault', 'sniper'], 2.6, 1.15); await shot('T1-guard-assault-sniper');
  await place(['heavy', 'elite', 'boss'], 2.9, 1.3); await shot('T2-heavy-elite-boss');
  await place(['guard', 'assault', 'sniper', 'heavy', 'elite', 'boss'], 2.6, 1.1);
  await page.evaluate(() => { for (const e of window.__e) e.model.rotation.y = Math.PI; SS.player.pitch = -0.1; }); await shot('T3-backs');
  console.log('tris,draws near | tris,draws far', await page.evaluate(() => { const out = {}; const tris = (g) => { let n = 0; g.traverse((o) => { let v = true; for (let p = o; p && p !== g.parent; p = p.parent) if (!p.visible) v = false; if (o.isMesh && v) n += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; }); return Math.round(n); };
    for (const e of [...window.__e, { kind: 'squad', model: SS.squad.list[0].model }]) { const l = e.model.userData.lod, vis = e.model.visible, set = (n) => { for (const o of l.full) o.visible = n; for (const o of l.detail) o.visible = n; for (const o of l.base) o.visible = !n; }, draws = () => { let n = 0; e.model.traverse((o) => { let v = true; for (let p = o; p && p !== e.model.parent; p = p.parent) if (!p.visible) v = false; if (o.isMesh && v) n++; }); return n; }; e.model.visible = true; set(true); const near = [tris(e.model), draws()]; set(false); out[e.kind] = [...near, tris(e.model), draws()]; set(true); e.model.visible = vis; } return JSON.stringify(out); }));
}

// mission 05 pre-rendered intro: plays (which file), then hands over to gameplay; mission 02 still uses the real-time cinematic
export async function video5({ page, shot }) {
  const st = () => page.evaluate(() => { const v = document.getElementById('introVideo'); return SS.state + '|' + getComputedStyle(v).display + '|' + (v.currentSrc || '').split('/').pop() + '|t=' + v.currentTime.toFixed(1); });
  await page.evaluate(() => SS.startMission(4)); await page.waitForTimeout(3000); console.log('m5 after 3 s :', await st()); await shot('X-video5');
  await page.waitForTimeout(6000); console.log('m5 after 9 s :', await st());
  await page.evaluate(() => { SS.toMenu(); SS.startMission(1); }); await page.waitForTimeout(2500); console.log('m2 (no file) :', await st());
}
