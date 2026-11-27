import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyse, markdown } from '../tools/playtest-report.mjs';
import { playRun } from '../tools/sim.mjs';
import { encode, RULES_VERSION, grade } from '../src/logic.js';

const exported = (n) => ({ game: 'rogue-legends', runs: Array.from({ length: n }, (_, i) => {
  const hero = i % 2 ? 'arcanist' : 'warden', seed = 1000 + i * 37, { S, acts } = playRun(seed, hero, 0);
  return { rules: RULES_VERSION, hero, level: 0, seed, actions: acts.map(encode).join(','), seconds: 1800, won: S.result.won, grade: grade(S) };
}) });

test('a playtest export replays into a report: groups, run ends, killers, card pick rates', () => {
  const data = exported(12);
  data.runs.push({ rules: 1, hero: 'warden', level: 0, seed: 1, actions: 'g0:1' });          // older rules: counted, not replayed
  data.runs.push({ rules: RULES_VERSION, hero: 'warden', level: 0, seed: 5, actions: 'p9.9' }); // tampered: reported as broken
  const R = analyse([data]);
  assert.equal(R.total, 14); assert.equal(R.skipped, 1); assert.equal(R.broken, 1);
  assert.equal(R.groups['warden L0'].runs + R.groups['arcanist L0'].runs, 12);
  assert.equal(Object.values(R.ends).reduce((a, b) => a + b, 0), 12);
  assert.ok(R.rewards > 0 && Object.keys(R.offered).length > 5, 'card rewards were seen');
  const losses = data.runs.slice(0, 12).filter((r) => !r.won).length;
  assert.ok(Object.values(R.killers).reduce((a, b) => a + b, 0) >= losses, 'every loss names what was standing');
  const md = markdown(R); assert.match(md, /pick rate/); assert.match(md, /warden L0/);
});
