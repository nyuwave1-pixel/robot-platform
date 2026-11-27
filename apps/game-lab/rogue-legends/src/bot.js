// A simple greedy player for balance tests and the simulator (tools: node tools/sim.mjs). Not used by the game screen.
import { legal, cardDef, choices } from './logic.js';

const VALUE = { fight: 2, elite: 1, rest: 3, shop: 1, event: 2, treasure: 4, boss: 5 };
export function botAction(S, skill = 1) {
  const A = legal(S);
  if (S.phase === 'map') {
    const ks = choices(S), lowHp = S.hp < S.maxHp * 0.45;
    return { a: 'go', k: ks.slice().sort((a, b) => score(b) - score(a))[0] };
    function score(k) { const t = S.map[k].type; return (t === 'rest' && lowHp ? 10 : VALUE[t]) + (t === 'elite' && (lowHp || skill < 1) ? -5 : 0); }
  }
  if (S.phase === 'combat') {
    const c = S.combat, enemies = c.enemies, incoming = enemies.reduce((s, e) => s + (e.hp > 0 && e.intent && (e.intent.t === 'atk' || e.intent.t === 'atkdeb' || e.intent.t === 'drain') ? e.intent.n * (e.intent.hits || 1) : 0), 0);
    const plays = A.filter((x) => x.a === 'play');
    if (!plays.length) return { a: 'end' };
    const weakest = enemies.reduce((b, e, i) => (e.hp > 0 && (b < 0 || e.hp < enemies[b].hp) ? i : b), -1);
    const need = incoming - c.P.block;
    const rank = (p) => {
      const d = cardDef(c.hand[p.i]); let v = 0;
      for (const [k, a, b] of d.fx) {
        if (k === 'block') v += need > 0 ? a * 1.4 : a * 0.2;
        else if (k === 'dmg') v += a * (b || 1); else if (k === 'dmgAll') v += a * enemies.filter((e) => e.hp > 0).length;
        else if (k === 'draw' || k === 'energy') v += 6 * a; else if (k === 'self') v += 12; else if (k === 'nextEnergy') v += 5 * a;
        else if (k === 'st' || k === 'stAll') v += a === 'burn' ? b * 1.3 : 6; else if (k === 'heal') v += S.hp < S.maxHp * 0.6 ? a : 1;
        else if (k === 'blockHit') v += c.P.block; else if (k === 'detonate') v += 10; else if (k === 'burnX' || k === 'burnXAll') v += 6;
        else if (k === 'blockHalfAll') v += c.P.block / 2 * enemies.filter((e) => e.hp > 0).length; else if (k === 'execute') v += a * 1.3; else if (k === 'cleanse') v += 4;
      }
      if (p.t >= 0 && p.t !== weakest) v -= 1;
      return v / Math.max(0.5, d.cost);
    };
    return plays.sort((a, b) => rank(b) - rank(a))[0];
  }
  if (S.phase === 'reward') return S.reward.cards.length ? { a: 'take', i: 0 } : { a: 'skip' };
  if (S.phase === 'rest') return { a: 'rest', o: S.hp < S.maxHp * 0.7 ? 'heal' : 'smith' };
  if (S.phase === 'shop') {
    const canRemove = S.deck.some((id) => id === 'strike' || id === 'bolt');
    return (canRemove && A.find((x) => x.a === 'remove')) || A.find((x) => x.a === 'buy') || { a: 'leave' };
  }
  if (S.phase === 'event') return { a: 'opt', i: S.event === 'shrine' ? (S.hp > 40 ? 0 : 1) : 0 };
  if (S.phase === 'pick') {
    if (S.pickFor === 'upgrade') return A.find((x) => x.a === 'pick') || { a: 'cancel' };
    const i = S.deck.findIndex((id) => id === 'strike' || id === 'bolt'); return i >= 0 ? { a: 'pick', i } : { a: 'cancel' };
  }
  return null;
}
