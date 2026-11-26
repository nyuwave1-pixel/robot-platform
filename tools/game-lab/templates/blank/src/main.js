// __NAME__ — browser side: a fixed-step loop, input and drawing. Rules: ./core/state.js.
import { newState, update } from './core/state.js';
const canvas = document.getElementById('game'), ctx = canvas.getContext('2d'), hud = document.getElementById('hud');
const keys = new Set(); addEventListener('keydown', (e) => keys.add(e.code)); addEventListener('keyup', (e) => keys.delete(e.code));
function resize() { canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); }
addEventListener('resize', resize); resize();
const state = newState(); let prev = performance.now(), acc = 0; const STEP = 1 / 60;
function frame(now) {
  requestAnimationFrame(frame); acc += Math.min(0.25, (now - prev) / 1000); prev = now;
  while (acc >= STEP) { update(state, STEP, { action: keys.has('Space') }); acc -= STEP; }
  ctx.fillStyle = '#0b0f14'; ctx.fillRect(0, 0, innerWidth, innerHeight);
  ctx.fillStyle = '#5ad1ff'; ctx.beginPath(); ctx.arc(innerWidth / 2 + Math.sin(state.t * 2) * 120, innerHeight / 2, 24, 0, Math.PI * 2); ctx.fill();
  hud.textContent = `__NAME__\nTIME ${state.t.toFixed(1)}   SCORE ${state.score}   [Space]`;
}
requestAnimationFrame(frame);
