import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verify, encodeActions, replay } from '../src/verify.js';
import { LEVELS } from '../src/levels.js';
import { playRun } from '../tools/sim.mjs';

function wonRun(L) { for (let s = 1; s < 400; s++) { const r = playRun(s * 101, L.hero, L.level); if (r.S.result.won) return { seed: s * 101, ...r }; } }

test('a won run verifies with the same turns and score', () => {
  const L = LEVELS[0], w = wonRun(L);
  const r = verify(0, { seed: w.seed, actions: encodeActions(w.acts) });
  assert.equal(r.ok, true); assert.equal(r.metric, w.S.result.turns); assert.equal(r.score, w.S.result.score);
});

test('a lost run is not a clear; a tampered or unfinished proof fails', () => {
  const L = LEVELS[1]; let lost;
  for (let s = 1; !lost; s++) { const r = playRun(s * 13, L.hero, L.level); if (!r.S.result.won) lost = { seed: s * 13, ...r }; }
  const v = verify(1, { seed: lost.seed, actions: encodeActions(lost.acts) });
  assert.equal(v.ok, false); assert.equal(v.won, false); assert.ok(v.score > 0, 'still scored (for RP grade)');
  const w = wonRun(LEVELS[0]), toks = encodeActions(w.acts).split(',');
  assert.equal(verify(0, { seed: w.seed, actions: toks.slice(0, -3).join(',') }).ok, false, 'unfinished');
  assert.equal(verify(0, { seed: w.seed + 1, actions: toks.join(',') }).ok, false, 'another seed is another run');
  const bad = toks.slice(); bad[2] = 'p9.0'; assert.equal(verify(0, { seed: w.seed, actions: bad.join(',') }).ok, false, 'illegal play');
  assert.equal(verify(0, { seed: -1, actions: '' }).ok, false); assert.equal(verify(99, { seed: 1, actions: '' }).ok, false);
  assert.ok(replay(LEVELS[0], w.seed, toks).result.won);
});
