// Greedy farmer used by tests and tools/sim.mjs to check that every level can be cleared (it is NOT used by the game).
import { newGame, apply, canDo, CROPS, PLOTS, VILLAGERS, LEVEL_RULES } from './logic.js';
// greedy bot: harvest, sell, water, plant best affordable crop that ripens before the end, till, talk/gift
export function bot(S, skill = 1) {
  const tryA = (a) => { if (!canDo(S, a)) { apply(S, a); return true; } return false; };
  while (!S.result) {
    let did = false;
    for (let i = 0; i < PLOTS; i++) if (tryA({ a: 'harvest', i })) did = true;
    for (const c of Object.keys(CROPS)) { const v = Object.entries(VILLAGERS).find(([, x]) => x.likes === c); if (v && S.hearts[v[0]] < 10 && S.inv[c] > 0) tryA({ a: 'gift', v: v[0], c }); tryA({ a: 'sell', c }); }
    for (let i = 0; i < PLOTS; i++) if (tryA({ a: 'water', i })) did = true;
    const left = 28 - S.day;
    const order = ['pumpkin', 'carrot', 'strawberry', 'turnip'].filter((c) => CROPS[c].days <= left);
    for (let i = 0; i < PLOTS; i++) for (const c of order) if (S.energy >= 3 && tryA({ a: 'plant', i, c })) { did = true; break; }
    if (skill > 0) for (const v of Object.keys(VILLAGERS)) if (S.energy >= 2 && S.hearts[v] < 10) tryA({ a: 'talk', v });
    for (let i = 0; i < PLOTS; i++) if (S.energy >= 4 && tryA({ a: 'till', i })) did = true;
    apply(S, { a: 'sleep' });
  }
  return S;
}
export function simulate(level, seeds = 200) {
  const sc = []; for (let s = 1; s <= seeds; s++) sc.push(bot(newGame({ seed: s, level })).result.score);
  sc.sort((a, b) => a - b); const T = LEVEL_RULES[level].target;
  return { level, target: T, median: sc[Math.floor(seeds / 2)], win: sc.filter((x) => x >= T).length / seeds };
}
