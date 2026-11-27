// TURBO LAP — browser side: top-down Canvas view with a chase camera that turns with your car, three AI rivals, 3-lap race.
// Rules live in ./logic.js and run in fixed 1/60 s ticks (createRace / raceTick), so every race can be replayed exactly:
// the recorded inputs are the proof the portals check with ./verify.js.
// Controls: W/↑ throttle, S/↓ brake/reverse, A D/← → steer, Space/Shift drift (let go = boost), R restart.
import { createRace, raceTick, finishOrder, gradeFor, driftTier, maskOf, TICK, COUNTDOWN_TICKS } from './logic.js';
import { LEVELS } from './levels.js';
import { encodeInputs } from './verify.js';
import { createPortal } from './portal.js';

const SCALE = 3.2;   // pixels per metre
const COLORS = ['#ffd35a', '#ff5a5a', '#5ad1ff', '#7dff9a'];
const canvas = document.getElementById('game'), ctx = canvas.getContext('2d'), hud = document.getElementById('hud');
const keys = new Set(), portal = createPortal('turbo-lap');
const store = { get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };
let race, masks, skids, acc, result;

function resize() { canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); }
addEventListener('resize', resize); resize();
addEventListener('keydown', (e) => { keys.add(e.code); if (e.code === 'KeyR') reset(); if (e.code === 'Space') e.preventDefault(); });
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

function reset() {
  race = createRace(LEVELS[0]); masks = []; skids = []; acc = 0; result = null;
  portal.levelStart(1);
}
portal.ready(); reset();

const held = (...c) => c.some((k) => keys.has(k));
function playerMask() {
  return maskOf({ throttle: held('KeyW', 'ArrowUp'), brake: held('KeyS', 'ArrowDown'), left: held('KeyA', 'ArrowLeft'), right: held('KeyD', 'ArrowRight'), drift: held('Space', 'ShiftLeft', 'ShiftRight') });
}

function finish() {
  const pos = finishOrder(race).indexOf(race.player) + 1, grade = gradeFor(pos), time = race.time;
  const best = Number(store.get('turbo-lap.best', 0)) || null, newBest = !best || time < best;
  if (newBest) store.set('turbo-lap.best', time.toFixed(2));
  const rp = portal.result({ level: 1, score: Math.max(0, Math.round(10000 - time * 50)) + (5 - pos) * 1000, grade, mode: 'CIRCUIT', seconds: +time.toFixed(2),
    stars: Math.max(0, 4 - pos), proof: { inputs: encodeInputs(masks) } });
  result = { pos, grade, time, newBest, rp };
}

let prev = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  acc += Math.min(0.25, (now - prev) / 1000); prev = now;
  while (acc >= TICK) {
    acc -= TICK;
    if (result) { raceTick(race, 2); continue; }   // after the flag: coast and brake while the others finish
    const m = race.tick < COUNTDOWN_TICKS ? 0 : playerMask();
    masks.push(m); raceTick(race, m);
    const p = race.player;
    if (p.drifting) for (const side of [-1, 1]) {   // rear-wheel skid marks (last 1500 dabs)
      skids.push(p.x - Math.cos(p.heading) * 1.6 - Math.sin(p.heading) * side, p.y - Math.sin(p.heading) * 1.6 + Math.cos(p.heading) * side);
      if (skids.length > 3000) skids.splice(0, 2);
    }
    if (p.finished) finish();
  }
  draw();
}
requestAnimationFrame(frame);

function draw() {
  const W = innerWidth, H = innerHeight, { track, cars, player } = race;
  ctx.fillStyle = '#25482c'; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H * 0.68); ctx.rotate(-player.heading - Math.PI / 2); ctx.scale(SCALE, SCALE); ctx.translate(-player.x, -player.y);
  const path = () => { ctx.beginPath(); track.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); };
  ctx.lineJoin = 'round';
  path(); ctx.strokeStyle = '#d8d8d8'; ctx.lineWidth = track.width + 2; ctx.stroke();                 // kerbs
  path(); ctx.strokeStyle = '#3a3d42'; ctx.lineWidth = track.width; ctx.stroke();                     // asphalt
  path(); ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 0.4; ctx.stroke(); ctx.setLineDash([]);
  const a = track.pts[0], b = track.pts[1], h = Math.atan2(b.y - a.y, b.x - a.x);                     // start line
  ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(h); ctx.fillStyle = '#fff'; ctx.fillRect(-0.6, -track.width / 2, 1.2, track.width); ctx.restore();
  ctx.fillStyle = 'rgba(15,15,18,.55)'; for (let i = 0; i < skids.length; i += 2) ctx.fillRect(skids[i] - 0.25, skids[i + 1] - 0.25, 0.5, 0.5);
  cars.forEach((c, i) => {
    ctx.save(); ctx.translate(c.x, c.y);
    if (c.drifting && driftTier(c.driftT)) { ctx.globalAlpha = 0.25; ctx.fillStyle = driftTier(c.driftT) === 2 ? '#5ad1ff' : '#ffb347'; ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.rotate(c.heading);
    if (c.boostT > 0) { ctx.fillStyle = c.boostV > 10 ? '#5ad1ff' : '#ffb347'; ctx.fillRect(-3.6 - Math.random(), -0.5, 1.4, 1); }
    ctx.fillStyle = COLORS[i]; ctx.fillRect(-2.2, -1.1, 4.4, 2.2); ctx.fillStyle = '#111'; ctx.fillRect(0.6, -0.9, 1.1, 1.8);
    ctx.restore();
  });
  ctx.restore();
  const order = finishOrder(race), pos = order.indexOf(player) + 1, fmt = (t) => (t == null ? '—' : `${Math.floor(t / 60)}:${(t % 60).toFixed(2).padStart(5, '0')}`);
  const count = race.tick < COUNTDOWN_TICKS ? Math.ceil((COUNTDOWN_TICKS - race.tick) * TICK) : 0, best = Number(store.get('turbo-lap.best', 0)) || null;
  hud.textContent = `TURBO LAP\nLAP ${Math.min(race.laps, player.lap + 1)}/${race.laps}   POS ${pos}/${cars.length}   ${Math.round(Math.abs(player.speed) * 3.6)} km/h\n` +
    `TIME ${fmt(race.time)}   LAP BEST ${fmt(player.bestLap)}   RECORD ${fmt(best)}\n${player.boostT > 0 ? 'BOOST!' : player.drifting ? 'DRIFT ' + '▮'.repeat(driftTier(player.driftT) + 1) : '[SPACE] drift → boost'}\n` +
    (count ? `\n${count}` : result ? `\nFINISHED — P${result.pos} · GRADE ${result.grade} · ${fmt(result.time)}${result.newBest ? ' · NEW RECORD!' : ''}${portal.embedded && result.rp ? ` · +${result.rp} RP` : ''}   [R] race again` : '') +
    `\n\n${order.map((c, i) => `${i + 1}. ${c.name}`).join('\n')}`;
}
