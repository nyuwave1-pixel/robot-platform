import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newState, update } from '../src/core/state.js';

test('state advances and scores', () => {
  const s = newState(); update(s, 0.5, { action: true });
  assert.equal(s.t, 0.5); assert.equal(s.score, 1);
});
