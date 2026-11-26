// Checks the generator end to end in a temporary copy: every template creates a game whose own tests pass.
//   node tools/game-lab/test-new-game.mjs
import { cpSync, mkdtempSync, rmSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'game-lab-'));
try {
  cpSync(HERE, join(tmp, 'tools', 'game-lab'), { recursive: true });
  for (const genre of ['rhythm', 'racing', 'puzzle']) {
    const id = `t-${genre}`;
    execFileSync('node', [join(tmp, 'tools', 'game-lab', 'new-game.mjs'), '--genre', genre, '--id', id, '--name', `TEST ${genre}`], { stdio: 'pipe' });
    const dir = join(tmp, 'apps', 'game-lab', id);
    const g = JSON.parse(readFileSync(join(dir, 'game.json'), 'utf8'));
    if (g.genre !== genre || g.id !== id) throw new Error('game.json not filled');
    if (readFileSync(join(dir, 'src', 'main.js'), 'utf8').includes('__NAME__')) throw new Error('placeholder left in main.js');
    if (!existsSync(join(dir, 'src', 'portal.js'))) throw new Error('no portal bridge');
    if (genre !== 'puzzle' && !readFileSync(join(dir, 'src', 'main.js'), 'utf8').includes(`createPortal('${id}')`)) throw new Error('main.js does not report as ' + id);
    if (genre !== 'puzzle' && !existsSync(join(dir, 'src', 'verify.js'))) throw new Error('no replay verifier');
    const files = readdirSync(join(dir, 'tests')).filter((f) => f.endsWith('.test.mjs')).map((f) => join('tests', f));
    execFileSync('node', ['--test', ...files], { cwd: dir, stdio: 'pipe' });   // throws if any test fails
    console.log(`ok ${genre}: ${id}`);
  }
  if (!existsSync(join(tmp, 'docs', 'game-dev', 'genres', 'LAB_INDEX.md'))) throw new Error('index not written');
  let dup = false; try { execFileSync('node', [join(tmp, 'tools', 'game-lab', 'new-game.mjs'), '--genre', 'rhythm', '--id', 't-rhythm'], { stdio: 'pipe' }); } catch { dup = true; }
  if (!dup) throw new Error('overwrote an existing game');
  console.log('ok: refuses to overwrite; index written');
} finally { rmSync(tmp, { recursive: true, force: true }); }
