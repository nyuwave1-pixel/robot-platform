// Island terrain formula (src/world/terrain.js), shared with the Unity slice (apps/unity-studio/Assets/Scripts/Core/IslandTerrain.cs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SIZE, N, CELL, FLATS, rawHeight, splatAt, flatDist } from '../src/world/terrain.js';

test('grid constants', () => { assert.equal(SIZE, 1200); assert.equal(N, 240); assert.equal(CELL, 5); });
test('flattened areas sit at their height', () => {
  for (const f of FLATS) { const cx = (f.x0 + f.x1) / 2, cz = (f.z0 + f.z1) / 2; assert.equal(flatDist(f, cx, cz), 0); assert.ok(Math.abs(rawHeight(cx, cz) - f.h) < 1e-9, f.kind); }
});
test('open sea outside the island, land inside', () => {
  assert.ok(rawHeight(590, 590) < 0, 'corner is sea'); assert.ok(rawHeight(0, 250) > 2, 'island interior is above the beach');
});
test('splat weights are non-negative and sum to 1', () => {
  for (const [x, z] of [[0, -95], [0, 420], [-140, 150], [300, 300], [0, 250]]) {
    const w = splatAt(x, z); assert.equal(w.length, 4);
    assert.ok(w.every((v) => v >= 0), `${x},${z}`); assert.ok(Math.abs(w.reduce((a, b) => a + b, 0) - 1) < 1e-9, `${x},${z}`);
  }
  assert.equal(splatAt(0, -95)[3], 1, 'the base flat is concrete');
});
