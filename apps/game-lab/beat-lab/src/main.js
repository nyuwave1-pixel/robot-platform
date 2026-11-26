// BEAT LAB — browser side: Web Audio clock + synthesized backing track, four lanes (D F J K), falling notes.
// Rules live in ./logic.js. Audio-to-visual sync uses AudioContext.currentTime (never Date.now), and a calibration
// offset ([ - ] / [ = ], saved) shifts the judgement clock, as in osu! / StepMania. Notes are drawn on a SmoothClock over the
// audio clock (no stutter); [1] [2] [3] pick EASY / NORMAL / HARD; hold notes: keep the key down to the tail; best per level saved.
import { makeChart, Session, LANES, LEVELS, SmoothClock } from './logic.js';
import { encodeEvents } from './verify.js';
import { createPortal } from './portal.js';
const portal = createPortal('beat-lab'); portal.ready();
const LEVEL_IDS = ['EASY', 'NORMAL', 'HARD'];   // BIT PARK level n = LEVEL_IDS[n - 1] (src/levels.js)

const KEYS = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'], LABELS = ['D', 'F', 'J', 'K'];
const COLORS = ['#5ad1ff', '#ffd35a', '#ffd35a', '#5ad1ff'];
const SCROLL = 520;   // pixels per second
const canvas = document.getElementById('game'), ctx = canvas.getContext('2d'), hud = document.getElementById('hud');
let actx = null, start = 0, chart = null, session = null, seed = 0, events = [], pressed = new Array(LANES).fill(0);
const store = { get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };
let offset = Number(store.get('beat-lab.offset', 0)), level = store.get('beat-lab.level', 'NORMAL'), saved = false;
if (!LEVELS[level]) level = 'NORMAL';
const clock = new SmoothClock(); let lastFrame = performance.now(), drawT = 0;
const best = () => JSON.parse(store.get('beat-lab.best.' + level, 'null'));

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
  const L = LEVELS[level];
  seed = Math.floor(Math.random() * 1e6); events = [];
  chart = makeChart({ ...L, bars: 16, seed });
  session = new Session(chart, { difficulty: L.difficulty }); saved = false; clock.time = null;
  portal.levelStart(LEVEL_IDS.indexOf(level) + 1);
  start = actx.currentTime + 0.3;
  scheduleMusic(chart);
}

addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const pick = { Digit1: 'EASY', Digit2: 'NORMAL', Digit3: 'HARD' }[e.code];
  if (pick && (!session || session.done)) { level = pick; store.set('beat-lab.level', level); return; }
  if (e.code === 'Minus' || e.code === 'Equal') { offset += e.code === 'Minus' ? -0.005 : 0.005; store.set('beat-lab.offset', offset); return; }
  if (!session || session.done) { begin(); return; }
  const lane = KEYS.indexOf(e.code); if (lane < 0) return;
  pressed[lane] = now();
  const ms = songMs(); if (ms == null) return;
  events.push({ lane, ms }); session.update(ms / 1000); session.hit(lane, ms / 1000);
});
addEventListener('keyup', (e) => {
  const lane = KEYS.indexOf(e.code); if (lane < 0 || !session || session.done) return;
  const ms = songMs(); if (ms == null) return;
  events.push({ lane, ms, up: true }); session.update(ms / 1000); session.release(lane, ms / 1000);
});
/** The song clock in whole ms (the replay proof stores exactly these, so verify.js judges the same times). */
function songMs() { const ms = Math.round((now() - offset) * 1000); return ms >= 0 ? Math.max(ms, events.length ? events.at(-1).ms : 0) : null; }
addEventListener('pointerdown', () => { if (!session || session.done) begin(); });

