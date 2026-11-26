// Rhythm game rules — no browser APIs, tested with `node --test`.
// Timing judgement like the big open rhythm games (osu!, StepMania/Etterna): windows around each note's time, earliest
// unjudged note in the lane wins, notes that pass the last window are misses. All times are seconds on the audio clock.

export const LANES = 4;
export const WINDOWS = [
  { grade: 'PERFECT', within: 0.045, score: 300 },
  { grade: 'GREAT', within: 0.09, score: 200 },
  { grade: 'GOOD', within: 0.135, score: 100 },
];
export const MISS_AFTER = WINDOWS[WINDOWS.length - 1].within;

/** Deterministic PRNG (mulberry32) so a seed always gives the same chart. */
export function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** A chart: quarter notes, eighth-note runs in later bars, no lane repeated twice in a row. */
export function makeChart({ bpm = 120, bars = 16, lead = 2, seed = 7, lanes = LANES } = {}) {
  const rnd = mulberry(seed), beat = 60 / bpm, notes = [];
  let prev = -1;
  const lane = () => { let l; do { l = Math.floor(rnd() * lanes); } while (l === prev && lanes > 1); prev = l; return l; };
  for (let bar = 0; bar < bars; bar++) {
    const busy = bar >= bars / 2;                // second half: eighth-note runs
    for (let step = 0; step < 8; step++) {
      const onBeat = step % 2 === 0;
      if (!onBeat && !(busy && rnd() < 0.45)) continue;
      if (onBeat && rnd() < 0.12) continue;      // a few rests
      notes.push({ t: lead + (bar * 8 + step) * beat / 2, lane: lane() });
    }
  }
  return { bpm, lead, length: lead + bars * 4 * beat, notes };
}

/** Grade of a hit `delta` seconds from the note (negative = early), or null outside every window. */
export function judge(delta) {
  const d = Math.abs(delta);
  for (const w of WINDOWS) if (d <= w.within) return w;
  return null;
}

/** One play of a chart: feed it key presses and the clock; it keeps score, combo and counts. */
export class Session {
  constructor(chart) {
    this.notes = chart.notes.map((n) => ({ ...n, result: null })).sort((a, b) => a.t - b.t);
    this.score = 0; this.combo = 0; this.maxCombo = 0;
    this.counts = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 };
    this.last = null;   // the latest judgement, for the screen
  }
  /** A key went down in `lane` at `time`; returns the judgement or null (nothing in reach: no penalty, like osu!). */
  hit(lane, time) {
    const note = this.notes.find((n) => !n.result && n.lane === lane && Math.abs(time - n.t) <= MISS_AFTER);
    if (!note) return null;
    const w = judge(time - note.t);
    note.result = w.grade; this.counts[w.grade]++; this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.score += w.score * (1 + Math.min(this.combo, 100) / 100);   // combo bonus, capped at ×2
    this.last = { grade: w.grade, delta: time - note.t, lane, at: time };
    return this.last;
  }
  /** Advance the clock: notes whose last window has passed become misses. */
  update(time) {
    for (const n of this.notes) {
      if (n.result || time - n.t <= MISS_AFTER) continue;
      n.result = 'MISS'; this.counts.MISS++; this.combo = 0; this.last = { grade: 'MISS', lane: n.lane, at: time };
    }
  }
  get judged() { return this.notes.filter((n) => n.result).length; }
  get done() { return this.judged === this.notes.length; }
  /** Accuracy 0–100 %: PERFECT 1, GREAT 2/3, GOOD 1/3, MISS 0 (osu!-style weighting). */
  get accuracy() {
    const c = this.counts, n = c.PERFECT + c.GREAT + c.GOOD + c.MISS;
    return n ? ((c.PERFECT * 3 + c.GREAT * 2 + c.GOOD) / (n * 3)) * 100 : 100;
  }
  get rank() { const a = this.accuracy; return a >= 95 ? 'S' : a >= 85 ? 'A' : a >= 70 ? 'B' : a >= 50 ? 'C' : 'D'; }
}
