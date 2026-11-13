// End-to-end QA: boots the production build in headless Chromium, exercises menus, controls and systems,
// then plays the whole campaign with a scripted operator (aim-bot + teleports between objectives).
// Usage: npm run build && npm run test:e2e   (screenshots → tests/out, report → tests/out/report.json)
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { preview } from 'vite';
import { HELPERS } from './plans.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const OUT = new URL('./out/', import.meta.url).pathname; mkdirSync(OUT, { recursive: true });
const results = []; let failed = 0;
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail: String(detail) }); if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const server = await preview({ preview: { port: 5183, strictPort: true }, logLevel: 'silent' });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
const shot = (n) => page.screenshot({ path: `${OUT}${n}.png`, timeout: 120000 });
const ev = (fn, arg) => page.evaluate(fn, arg);
const run = (sec) => ev((s) => QA.run(s), sec);
const t0 = Date.now();
await page.goto('http://localhost:5183/?test&q=' + (process.env.Q || 'medium'));
await page.waitForFunction(() => window.SS && SS.state === 'menu', null, { timeout: 120000 });
check('boot → main menu', true, `${((Date.now() - t0) / 1000).toFixed(1)} s load`);
await ev(HELPERS); await ev(() => { localStorage.clear(); });
const gl = await ev(() => { const g = SS.renderer.getContext(), d = g.getExtension('WEBGL_debug_renderer_info'); return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown'; });
if (!process.env.CAMPAIGN_ONLY) {
// ---------- menus: every main-menu button opens a working screen ----------
for (const [a, expect] of [['campaign', 'CAMPAIGN'], ['multiplayer', 'MULTIPLAYER'], ['operations', 'OPERATIONS'], ['weapons', 'ARMORY'], ['operator', 'OPERATOR'], ['settings', 'SETTINGS'], ['exit', 'EXIT GAME']]) {
  await page.click(`nav [data-a="${a}"]`); const h = await page.textContent('#menu h2'); check(`menu: ${a}`, h.includes(expect), h); if (a === 'weapons') await shot('menu-weapons'); if (a === 'settings') await shot('menu-settings');
  await page.click(a === 'exit' ? '[data-a="main"]' : '.panel header [data-a="main"]');
}
await shot('menu-main');
await page.click('nav [data-a="settings"]'); await page.selectOption('[data-set="quality"]', 'low'); check('settings: quality preset applies', await ev(() => SS.settings.quality === 'low' && SS.renderer.shadowMap.enabled === false));
await page.selectOption('[data-set="quality"]', process.env.Q || 'medium'); await page.fill('[data-set="fov"]', '90'); check('settings: FOV slider applies', await ev(() => SS.settings.fov === 90)); await page.fill('[data-set="fov"]', '78');
check('settings persist to storage', await ev(() => JSON.parse(localStorage.getItem('special-soldier-save-v1')).settings.fov === 78)); await page.click('.panel header [data-a="main"]');
await page.click('nav [data-a="weapons"]'); await page.click('[data-a="wsel"][data-v="smg"]'); check('armory: locked weapon cannot be equipped', (await page.locator('[data-a="equip"]').count()) === 0); await page.click('[data-a="wsel"][data-v="pistol"]'); const dps = await page.textContent('.dps'); check('armory: DPS panel', /BURST DPS\s*200/.test(dps), dps.replace(/\s+/g, ' ').slice(0, 80)); await page.click('.panel header [data-a="main"]');
await page.click('nav [data-a="campaign"]'); check('campaign: missions 2–5 locked on a new profile', (await page.locator('.mcard.locked').count()) === 4); await page.click('[data-a="brief"][data-v="0"]'); await shot('briefing-m1');
// ---------- mission 1 with the real intro cinematic ----------
await page.click('[data-a="deploy"]'); await page.waitForFunction(() => SS.state === 'cinematic', null, { timeout: 8000 }).catch(() => {}); check('deploy → boat cinematic (no intro video present → real-time)', await ev(() => SS.state === 'cinematic' && SS.cine.active));
await run(8); await shot('cine-front'); await run(12); await shot('cine-rear'); await run(16);
check('cinematic → first-person landing', await ev(() => SS.state === 'playing' && SS.mission.oi === 0), JSON.stringify(await ev(() => QA.info().pos)));
await run(0.5); await shot('m1-landing');
// ---------- player systems ----------
await ev(() => { SS.noTarget = true; SS.godMode = true; });
const P0 = await ev(() => SS.player.pos.toArray());
await ev(() => { SS.input.keys.add('KeyW'); }); await run(1.5); await ev(() => SS.input.keys.delete('KeyW')); const P1 = await ev(() => SS.player.pos.toArray()); check('move: W walks forward', P0[2] - P1[2] > 3, `${(P0[2] - P1[2]).toFixed(1)} m in 1.5 s`);
await ev(() => { SS.input.keys.add('KeyW'); SS.input.keys.add('ShiftLeft'); }); await run(1.5); const sprint = await ev(() => ({ z: SS.player.pos.z, st: SS.player.stamina, sp: SS.player.sprinting })); check('sprint: faster + drains stamina', P1[2] - sprint.z > 7 && sprint.st < 95, `${(P1[2] - sprint.z).toFixed(1)} m, stamina ${sprint.st.toFixed(0)}`);
await ev(() => QA.key('ControlLeft')); await run(0.2); check('slide: crouch while sprinting', await ev(() => SS.player.sliding > 0)); await ev(() => { SS.input.keys.clear(); }); await run(1.2);
await ev(() => { SS.player.stance = 0; QA.key('KeyZ'); }); await run(0.6); check('prone', await ev(() => SS.player.stance === 2 && SS.player.height < 0.8)); await ev(() => QA.key('Space')); await run(0.6); check('stand up', await ev(() => SS.player.stance === 0));
await ev(() => QA.key('Space')); await run(0.15); check('jump', await ev(() => !SS.player.grounded)); await run(1);
await ev(() => { SS.noTarget = true; QA.key('Digit2'); }); await run(0.8); check('weapon switch [2]', await ev(() => SS.weapons.cur === 1)); await ev(() => QA.key('Digit3')); await run(0.8); check('weapon switch [3] sidearm', await ev(() => SS.weapons.slot.id === 'pistol')); await ev(() => QA.key('Digit1')); await run(0.8);
await ev(() => { SS.player.pitch = 0.6; SS.input.btn[0] = true; }); await run(0.5); const mag = await ev(() => { SS.input.btn[0] = false; return SS.weapons.slot.mag; }); check('fire: automatic', mag < 30 && mag > 18, `mag ${mag}/30 after 0.5 s`);
const pit = await ev(() => SS.player.pitch); check('recoil climbs the muzzle', pit > 0.6, `pitch +${((pit - 0.6) * 57.3).toFixed(1)}°`);
await ev(() => QA.key('KeyV')); await run(0.1); check('fire mode toggle [V]', await ev(() => SS.weapons.slot.mode === 'semi')); await ev(() => { SS.input.btn[0] = true; }); await run(0.5); const mag2 = await ev(() => { SS.input.btn[0] = false; return SS.weapons.slot.mag; }); check('semi-auto: one round per trigger pull', mag2 === mag - 1, `${mag} → ${mag2}`); await ev(() => QA.key('KeyV'));
await ev(() => QA.key('KeyR')); await run(0.3); check('reload starts', await ev(() => SS.weapons.reloading)); await run(2.6); check('reload completes', await ev(() => SS.weapons.slot.mag === 30));
await ev(() => { SS.input.btn[2] = true; }); await run(0.6); check('ADS: zoom + tighter spread', await ev(() => SS.weapons.adsT === 1 && SS.camera.fov < 62 && SS.weapons.spreadDeg() < 1.3), await ev(() => `fov ${SS.camera.fov.toFixed(0)}, spread ${SS.weapons.spreadDeg().toFixed(2)}°`)); await ev(() => { SS.input.btn[2] = false; });
await ev(() => { SS.player.pitch = 0.3; QA.key('KeyG'); }); await run(0.2); check('grenade thrown', await ev(() => SS.fx.nades.length === 1 && SS.weapons.grenades === 3)); await run(3.5); check('grenade detonates', await ev(() => SS.fx.nades.length === 0));
await ev(() => QA.key('KeyN')); await run(0.2); check('night vision [N]', await ev(() => SS.gear.vision === 1)); await shot('m1-nvg'); await ev(() => QA.key('KeyN'));
await ev(() => QA.key('KeyL')); await run(0.1); check('tac light [L]', await ev(() => SS.gear.light && SS.gear.spot.intensity > 0)); await ev(() => QA.key('KeyL'));
await ev(() => QA.key('KeyT')); await run(0.1); check('thermal locked until unlocked', await ev(() => SS.gear.vision === 0));
await ev(() => QA.key('Tab')); await run(0.3); check('tactical map [Tab]', await ev(() => document.getElementById('tacmap').style.display === 'block')); await shot('m1-tacmap'); await ev(() => QA.key('Tab')); await run(0.2);
await ev(() => QA.key('Escape')); await run(0.1); check('pause', await ev(() => SS.state === 'paused')); await page.click('[data-a="resume"]'); check('resume', await ev(() => SS.state === 'playing'));
// ---------- AI: stealth detection, alert, damage, death + checkpoint ----------
await ev(() => { SS.noTarget = false; SS.godMode = false; SS.startMission(0, true); }); await run(0.3);
const yard = () => { SS.enemies.clear(); SS.squad.clear(); const mk = (x, z) => SS.enemies.spawn('guard', x, z, { group: 'beach', yaw: 0 }); window._e = mk(0, -40); return mk; };
await ev(`(${yard})()(10, -36); SS.enemies.spawn('guard', -10, -36, { group: 'beach', yaw: 0 }); SS.player.stance = 1; QA.tp(0, -53);`); await run(1.5);
check('AI: crouched behind a sentry (outside view cone) → not seen', await ev(() => !_e.see && _e.state === 0 && _e.detect < 0.3), await ev(() => `state ${_e.state}, detect ${_e.detect.toFixed(2)}`));
await ev(() => { SS.player.stance = 0; QA.tp(0, -28); }); await run(0.4); const det1 = await ev(() => _e.detect); await run(4);
check('AI: awareness meter fills in view cone → COMBAT', await ev(() => _e.state === 3), `detect ${det1.toFixed(2)} after 0.4 s → state ${await ev(() => _e.state)}`);
check('AI: alert propagates to the squad', await ev(() => SS.enemies.list.filter((e) => e.alive && e.state >= 2).length >= 3), await ev(() => SS.enemies.list.filter((e) => e.alive && e.state >= 2).length + ' hostiles alerted'));
await run(6); check('AI: surviving sentry radios for reinforcements', await ev(() => SS.mission.flags.alarm === true && SS.enemies.count('qrf') > 0), await ev(() => SS.enemies.count('qrf') + ' QRF spawned'));
check('AI: hostiles take cover', await ev(() => SS.enemies.list.some((e) => e.alive && e.cover)));
await shot('m1-firefight');
await run(25); const hp = await ev(() => ({ hp: SS.player.health, ar: SS.player.armor, st: SS.state })); check('player takes damage (armor absorbs first)', hp.ar < 100 || hp.st !== 'playing', `health ${hp.hp.toFixed(0)}, armor ${hp.ar.toFixed(0)}`);
await ev(() => { SS.player.damage(500, 0, 0, 'bullet'); }); await run(2.5); check('death → KIA screen', await ev(() => SS.state === 'deadMenu')); await shot('kia'); await page.click('[data-a="restart"]'); check('restart from checkpoint', await ev(() => SS.state === 'playing' && SS.player.health === 100 && SS.mission.stats.deaths === 1));
// ---------- stealth kill with the suppressed sidearm ----------
await ev(() => { SS.startMission(0, true); }); await run(0.3);
await ev(() => { QA.key('Digit3'); }); await run(0.8); await ev(`(${yard})(); SS.enemies.spawn('guard', 60, -112, { group: 'beach', yaw: 0 }); SS.player.stance = 1; QA.tp(0, -49);`); await run(0.3);
await ev(() => { SS.skipRender = true; for (let i = 0; i < 90 && _e.alive; i++) { const P = SS.player; P.updateCamera(0); const dx = _e.pos.x - P.eye.x, dz = _e.pos.z - P.eye.z, dy = _e.pos.y + 1.64 - P.eye.y; P.yaw = Math.atan2(-dx, -dz); P.pitch = Math.atan2(dy, Math.hypot(dx, dz)) - P.recoilOff; SS.input.btn[2] = true; SS.input.btn[0] = i > 20 && i % 8 < 2; SS.tick(1 / 30); } SS.input.btn[0] = SS.input.btn[2] = false; SS.skipRender = false; }); await run(1);
check('stealth: suppressed headshot kill raises no alarm', await ev(() => !_e.alive && SS.mission.stats.headshots >= 1 && SS.enemies.inCombat === 0), await ev(() => `kills ${SS.mission.stats.kills}, headshots ${SS.mission.stats.headshots}, in combat ${SS.enemies.inCombat}`));
}
// ---------- full campaign play-through ----------
const campaign = [];
for (let mi = 0; mi < 5; mi++) {
  if (mi > 0) { await page.click('[data-a="next"]'); await page.click('[data-a="deploy"]'); } else await ev(() => SS.startMission(0, true));
  await ev(() => { SS.godMode = true; }); let guard = 0, cineSeen = 0;
  while (guard++ < 400) {
    const st = await ev(() => SS.state); if (st === 'result') break; if (st === 'video') { await page.waitForTimeout(300); guard--; continue; } if (process.env.TRACE) console.log('  step', mi + 1, guard, st, JSON.stringify(await ev(() => QA.info())).slice(0, 220));
    if (st === 'cinematic') { cineSeen++; if (cineSeen % 2 === 1 && mi > 0) { await run(2.5); await shot(`m${mi + 1}-cine${cineSeen}`); } await ev(() => { QA.key('Enter'); QA.run(0.1); }); continue; }
    const o = await ev(() => { const m = SS.mission, o = m.obj; if (!o) return null; const at = o.at ? o.at() : o; return { type: o.type, group: o.group, x: at.x, y: at.y, z: at.z, hold: o.hold || 0, oi: m.oi, text: m.objText() }; });
    if (!o) { await run(1); continue; }
    if (o.type === 'kill') await ev((g) => QA.fight(g, 40), o.group);
    else if (o.type === 'reach') { await ev((o) => { QA.tp(o.x, o.z, o.y !== undefined ? o.y - (o.y < -30 ? 1 : 0) : undefined); }, o); await run(0.3); }
    else if (o.type === 'interact') { await ev((o) => { QA.tp(o.x + 0.6, o.z + 0.6, o.y < -30 ? -60 : undefined); SS.input.keys.add('KeyE'); QA.key('KeyE'); }, o); await run(o.hold + 0.4); await ev(() => SS.input.keys.delete('KeyE')); if (await ev((oi) => SS.mission.oi === oi && SS.state === 'playing', o.oi)) await run(1.5); }
    else if (o.type === 'custom') { await ev(() => QA.tp(SS.player.pos.x + 40, SS.player.pos.z + 30)); await run(0.3); }
    else if (o.type === 'defend') { if (!campaign[mi]) await shot(`m${mi + 1}-defend`); await ev(() => QA.fight(null, 8)); await run(4); }
    if (guard === 2) await shot(`m${mi + 1}-play`);
  }
  const res = await ev(() => SS.lastResult && SS.state === 'result' ? SS.lastResult : null); campaign[mi] = res;
  check(`campaign: MISSION 0${mi + 1} completed`, !!res, res ? `grade ${res.grade}, ${res.kills} kills, ${res.acc}% acc, ${Math.round(res.time)} s game-time` : `stuck: ${JSON.stringify(await ev(() => QA.info()))}`);
  if (res) { await shot(`m${mi + 1}-result`); check(`  unlocks after M0${mi + 1}`, await ev((i) => SS.save.progress === i + 1, mi), res.unlocks.join(', ')); } else break;
}
await ev(() => { SS.godMode = false; });
if (campaign[4]) { await page.click('[data-a="next"]'); check('campaign end screen', (await page.textContent('#menu h2')).includes('OPERATION COMPLETE')); await page.click('[data-a="main"]'); }
// ---------- unlock-gated equipment after the campaign ----------
await ev(() => SS.startMission(1, true)); await run(0.5);
await ev(() => QA.key('KeyT')); await run(0.2); check('thermal imager (unlocked)', await ev(() => SS.gear.vision === 2 && SS.enemies.thermal)); await shot('thermal'); await ev(() => QA.key('KeyT'));
await ev(() => QA.key('KeyB')); await run(0.3); await ev(() => { SS.input.keys.add('Space'); SS.input.keys.add('KeyW'); }); await run(4); await ev(() => SS.input.keys.clear());
check('recon drone: free-fly camera', await ev(() => SS.gear.droneActive && SS.gear.dronePos.distanceTo(SS.player.pos) > 30), await ev(() => `drone ${SS.gear.dronePos.distanceTo(SS.player.pos).toFixed(0)} m from operator, battery ${(SS.gear.battery * 100).toFixed(0)}%`));
await ev(() => { const e = QA.nearest(); const g = SS.gear; g.dronePos.set(e.pos.x + 20, e.pos.y + 30, e.pos.z + 20); const dx = e.pos.x - g.dronePos.x, dz = e.pos.z - g.dronePos.z; g.dyaw = Math.atan2(-dx, -dz); g.dpitch = -Math.atan2(30, Math.hypot(dx, dz)); }); await run(1.2); await shot('drone');
check('recon drone: tags hostiles for HUD + minimap', await ev(() => SS.enemies.list.some((e) => SS.time - e.marked < 5)), await ev(() => SS.enemies.list.filter((e) => SS.time - e.marked < 5).length + ' tagged')); await ev(() => QA.key('KeyB')); await run(0.3);
// ---------- weather / zones gallery ----------
for (const [n, mi, x, z, yaw] of [['zone-jungle', 1, -60, 196, 0.9], ['zone-base', 2, 0, -30, 0], ['zone-airfield', 4, 150, -270, -1.2]]) { await ev(([mi, x, z, yaw]) => { SS.startMission(mi, true); SS.noTarget = true; QA.tp(x, z); SS.player.yaw = yaw; }, [mi, x, z, yaw]); await run(1.5); await shot(n); }
await ev(() => { SS.noTarget = false; SS.toMenu(); });
// ---------- performance (real-time frames; renderer reported so numbers are read in context) ----------
const perf = {};
for (const q of ['low', 'medium', 'high']) {
  await ev((q) => { SS.settings.quality = q; SS.applySettings(); SS.startMission(2, true); SS.noTarget = true; QA.tp(0, 20); SS.player.yaw = 0; }, q); await page.waitForTimeout(1500);
  perf[q] = await ev(() => new Promise((res) => { let n = 0, worst = 0, last = performance.now(); const t0 = last; const f = (t) => { n++; worst = Math.max(worst, t - last); last = t; if (t - t0 < 5000) requestAnimationFrame(f); else res({ fps: +(n / ((t - t0) / 1000)).toFixed(1), worstMs: +worst.toFixed(0), draws: SS.stats.calls, tris: SS.stats.tris, res: SS.renderer.domElement.width + 'x' + SS.renderer.domElement.height }); }; requestAnimationFrame(f); }));
  console.log(`PERF  ${q}: ${JSON.stringify(perf[q])}`);
}
const mem = await ev(() => (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null));
check('no console / page errors during the whole run', errs.length === 0, errs.slice(0, 5).join(' | '));
writeFileSync(OUT + 'report.json', JSON.stringify({ date: new Date().toISOString(), renderer: gl, viewport: '1280x720', checks: results, campaign, perf, jsHeapMB: mem, errors: errs }, null, 2));
console.log(`\n${results.length - failed}/${results.length} checks passed · renderer: ${gl} · JS heap ${mem} MB · ${((Date.now() - t0) / 1000).toFixed(0)} s wall`);
await browser.close(); await server.httpServer.close(); process.exit(failed ? 1 : 0);
