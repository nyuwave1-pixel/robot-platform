// Unit tests for the DPS balance model (pure data — no browser needed).  Run: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { WEAPONS, burstDps, effectiveDps, damageAt, cycleTime, timeToKill, hitChance, balanceTable } from '../src/config/weapons.js';

test('burst DPS = damage × pellets × rpm / 60', () => { assert.equal(burstDps(WEAPONS.m4), 400); assert.equal(Math.round(burstDps(WEAPONS.shotgun)), Math.round((15 * 9 * 78) / 60)); });
test('damage falls off linearly between range bounds', () => { const w = WEAPONS.m4; assert.equal(damageAt(w, 10), 30); assert.equal(damageAt(w, 500), 30 * 0.6); const mid = damageAt(w, (45 + 130) / 2); assert.ok(Math.abs(mid - 24) < 1e-9); });
test('field DPS is always below burst DPS (reload + accuracy + falloff)', () => { for (const w of Object.values(WEAPONS)) for (const d of [10, 40, 150]) assert.ok(effectiveDps(w, d) < burstDps(w), `${w.name} @${d}`); });
test('weapon roles: each class wins in its intended band', () => {
  const f = (id, d) => effectiveDps(WEAPONS[id], d);
  assert.equal(timeToKill(WEAPONS.shotgun, 90, 0, 8).shots, 1, 'shotgun one-shots a sentry in CQB');
  assert.ok(f('shotgun', 6) > f('shotgun', 30) * 5, 'shotgun collapses outside CQB');
  assert.ok(f('smg', 10) > f('pistol', 10), 'SMG beats sidearm up close');
  assert.ok(f('bolt', 200) > f('smg', 200) && f('dmr', 200) > f('m4', 200), 'precision rifles own long range');
  assert.ok(f('m4', 40) > f('smg', 40), 'assault rifle beats SMG at mid range');
});
test('no primary dominates: burst DPS of automatic weapons within ±15%', () => { const v = ['m4', 'arx', 'kr5', 'smg', 'lmg'].map((id) => burstDps(WEAPONS[id])); assert.ok(Math.max(...v) / Math.min(...v) < 1.15, v.join(',')); });
test('time-to-kill: armor adds shots; bolt-action one-shots an unarmoured sentry', () => { assert.equal(timeToKill(WEAPONS.bolt, 90).shots, 1); const a = timeToKill(WEAPONS.m4, 150, 0).shots, b = timeToKill(WEAPONS.m4, 150, 90).shots; assert.ok(b > a); });
test('reload cycle: shell-by-shell reload scales with magazine', () => { assert.ok(Math.abs(cycleTime(WEAPONS.shotgun) - ((6 * 60) / 78 + 0.55 * 7)) < 1e-9); });
test('hit chance decreases with distance and is bounded', () => { for (const w of Object.values(WEAPONS)) { assert.ok(hitChance(w, 20) >= hitChance(w, 200)); assert.ok(hitChance(w, 5) <= 0.98 && hitChance(w, 900) >= 0.03); } });
test('data integrity: every weapon has the full stat block', () => { for (const [id, w] of Object.entries(WEAPONS)) for (const k of ['name', 'cls', 'slot', 'dmg', 'rpm', 'mag', 'reserve', 'reload', 'ads', 'zoom', 'recoilV', 'recoilH', 'spread', 'adsSpread', 'range', 'vel', 'weight', 'modes', 'pellets', 'loud', 'unlock']) assert.ok(w[k] !== undefined, `${id}.${k}`); assert.equal(balanceTable().length, 10); });
