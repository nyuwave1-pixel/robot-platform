// In-game pathfinding scenario (v0.15): temporary U-shaped walls are added round a beach enemy, its goal is behind the
// back wall, then the game is simulated for 30 s — once with pathfinding off (old behaviour) and once on.
// Usage: npm run build && PW_CHANNEL=chrome node tests/nav-scenario.mjs   (serves dist/ itself on port 5184)
import { createRequire } from 'node:module';
import { preview } from 'vite';
import { HELPERS } from './plans.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const server = await preview({ preview: { port: 5184, strictPort: true }, logLevel: 'silent' });
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.goto('http://localhost:5184/?test&q=low');
await page.waitForFunction(() => window.SS && SS.state === 'menu', null, { timeout: 240000 });
await page.evaluate(HELPERS);
let fail = 0;
for (const navOff of [true, false]) {
  const r = await page.evaluate((off) => {
    SS.startMission(0, true); SS.navOff = off; SS.navStats.ok = SS.navStats.fail = 0;
    const W = SS.world, T = SS.THREE;
    // U-shaped 'room' (10 x 9 m, 3 m walls, open on the -z side) built round a beach enemy; goal 4 m behind the back wall.
    // This is the indoor case: the straight line is blocked and side-stepping cannot find the door behind the agent.
    const e = SS.enemies.list.find((x) => x.alive && !x.type.vehicle && x.pos.y > -30 && W.heightAt(x.pos.x, x.pos.z) > 1.5);
    const ex = e.pos.x, ez = e.pos.z, y0 = W.heightAt(ex, ez) - 1, wall = (x0, z0, x1, z1) => W.addCollider({ min: new T.Vector3(x0, y0, z0), max: new T.Vector3(x1, y0 + 4, z1), tmp: true });
    if (!SS._navWalls) SS._navWalls = [wall(ex - 5.2, ez + 3, ex + 5.2, ez + 3.4), wall(ex - 5.2, ez - 6, ex - 4.8, ez + 3.4), wall(ex + 4.8, ez - 6, ex + 5.2, ez + 3.4)];
    SS.player.pos.set(ex + 140, 0, ez + 140); SS.player.pos.y = W.heightAt(SS.player.pos.x, SS.player.pos.z);
    e.pos.set(ex, W.groundAt(ex, ez, 50), ez); e.hold = false; e.state = 2; e.stateT = -14; e.patrol = null; e.alerted = false; e.detect = 0.5; e.nav = null; e.navFail = null;
    e.goal = new T.Vector3(ex, e.pos.y, ez + 7.4); e.atGoal = false; e.inv.copy(e.goal); e.lk.copy(e.goal);
    const c = { min: { x: ex - 5.2, z: ez - 6 }, max: { x: ex + 5.2, z: ez + 3.4 } };
    const goal = e.goal.clone(), d0 = Math.hypot(goal.x - e.pos.x, goal.z - e.pos.z);
    let best = d0; for (let t = 0; t < 30; t += 0.5) { QA.run(0.5); best = Math.min(best, Math.hypot(goal.x - e.pos.x, goal.z - e.pos.z)); }
    return { navOff: off, room: [+(c.max.x - c.min.x).toFixed(1), +(c.max.z - c.min.z).toFixed(1)], start: d0.toFixed(1), closest: best.toFixed(1), nav: { ...SS.navStats } };
  }, navOff);
  console.log(JSON.stringify(r));
  if (!navOff && +r.closest > 1.5) { fail++; console.log('FAIL  with pathfinding the enemy did not reach the far side'); }
}
await browser.close(); server.httpServer.close();
process.exit(fail ? 1 : 0);
