// Island terrain formula shared by the web game and the Unity slice (apps/unity-studio/Assets/Scripts/Core/IslandTerrain.cs).
// Pure maths, no three.js, so node and unit tests can import it. world.js re-exports everything here.
// Change the island here; then run `node apps/unity-studio/Tools~/gen-terrain-fixture.mjs` so the Unity parity test follows.
import { clamp, lerp, smooth, fbm } from '../core/util.js';

export const SIZE = 1200, N = 240, CELL = SIZE / N;
export const FLATS = [
  { x0: -135, x1: 135, z0: -195, z1: 5, h: 16, m: 35, kind: 'base' },
  { x0: -70, x1: 270, z0: -335, z1: -240, h: 7, m: 30, kind: 'air' },
  { x0: -20, x1: 130, z0: -420, z1: -345, h: 2.2, m: 20, kind: 'port' },
  { x0: -175, x1: -105, z0: 115, z1: 185, h: 13, m: 25, kind: 'comms' },
];
export function flatDist(f, x, z) { return Math.hypot(Math.max(f.x0 - x, 0, x - f.x1), Math.max(f.z0 - z, 0, z - f.z1)); }
export function rawHeight(x, z) {
  const r = Math.hypot(x, z), ang = Math.atan2(z, x);
  const R = 430 + 30 * Math.sin(ang * 3 + 1) + 18 * Math.sin(ang * 7);
  const rn = r / R;
  let h = -7 + smooth(1.0, 0.74, rn) * 9.2;
  const inland = smooth(0.8, 0.45, rn);
  h += inland * (fbm(x * 0.006 + 10, z * 0.006 + 7, 5) * 34 - 6) + inland * fbm(x * 0.03, z * 0.03, 3) * 3;
  h += smooth(-150, -300, x) * smooth(0.97, 0.7, rn) * 22;
  for (const f of FLATS) h = lerp(h, f.h, 1 - smooth(0, f.m, flatDist(f, x, z)));
  return h;
}

/** Splat weights [sand, grass, rock, concrete] for the terrain material (same rules World uses for the mesh). */
export function splatAt(x, z, h = rawHeight(x, z)) {
  const slope = Math.abs(rawHeight(x + 3, z) - h) + Math.abs(rawHeight(x, z + 3) - h);
  let wS = smooth(3.4, 2.0, h), wR = (1 - wS) * smooth(2.6, 4.2, slope), wC = 0;
  for (const f of FLATS) { const d = flatDist(f, x, z); if (d < 6) wC = Math.max(wC, 1 - d / 6); }
  wS *= 1 - wC; wR *= 1 - wC;
  return [wS, Math.max(0, 1 - wS - wR - wC), wR, wC];
}

/** The (N+1)² height grid World keeps (Float32, 5 m cells, row = z). */
export function gridHeights() {
  const H = new Float32Array((N + 1) * (N + 1));
  for (let r = 0; r <= N; r++) for (let c = 0; c <= N; c++) H[r * (N + 1) + c] = rawHeight(-SIZE / 2 + c * CELL, -SIZE / 2 + r * CELL);
  return H;
}
/** Bilinear height on that grid — what the game uses for placement and collisions (World.heightAt). */
export function heightAtGrid(H, x, z) {
  const fx = clamp((x + SIZE / 2) / CELL, 0, N - 0.001), fz = clamp((z + SIZE / 2) / CELL, 0, N - 0.001);
  const c = fx | 0, r = fz | 0, u = fx - c, v = fz - r, i = r * (N + 1) + c;
  return lerp(lerp(H[i], H[i + 1], u), lerp(H[i + N + 1], H[i + N + 2], u), v);
}
