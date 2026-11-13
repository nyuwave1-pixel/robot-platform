// Dev helper: boots the game headless and captures screenshots at scripted moments.
import { createRequire } from 'node:module';
import { preview } from 'vite';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.env.OUT || '/tmp/claude-0/-home-user-robot-platform/ac6b075d-dbb3-56b1-9c64-d3d8fda8d695/scratchpad';
const plan = process.argv[2] || 'intro';
const server = await preview({ preview: { port: 5182, strictPort: true }, logLevel: 'silent' });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on('console', (m) => { if (m.type() === 'error') errs.push('error: ' + m.text().slice(0, 400)); }); page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
await page.goto('http://localhost:5182/?test&q=' + (process.env.Q || 'medium'));
await page.waitForFunction(() => window.SS && window.SS.state === 'menu', null, { timeout: 90000 });
const shot = async (n) => { await page.screenshot({ path: `${out}/${n}.png`, timeout: 120000 }); };
// advance simulated time quickly without waiting in real time
const sim = (sec, dt = 1 / 30) => page.evaluate(([sec, dt]) => { SS.skipRender = true; const t0 = performance.now(); for (let t = 0; t < sec; t += dt) SS.tick(dt); SS.skipRender = false; const t1 = performance.now(); SS.tick(0.001); return [((t1 - t0) / (sec / dt)).toFixed(2) + ' ms/sim-tick', (performance.now() - t1).toFixed(0) + ' ms/render-frame']; }, [sec, dt]);
if (plan === 'intro') {
  await page.evaluate(() => SS.startMission(0));
  console.log(await sim(0.1)); for (const [n, t] of [['c1', 3], ['c2', 6.5], ['c3', 6], ['c4', 6.5], ['c5', 5], ['c6', 4]]) { await sim(t); await shot(n); }
  await sim(6); await shot('land'); console.log(await page.evaluate(() => JSON.stringify({ state: SS.state, pos: SS.player.pos.toArray().map((v) => +v.toFixed(1)), obj: SS.mission.objText(), enemies: SS.enemies.count() })));
} else { const fn = (await import('./plans.mjs'))[plan]; await fn({ page, sim, shot }); }
console.log(errs.slice(0, 12).join('\n') || 'no console errors');
await browser.close(); await server.httpServer.close(); process.exit(0);
