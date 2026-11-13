import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { preview } from 'vite';
const out = process.argv[2] || '/tmp/claude-0/-home-user-robot-platform/ac6b075d-dbb3-56b1-9c64-d3d8fda8d695/scratchpad';
const server = await preview({ preview: { port: 5181, strictPort: true }, logLevel: 'silent' });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 300)); }); page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
await page.goto('http://localhost:5181/?test&q=' + (process.argv[3] || 'medium'));
try { await page.waitForFunction(() => window.SS && window.SS.state === 'menu', null, { timeout: 90000 }); } catch (e) { errs.push('TIMEOUT waiting for menu: ' + await page.evaluate(() => document.getElementById('loadText').textContent)); }
await page.waitForTimeout(2500); await page.screenshot({ path: out + '/menu.png' });
console.log(errs.join('\n') || 'no console errors'); console.log(await page.evaluate(() => JSON.stringify({ state: SS.state, statics: SS.world?.staticCount, colliders: SS.world?.colliders.length, veg: SS.world?.vegCount, calls: SS.renderer?.info.render.calls, tris: SS.renderer?.info.render.triangles })));
await browser.close(); await server.httpServer.close(); process.exit(0);
