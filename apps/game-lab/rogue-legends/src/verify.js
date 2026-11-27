// Replay verifier (BIT PARK score server, airobotphysical RP check): rebuilds the run from (seed, hero, level) and replays
// every recorded action through the same rules; an illegal action anywhere rejects the proof.
// proof = { seed, actions: "g0:2,p0.0,p1.-1,e,…" }. metric = turns used for a won run (lower is better).
import { newRun, apply, decode, encode, grade } from './logic.js';
import { LEVELS } from './levels.js';

export const encodeActions = (list) => list.map(encode).join(',');

export function replay(L, seed, tokens) {
  const S = newRun({ seed, hero: L.hero, level: L.level });
  for (const tok of tokens) { const act = decode(tok); if (!act) throw new Error('bad token ' + tok); apply(S, act); }
  return S;
}

export function verify(levelIndex0, proof) {
  const L = LEVELS[levelIndex0];
  if (!L || !proof || typeof proof !== 'object') return { ok: false };
  const seed = proof.seed; if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) return { ok: false };
  if (typeof proof.actions !== 'string' || proof.actions.length > 200000) return { ok: false };
  const tokens = proof.actions ? proof.actions.split(',') : [];
  if (tokens.length > 20000) return { ok: false };
  let S;
  try { S = replay(L, seed, tokens); } catch { return { ok: false }; }
  if (!S.result) return { ok: false };                       // the run has to be over
  const r = S.result;
  return { ok: r.won, metric: r.won ? r.turns : 0, won: r.won, score: r.score, grade: grade(S), floor: r.floor, turns: r.turns, kills: r.kills, elites: r.elites, hp: r.hp };
}
