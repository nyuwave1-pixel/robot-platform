import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRun, apply, choices, VARIANTS, SWELL, ECHO_EVERY } from '../src/logic.js';
import { verify, encodeActions } from '../src/verify.js';
import { LEVELS } from '../src/levels.js';
import { playRun } from '../tools/sim.mjs';

const fight = (variant, hero = 'warden') => { const S = newRun({ seed: 13, hero, variant }); apply(S, { a: 'go', k: choices(S)[0] }); const c = S.combat; c.enemies.splice(1); const e = c.enemies[0]; e.hp = e.maxHp = 300; e.block = 0; e.st = {}; c.energy = 20; return { S, c, e }; };

test('echo: every 4th card repeats its damage (not its draw)', () => {
  const { S, c, e } = fight('echo');
  c.hand = ['strike', 'strike', 'strike', 'strike']; c.swell = [0, 0, 0, 0];
  for (let k = 0; k < 3; k++) apply(S, { a: 'play', i: 0, t: 0 });
  assert.equal(e.hp, 300 - 18);
  apply(S, { a: 'play', i: 0, t: 0 }); assert.equal(e.hp, 300 - 18 - 12, '4th strike lands twice');
  c.hand = ['brace', 'brace', 'brace', 'brace']; c.draw = ['strike', 'strike', 'strike', 'strike', 'strike', 'strike', 'strike', 'strike']; c.played = 3;
  const before = c.hand.length; apply(S, { a: 'play', i: 0, t: -1 });
  assert.equal(c.hand.length, before - 1 + 1, 'the echoed brace draws once, not twice');
  assert.equal(ECHO_EVERY, 4);
});

test('tide: the hand stays, held cards swell, the draw only tops back up to 5', () => {
  const { S, c, e } = fight('tide');
  const held = c.hand.slice(0, 2); c.hand = held.slice(); c.swell = [0, 0];
  apply(S, { a: 'end' });
  if (!S.combat) return;   // (a rare one-shot death would end the test early)
  assert.deepEqual(S.combat.hand.slice(0, 2), held, 'kept');
  assert.equal(S.combat.swell[0], 1); assert.equal(S.combat.hand.length, 5, 'topped up to 5');
  S.combat.hand[0] = 'strike'; S.combat.swell[0] = 2; S.combat.energy = 5; const hp = e.hp; e.block = 0;
  apply(S, { a: 'play', i: 0, t: 0 }); assert.equal(hp - e.hp, 6 + 2 * SWELL, 'swollen strike');
});

test('variant runs replay through verify under their own level; classic levels keep their indices', () => {
  assert.deepEqual(LEVELS.slice(0, 6).map((l) => l.variant || 'classic'), Array(6).fill('classic'));
  for (const v of ['echo', 'tide']) {
    const li = LEVELS.findIndex((l) => l.variant === v && l.hero === 'warden'); let w = null;
    for (let s = 1; s < 500 && !w; s++) { const r = playRun(s * 7919, 'warden', 0, 1, v); if (r.S.result.won) w = { seed: s * 7919, r }; }
    assert.ok(w, `a ${v} win exists`);
    const ok = verify(li, { seed: w.seed, actions: encodeActions(w.r.acts) });
    assert.equal(ok.ok, true); assert.equal(ok.metric, w.r.S.result.turns);
    assert.equal(verify(0, { seed: w.seed, actions: encodeActions(w.r.acts) }).ok, false, 'the same actions are not a classic run');
  }
  assert.deepEqual(VARIANTS, ['classic', 'echo', 'tide']);
});
