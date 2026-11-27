// Two real browsers in one multiplayer room: join → start → A shoots B → kill + score → B respawns → host leaves.
//   node tests/mp.mjs            (dedicated server: starts server/mp-server.mjs on a local port)
//   MP=supabase node tests/mp.mjs (Supabase Realtime, host runs in browser A; needs internet)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { preview } from 'vite';
const { chromium } = createRequire(import.meta.url)('playwright');
const OUT = process.env.OUT || 'tests/out', KIND = process.env.MP || 'ws', WSPORT = 8799, room = 'T' + Math.random().toString(36).slice(2, 7).toUpperCase();
const results = []; const check = (name, ok, info = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let srv = null;
if (KIND === 'ws') { srv = spawn(process.execPath, ['server/mp-server.mjs'], { env: { ...process.env, PORT: String(WSPORT) }, stdio: ['ignore', 'pipe', 'inherit'] }); await new Promise((r) => srv.stdout.once('data', r)); }
const server = await preview({ preview: { port: 5191, strictPort: true }, logLevel: 'silent' });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errs = [];
async function open(name) {
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } }), page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(name + ': ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(name + ': ' + m.text().slice(0, 200)); });
  const q = `?test&q=low&mp=${room}&name=${name}` + (KIND === 'ws' ? `&server=${encodeURIComponent('ws://localhost:' + WSPORT)}` : '');
  await page.goto('http://localhost:5191/' + q); await page.waitForFunction(() => window.SS && SS.mp && SS.mp.connected, null, { timeout: 120000 });
  await page.evaluate(() => { SS.skipRender = true; }); return page;
}
const A = await open('ALPHA'); check('A connected to room ' + room, true, KIND);
const B = await open('BRAVO'); check('B connected', true);
await A.waitForFunction(() => SS.mp.roster && SS.mp.roster.players.length === 2, null, { timeout: 20000 }).catch(() => {});
const ros = await A.evaluate(() => SS.mp.roster && SS.mp.roster.players.map((p) => p.n + ':' + p.tm).join(' '));
check('both players in the roster, on opposite teams', !!ros && ros.includes('ALPHA') && ros.includes('BRAVO') && ros.includes('blue') && ros.includes('red'), ros);
check('A is the room leader', await A.evaluate(() => SS.mp.isLeader()));
await A.evaluate(() => SS.mp.start());
await Promise.all([A, B].map((p) => p.waitForFunction(() => SS.mp.active && SS.player.alive, null, { timeout: 20000 }).catch(() => {})));
check('match started, both spawned', (await A.evaluate(() => SS.mp.active && SS.player.alive)) && (await B.evaluate(() => SS.mp.active && SS.player.alive)));
// put B 16 m in front of A on open ground, wait out spawn protection
const a0 = await A.evaluate(() => [SS.player.pos.x, SS.player.pos.z]);
await B.evaluate(([x, z]) => { SS.player.place(x, z - 16, 0); }, a0); await sleep(2600);
await A.waitForFunction(() => [...SS.mp.remotes.values()].some((r) => r.buf.length > 3), null, { timeout: 10000 }).catch(() => {});
const seen = await A.evaluate(() => { const r = [...SS.mp.remotes.values()][0]; return r ? [r.name, +r.pos.x.toFixed(1), +r.pos.z.toFixed(1)] : null; });
check('A sees B moving into position (interpolated)', !!seen && Math.abs(seen[2] - (a0[1] - 16)) < 3, JSON.stringify(seen));
await A.evaluate(() => { SS.skipRender = false; }); await sleep(700); await A.screenshot({ path: `${OUT}/mp-${KIND}-aim.png` }); await A.evaluate(() => { SS.skipRender = true; });
// A aims at B's chest and holds the trigger (ADS), re-aiming between bursts as recoil climbs
let killed = false;
for (let i = 0; i < 60 && !killed; i++) {
  await A.evaluate(() => {
    const r = [...SS.mp.remotes.values()][0], P = SS.player; if (!r) return;
    const dx = r.pos.x - P.eye.x, dz = r.pos.z - P.eye.z, dy = r.pos.y + 1.25 - P.eye.y; P.yaw = Math.atan2(-dx, -dz); P.pitch = Math.atan2(dy, Math.hypot(dx, dz)); P.recoilOff = 0;
    SS.input.btn[0] = true; SS.input.btn[2] = true; for (let k = 0; k < 4; k++) SS.tick(1 / 60);
  });
  await sleep(60); killed = await A.evaluate(() => SS.mission.stats.kills >= 1);
}
await A.evaluate(() => { SS.input.btn[0] = false; SS.input.btn[2] = false; });
const aStats = await A.evaluate(() => ({ shots: SS.mission.stats.shots, hits: SS.mission.stats.hits, kills: SS.mission.stats.kills, score: SS.mp.roster.score }));
await B.waitForFunction(() => SS.mission.stats.deaths >= 1, null, { timeout: 5000 }).catch(() => {});
check('A kills B (hits claimed, Authority applied damage)', killed && (await B.evaluate(() => SS.mission.stats.deaths)) === 1, JSON.stringify(aStats));
await A.waitForFunction(() => SS.mp.roster.score.blue + SS.mp.roster.score.red === 1, null, { timeout: 5000 }).catch(() => {});
check('score 1 on both screens', (await A.evaluate(() => SS.mp.roster.score.blue + SS.mp.roster.score.red)) === 1 && (await B.evaluate(() => SS.mp.roster.score.blue + SS.mp.roster.score.red)) === 1);
const feedB = await B.evaluate(() => (SS.mp.ui.log || []).join(' ')); check('kill feed shows the kill', feedB.includes('ALPHA>BRAVO'), feedB);
await B.evaluate(() => { SS.skipRender = false; }); await sleep(500); await B.screenshot({ path: `${OUT}/mp-${KIND}-dead.png` }); await B.evaluate(() => { SS.skipRender = true; });
await B.waitForFunction(() => SS.player.alive, null, { timeout: 9000 }).catch(() => {});
check('B respawns after the delay', await B.evaluate(() => SS.player.alive && SS.mission.stats.deaths === 1), await B.evaluate(() => JSON.stringify({ alive: SS.player.alive, hp: SS.player.health, st: SS.state, active: SS.mp.active, respawnAt: SS.mp.respawnAt, feed: document.getElementById('mpFeed').textContent })));
// anti-cheat: B claims a hit on A with an impact point 6 m beside A → the Authority rejects it, A keeps its health
await sleep(2500);
const hpBefore = await A.evaluate(() => SS.player.health);
await B.evaluate(() => { const r = [...SS.mp.remotes.values()][0], P = SS.player, E = P.eye; SS.mp.toHost({ k: 'hit', t: r.id, d: 90, z: 'head', sp: [P.pos.x, P.pos.y, P.pos.z], o: [E.x, E.y, E.z], h: [r.pos.x + 6, r.pos.y + 1.2, r.pos.z] }); });
await sleep(1500);
check('forged hit claim (impact beside the target) is rejected', (await A.evaluate(() => SS.player.health)) === hpBefore, `A health ${hpBefore} → ${await A.evaluate(() => SS.player.health)}`);
// walls: A outside and B inside the base's south wall; A claims a hit on B's body → rejected (line of sight through the wall)
const side = await A.evaluate(() => { const c = SS.world.colliders.find((c) => c.hp === undefined && !c.pass && !c.thin && c.max.x - c.min.x > 50 && c.max.z - c.min.z < 1.5 && c.max.y - c.min.y > 3 && c.min.z > -2 && c.max.z < 2 && c.min.x > 0); // the base's south perimeter wall (east half)
  if (!c) return null; const x = (c.min.x + c.max.x) / 2; SS.player.place(x, c.max.z + 5, 0); return { x, z: c.min.z - 5, box: [c.min.x, c.min.y, c.min.z, c.max.x, c.max.y, c.max.z].map(Math.round) }; });
