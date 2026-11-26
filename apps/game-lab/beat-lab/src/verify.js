// Replay verifier (BIT PARK score server, airobotphysical RP check): rebuilds the chart from the level + seed, replays the
// recorded key presses through the same Session rules, and returns what the game claimed it scored.
// proof = { seed, events: "d0:1234,u0:1500,…" }  (d = key down, u = key up, lane, ms on the song clock, ascending)
import { makeChart, Session } from './logic.js';
import { LEVELS } from './levels.js';

export function encodeEvents(list) { return list.map((e) => `${e.up ? 'u' : 'd'}${e.lane}:${e.ms}`).join(','); }
export function decodeEvents(s) {
  if (typeof s !== 'string' || s.length > 60000) return null;
  if (!s) return [];
  const out = [];
  for (const part of s.split(',')) {
    const m = /^([du])([0-3]):(\d{1,7})$/.exec(part); if (!m) return null;
    out.push({ up: m[1] === 'u', lane: +m[2], ms: +m[3] });
  }
  return out;
}

export function verify(levelIndex0, proof) {
  const L = LEVELS[levelIndex0]; if (!L || !proof || typeof proof !== 'object') return { ok: false };
  const seed = proof.seed; if (!Number.isInteger(seed) || seed < 0 || seed > 1e9) return { ok: false };
  const events = decodeEvents(proof.events); if (!events) return { ok: false };
  const chart = makeChart({ ...L, seed });
  if (events.length > chart.notes.length * 4 + 200) return { ok: false };            // mashing every key is not a play
  for (let i = 1; i < events.length; i++) if (events[i].ms < events[i - 1].ms) return { ok: false };
  const s = new Session(chart, { difficulty: L.difficulty });
  for (const e of events) {
    const t = e.ms / 1000; s.update(t);
    if (e.up) s.release(e.lane, t); else s.hit(e.lane, t);
  }
  s.update(chart.length + 1);
  if (!s.done) return { ok: false };
  // metric: misses + broken holds (lower is better; BIT PARK keeps metrics small)
  return { ok: true, metric: s.counts.MISS + s.holds.BREAK, score: Math.round(s.score), accuracy: +s.accuracy.toFixed(2), rank: s.rank, maxCombo: s.maxCombo };
}
