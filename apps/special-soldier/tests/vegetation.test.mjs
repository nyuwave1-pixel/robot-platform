// Island vegetation layout (src/world/vegetation.js), shared with the Unity slice (Core/IslandVegetation.cs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gridHeights, heightAtGrid } from '../src/world/terrain.js';
import { vegetationLayout, inFlat, WATERFALL } from '../src/world/vegetation.js';

const H = gridHeights(), at = (x, z) => heightAtGrid(H, x, z), v = vegetationLayout(at);
test('same seed, same island', () => { const w = vegetationLayout(at); assert.deepEqual(w.trunks.slice(0, 20), v.trunks.slice(0, 20)); assert.equal(w.ferns.length, v.ferns.length); });
test('densities stay in the v0.20 range', () => {
  assert.ok(v.trunks.length > 600 && v.trunks.length < 2200, `trees ${v.trunks.length}`);
  assert.ok(v.palms.length > 150 && v.palms.length < 700, `palms ${v.palms.length}`);
  assert.ok(v.rocks.length > 150 && v.rocks.length < 420, `rocks ${v.rocks.length}`);
  assert.ok(v.ferns.length > 2500, `ferns ${v.ferns.length}`);
});
test('nothing grows on the flats, in the waterfall clearing or on the beach trail', () => {
  for (const t of v.trunks) { assert.ok(!inFlat(t.x, t.z, 6)); assert.ok(Math.hypot(t.x - WATERFALL.x, t.z - WATERFALL.z) >= 16); assert.ok(t.y + 0.3 >= 2.8); }
  for (const p of v.palms) { const h = p.y + 0.3; assert.ok(h >= 1.1 && h <= 5, 'palms on the beach band'); }
});
test('trees stand on the ground', () => { for (const t of v.trunks.slice(0, 50)) assert.ok(Math.abs(t.y - (at(t.x, t.z) - 0.3)) < 1e-9); });
