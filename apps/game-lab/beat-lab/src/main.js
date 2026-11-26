// BEAT LAB — browser side: Web Audio clock + synthesized backing track, four lanes (D F J K), falling notes.
// Rules live in ./core/rhythm.js. Audio-to-visual sync uses AudioContext.currentTime (never Date.now), and a calibration
// offset ([ - ] / [ = ], saved) shifts the judgement clock, as in osu! / StepMania.
import { makeChart, Session, LANES } from './core/rhythm.js';

const KEYS = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'], LABELS = ['D', 'F', 'J', 'K'];
const COLORS = ['#5ad1ff', '#ffd35a', '#ffd35a', '#5ad1ff'];
const SCROLL = 520;   // pixels per second
const canvas = document.getElementById('game'), ctx = canvas.getContext('2d'), hud = document.getElementById('hud');
let actx = null, start = 0, chart = null, session = null, pressed = new Array(LANES).fill(0);
let offset = Number(localStorage.getItem('beat-lab.offset') || 0);

function resize() { canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); }
addEventListener('resize', resize); resize();

const now = () => (actx ? actx.currentTime - start : 0);

/** Backing track: kick on beats, hat on eighths, a bass note per bar — scheduled ahead on the audio clock. */
function scheduleMusic(c) {
  const beat = 60 / c.bpm, bars = Math.round((c.length - c.lead) / (4 * beat));
  const tone = (t, f, dur, type = 'sine', gain = 0.3) => {
    const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (type === 'sine' && f < 200) o.frequency.exponentialRampToValueAtTime(40, t + dur);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur);
  };
  const roots = [110, 87.3, 98, 82.4];
  for (let i = 0; i < bars * 8; i++) {
    const t = start + c.lead + i * beat / 2;
    if (i % 2 === 0) tone(t, 150, 0.18, 'sine', 0.55);                 // kick
    tone(t, 8000, 0.03, 'square', 0.025);                                 // hat
    if (i % 8 === 0) tone(t, roots[(i / 8) % 4], beat * 3.5, 'triangle', 0.18);   // bass
  }
}

function begin() {
  actx = actx || new AudioContext();
  chart = makeChart({ bpm: 128, bars: 16, seed: Math.floor(Math.random() * 1e6) });
  session = new Session(chart);
  start = actx.currentTime + 0.3;
  scheduleMusic(chart);
}

addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (!session || session.done) { begin(); return; }
  if (e.code === 'Minus' || e.code === 'Equal') { offset += e.code === 'Minus' ? -0.005 : 0.005; localStorage.setItem('beat-lab.offset', offset); return; }
  const lane = KEYS.indexOf(e.code); if (lane < 0) return;
  pressed[lane] = now();
  session.hit(lane, now() - offset);
});
addEventListener('pointerdown', () => { if (!session || session.done) begin(); });

function draw() {
  requestAnimationFrame(draw);
  const W = innerWidth, H = innerHeight, laneW = Math.min(110, W / 6), x0 = (W - laneW * LANES) / 2, hitY = H - 120, t = now();
  ctx.fillStyle = '#0b0f14'; ctx.fillRect(0, 0, W, H);
  for (let l = 0; l < LANES; l++) {
    ctx.fillStyle = l % 2 ? '#121a22' : '#0f161d'; ctx.fillRect(x0 + l * laneW, 0, laneW, H);
    const glow = Math.max(0, 1 - (t - pressed[l]) * 6);
    ctx.fillStyle = `rgba(255,255,255,${0.08 + glow * 0.25})`; ctx.fillRect(x0 + l * laneW + 4, hitY - 10, laneW - 8, 20);
    ctx.fillStyle = '#8fa3b5'; ctx.font = '600 16px system-ui'; ctx.textAlign = 'center'; ctx.fillText(LABELS[l], x0 + l * laneW + laneW / 2, hitY + 50);
  }
  if (!session) { ctx.fillStyle = '#e8ecef'; ctx.font = '600 22px system-ui'; ctx.textAlign = 'center'; ctx.fillText('PRESS ANY KEY / CLICK TO START', W / 2, H / 2); hud.textContent = 'BEAT LAB'; return; }
  session.update(t - offset);
  for (const n of session.notes) {
    if (n.result && n.result !== 'MISS') continue;
    const y = hitY - (n.t - (t - offset)) * SCROLL; if (y < -30 || y > H + 30) continue;
    ctx.fillStyle = n.result === 'MISS' ? '#5a2a2a' : COLORS[n.lane]; ctx.fillRect(x0 + n.lane * laneW + 8, y - 9, laneW - 16, 18);
  }
  const L = session.last;
  if (L && t - L.at < 0.6) { ctx.fillStyle = { PERFECT: '#7dff9a', GREAT: '#5ad1ff', GOOD: '#ffd35a', MISS: '#ff5a5a' }[L.grade]; ctx.font = '700 32px system-ui'; ctx.textAlign = 'center'; ctx.fillText(L.grade, W / 2, hitY - 160); }
  const c = session.counts;
  hud.textContent = `BEAT LAB   ${chart.bpm} BPM\nSCORE ${Math.round(session.score)}   COMBO ${session.combo}   ACC ${session.accuracy.toFixed(1)}%\nPERFECT ${c.PERFECT}  GREAT ${c.GREAT}  GOOD ${c.GOOD}  MISS ${c.MISS}\nOFFSET ${(offset * 1000).toFixed(0)} ms  [ - / = ]` + (session.done ? `\n\nRANK ${session.rank} — MAX COMBO ${session.maxCombo} — press any key` : '');
}
draw();