function draw() {
  requestAnimationFrame(draw);
  const f = performance.now(), dt = Math.min(0.1, (f - lastFrame) / 1000); lastFrame = f;
  drawT = actx ? clock.tick(now(), dt) : 0;
  const W = innerWidth, H = innerHeight, laneW = Math.min(110, W / 6), x0 = (W - laneW * LANES) / 2, hitY = H - 120, t = drawT;
  ctx.fillStyle = '#0b0f14'; ctx.fillRect(0, 0, W, H);
  for (let l = 0; l < LANES; l++) {
    ctx.fillStyle = l % 2 ? '#121a22' : '#0f161d'; ctx.fillRect(x0 + l * laneW, 0, laneW, H);
    const glow = Math.max(0, 1 - (t - pressed[l]) * 6);
    ctx.fillStyle = `rgba(255,255,255,${0.08 + glow * 0.25})`; ctx.fillRect(x0 + l * laneW + 4, hitY - 10, laneW - 8, 20);
    ctx.fillStyle = '#8fa3b5'; ctx.font = '600 16px system-ui'; ctx.textAlign = 'center'; ctx.fillText(LABELS[l], x0 + l * laneW + laneW / 2, hitY + 50);
  }
  if (!session) { ctx.fillStyle = '#e8ecef'; ctx.font = '600 22px system-ui'; ctx.textAlign = 'center'; ctx.fillText('PRESS ANY KEY / CLICK TO START', W / 2, H / 2); ctx.font = '500 16px system-ui'; ctx.fillText(levelLine(), W / 2, H / 2 + 34); hud.textContent = 'BEAT LAB'; return; }
  session.update(now() - offset);   // judge on the real audio clock; draw on the smooth one
  for (const n of session.notes) {
    const head = hitY - (n.t - (t - offset)) * SCROLL, x = x0 + n.lane * laneW;
    if (n.len && n.tail !== 'OK') {   // hold body: from the head (or the judge line while held) up to the tail
      const top = hitY - (n.t + n.len - (t - offset)) * SCROLL, bottom = n.held ? hitY : head;
      if (bottom > -30 && top < H + 30) { ctx.fillStyle = n.tail === 'BREAK' ? '#3a2424' : n.held ? '#ffffffaa' : COLORS[n.lane] + '88'; ctx.fillRect(x + laneW / 2 - 12, top, 24, Math.max(0, bottom - top)); }
    }
    if (n.result && n.result !== 'MISS') continue;
    if (head < -30 || head > H + 30) continue;
    ctx.fillStyle = n.result === 'MISS' ? '#5a2a2a' : COLORS[n.lane]; ctx.fillRect(x + 8, head - 9, laneW - 16, 18);
  }
  const L = session.last;
  if (L && t - L.at < 0.6) { ctx.fillStyle = { PERFECT: '#7dff9a', GREAT: '#5ad1ff', GOOD: '#ffd35a', MISS: '#ff5a5a', HOLD: '#c8a2ff', BREAK: '#ff5a5a' }[L.grade]; ctx.font = '700 32px system-ui'; ctx.textAlign = 'center'; ctx.fillText(L.grade, W / 2, hitY - 160); }
  const c = session.counts;
  if (session.done && !saved) {
    saved = true; const b = best(), r = { score: Math.round(session.score), acc: +session.accuracy.toFixed(1), rank: session.rank };
    if (!b || r.score > b.score) { store.set('beat-lab.best.' + level, JSON.stringify(r)); session.newBest = true; }
    session.rp = portal.result({ level: LEVEL_IDS.indexOf(level) + 1, score: r.score, grade: r.rank, mode: level, seconds: chart.length,
      stars: { S: 3, A: 2, B: 1 }[r.rank] || 0, proof: { seed, events: encodeEvents(events) } });
  }
  hud.textContent = `BEAT LAB   ${level} · ${chart.bpm} BPM\nSCORE ${Math.round(session.score)}   COMBO ${session.combo}   ACC ${session.accuracy.toFixed(1)}%\nPERFECT ${c.PERFECT}  GREAT ${c.GREAT}  GOOD ${c.GOOD}  MISS ${c.MISS}  HOLD ${session.holds.OK}/${session.holds.OK + session.holds.BREAK}\nOFFSET ${(offset * 1000).toFixed(0)} ms  [ - / = ]` + (session.done ? `\n\nRANK ${session.rank} — MAX COMBO ${session.maxCombo}${session.newBest ? ' — NEW BEST!' : ''}${portal.embedded && session.rp ? ` — +${session.rp} RP` : ''}\n${levelLine()}\npress any key` : '');
}
function levelLine() { const b = best(); return `[1] EASY  [2] NORMAL  [3] HARD  —  ${level}` + (b ? `   BEST ${b.score} (${b.rank}, ${b.acc}%)` : ''); }
draw();
