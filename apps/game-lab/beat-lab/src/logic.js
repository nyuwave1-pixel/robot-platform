// Rhythm game rules — no browser APIs, tested with `node --test`. Self-contained (BIT PARK copies src/logic.js + levels.js + verify.js to its score server).
// Timing judgement like the big open rhythm games (osu!, StepMania/Etterna): windows around each note's time, earliest
// unjudged note in the lane wins, notes that pass the last window are misses. All times are seconds on the audio clock.

export const LANES = 4;
export const WINDOWS = [
  { grade: 'PERFECT', within: 0.045, score: 300 },
  { grade: 'GREAT', within: 0.09, score: 200 },
  { grade: 'GOOD', within: 0.135, score: 100 },
];
export const MISS_AFTER = WINDOWS[WINDOWS.length - 1].within;

/** Difficulty 0 (lenient) … 10 (strict) → judgement windows. Same idea as osu!'s OD (windows shrink linearly with
 * difficulty; studied in ppy/osu HitWindows.cs, MIT) — our own numbers, written from scratch. Difficulty 5 = WINDOWS. */
export function windowsFor(difficulty = 5) {
  const k = Math.max(0, Math.min(10, difficulty)) - 5;
  return WINDOWS.map((w) => ({ ...w, within: +(w.within - k * w.within * 0.06).toFixed(4) }));
}

/** EASY / NORMAL / HARD presets: judgement strictness, tempo, how busy the chart is, and how many hold notes. */
export const LEVELS = {
  EASY: { difficulty: 2, bpm: 110, busy: 0.25, rest: 0.2, holds: 0.08 },
  NORMAL: { difficulty: 5, bpm: 128, busy: 0.45, rest: 0.12, holds: 0.12 },
  HARD: { difficulty: 8, bpm: 150, busy: 0.7, rest: 0.05, holds: 0.15 },
};

/** Deterministic PRNG (mulberry32) so a seed always gives the same chart. */
export function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** A chart: quarter notes, eighth-note runs in later bars, no lane repeated twice in a row. */
/** Hold notes have `len` (seconds): keep the key down until the tail; the lane stays free until then. */
export function makeChart({ bpm = 120, bars = 16, lead = 2, seed = 7, lanes = LANES, busy: busyP = 0.45, rest = 0.12, holds = 0 } = {}) {
  const rnd = mulberry(seed), beat = 60 / bpm, notes = [];
  let prev = -1; const freeAt = new Array(lanes).fill(-1);
  const lane = (t) => {
    const open = [...Array(lanes).keys()].filter((l) => l !== prev && freeAt[l] < t - 1e-6);
    if (!open.length) return -1;                   // every other lane is still held: rest
    prev = open[Math.floor(rnd() * open.length)]; return prev;
  };
  for (let bar = 0; bar < bars; bar++) {
    const busy = bar >= bars / 2;                // second half: eighth-note runs
    for (let step = 0; step < 8; step++) {
      const onBeat = step % 2 === 0;
      if (!onBeat && !(busy && rnd() < busyP)) continue;
      if (onBeat && rnd() < rest) continue;      // a few rests
      const t = lead + (bar * 8 + step) * beat / 2, l = lane(t);
      if (l < 0) continue;
      const n = { t, lane: l };
      if (onBeat && bar < bars - 1 && rnd() < holds) { n.len = beat * (rnd() < 0.5 ? 1 : 2); freeAt[l] = t + n.len; }
      notes.push(n);
    }
  }
  return { bpm, lead, length: lead + bars * 4 * beat, notes };
}

/** Grade of a hit `delta` seconds from the note (negative = early), or null outside every window. */
export function judge(delta, windows = WINDOWS) {
  const d = Math.abs(delta);
  for (const w of windows) if (d <= w.within) return w;
  return null;
}

