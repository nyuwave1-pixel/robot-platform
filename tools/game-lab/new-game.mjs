// Genre Game Lab: create a new game sub-section (하부 섹션) from a genre template.
//   node tools/game-lab/new-game.mjs --genre rhythm --id beat-lab --name "BEAT LAB" [--summary "…"]
//   node tools/game-lab/new-game.mjs --list          (the lab's games)
//   node tools/game-lab/new-game.mjs --index         (rebuild docs/game-dev/genres/LAB_INDEX.md only)
// Genres: rhythm, racing, blank (any other genre starts from blank). Creates apps/game-lab/<id>/ with rules in src/core,
// tests (node --test, no install), game.json, README, asset and third-party ledgers; then refreshes the lab index.
// Afterwards: claim the folder in docs/game-dev/STUDIO_HUB.md, run its tests, regenerate the portal feed.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, '..', '..');
const TEMPLATES = join(HERE, 'templates'), LAB = join(ROOT, 'apps', 'game-lab'), INDEX = join(ROOT, 'docs', 'game-dev', 'genres', 'LAB_INDEX.md');
const GENRE_TEMPLATE = { rhythm: 'rhythm', racing: 'racing' };   // others → blank
const SUMMARY = {
  rhythm: '4-lane rhythm game: Web Audio clock, judgement windows, combo, accuracy and rank.',
  racing: 'Top-down arcade racer: spline circuit, kart physics, AI rivals, 3-lap race.',
};

function args(argv) { const o = {}; for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const k = a.slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; o[k] = v; } } return o; }

export function listGames() {
  if (!existsSync(LAB)) return [];
  return readdirSync(LAB).filter((d) => existsSync(join(LAB, d, 'game.json'))).map((d) => ({ dir: `apps/game-lab/${d}`, ...JSON.parse(readFileSync(join(LAB, d, 'game.json'), 'utf8')) }))
    .sort((a, b) => a.created.localeCompare(b.created) || a.id.localeCompare(b.id));
}

export function writeIndex() {
  const games = listGames();
  const rows = games.map((g) => `| ${g.name} | ${g.genre} | ${g.status} | \`${g.dir}\` | ${g.summary} | ${(g.learnedFrom || []).join(', ') || '—'} |`);
  mkdirSync(dirname(INDEX), { recursive: true });
  writeFileSync(INDEX, `# 장르 게임 랩 — 하부 섹션 목록

이 파일은 \`node tools/game-lab/new-game.mjs\` 가 \`apps/game-lab/*/game.json\` 에서 만듭니다. 손으로 고치지 말고 각 게임의 \`game.json\` 을 고친 뒤 \`--index\` 로 다시 만드세요.
오픈소스 조사·라이선스 판정: [OPEN_SOURCE_CATALOG.md](OPEN_SOURCE_CATALOG.md) · 새 하부 섹션 만드는 법: [README.md](README.md)

| 게임 | 장르 | 상태 | 위치 | 한 줄 | 참고한 오픈소스 |
|---|---|---|---|---|---|
${rows.join('\n') || '| (아직 없음) | | | | | |'}
`);
  return games.length;
}

function fill(dir, vars) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { fill(p, vars); continue; }
    if (!/\.(md|json|js|mjs|html|css|txt)$/.test(name)) continue;
    let s = readFileSync(p, 'utf8'); for (const [k, v] of Object.entries(vars)) s = s.split(k).join(v); writeFileSync(p, s);
  }
}

export function createGame({ genre, id, name, summary }) {
  if (!/^[a-z][a-z0-9-]{1,38}$/.test(id || '')) throw new Error('--id: lower-case letters, digits and dashes, 2–39 characters (e.g. beat-lab)');
  const dest = join(LAB, id);
  if (existsSync(dest)) throw new Error(`apps/game-lab/${id} already exists — pick another --id`);
  const template = GENRE_TEMPLATE[genre] || 'blank';
  mkdirSync(dest, { recursive: true });
  cpSync(join(TEMPLATES, 'common'), dest, { recursive: true });
  cpSync(join(TEMPLATES, template), dest, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  fill(dest, { __ID__: id, __NAME__: (name || id.toUpperCase()).replace(/"/g, ''), __GENRE__: genre, __DATE__: date, __SUMMARY__: (summary || SUMMARY[genre] || `${genre} prototype`).replace(/"/g, "'") });
  writeIndex();
  return { dir: relative(ROOT, dest), template };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const o = args(process.argv.slice(2));
  try {
    if (o.list) { for (const g of listGames()) console.log(`${g.id.padEnd(20)} ${g.genre.padEnd(10)} ${g.status.padEnd(10)} ${g.dir}`); process.exit(0); }
    if (o.index) { console.log(`[game-lab] index: ${writeIndex()} games → ${relative(ROOT, INDEX)}`); process.exit(0); }
    if (!o.genre || !o.id) { console.error('usage: node tools/game-lab/new-game.mjs --genre <rhythm|racing|blank|…> --id <kebab-id> [--name "NAME"] [--summary "…"]'); process.exit(2); }
    const r = createGame({ genre: String(o.genre).toLowerCase(), id: String(o.id), name: o.name === true ? undefined : o.name, summary: o.summary === true ? undefined : o.summary });
    console.log(`[game-lab] created ${r.dir} from the ${r.template} template`);
    console.log(`  next: claim it in docs/game-dev/STUDIO_HUB.md · cd ${r.dir} && node --test "tests/*.test.mjs" · node tools/portal/export-bitpark-feed.mjs`);
  } catch (e) { console.error('[game-lab] ' + e.message); process.exit(1); }
}
