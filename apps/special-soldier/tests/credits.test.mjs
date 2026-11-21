// The in-game CREDITS screen (src/config/credits.js) must name every asset in the licence ledger (docs/ASSET_LICENSES.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CREDITS } from '../src/config/credits.js';

const ledger = readFileSync(new URL('../docs/ASSET_LICENSES.md', import.meta.url), 'utf8');
const shown = CREDITS.flatMap((c) => c.items).join(' | ');
test('every ledger row (Poly Haven id / Freesound author) is on the credits screen', () => {
  const rows = ledger.split('\n').filter((l) => l.startsWith('|') && /^(Poly Haven|Freesound)/.test((l.split('|')[2] || '').trim())); // per-asset rows: source column
  assert.ok(rows.length >= 20, `ledger rows found: ${rows.length}`);
  for (const r of rows) {
    const cells = r.split('|').map((s) => s.trim()), name = cells[1], author = cells[3];
    const key = /Poly Haven/.test(cells[2]) ? name.split(' ')[0] : author;
    assert.ok(shown.includes(key), `missing on credits screen: ${name} (${key})`);
  }
});
test('CC-BY rows, if any, are credited by author', () => {
  for (const r of ledger.split('\n').filter((l) => /CC[- ]BY/.test(l) && l.startsWith('|'))) { const author = r.split('|')[3].trim(); assert.ok(shown.includes(author), `CC-BY author not credited: ${author}`); }
});
