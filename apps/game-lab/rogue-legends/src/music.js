// Generative background music (Web Audio, no files): a low drone plus a slow arpeggio in D minor. The mood follows the
// game: 'map' calm, 'combat' faster and brighter, 'boss' lower and heavier. Off until the first click (browser autoplay
// rules); M toggles it, the choice is remembered.
const KEY = 'rogue-legends.music';
let ctx = null, master = null, timer = 0, step = 0, mood = 'map', drone = null;
let on = (() => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } })();

const SCALE = [0, 2, 3, 5, 7, 8, 10];                          // natural minor
const MOODS = {
  map: { root: 50, bpm: 72, pattern: [0, 2, 4, 2, 0, 4, 6, 4], gain: 0.05 },
  combat: { root: 50, bpm: 112, pattern: [0, 4, 2, 4, 0, 5, 4, 2], gain: 0.06 },
  boss: { root: 45, bpm: 96, pattern: [0, 1, 4, 1, 0, 5, 4, 6], gain: 0.07 },
};
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

function ensure() {
  if (ctx) return true;
  try { ctx = new AudioContext(); } catch { return false; }
  master = ctx.createGain(); master.gain.value = on ? 1 : 0; master.connect(ctx.destination);
  return true;
}
function setDrone() {
  if (!ctx) return;
  if (drone) { const d = drone; d.g.gain.setTargetAtTime(0, ctx.currentTime, 0.4); setTimeout(() => d.o.forEach((o) => o.stop()), 2000); }
  const M = MOODS[mood], g = ctx.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(M.gain * 0.8, ctx.currentTime, 1.2);
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = mood === 'boss' ? 380 : 520;
  const o = [0, 7, 12].map((iv, i) => { const x = ctx.createOscillator(); x.type = i ? 'sine' : 'sawtooth'; x.frequency.value = hz(M.root - 12 + iv); x.detune.value = i * 4; x.connect(f); x.start(); return x; });
  f.connect(g).connect(master); drone = { o, g };
}
function note(t, midi, len, gain) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'triangle'; o.frequency.value = hz(midi);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g).connect(master); o.start(t); o.stop(t + len + 0.05);
}
function tick() {
  const M = MOODS[mood], beat = 60 / M.bpm / 2, deg = M.pattern[step % M.pattern.length];
  const oct = Math.floor(deg / 7), midi = M.root + 12 + SCALE[deg % 7] + 12 * oct;
  note(ctx.currentTime + 0.05, midi, beat * 1.8, M.gain);
  if (step % 8 === 0) note(ctx.currentTime + 0.05, M.root + SCALE[(step / 8) % 2 ? 3 : 0], beat * 7, M.gain * 0.8);
  step++;
  timer = setTimeout(tick, beat * 1000);
}

/** Start (after a user gesture) or switch mood: 'map' | 'combat' | 'boss'. */
export function music(next) {
  if (!ensure()) return;
  if (ctx.state === 'suspended') ctx.resume();
  if (next !== mood || !drone) { mood = next; setDrone(); }
  if (!timer) tick();
}
export const musicOn = () => on;
export function toggleMusic() {
  on = !on; try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* private mode */ }
  if (master) master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.1);
  return on;
}
