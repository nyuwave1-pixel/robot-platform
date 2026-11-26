import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeChart, judge, Session, MISS_AFTER } from '../src/core/rhythm.js';

test('chart is deterministic, sorted and inside the song', () => {
  const a = makeChart({ seed: 3 }), b = makeChart({ seed: 3 });
  assert.deepEqual(a.notes, b.notes);
  assert.ok(a.notes.length > 40);
  for (let i = 1; i < a.notes.length; i++) { assert.ok(a.notes[i].t > a.notes[i - 1].t); assert.notEqual(a.notes[i].lane, a.notes[i - 1].lane); }
  assert.ok(a.notes.at(-1).t < a.length);
});

test('judgement windows', () => {
  assert.equal(judge(0.01).grade, 'PERFECT'); assert.equal(judge(-0.06).grade, 'GREAT');
  assert.equal(judge(0.13).grade, 'GOOD'); assert.equal(judge(0.2), null);
});

test('hits, misses, combo and accuracy', () => {
  const s = new Session({ notes: [{ t: 1, lane: 0 }, { t: 1.5, lane: 1 }, { t: 2, lane: 2 }] });
  assert.equal(s.hit(0, 1.02).grade, 'PERFECT');
  assert.equal(s.hit(3, 1.5), null, 'nothing in that lane: no penalty');
  assert.equal(s.hit(1, 1.58).grade, 'GREAT');
  assert.equal(s.combo, 2);
  s.update(2 + MISS_AFTER + 0.01);
  assert.equal(s.counts.MISS, 1); assert.equal(s.combo, 0); assert.ok(s.done);
  assert.ok(Math.abs(s.accuracy - (3 + 2) / 9 * 100) < 1e-9);
  assert.equal(s.maxCombo, 2);
});
