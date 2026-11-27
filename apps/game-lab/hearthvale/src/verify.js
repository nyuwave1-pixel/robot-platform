// Replay verifier (BIT PARK score server, airobotphysical RP check): rebuilds the season from (seed, level) and replays
// every recorded action through the same rules; an illegal action anywhere rejects the proof. Paid PP items are cosmetic
// or unranked modes, so they are not part of the proof and cannot change a verified score.
// proof = { seed, actions: "t6,p6t,w6,…,z" }. metric = season score (coins + 40 × hearts) — HIGHER is better.
import { newGame, apply, decode, encode, LEVEL_RULES } from './logic.js';
import { LEVELS } from './levels.js';

export const encodeActions = (list) => list.map(encode).join(',');

export function replay(L, seed, tokens) {
  const S = newGame({ seed, level: L.level });
  for (const tok of tokens) { const act = decode(tok); if (!act) throw new Error('bad token ' + tok); apply(S, act); }
  return S;
}

export function verify(levelIndex0, proof) {
  const L = LEVELS[levelIndex0];
  if (!L || !proof || typeof proof !== 'object') return { ok: false };
  const seed = proof.seed; if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) return { ok: false };
  if (typeof proof.actions !== 'string' || proof.actions.length > 60000) return { ok: false };
  const tokens = proof.actions ? proof.actions.split(',') : [];
  if (tokens.length > 8000) return { ok: false };
  let S;
  try { S = replay(L, seed, tokens); } catch { return { ok: false }; }
  if (!S.result) return { ok: false };                       // the season has to be over
  const r = S.result;
  return { ok: r.won, metric: r.won ? r.score : 0, won: r.won, score: r.score, grade: r.grade, coins: r.coins, hearts: r.hearts, target: LEVEL_RULES[L.level].target };
}
