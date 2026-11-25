// Downloads the CC0 sky HDRIs the slice uses from Poly Haven (official API), checks each file's MD5, and writes them to
// Assets/Resources/Sky/ (loaded at runtime by SkyDirector). Re-run to restore or change resolution:  node "apps/unity-studio/Tools~/fetch-hdris.mjs" [1k|2k]
// Licence: CC0 (https://polyhaven.com/license). Ledger: apps/special-soldier/docs/ASSET_LICENSES.md
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SKIES = {
  day: 'kloofendal_48d_partly_cloudy_puresky',
  dawn: 'kloppenheim_06_puresky',
  storm: 'overcast_soil_puresky',
  dusk: 'belfast_sunset_puresky',
  night: 'qwantani_night_puresky',
};
const res = process.argv[2] || '1k';
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'Assets', 'Resources', 'Sky');
mkdirSync(out, { recursive: true });
for (const [preset, id] of Object.entries(SKIES)) {
  const files = await (await fetch(`https://api.polyhaven.com/files/${id}`)).json();
  const f = files.hdri[res].hdr;
  const buf = Buffer.from(await (await fetch(f.url)).arrayBuffer());
  const md5 = createHash('md5').update(buf).digest('hex');
  if (md5 !== f.md5) throw new Error(`${id}: MD5 mismatch (${md5} != ${f.md5})`);
  writeFileSync(join(out, `sky_${preset}.hdr`), buf);
  console.log(`[hdri] ${preset.padEnd(6)} ${id} ${res} ${(buf.length / 1024) | 0} kB md5 ${md5}`);
}
