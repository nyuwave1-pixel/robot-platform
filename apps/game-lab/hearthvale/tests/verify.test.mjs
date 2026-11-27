import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame } from '../src/logic.js';
import { bot } from '../src/bot.js';
import { verify } from '../src/verify.js';
import { LEVELS } from '../src/levels.js';

test('a bot season verifies on every level; tampering is rejected', () => {
  LEVELS.forEach((L, i) => {
    const S = bot(newGame({ seed: 11, level: L.level })), proof = { seed: 11, actions: S.actions.join(',') };
    const r = verify(i, proof);
    assert.equal(r.ok, S.result.won); assert.equal(r.score, S.result.score);
    if (r.ok) assert.equal(r.metric, S.result.score);
  });
  const S = bot(newGame({ seed: 11 })), good = S.actions.join(',');
  assert.equal(verify(0, { seed: 12, actions: good }).ok, false, 'another seed has other weather/prices');
  assert.equal(verify(0, { seed: 11, actions: good.replace(/,z$/, '') }).ok, false, 'the season must be over');
  assert.equal(verify(0, { seed: 11, actions: 'sp,' + good }).ok, false, 'selling what you do not have');
  assert.equal(verify(9, { seed: 11, actions: good }).ok, false);
  assert.equal(verify(0, { seed: -1, actions: good }).ok, false);
});
