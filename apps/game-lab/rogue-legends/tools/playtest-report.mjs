// Playtest report: reads history files exported from the title screen ("기록 내보내기 (JSON)") and replays every run with the
// game's own rules, so each number comes from what really happened, not from a separate tracker.
//   node tools/playtest-report.mjs tester1.json tester2.json … [--out report.md]
// Per hero × level: runs, wins, depth, minutes · where runs end and what killed them · card pick rate (taken / offered)
// and shop buys · relics in winning runs. Runs made under another rules version are counted but not replayed.
import { readFileSync, writeFileSync } from 'node:fs';
import { newRun, apply, decode, RULES_VERSION, ENEMIES, cardDef, RELICS } from '../src/logic.js';

export function analyse(files) {
  const runs = files.flatMap((f) => { const j = typeof f === 'string' ? JSON.parse(readFileSync(f, 'utf8')) : f; return (j.runs || []).map((r) => ({ ...r, tester: j.tester || (typeof f === 'string' ? f : 'data') })); });
  const R = { total: runs.length, skipped: 0, broken: 0, groups: {}, ends: {}, killers: {}, offered: {}, taken: {}, skips: 0, rewards: 0, bought: {}, winRelics: {}, minutes: [] };
  for (const run of runs) {
    if (run.rules !== RULES_VERSION) { R.skipped++; continue; }
    let S;
    try {
      S = newRun({ seed: run.seed, hero: run.hero, level: run.level });
      for (const tok of run.actions ? run.actions.split(',') : []) {
        const a = decode(tok);
        if (S.phase === 'reward' && S.reward.cards.length && (a.a === 'take' || a.a === 'skip')) {
          R.rewards++;
          for (const id of S.reward.cards) R.offered[base(id)] = (R.offered[base(id)] || 0) + 1;
          if (a.a === 'take') { const id = base(S.reward.cards[a.i]); R.taken[id] = (R.taken[id] || 0) + 1; } else R.skips++;
        }
        if (S.phase === 'shop' && a.a === 'buy') { const id = a.i >= 0 ? base(S.shop.cards[a.i].id) : 'relic:' + S.shop.relic.id; R.bought[id] = (R.bought[id] || 0) + 1; }
        apply(S, a);
      }
    } catch { R.broken++; continue; }
    if (!S.result) { R.broken++; continue; }
    const k = `${run.hero} L${run.level}`, g = (R.groups[k] = R.groups[k] || { runs: 0, wins: 0, depth: 0, seconds: 0 });
    g.runs++; g.wins += S.result.won ? 1 : 0; g.depth += S.result.depth + 1; g.seconds += run.seconds || 0;
    const end = S.result.won ? 'won' : `act ${S.result.act} floor ${S.result.floor + 1}`; R.ends[end] = (R.ends[end] || 0) + 1;
    for (const e of S.result.killedBy || []) R.killers[e] = (R.killers[e] || 0) + 1;
    if (S.result.won) for (const r of S.relics) R.winRelics[r] = (R.winRelics[r] || 0) + 1;
  }
  return R;
}
const base = (id) => id.replace(/\+$/, '');

export function markdown(R) {
  const L = [`# ROGUE LEGENDS playtest report`, '', `runs ${R.total} · replayed ${R.total - R.skipped - R.broken} · other rules version ${R.skipped} · could not replay ${R.broken}`, ''];
  L.push('| hero · level | runs | wins | avg floors (of 26) | avg minutes |', '|---|---|---|---|---|');
  for (const [k, g] of Object.entries(R.groups)) L.push(`| ${k} | ${g.runs} | ${g.wins} (${Math.round((100 * g.wins) / g.runs)}%) | ${(g.depth / g.runs).toFixed(1)} | ${(g.seconds / g.runs / 60).toFixed(1)} |`);
  L.push('', '## where runs end', '', ...Object.entries(R.ends).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`));
  L.push('', '## what was standing when the hero fell', '', ...Object.entries(R.killers).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${ENEMIES[k]?.name || k}: ${v}`));
  L.push('', `## card rewards (${R.rewards} rewards, skipped ${R.skips})`, '', '| card | offered | taken | pick rate |', '|---|---|---|---|');
  for (const [id, n] of Object.entries(R.offered).sort((a, b) => (R.taken[b[0]] || 0) / b[1] - (R.taken[a[0]] || 0) / a[1])) L.push(`| ${cardDef(id)?.name || id} | ${n} | ${R.taken[id] || 0} | ${Math.round((100 * (R.taken[id] || 0)) / n)}% |`);
  if (Object.keys(R.bought).length) L.push('', '## shop buys', '', ...Object.entries(R.bought).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k.startsWith('relic:') ? '유물 ' + (RELICS[k.slice(6)]?.name || k) : cardDef(k)?.name || k}: ${v}`));
  if (Object.keys(R.winRelics).length) L.push('', '## relics in winning runs', '', ...Object.entries(R.winRelics).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${RELICS[k]?.name || k}: ${v}`));
  return L.join('\n') + '\n';
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2), oi = args.indexOf('--out'), out = oi >= 0 ? args.splice(oi, 2)[1] : null;
  if (!args.length) { console.error('usage: node tools/playtest-report.mjs history.json … [--out report.md]'); process.exit(1); }
  const md = markdown(analyse(args));
  if (out) writeFileSync(out, md); else process.stdout.write(md);
}
