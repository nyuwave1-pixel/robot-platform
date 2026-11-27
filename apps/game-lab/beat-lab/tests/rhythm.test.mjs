import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeChart, judge, Session, MISS_AFTER } from '../src/logic.js';

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

import { windowsFor, LEVELS, SmoothClock } from '../src/logic.js';

test('difficulty narrows the windows; 5 is the default', () => {
  const easy = windowsFor(LEVELS.EASY.difficulty), hard = windowsFor(LEVELS.HARD.difficulty), mid = windowsFor(5);
  assert.equal(mid[0].within, 0.045);
  for (let i = 0; i < 3; i++) assert.ok(easy[i].within > mid[i].within && mid[i].within > hard[i].within);
  assert.equal(judge(0.04, hard).grade, 'GREAT', 'a 40 ms hit is no longer PERFECT on HARD');
  assert.equal(judge(0.04, easy).grade, 'PERFECT');
});

test('hold notes: keep the key down to the tail, early release breaks', () => {
  const s = new Session({ notes: [{ t: 1, lane: 0, len: 1 }, { t: 1, lane: 1, len: 1 }] });
  s.hit(0, 1); s.hit(1, 1.01);
  assert.equal(s.release(1, 1.3).grade, 'BREAK'); assert.equal(s.combo, 0);
  s.update(2.01);
  assert.equal(s.holds.OK, 1); assert.equal(s.holds.BREAK, 1); assert.ok(s.done);
  const m = new Session({ notes: [{ t: 1, lane: 2, len: 0.5 }] });
  m.update(1.5); assert.equal(m.counts.MISS, 1); assert.equal(m.holds.BREAK, 1, 'a missed head loses its tail'); assert.ok(m.done);
});

test('level charts: holds never overlap a note in their lane; HARD is busier', () => {
  for (const [name, L] of Object.entries(LEVELS)) {
    const c = makeChart({ ...L, seed: 11 });
    for (const h of c.notes.filter((n) => n.len)) assert.ok(!c.notes.some((n) => n !== h && n.lane === h.lane && n.t >= h.t && n.t <= h.t + h.len), `${name}: lane ${h.lane} free while held`);
  }
  const perSec = (L) => { const c = makeChart({ ...L, seed: 11 }); return c.notes.length / c.length; };
  assert.ok(perSec(LEVELS.HARD) > perSec(LEVELS.EASY) * 1.4);
  assert.ok(makeChart({ ...LEVELS.NORMAL, seed: 11 }).notes.some((n) => n.len), 'NORMAL has holds');
});

test('smooth clock: steady through audio-buffer jumps, never backward, snaps after a stall', () => {
  const c = new SmoothClock(); let src = 0, maxStep = 0, prev = c.tick(0, 0);
  for (let f = 1; f <= 120; f++) { const real = f / 60; src = Math.floor(real / 0.0107) * 0.0107; const t = c.tick(src, 1 / 60); assert.ok(t >= prev); maxStep = Math.max(maxStep, t - prev); prev = t; }
  assert.ok(maxStep < 0.022, `frame step ${maxStep.toFixed(4)} stays near 1/60`);
  assert.ok(Math.abs(prev - 2) < 0.02, 'tracks the audio clock');
  assert.equal(c.tick(3, 1 / 60), 3, 'a big jump (tab was hidden) snaps');
});
