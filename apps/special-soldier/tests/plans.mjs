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
