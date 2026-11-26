// Copy the Genre Game Lab games and the GAME DEV LAB feed into the airobotphysical.com repo (airobotverse-).
//   node tools/portal/export-to-airobotverse.mjs [--dir ../airobotverse-]   (or AIROBOTVERSE_DIR)
// What it writes there (nothing else is touched):
//   public/arcade/<id>/index.html + src/*.js   the game, served same-origin as a selfHosted game (/games/play/<id>/)
//   public/images/game-covers/<id>.png          the lab screenshot (docs/game-dev/screenshots/game-lab-<id>.png)
//   src/data/gamedev-lab.json                   docs/game-dev/bitpark/feed.json (GAME DEV LAB section data)
// The GAMES entry in src/lib/games-config.ts is printed, not written: add it by hand once per new game (the RP numbers
// come from game.json portal.airobotphysical). Then commit there on a branch and open a PR — deploying is the owner's call.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const argDir = process.argv.indexOf('--dir');
const DEST = resolve(argDir > 0 ? process.argv[argDir + 1] : process.env.AIROBOTVERSE_DIR || join(ROOT, '..', 'airobotverse-'));
if (!existsSync(join(DEST, 'src', 'lib', 'games-config.ts'))) { console.error(`[export] not an airobotverse checkout: ${DEST}`); process.exit(1); }

const lab = join(ROOT, 'apps', 'game-lab'), config = readFileSync(join(DEST, 'src', 'lib', 'games-config.ts'), 'utf8');
for (const id of readdirSync(lab).filter((d) => existsSync(join(lab, d, 'game.json')))) {
  const g = JSON.parse(readFileSync(join(lab, id, 'game.json'), 'utf8')), ap = g.portal?.airobotphysical;
  if (!ap) { console.log(`[export] skip ${id}: no portal.airobotphysical in game.json`); continue; }
  const out = join(DEST, 'public', 'arcade', id);
  rmSync(out, { recursive: true, force: true }); mkdirSync(join(out, 'src'), { recursive: true });
  cpSync(join(lab, id, 'index.html'), join(out, 'index.html'));
  for (const f of readdirSync(join(lab, id, 'src')).filter((f) => f.endsWith('.js'))) cpSync(join(lab, id, 'src', f), join(out, 'src', f));
  writeFileSync(join(out, 'SOURCE.md'), `Generated from nyuwave1-pixel/robot-platform apps/game-lab/${id} by tools/portal/export-to-airobotverse.mjs — edit it there, not here.\n`);
  const shot = join(ROOT, 'docs', 'game-dev', 'screenshots', `game-lab-${id}.png`);
  if (existsSync(shot)) cpSync(shot, join(DEST, 'public', 'images', 'game-covers', `${id}.png`));
  const registered = config.includes(`id: "${id}"`);
  console.log(`[export] ${id} → public/arcade/${id}/ ${registered ? '(registered in games-config)' : '— add to GAMES:'}`);
  if (!registered) console.log(`  { id: "${id}", title: "${g.name}", desc: "${g.summary}", emoji: "🎮", path: "/arcade/${id}/", category: "Arcade", rpReward: ${ap.rpReward}, players: "1", status: "beta", selfHosted: true, thumbnail: "/images/game-covers/${id}.png" },`);
}
cpSync(join(ROOT, 'docs', 'game-dev', 'bitpark', 'feed.json'), join(DEST, 'src', 'data', 'gamedev-lab.json'));
console.log('[export] src/data/gamedev-lab.json ← docs/game-dev/bitpark/feed.json');