if (side) {
  await B.evaluate((s) => SS.player.place(s.x, s.z, Math.PI), side); await sleep(1800);
  const hpB = await B.evaluate(() => SS.player.health);
  await A.evaluate(() => { const r = [...SS.mp.remotes.values()][0], P = SS.player, E = P.eye; SS.mp.toHost({ k: 'hit', t: r.id, d: 40, z: 'torso', sp: [P.pos.x, P.pos.y, P.pos.z], o: [E.x, E.y, E.z], h: [r.pos.x, r.pos.y + 1.2, r.pos.z] }); });
  await sleep(1500);
  const why = await A.evaluate(() => SS.mp.lastReject);
  check('hit through the real base wall is rejected (reason: wall)', (await B.evaluate(() => SS.player.health)) === hpB && why === 'wall', `wall ${JSON.stringify(side.box)}, reason ${why}, B health ${hpB} → ${await B.evaluate(() => SS.player.health)}`);
} else check('found the base wall for the wall test', false);
// grenades: open ground again, A lobs a frag at B; the Authority deals the blast; B sees the grenade in flight
await B.waitForFunction(() => SS.player.alive, null, { timeout: 9000 }).catch(() => {});
await A.evaluate(([x, z]) => SS.player.place(x, z, 0), a0); await B.evaluate(([x, z]) => SS.player.place(x, z - 9, 0), a0); await sleep(2600);
const hpB0 = await B.evaluate(() => SS.player.health), deaths0 = await B.evaluate(() => SS.mission.stats.deaths);
await A.evaluate(() => { const r = [...SS.mp.remotes.values()][0], P = SS.player; const dx = r.pos.x - P.eye.x, dz = r.pos.z - P.eye.z; P.yaw = Math.atan2(-dx, -dz); P.pitch = -0.28; SS.skipRender = true; SS.tick(1 / 60); SS.weapons.throwGrenade(); });
let sawNade = false;
for (let i = 0; i < 40; i++) { await A.evaluate(() => { for (let k = 0; k < 6; k++) SS.tick(1 / 60); }); if (!sawNade) sawNade = await B.evaluate(() => SS.fx.nades.some((n) => n.owner === 'remote')); await sleep(50); }
await sleep(800);
const hpB1 = await B.evaluate(() => SS.player.health), deaths1 = await B.evaluate(() => SS.mission.stats.deaths);
check('grenade: B sees it in flight, the blast hurts or kills B', sawNade && (hpB1 < hpB0 || deaths1 > deaths0), `seen ${sawNade}, B health ${hpB0} → ${hpB1}, deaths ${deaths0} → ${deaths1}, A grenades left ${await A.evaluate(() => SS.weapons.grenades)}`);
const net = await Promise.all([A, B].map((p) => p.evaluate(() => ({ sent: SS.mp.stats.sent, recv: SS.mp.stats.recv, hz: SS.mp.transport.sendHz }))));
console.log('net:', JSON.stringify(net));
// host / leader leaves: on Supabase the other browser becomes the host and keeps the score
await A.close();
await sleep(KIND === 'supabase' ? 4000 : 1500);
if (KIND === 'supabase') check('host migration: B now runs the Authority with the score kept', await B.evaluate(() => !!SS.mp.auth && SS.mp.auth.score.blue + SS.mp.auth.score.red === 1));
else check('server keeps the room for B after A leaves', await B.evaluate(() => SS.mp.connected && SS.mp.roster.players.length === 1));
check('no page errors', errs.length === 0, errs.slice(0, 4).join(' | '));
if (srv) { const h = await (await fetch(`http://localhost:${WSPORT}/health`)).json(); console.log('server:', JSON.stringify(h)); srv.kill(); }
await browser.close(); await server.httpServer.close();
console.log(`\n${results.filter(Boolean).length}/${results.length} checks passed (${KIND})`); process.exit(results.every(Boolean) ? 0 : 1);
