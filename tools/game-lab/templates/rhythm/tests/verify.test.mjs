import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verify, encodeEvents } from '../src/verify.js';
import { LEVELS } from '../src/levels.js';
import { makeChart } from '../src/logic.js';

/** A bot that plays a chart: hits each note `err` ms late and holds to the tail; `skip` drops every n-th note. */
function play(level, seed, err = 10, skip = 0) {
  const L = LEVELS[level], chart = makeChart({ ...L, seed }), ev = [];
  chart.notes.forEach((n, i) => {
    if (skip && i % skip === 0) return;
    const ms = Math.round(n.t * 1000) + err; ev.push({ lane: n.lane, ms });
    ev.push({ lane: n.lane, ms: n.len ? Math.round((n.t + n.len) * 1000) + 5 : ms + 60, up: true });
  });
  ev.sort((a, b) => a.ms - b.ms || (a.up ? -1 : 1));
  return { chart, events: encodeEvents(ev) };
}

test('a clean replay verifies with the same score the game would show', () => {
  const { chart, events } = play(1, 4242);
  const r = verify(1, { seed: 4242, events });
  assert.equal(r.ok, true); assert.equal(r.metric, 0); assert.equal(r.rank, 'S');
  assert.equal(r.accuracy, 100); assert.equal(r.maxCombo, chart.notes.length + chart.notes.filter((n) => n.len).length, 'every head and tail');
  // perfect play score: 300 per head, 100 per tail, × (1 + combo/100) capped at ×2, in judgement order
  const order = chart.notes.flatMap((n) => [[n.t, 300], ...(n.len ? [[n.t + n.len, 100]] : [])]).sort((a, b) => a[0] - b[0]);
  const expect = order.reduce((sum, [, pts], i) => sum + pts * (1 + Math.min(i + 1, 100) / 100), 0);
  assert.equal(r.score, Math.round(expect));
});

test('misses count in the metric; level and seed must match the events', () => {
  const { events } = play(2, 99, 20, 5);
  const r = verify(2, { seed: 99, events }); assert.ok(r.ok); assert.ok(r.metric > 5);
  assert.ok(verify(2, { seed: 100, events }).metric > r.metric, 'another seed is another chart');
});

test('malformed proofs are rejected', () => {
  assert.equal(verify(9, { seed: 1, events: '' }).ok, false);
  assert.equal(verify(0, { seed: -1, events: '' }).ok, false);
  assert.equal(verify(0, { seed: 1, events: 'x9:1' }).ok, false);
  assert.equal(verify(0, { seed: 1, events: 'd0:500,d1:400' }).ok, false, 'time goes forward');
  assert.equal(verify(0, { seed: 1, events: Array(3000).fill('d0:1').join(',') }).ok, false, 'mashing');
  assert.equal(verify(0, { seed: 1, events: '' }).ok, true, 'an empty play is a valid (all-miss) play');
});
