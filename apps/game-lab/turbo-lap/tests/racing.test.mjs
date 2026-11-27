import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeTrack, locate, newCar, step, updateLap, aiInput, standings, CIRCUIT, CAR } from '../src/logic.js';

const track = makeTrack(CIRCUIT);

test('track is closed and about a kilometre', () => {
  assert.ok(track.length > 900 && track.length < 1600, `length ${track.length}`);
  const l = locate(track, CIRCUIT[0].x, CIRCUIT[0].y + 3);
  assert.ok(l.onTrack); assert.ok(l.dist < 4);
  assert.equal(locate(track, 120, 120).onTrack, false, 'the infield is grass');
});

test('throttle accelerates to the cap, grass caps lower, brakes stop', () => {
  const c = newCar(0, 0, 0);
  for (let i = 0; i < 600; i++) step(c, { throttle: 1, brake: 0, steer: 0 }, 1 / 60, true);
  assert.ok(c.speed > 25 && c.speed <= CAR.maxSpeed, `speed ${c.speed}`);
  for (let i = 0; i < 300; i++) step(c, { throttle: 1, brake: 0, steer: 0 }, 1 / 60, false);
  assert.ok(c.speed <= CAR.grassMax + 0.5, `grass speed ${c.speed}`);
  let frames = 0; while (c.speed > 0 && frames < 600) { step(c, { throttle: 0, brake: 1, steer: 0 }, 1 / 60, true); frames++; }
  assert.ok(frames < 60, `stopped in ${frames} frames from grass speed`);
  for (let i = 0; i < 120; i++) step(c, { throttle: 0, brake: 1, steer: 0 }, 1 / 60, true);
  assert.ok(c.speed < 0 && c.speed >= -12, 'holding brake at a stop reverses (capped)');
});

test('laps count only by going round', () => {
  const c = newCar(0, 0, 0);
  for (let lap = 0; lap < 2; lap++) for (let s = 0; s < track.length; s += 20) updateLap(c, track, s, lap * 60 + s / 20);
  updateLap(c, track, 10, 130);   // over the line a second time
  assert.equal(c.lap, 2); assert.ok(c.bestLap > 0);
  const cheat = newCar(0, 0, 0);
  for (let i = 0; i < 20; i++) { updateLap(cheat, track, 5, i); updateLap(cheat, track, track.length - 5, i + 0.5); }   // wiggle over the line
  assert.equal(cheat.lap, 0, 'crossing the line back and forth does not count');
});

test('an AI driver gets round the circuit', () => {
  const p0 = CIRCUIT[0], c = newCar(p0.x, p0.y, 0); let t = 0;
  while (!c.finished && t < 400) { const l = locate(track, c.x, c.y); step(c, aiInput(c, track), 1 / 30, l.onTrack); updateLap(c, track, locate(track, c.x, c.y).s, t, 1); t += 1 / 30; }
  assert.ok(c.finished, `AI stuck at progress ${c.progress.toFixed(0)} of ${track.length.toFixed(0)}`);
  assert.equal(standings([newCar(0, 0, 0), c])[0], c);
});

import { DRIFT, driftTier } from '../src/logic.js';

test('drift: needs speed, slides the nose in, a long drift earns a bigger boost past top speed', () => {
  const slow = newCar(0, 0, 0); step(slow, { throttle: 1, steer: 1, drift: true }, 1 / 60); assert.equal(slow.drifting, false, 'no drift from standstill');
  const run = (secs) => {
    const c = newCar(0, 0, 0); for (let i = 0; i < 400; i++) step(c, { throttle: 1, steer: 0 }, 1 / 60);
    for (let t = 0; t < secs; t += 1 / 60) step(c, { throttle: 1, steer: 1, drift: true }, 1 / 60);
    const slip = c.slip; step(c, { throttle: 1, steer: 0, drift: false }, 1 / 60); return { c, slip };
  };
  const short = run(0.3), mid = run(1), long = run(2);
  assert.ok(long.slip > 0.3, `nose swings in (${long.slip.toFixed(2)})`);
  assert.equal(short.c.boostV, 0); assert.equal(mid.c.boostV, DRIFT.boost[1]); assert.equal(long.c.boostV, DRIFT.boost[2]);
  assert.equal(driftTier(0.5), 0); assert.equal(driftTier(1), 1); assert.equal(driftTier(2), 2);
  const c = long.c; let top = 0; for (let i = 0; i < 60; i++) { step(c, { throttle: 1, steer: 0 }, 1 / 60); top = Math.max(top, c.speed); }
  assert.ok(top > CAR.maxSpeed + 3, `boost runs past top speed (${top.toFixed(1)})`);
  for (let i = 0; i < 400; i++) step(c, { throttle: 1, steer: 0 }, 1 / 60);
  assert.ok(c.speed <= CAR.maxSpeed + 0.01, 'and settles back');
});

test('drifting turns tighter than gripping at the same speed', () => {
  const turn = (drift) => { const c = newCar(0, 0, 0); for (let i = 0; i < 400; i++) step(c, { throttle: 1, steer: 0 }, 1 / 60);
    const h0 = c.heading; for (let i = 0; i < 60; i++) step(c, { throttle: 1, steer: 1, drift }, 1 / 60); return c.heading - h0; };
  assert.ok(turn(true) > turn(false) * 1.1);
});
