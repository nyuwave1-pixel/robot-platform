// Where the island's trees, palms, rocks and ferns grow — shared by the web game (build.js buildVegetation) and the
// Unity slice (apps/unity-studio/Assets/Scripts/Core/IslandVegetation.cs). Pure maths, no three.js.
// Uses its OWN random stream (VEG_SEED), so adding a prop elsewhere in build.js no longer reshuffles every tree, and the
// layout can be reproduced outside the browser. Rules and densities are the ones buildVegetation used before (v0.20).
// Change it here, then run `node "apps/unity-studio/Tools~/gen-vegetation-fixture.mjs"` so the Unity parity test follows.
import { mulberry, fbm, TAU } from '../core/util.js';
import { FLATS } from './terrain.js';

export const VEG_SEED = 0x5eed7e3;
/** Waterfall clearing (POI.waterfall in build.js reads this). */
export const WATERFALL = { x: 190, z: 150 };
export const inFlat = (x, z, pad = 8) => FLATS.some((f) => x > f.x0 - pad && x < f.x1 + pad && z > f.z0 - pad && z < f.z1 + pad);

/** heightAt: (x, z) → ground height (World.heightAt / terrain.js heightAtGrid). Returns { trunks, palms, rocks, ferns }. */
export function vegetationLayout(heightAt, seed = VEG_SEED) {
  const rnd = mulberry(seed), trunks = [], palms = [], rocks = [], ferns = [];
  for (let i = 0; i < 5200; i++) {
    const x = (rnd() - 0.5) * 860, z = (rnd() - 0.5) * 860, h = heightAt(x, z);
    if (h < 2.8 || inFlat(x, z, 6)) continue;
    const dens = fbm(x * 0.012 + 3, z * 0.012, 2); if (dens < 0.36) continue;
    if (Math.abs(x) < 5 + fbm(z * 0.05, 1, 2) * 4 && z > 0 && z < 300) continue; // trail from the beach to the base gate
    if (Math.hypot(x - WATERFALL.x, z - WATERFALL.z) < 16) continue;
    trunks.push({ x, y: h - 0.3, z, r: rnd() * 6, s: 0.8 + rnd() * 0.9, tx: (rnd() - 0.5) * 0.12, tz: (rnd() - 0.5) * 0.12 });
  }
  for (let i = 0; i < 900; i++) { const a = rnd() * TAU, r = 300 + rnd() * 110, x = Math.cos(a) * r, z = Math.sin(a) * r, h = heightAt(x, z); if (h < 1.1 || h > 5 || inFlat(x, z, 4)) continue; if (Math.abs(x) < 7 && z > 300) continue; palms.push({ x, y: h - 0.3, z, r: rnd() * 6, s: 0.8 + rnd() * 0.6, tx: (rnd() - 0.5) * 0.3, tz: (rnd() - 0.5) * 0.3 }); }
  for (let i = 0; i < 420; i++) { const x = (rnd() - 0.5) * 900, z = (rnd() - 0.5) * 900, h = heightAt(x, z); if (h < -1.5 || inFlat(x, z, 3)) continue; rocks.push({ x, y: h - 0.3, z, r: rnd() * 6, s: 0.5 + rnd() * rnd() * 3.2, tx: rnd(), tz: rnd() }); }
  for (let i = 0; i < 9000; i++) { const x = (rnd() - 0.5) * 820, z = (rnd() - 0.5) * 820, h = heightAt(x, z); if (h < 2.6 || inFlat(x, z, 1)) continue; ferns.push({ x, y: h - 0.05, z, r: rnd() * 6, s: 0.6 + rnd() * 1.1 }); }
  return { trunks, palms, rocks, ferns };
}
