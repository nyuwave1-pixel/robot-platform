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
