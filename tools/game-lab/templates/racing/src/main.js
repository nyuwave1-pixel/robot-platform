// __NAME__ — browser side: top-down Canvas view with a chase camera that turns with your car, three AI rivals, 3-lap race.
// Rules live in ./core/racing.js. Controls: W/↑ throttle, S/↓ brake/reverse, A D/← → steer, R restart.
import { makeTrack, locate, newCar, step, updateLap, aiInput, standings, CIRCUIT } from './core/racing.js';

const LAPS = 3, SCALE = 3.2;   // pixels per metre
const canvas = document.getElementById('game'), ctx = canvas.getContext('2d'), hud = document.getElementById('hud');
const track = makeTrack(CIRCUIT), keys = new Set();
let cars, player, time, countdown;

function resize() { canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); }
addEventListener('resize', resize); resize();
addEventListener('keydown', (e) => { keys.add(e.code); if (e.code === 'KeyR') reset(); });
addEventListener('keyup', (e) => keys.delete(e.code));

function reset() {
  const a = track.pts[0], b = track.pts[1], h = Math.atan2(b.y - a.y, b.x - a.x);
  const grid = (i) => { const back = 8 + i * 9, side = i % 2 ? 3.5 : -3.5; return newCar(a.x - Math.cos(h) * back - Math.sin(h) * side, a.y - Math.sin(h) * back + Math.cos(h) * side, h); };
  cars = [0, 1, 2, 3].map(grid);
  cars.forEach((c, i) => { c.name = i === 0 ? 'YOU' : ['VIPER', 'NOMAD', 'ATLAS'][i - 1]; c.color = ['#ffd35a', '#ff5a5a', '#5ad1ff', '#7dff9a'][i]; c.skill = [1, 0.93, 0.9, 0.87][i]; const l = locate(track, c.x, c.y); c.lastS = l.s; c.progress = l.s - track.length; });
  player = cars[0]; time = 0; countdown = 3;
}
reset();

let prev = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
  if (countdown > 0) countdown -= dt; else time += dt;
  for (const c of cars) {
    if (c.finished) { step(c, { throttle: 0, brake: 0.3, steer: 0 }, dt, true); continue; }
    const l = locate(track, c.x, c.y);
    const input = countdown > 0 ? { throttle: 0, brake: 1, steer: 0 }
      : c === player ? { throttle: +(keys.has('KeyW') || keys.has('ArrowUp')), brake: +(keys.has('KeyS') || keys.has('ArrowDown')), steer: (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) }
      : (() => { const a = aiInput(c, track, c.skill); return a; })();
    step(c, input, dt, l.onTrack);
    updateLap(c, track, locate(track, c.x, c.y).s, time, LAPS);
  }
  draw();
}
requestAnimationFrame(frame);

function draw() {
  const W = innerWidth, H = innerHeight;
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
  for (const c of cars) { ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.heading); ctx.fillStyle = c.color; ctx.fillRect(-2.2, -1.1, 4.4, 2.2); ctx.fillStyle = '#111'; ctx.fillRect(0.6, -0.9, 1.1, 1.8); ctx.restore(); }
  ctx.restore();
  const order = standings(cars), pos = order.indexOf(player) + 1, fmt = (t) => (t == null ? '—' : `${Math.floor(t / 60)}:${(t % 60).toFixed(2).padStart(5, '0')}`);
  hud.textContent = `__NAME__\nLAP ${Math.min(LAPS, player.lap + 1)}/${LAPS}   POS ${pos}/${cars.length}   ${Math.round(Math.abs(player.speed) * 3.6)} km/h\nTIME ${fmt(time)}   BEST ${fmt(player.bestLap)}\n` +
    (countdown > 0 ? `\n${Math.ceil(countdown)}` : player.finished ? `\nFINISHED — P${pos}   [R] race again` : '') + `\n\n${order.map((c, i) => `${i + 1}. ${c.name}`).join('\n')}`;
}
