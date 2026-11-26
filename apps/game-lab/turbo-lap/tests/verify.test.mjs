import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verify, encodeInputs, decodeInputs } from '../src/verify.js';
import { createRace, raceTick, finishOrder, aiInput, maskOf, COUNTDOWN_TICKS } from '../src/logic.js';
import { LEVELS } from '../src/levels.js';

/** A keyboard bot: the AI's wishes squeezed into on/off keys, like a player's. */
function drive() {
  const race = createRace(LEVELS[0]), masks = [];
  while (!race.player.finished && race.tick < 60 * 60 * 5) {
    const a = aiInput(race.player, race.track, 1);
    const m = race.tick < COUNTDOWN_TICKS ? 1 : maskOf({ throttle: a.throttle, brake: a.brake, left: a.steer < -0.15, right: a.steer > 0.15 });
    masks.push(m); raceTick(race, m);
  }
  return { race, masks };
}

test('a recorded race replays to the same finish', () => {
  const { race, masks } = drive();
  assert.ok(race.player.finished, 'the bot finishes three laps');
  const r = verify(0, { inputs: encodeInputs(masks) });
  assert.equal(r.ok, true);
  assert.equal(r.metric, finishOrder(race).indexOf(race.player) + 1);
  assert.equal(r.seconds, +race.time.toFixed(2));
  assert.ok(r.seconds > 60, `${r.seconds} s for 3 laps`);
});

test('run-length coding round-trips; bad or unfinished proofs fail', () => {
  const masks = [1, 1, 1, 9, 9, 0, 17]; assert.deepEqual(decodeInputs(encodeInputs(masks)), masks);
  assert.equal(verify(0, { inputs: '1*600' }).ok, false, 'did not finish');
  assert.equal(verify(0, { inputs: '99*5' }).ok, false);
  assert.equal(verify(0, { inputs: '1*9999999' }).ok, false);
  assert.equal(verify(3, { inputs: '' }).ok, false);
});
