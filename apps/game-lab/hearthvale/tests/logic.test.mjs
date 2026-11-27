import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, apply, canDo, decode, encode, CROPS, DAYS, LEVEL_RULES, score, ripe } from '../src/logic.js';
import { bot, simulate } from '../src/bot.js';

test('same seed gives the same weather and prices', () => {
  const a = newGame({ seed: 42 }), b = newGame({ seed: 42 }), c = newGame({ seed: 43 });
  assert.deepEqual(a.weather, b.weather); assert.deepEqual(a.prices, b.prices); assert.notDeepEqual(a.prices, c.prices);
  assert.equal(a.weather[0], 'sun');
});

test('a turnip grows in 4 watered days and sells at the day price', () => {
  const S = newGame({ seed: 5 });
  apply(S, { a: 'plant', i: 0, c: 'turnip' }); assert.equal(S.coins, 150 - CROPS.turnip.seed);
  for (let d = 0; d < 4; d++) { if (!S.plots[0].watered) apply(S, { a: 'water', i: 0 }); apply(S, { a: 'sleep' }); }
  assert.ok(ripe(S.plots[0])); apply(S, { a: 'harvest', i: 0 }); assert.equal(S.inv.turnip, 1);
  if (S.weather[S.day - 1] !== 'storm') { const before = S.coins; apply(S, { a: 'sell', c: 'turnip' }); assert.equal(S.coins, before + S.prices[S.day - 1].turnip); }
});

test('an unwatered crop does not grow on a sunny night', () => {
  const S = newGame({ seed: 5 }); apply(S, { a: 'plant', i: 0, c: 'carrot' }); apply(S, { a: 'sleep' });
  assert.equal(S.plots[0].age, 0);
});

test('energy, coins and storms are enforced', () => {
  const S = newGame({ seed: 9 });
  assert.equal(canDo(S, { a: 'till', i: 3 }), 'tilled');
  for (let i = 6; i < 12; i++) apply(S, { a: 'till', i });           // 6 × 2 energy
  assert.equal(canDo(S, { a: 'till', i: 12 }), 'energy');
  const P = newGame({ seed: 9, level: 'frugal' }); assert.equal(canDo(P, { a: 'plant', i: 0, c: 'pumpkin' }), 'coins');
  const T = newGame({ seed: 1 }); T.weather[0] = 'storm'; assert.equal(canDo(T, { a: 'talk', v: 'mira' }), 'storm');
});

test('a liked gift gives 3 hearts and 4 hearts unlock the perk', () => {
  const S = newGame({ seed: 3 }); S.inv.strawberry = 2;
  apply(S, { a: 'gift', v: 'mira', c: 'strawberry' }); assert.equal(S.hearts.mira, 3);
  apply(S, { a: 'talk', v: 'mira' }); assert.equal(S.hearts.mira, 4);
  apply(S, { a: 'sleep' }); assert.equal(S.energy, LEVEL_RULES.meadow.energy + 2);
});

test('the season ends after day 28 with a result', () => {
  const S = newGame({ seed: 1 }); for (let d = 0; d < DAYS; d++) apply(S, { a: 'sleep' });
  assert.ok(S.result); assert.equal(S.result.score, score(S)); assert.throws(() => apply(S, { a: 'sleep' }));
});

test('tokens round-trip', () => {
  for (const a of [{ a: 'till', i: 23 }, { a: 'plant', i: 4, c: 'strawberry' }, { a: 'water', i: 0 }, { a: 'harvest', i: 11 }, { a: 'sell', c: 'pumpkin' },
    { a: 'talk', v: 'juno' }, { a: 'gift', v: 'tomas', c: 'pumpkin' }, { a: 'sleep' }]) assert.deepEqual(decode(encode(a)), a);
  assert.equal(decode('x1'), null);
});

test('every level can be cleared by the greedy farmer', () => {
  for (const level of Object.keys(LEVEL_RULES)) { const r = simulate(level, 40); assert.ok(r.win >= 0.5, `${level} win ${r.win}`); }
  assert.ok(bot(newGame({ seed: 7 })).result.won);
});
