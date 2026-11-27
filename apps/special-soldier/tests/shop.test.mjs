// PP SHOP rules (src/config/shop.js) and the portal bridge (src/net/portal.js): node --test, no browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SHOP_ITEMS, ITEM, ownership, effects, cosmetics, missionOpen, portalRows } from '../src/config/shop.js';
import { createPortal } from '../src/net/portal.js';

test('catalog: ids follow the portal rule, prices are positive PP, kinds are known', () => {
  const ids = new Set();
  for (const i of SHOP_ITEMS) {
    assert.match(i.id, /^special-soldier-[a-z0-9-]+$/); assert.ok(i.id.length <= 40, i.id);
    assert.ok(!ids.has(i.id), 'unique ' + i.id); ids.add(i.id);
    assert.ok(Number.isInteger(i.price) && i.price > 0, i.id);
    assert.ok(['cosmetic', 'unlock', 'consumable'].includes(i.kind), i.id);
  }
});

test('game.json items match the catalog (what the portal lists is what the game knows)', () => {
  const g = JSON.parse(readFileSync(new URL('../game.json', import.meta.url), 'utf8'));
  assert.deepEqual(g.items, portalRows());
});

test('ownership ignores unknown ids, non-owned rows and zero counts', () => {
  const own = ownership([{ id: 'special-soldier-armory', owned: true }, { id: 'special-soldier-camo-gold', owned: false }, { id: 'evil-item', owned: true },
    { id: 'special-soldier-revive', count: 3 }, { id: 'special-soldier-supply', count: 0 }, null]);
  assert.deepEqual([...own.owned], ['special-soldier-armory']);
  assert.deepEqual(own.counts, { 'special-soldier-revive': 3 });
  assert.deepEqual(ownership('not a list').owned.size, 0);
});

test('effects: unlocks apply in the campaign, nothing in ranked multiplayer', () => {
  const own = ownership(['special-soldier-armory', 'special-soldier-mission-select', 'special-soldier-gear-early', 'special-soldier-camo-gold', 'special-soldier-callsign-gold'].map((id) => ({ id, owned: true })));
  const fx = effects(own);
  assert.equal(fx.allWeapons, true); assert.equal(fx.allMissions, true); assert.equal(fx.earlyGear, true);
  assert.equal(fx.camo, ITEM['special-soldier-camo-gold'].tint); assert.equal(fx.callsignColor, '#ffd36a');
  const mp = effects(own, { ranked: true });
  assert.deepEqual(mp, { allWeapons: false, allMissions: false, earlyGear: false, camo: null, callsignColor: null });
  assert.equal(cosmetics(own).camo, ITEM['special-soldier-camo-gold'].tint, 'looks-only items may still show');
});

test('camo pick chooses among owned finishes only', () => {
  const own = ownership([{ id: 'special-soldier-camo-desert', owned: true }, { id: 'special-soldier-camo-gold', owned: true }]);
  assert.equal(effects(own).camo, ITEM['special-soldier-camo-gold'].tint, 'default: the best owned');
  own.camoPick = 'special-soldier-camo-desert'; assert.equal(effects(own).camo, ITEM['special-soldier-camo-desert'].tint);
  own.camoPick = 'special-soldier-camo-urban'; assert.equal(effects(own).camo, null, 'not owned → no camo');
});

test('mission select: progress or the unlock', () => {
  assert.equal(missionOpen(3, 1, { allMissions: false }), false);
  assert.equal(missionOpen(1, 1, null), true);
  assert.equal(missionOpen(4, 0, { allMissions: true }), true);
});

// a fake window pair: the game frame posts to its parent, the "portal" answers like BIT PARK
function frames(answer) {
  const listeners = [];
  const win = { addEventListener: (t, f) => listeners.push(f), parent: null };
  win.parent = { postMessage: (m) => { const r = answer(m); if (r) setTimeout(() => listeners.forEach((f) => f({ data: { source: 'bitpark-portal', id: m.id, ...r } })), 0); } };
  return win;
}

test('portal bridge: standalone rejects, embedded calls follow the SDK message shape', async () => {
  const solo = { addEventListener() {} }; solo.parent = solo;
  const s = createPortal('special-soldier', { win: solo });
  assert.equal(s.embedded, false);
  assert.equal(await s.items(), null);
  await assert.rejects(s.buy('special-soldier-armory'), /standalone/);

  const seen = [];
  const p = createPortal('special-soldier', { win: frames((m) => { seen.push(m);
    if (m.call === 'getGameItems') return { ok: true, result: [{ id: 'special-soldier-revive', count: 2 }] };
    if (m.call === 'buyGameItem') return { ok: false, error: 'insufficient_funds' };
    if (m.call === 'useGameItem') return { ok: true, result: { ok: true, left: 1 } };
    return { ok: true, result: { PP: 120 } }; }) });
  assert.equal(p.embedded, true);
  assert.deepEqual(await p.items(), [{ id: 'special-soldier-revive', count: 2 }]);
  await assert.rejects(p.buy('special-soldier-armory'), /insufficient_funds/);
  assert.deepEqual(await p.use('special-soldier-revive', 'revive:0:1'), { ok: true, left: 1 });
  assert.deepEqual(await p.wallet(), { PP: 120 });
  const use = seen.find((m) => m.call === 'useGameItem');
  assert.deepEqual({ source: use.source, slug: use.slug, args: use.args }, { source: 'bitpark-game', slug: 'special-soldier', args: { id: 'special-soldier-revive', ref: 'revive:0:1' } });
});
