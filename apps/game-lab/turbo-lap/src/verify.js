// Replay verifier (BIT PARK score server, airobotphysical RP check): re-runs the whole race — rivals included — from the
// recorded player inputs with the same fixed-step rules, and returns the finishing position and time it really gives.
// proof = { inputs: "mask*ticks,mask*ticks,…" }  (run-length; mask = throttle 1 | brake 2 | left 4 | right 8 | drift 16)
import { createRace, raceTick, finishOrder, TICK } from './logic.js';
import { LEVELS } from './levels.js';

const MAX_TICKS = 60 * 60 * 10;   // a 10-minute cap

export function encodeInputs(masks) {
  const out = []; let prev = -1, n = 0;
  for (const m of masks) { if (m === prev) n++; else { if (n) out.push(`${prev}*${n}`); prev = m; n = 1; } }
  if (n) out.push(`${prev}*${n}`);
  return out.join(',');
}
export function decodeInputs(s) {
  if (typeof s !== 'string' || s.length > 200000) return null;
  const masks = [];
  for (const part of s ? s.split(',') : []) {
    const m = /^(\d{1,2})\*(\d{1,6})$/.exec(part); if (!m || +m[1] > 31) return null;
    for (let i = 0; i < +m[2]; i++) { masks.push(+m[1]); if (masks.length > MAX_TICKS) return null; }
  }
  return masks;
}

export function verify(levelIndex0, proof) {
  const L = LEVELS[levelIndex0]; if (!L || !proof || typeof proof !== 'object') return { ok: false };
  const masks = decodeInputs(proof.inputs); if (!masks) return { ok: false };
  const race = createRace(L);
  for (const m of masks) { raceTick(race, m); if (race.player.finished) break; }
  if (!race.player.finished) return { ok: false };
  const position = finishOrder(race).indexOf(race.player) + 1;
  return { ok: true, metric: position, seconds: +(race.time).toFixed(2), bestLap: +race.player.bestLap.toFixed(2), ticks: race.tick, tick: TICK };
}
