// Downloads the Quaternius Universal Animation Library [Standard] (CC0) from its official itch.io page (free "name your own
// price" download, nothing paid) and places the Unity FBX in Assets/ThirdParty/Quaternius/UAL/, checking SHA-256.
//   node "apps/unity-studio/Tools~/fetch-ual.mjs"            (skips when the file is already there and matches)
// The FBX is also committed, so this is only needed to re-create or verify it. Needs `unzip` or `tar` (Windows 10+ tar reads zip).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const GAME = 'https://quaternius.itch.io/universal-animation-library';
const ZIP_SHA = 'cc73fc4e495b82958207316596317a3f40b9fa38065bde1027937452da537724';   // Universal Animation Library[Standard].zip, 2026-11-25
const FILES = {
  'Unity/UAL1_Standard.fbx': ['UAL1_Standard.fbx', '21b32d912da3cb93426d974fb945e86f5b2e86970acd2ce89905e0fbf9f1dcc2'],
  'License.txt': ['License.txt', '6d01f55c6e4c49a2c9963e147e561945ae2c83958c8ca667d90a6bffdbfac061'],
};
const dest = join(dirname(fileURLToPath(import.meta.url)), '..', 'Assets', 'ThirdParty', 'Quaternius', 'UAL');
const sha = (b) => createHash('sha256').update(b).digest('hex');

if (Object.values(FILES).every(([name, h]) => existsSync(join(dest, name)) && sha(readFileSync(join(dest, name))) === h)) {
  console.log('[ual] already present and verified:', dest); process.exit(0);
}

let cookies = '';
async function req(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { ...(opts.headers || {}), cookie: cookies }, redirect: 'follow' });
  for (const c of r.headers.getSetCookie?.() || []) cookies += (cookies ? '; ' : '') + c.split(';')[0];
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r;
}
const page = await (await req(GAME)).text();
const csrf = (page.match(/name="csrf_token" value="([^"]+)"/) || page.match(/name="csrf_token" content="([^"]+)"/) || [])[1];
if (!csrf) throw new Error('itch.io page changed: no csrf_token');
const uploads = [...page.matchAll(/data-upload_id="(\d+)"[\s\S]*?class="name"[^>]*>([^<]+)/g)].map((m) => ({ id: m[1], name: m[2] }));
const std = uploads.find((u) => u.name.includes('[Standard]')) || { id: '17958403' };
const body = new URLSearchParams({ csrf_token: csrf });
const info = await (await req(`${GAME}/file/${std.id}?source=view_game&as_props=1&after_download_lightbox=true`, { method: 'POST', body })).json();
if (!info.url) throw new Error('itch.io gave no download url: ' + JSON.stringify(info).slice(0, 200));
const zip = Buffer.from(await (await req(info.url)).arrayBuffer());
if (sha(zip) !== ZIP_SHA) console.warn(`[ual] zip SHA-256 differs (new upload?): ${sha(zip)} — checking the files inside`);

const tmp = mkdtempSync(join(tmpdir(), 'ual-'));
try {
  const z = join(tmp, 'ual.zip'); writeFileSync(z, zip);
  try { execFileSync('unzip', ['-q', '-o', z, '-d', tmp]); } catch { execFileSync('tar', ['-xf', z, '-C', tmp]); }
  mkdirSync(dest, { recursive: true });
  for (const [inZip, [name, h]] of Object.entries(FILES)) {
    const from = join(tmp, 'Universal Animation Library[Standard]', ...inZip.split('/'));
    const got = sha(readFileSync(from));
    if (got !== h) throw new Error(`${inZip}: SHA-256 ${got}, expected ${h} — update the ledger (apps/unity-studio/ASSET_LICENSES.md) before using it`);
    copyFileSync(from, join(dest, name));
    console.log(`[ual] ${name} ok (${h.slice(0, 12)}…)`);
  }
} finally { rmSync(tmp, { recursive: true, force: true }); }
