// Builds the Blender assets on any OS: finds Blender (or a Python with the bpy module) and runs tools/blender/build.py.
//   npm run assets              → src/assets/assets.glb + blender/special_soldier_assets.blend (no preview renders)
//   npm run assets -- --render  → also the Cycles preview renders in docs/screenshots (slow)
//   npm run assets -- --check   → only report which Blender would be used
// Override the location with BLENDER_EXE (saved by tools/dev-env/setup.ps1 on Windows) or BLENDER (path to blender / blender.exe).
import { existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), check = args.includes('--check'), render = args.includes('--render');
const ok = (cmd, a) => { try { return spawnSync(cmd, a, { stdio: 'ignore' }).status === 0; } catch { return false; } };

function findBlender() {
  const env = process.env.BLENDER_EXE || process.env.BLENDER;
  if (env) return existsSync(env) || ok(env, ['--version']) ? env : null;
  const cands = [];
  if (process.platform === 'win32') {
    const base = 'C:\\Program Files\\Blender Foundation';
    if (existsSync(base)) for (const d of readdirSync(base).filter((n) => /^Blender \d/.test(n)).sort().reverse()) cands.push(join(base, d, 'blender.exe'));
  } else if (process.platform === 'darwin') cands.push('/Applications/Blender.app/Contents/MacOS/Blender');
  for (const c of cands) if (existsSync(c)) return c;
  return ok('blender', ['--version']) ? 'blender' : null;
}
function findBpyPython() {
  for (const py of process.platform === 'win32' ? ['py', 'python'] : ['python3', 'python']) if (ok(py, ['-c', 'import bpy'])) return py;
  return null;
}

const blender = findBlender(), py = blender ? null : findBpyPython();
const script = join(root, 'tools', 'blender', 'build.py'), extra = render ? [] : ['--no-render'];
if (!blender && !py) {
  console.error('Blender not found. Install Blender 5.3 (https://www.blender.org/download/) or `pip install bpy==5.3.0`,\nor set BLENDER_EXE to the path of blender(.exe).');
  process.exit(check ? 0 : 1);
}
console.log(blender ? `Blender: ${blender}` : `Python with bpy: ${py}`);
if (check) process.exit(0);
const r = blender ? spawnSync(blender, ['--background', '--python', script, '--', ...extra], { stdio: 'inherit', cwd: root })
  : spawnSync(py, [script, ...extra], { stdio: 'inherit', cwd: root });
process.exit(r.status ?? 1);