/** One play of a chart: feed it key presses and the clock; it keeps score, combo and counts. */
export class Session {
  constructor(chart, { difficulty = 5 } = {}) {
    this.windows = windowsFor(difficulty); this.missAfter = this.windows[this.windows.length - 1].within;
    this.notes = chart.notes.map((n) => ({ ...n, result: null, held: false, tail: null })).sort((a, b) => a.t - b.t);
    this.score = 0; this.combo = 0; this.maxCombo = 0;
    this.counts = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 };
    this.holds = { OK: 0, BREAK: 0 };
    this.holding = [];   // per lane: the hold note being held
    this.last = null;   // the latest judgement, for the screen
  }
  /** A key went down in `lane` at `time`; returns the judgement or null (nothing in reach: no penalty, like osu!). */
  hit(lane, time) {
    const note = this.notes.find((n) => !n.result && n.lane === lane && Math.abs(time - n.t) <= this.missAfter);
    if (!note) return null;
    const w = judge(time - note.t, this.windows);
    note.result = w.grade; this.counts[w.grade]++; this.addCombo(w.score);
    if (note.len) { note.held = true; this.holding[lane] = note; }
    this.last = { grade: w.grade, delta: time - note.t, lane, at: time };
    return this.last;
  }
  addCombo(points) {
    this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.score += points * (1 + Math.min(this.combo, 100) / 100);   // combo bonus, capped at ×2
  }
  /** A key went up: letting a hold go before its tail (minus the GOOD window) breaks it and the combo. */
  release(lane, time) {
    const n = this.holding[lane]; if (!n) return null;
    this.holding[lane] = null; n.held = false;
    if (time >= n.t + n.len - this.missAfter) return this.finishHold(n, 'OK', time);
    return this.finishHold(n, 'BREAK', time);
  }
  finishHold(n, how, time) {
    n.tail = how; this.holds[how]++;
    if (how === 'OK') this.addCombo(100); else this.combo = 0;
    this.last = { grade: how === 'OK' ? 'HOLD' : 'BREAK', lane: n.lane, at: time };
    return this.last;
  }
  /** Advance the clock: notes whose last window has passed become misses. */
  update(time) {
    for (const n of this.notes) {
      if (n.held && time >= n.t + n.len) { this.holding[n.lane] = null; n.held = false; this.finishHold(n, 'OK', time); continue; }
      if (n.result || time - n.t <= this.missAfter) continue;
      n.result = 'MISS'; this.counts.MISS++; this.combo = 0; this.last = { grade: 'MISS', lane: n.lane, at: time };
      if (n.len) { n.tail = 'BREAK'; this.holds.BREAK++; }   // a missed head loses the tail too
    }
  }
  get judged() { return this.notes.filter((n) => n.result && (!n.len || n.tail)).length; }
  get done() { return this.judged === this.notes.length; }
  /** Accuracy 0–100 %: PERFECT 1, GREAT 2/3, GOOD 1/3, MISS 0 (osu!-style weighting). */
  get accuracy() {
    const c = this.counts, n = c.PERFECT + c.GREAT + c.GOOD + c.MISS;
    return n ? ((c.PERFECT * 3 + c.GREAT * 2 + c.GOOD) / (n * 3)) * 100 : 100;
  }
  get rank() { const a = this.accuracy; return a >= 95 ? 'S' : a >= 85 ? 'A' : a >= 70 ? 'B' : a >= 50 ? 'C' : 'D'; }
}

/** Smooth game clock over a jumpy audio clock. AudioContext.currentTime advances in audio-buffer steps (often ~3–10 ms,
 * sometimes stalls), which makes falling notes stutter. Idea studied in osu-framework InterpolatingFramedClock (MIT),
 * written from scratch: advance by the frame time, then pull gently toward the source; snap when it is far off. */
export class SmoothClock {
  constructor({ maxDrift = 0.05, pull = 0.12 } = {}) { this.time = null; this.maxDrift = maxDrift; this.pull = pull; }
  /** source = the audio clock now, dt = seconds since the last frame → the time to draw with (never goes backward). */
  tick(source, dt) {
    if (this.time == null || Math.abs(source - this.time - dt) > this.maxDrift) { this.time = Math.max(this.time ?? -Infinity, source); return this.time; }
    const next = this.time + dt; this.time = Math.max(this.time, next + (source - next) * this.pull); return this.time;
  }
}
