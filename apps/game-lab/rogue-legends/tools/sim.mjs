// Balance simulator: the greedy bot plays N seeded runs per hero and level; prints win rate, floor reached, turns.
//   node tools/sim.mjs [runs=200]
import { newRun, apply, grade } from '../src/logic.js';
import { botAction } from '../src/bot.js';
import { LEVELS } from '../src/levels.js';

export function playRun(seed, hero, level, skill = 1) {
  const S = newRun({ seed, hero, level }), acts = [];
  while (!S.result && acts.length < 20000) { const a = botAction(S, skill); acts.push(a); apply(S, a); }
  return { S, acts };
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const N = +(process.argv[2] || 200);
  for (const L of LEVELS) {
    let won = 0, floors = 0, turns = 0; const grades = {};
    for (let s = 1; s <= N; s++) { const { S } = playRun(s * 7919, L.hero, L.level); won += S.result.won; floors += S.result.floor; turns += S.result.turns; const g = grade(S); grades[g] = (grades[g] || 0) + 1; }
    console.log(`${L.id.padEnd(11)} win ${(100 * won / N).toFixed(0).padStart(3)}%  avg floor ${(floors / N).toFixed(1)}  avg turns ${(turns / N).toFixed(0)}  grades ${JSON.stringify(grades)}`);
  }
}
