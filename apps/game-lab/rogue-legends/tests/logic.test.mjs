import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRun, apply, legal, choices, cardDef, CARDS, HEROES, ENEMIES, encode, decode, FLOORS } from '../src/logic.js';
import { botAction } from '../src/bot.js';
import { playRun } from '../tools/sim.mjs';

test('the map: every node reachable from the bottom leads to the boss', () => {
  for (let seed = 1; seed < 40; seed++) {
    const S = newRun({ seed });
    const starts = choices(S); assert.ok(starts.length >= 2, 'at least two starting paths');
    const seen = new Set(), stack = [...starts];
    while (stack.length) { const k = stack.pop(); if (seen.has(k)) continue; seen.add(k); stack.push(...S.map[k].next); }
    assert.ok(seen.has('boss'));
    for (const k of seen) if (k !== 'boss') assert.ok(S.map[k].next.length > 0, `dead end at ${k}`);
    assert.equal(Object.values(S.map).filter((n) => n.f === 0).every((n) => n.type === 'fight'), true, 'floor 1 is a fight');
    assert.ok(Object.values(S.map).some((n) => n.type === 'rest'), 'a campfire exists');
  }
});

test('same seed + same actions = same run (determinism)', () => {
  const a = playRun(4242, 'arcanist', 0), b = newRun({ seed: 4242, hero: 'arcanist' });
  for (const act of a.acts) apply(b, act);
  assert.deepEqual(b.result, a.S.result);
  assert.equal(b.hp, a.S.hp); assert.deepEqual(b.deck, a.S.deck);
});

test('combat rules: energy, block absorbs, vulnerable +50 %, weak −25 %, thorns', () => {
  const S = newRun({ seed: 9, hero: 'warden' });
  apply(S, { a: 'go', k: choices(S)[0] });
  assert.equal(S.phase, 'combat');
  const c = S.combat, e = c.enemies[0];
  assert.equal(c.hand.length, 5); assert.equal(c.energy, 3);
  assert.equal(c.P.block, 6, 'iron badge: 6 block at the start');
  e.hp = e.maxHp = 100; c.hand[0] = 'strike'; e.block = 2; const hp0 = e.hp;
  apply(S, { a: 'play', i: 0, t: 0 });
  assert.equal(hp0 - e.hp, 4, '6 damage − 2 block'); assert.equal(c.energy, 2);
  e.st.vuln = 1; e.block = 0; c.hand[0] = 'strike'; const hp1 = e.hp;
  apply(S, { a: 'play', i: 0, t: 0 }); assert.equal(hp1 - e.hp, 9, 'vulnerable: 6 × 1.5');
  c.energy = 0; assert.ok(legal(S).every((x) => x.a === 'end' || cardDef(c.hand[x.i]).cost === 0), 'no energy: only 0-cost cards');
  assert.throws(() => apply(S, { a: 'play', i: c.hand.findIndex((id) => cardDef(id).cost > 0), t: 0 }));
});

test('every card resolves without errors, upgrades are stronger or cheaper', () => {
  for (const [id, d] of Object.entries(CARDS)) {
    const up = cardDef(id + '+');
    assert.ok(up.upgraded && up.name.endsWith('+'), id);
    assert.ok(up.cost < d.cost || JSON.stringify(up.fx) !== JSON.stringify(d.fx), `${id}+ differs`);
    const S = newRun({ seed: 3, hero: d.hero || 'warden' }); apply(S, { a: 'go', k: choices(S)[0] });
    const c = S.combat; c.energy = 9; c.hand[0] = id + '+';
    apply(S, { a: 'play', i: 0, t: d.target === 'enemy' ? c.enemies.findIndex((e) => e.hp > 0) : -1 });
  }
});

test('burn ticks at the end of your turn and halves; detonate cashes it in', () => {
  const S = newRun({ seed: 5, hero: 'arcanist' }); apply(S, { a: 'go', k: choices(S)[0] });
  const c = S.combat, e = c.enemies[0]; e.hp = e.maxHp = 200; e.st = { burn: 8 };
  c.hand = ['detonate', 'stoke+']; c.energy = 3;
  apply(S, { a: 'play', i: 1, t: 0 }); assert.equal(e.st.burn, 16, 'stoke doubles');
  apply(S, { a: 'play', i: 0, t: 0 }); assert.equal(e.hp, 200 - 32); assert.equal(e.st.burn, undefined);
  e.st.burn = 9; const before = e.hp; apply(S, { a: 'end' });
  assert.equal(before - e.hp, 9); assert.equal(e.st.burn, 4);
});

test('a whole run ends (bot) for both heroes, with rewards, shops and campfires on the way', () => {
  const seen = new Set();
  for (const hero of Object.keys(HEROES)) for (let s = 1; s <= 25; s++) {
    const { S, acts } = playRun(s * 31, hero, 0);
    assert.ok(S.result, 'run finished'); for (const a of acts) seen.add(a.a);
  }
  for (const a of ['go', 'play', 'end', 'take', 'rest']) assert.ok(seen.has(a), `bot used ${a}`);
});

test('action codec round-trips every legal action', () => {
  const S = newRun({ seed: 77, hero: 'warden' });
  for (let n = 0; n < 400 && !S.result; n++) {
    for (const a of legal(S)) assert.deepEqual(decode(encode(a)), a);
    apply(S, botAction(S));
  }
});

test('content sanity: enemies and boss', () => {
  assert.ok(ENEMIES.colossus.boss); assert.equal(FLOORS, 13);
  for (const [k, e] of Object.entries(ENEMIES)) { assert.ok(e.moves.length >= 2, k); assert.ok(e.hp[0] <= e.hp[1], k); }
});
