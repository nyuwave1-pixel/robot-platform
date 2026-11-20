// Grid A* (src/game/nav.js) against a stub world made of box colliders — no browser needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findPath, clearLine, standable, steerTarget, replan } from '../src/game/nav.js';

const box = (x0, z0, x1, z1, y1 = 3) => ({ min: { x: x0, y: 0, z: z0 }, max: { x: x1, y: y1, z: z1 } });
const world = (boxes, sea = () => false) => ({ heightAt: (x, z) => (sea(x, z) ? -2 : 1), near: (x, z, r, out = []) => { out.length = 0; for (const b of boxes) out.push(b); return out; } });
const walk = (W, path, ax, az) => { let px = ax, pz = az; for (const p of path) { assert.ok(clearLine(W, px, pz, p.x, p.z, 0), `segment ${px.toFixed(1)},${pz.toFixed(1)} → ${p.x.toFixed(1)},${p.z.toFixed(1)} is blocked`); px = p.x; pz = p.z; } return { px, pz }; };

test('open ground: path is the straight line', () => {
  const p = findPath(world([]), 0, 0, 10, 4, 0);
  assert.equal(p.length, 1); assert.deepEqual(p[0], { x: 10, z: 4 });
});

test('U-shaped room: agent inside walks out of the opening and round to a goal behind the back wall', () => {
  // room 0..8 x 0..8, open on the -z side; goal is behind the +z wall
  const W = world([box(-0.2, 0, 0, 8.2), box(8, 0, 8.2, 8.2), box(-0.2, 8, 8.2, 8.2)]);
  assert.equal(clearLine(W, 4, 4, 4, 12, 0), false, 'direct line is blocked (this is where the old AI got stuck)');
  const p = findPath(W, 4, 4, 4, 12, 0); assert.ok(p && p.length >= 2, 'found a route with turns');
  const end = walk(W, p, 4, 4); assert.ok(Math.hypot(end.px - 4, end.pz - 12) < 0.01, 'ends on the goal');
  assert.ok(p.length < 8, `smoothed (${p.length} waypoints)`);
});

test('goal inside a crate: path ends next to it instead of failing', () => {
  const W = world([box(9, -1, 11, 1)]);
  const p = findPath(W, 0, 0, 10, 0, 0); assert.ok(p); const last = p[p.length - 1];
  assert.ok(standable(W, last.x, last.z, 0) && Math.hypot(last.x - 10, last.z) < 2.5);
});

test('fully enclosed: no path (caller keeps its old fallback)', () => {
  const W = world([box(-3, -3, 3, -2.5), box(-3, 2.5, 3, 3), box(-3, -3, -2.5, 3), box(2.5, -3, 3, 3)]);
  assert.equal(findPath(W, 0, 0, 20, 0, 0), null);
});

test('sea is not walkable; low boxes (kerbs under step height) are ignored, high ones block', () => {
  const W = world([box(4, -5, 5, 5, 0.4)], (x) => x > 20);
  assert.equal(standable(W, 25, 0, 0), false);
  assert.equal(clearLine(W, 0, 0, 10, 0, 0), true, '0.4 m kerb is stepped over (same 0.55 m rule as World.moveCircle)');
});

test('steerTarget follows waypoints and drops the path when the goal moves', () => {
  const W = world([box(-0.2, 0, 0, 8.2), box(8, 0, 8.2, 8.2), box(-0.2, 8, 8.2, 8.2)]);
  const a = { pos: { x: 4, z: 4, y: 0 } }, goal = { x: 4, z: 12 };
  assert.ok(replan(W, a, goal)); const t0 = steerTarget(a, goal); assert.notDeepEqual(t0, goal);
  assert.deepEqual(steerTarget(a, { x: 30, z: 30 }), { x: 30, z: 30 });
});

test('walking the route with game-style collision (r 0.36, wall sliding) reaches the goal after one replan', () => {
  const boxes = [box(-3, -3, 3, 3)], W = world(boxes);
  const hit = (px, pz) => boxes.some((c) => { const cx = Math.max(c.min.x, Math.min(px, c.max.x)), cz = Math.max(c.min.z, Math.min(pz, c.max.z)); return (px - cx) ** 2 + (pz - cz) ** 2 < 0.36 * 0.36; });
  const a = { pos: { x: 0, z: -4.2, y: 0 } }, goal = { x: 0, z: 4.2 }; let stuck = 0, plans = 0, reached = false;
  for (let f = 0; f < 600 && !reached; f++) {
    const t = steerTarget(a, goal); let gx = t.x - a.pos.x, gz = t.z - a.pos.z; const gl = Math.hypot(gx, gz) || 1; gx /= gl; gz /= gl;
    const px = a.pos.x, pz = a.pos.z; if (!hit(a.pos.x + gx * 0.09, a.pos.z)) a.pos.x += gx * 0.09; if (!hit(a.pos.x, a.pos.z + gz * 0.09)) a.pos.z += gz * 0.09;
    if (Math.hypot(a.pos.x - px, a.pos.z - pz) < 0.04 && ++stuck > 10) { stuck = 0; plans++; replan(W, a, goal); }
    reached = Math.hypot(goal.x - a.pos.x, goal.z - a.pos.z) < 0.7;
  }
  assert.ok(reached, `stopped at ${a.pos.x.toFixed(2)},${a.pos.z.toFixed(2)}`); assert.equal(plans, 1, 'one path request, no snagging on corners afterwards');
});
