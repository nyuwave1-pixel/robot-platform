// Weapon data table + DPS balance model. Pure data/math: imported by the game AND by node unit tests.
// dmg = per projectile, rpm = cyclic rate, spread in degrees, range = [falloff start, falloff end] metres,
// vel = muzzle velocity m/s, weight kg (drives move speed, ADS + sprint-to-fire time), loud = audible radius (m).
export const WEAPONS = {
  m4:     { name: 'M4A1 CARBINE',     cls: 'ASSAULT RIFLE', slot: 'primary', dmg: 30,  rpm: 800,  mag: 30,  reserve: 210, reload: 2.3, ads: 0.24, zoom: 1.35, recoilV: 0.95, recoilH: 0.35, spread: 2.2, adsSpread: 0.12, range: [45, 130], minMul: 0.6,  vel: 880, weight: 3.4, modes: ['auto', 'semi'],  pellets: 1, loud: 110, unlock: 0, desc: 'Balanced 5.56 carbine. SQUAD 07 standard issue.' },
  arx:    { name: 'ARX-17 TACTICAL',  cls: 'ASSAULT RIFLE', slot: 'primary', dmg: 37,  rpm: 640,  mag: 30,  reserve: 180, reload: 2.5, ads: 0.27, zoom: 1.5,  recoilV: 1.25, recoilH: 0.4,  spread: 2.0, adsSpread: 0.09, range: [60, 160], minMul: 0.65, vel: 900, weight: 3.8, modes: ['auto', 'burst', 'semi'], pellets: 1, loud: 115, unlock: 2, desc: 'Modern modular rifle. Hits harder, cycles slower.' },
  kr5:    { name: 'KR-5 RAPID',       cls: 'ASSAULT RIFLE', slot: 'primary', dmg: 25,  rpm: 960,  mag: 35,  reserve: 245, reload: 2.1, ads: 0.22, zoom: 1.3,  recoilV: 0.85, recoilH: 0.6,  spread: 2.6, adsSpread: 0.16, range: [35, 100], minMul: 0.55, vel: 840, weight: 3.1, modes: ['auto'],          pellets: 1, loud: 105, unlock: 4, desc: 'High-cyclic rifle. Shreds up close, walks at range.' },
  smg:    { name: 'VIPER-9 SMG',      cls: 'SMG',           slot: 'primary', dmg: 22,  rpm: 1000, mag: 32,  reserve: 224, reload: 1.8, ads: 0.17, zoom: 1.2,  recoilV: 0.6,  recoilH: 0.5,  spread: 2.4, adsSpread: 0.3,  range: [18, 55],  minMul: 0.45, vel: 400, weight: 2.4, modes: ['auto', 'semi'],  pellets: 1, loud: 80,  unlock: 1, desc: 'Close-quarters bullet hose. Falls off fast.' },
  shotgun:{ name: 'M90 BREACHER',     cls: 'SHOTGUN',       slot: 'primary', dmg: 15,  rpm: 78,   mag: 7,   reserve: 42,  reload: 0.55, ads: 0.25, zoom: 1.15, recoilV: 4.2,  recoilH: 1.2,  spread: 4.2, adsSpread: 2.6,  range: [10, 32],  minMul: 0.2,  vel: 400, weight: 3.6, modes: ['semi'],          pellets: 9, loud: 130, unlock: 2, shellReload: true, desc: 'Pump-action 12 gauge. Nine pellets per shell.' },
  lmg:    { name: 'MG-48 LMG',        cls: 'LMG',           slot: 'primary', dmg: 34,  rpm: 720,  mag: 100, reserve: 300, reload: 5.6, ads: 0.42, zoom: 1.35, recoilV: 1.05, recoilH: 0.7,  spread: 3.4, adsSpread: 0.22, range: [60, 170], minMul: 0.65, vel: 860, weight: 8.2, modes: ['auto'],          pellets: 1, loud: 140, unlock: 3, desc: 'Belt-fed sustained fire. Heavy; slow to bring up.' },
  bolt:   { name: 'M24 LONGBOW',      cls: 'SNIPER RIFLE',  slot: 'primary', dmg: 160, rpm: 44,   mag: 5,   reserve: 35,  reload: 3.2, ads: 0.4,  zoom: 6,    recoilV: 5.5,  recoilH: 0.8,  spread: 5.5, adsSpread: 0.01, range: [200, 500], minMul: 0.85, vel: 950, weight: 5.4, modes: ['semi'],          pellets: 1, loud: 160, unlock: 1, scope: true, desc: 'Bolt-action. One round, one target — at any range.' },
  dmr:    { name: 'SR-25 MARKSMAN',   cls: 'SNIPER RIFLE',  slot: 'primary', dmg: 78,  rpm: 270,  mag: 10,  reserve: 60,  reload: 2.8, ads: 0.34, zoom: 4,    recoilV: 2.8,  recoilH: 0.7,  spread: 4.5, adsSpread: 0.03, range: [120, 380], minMul: 0.8, vel: 870, weight: 4.9, modes: ['semi'],          pellets: 1, loud: 150, unlock: 3, scope: true, desc: 'Semi-auto precision rifle. Fast follow-up shots.' },
  pistol: { name: 'P9 SUPPRESSED',    cls: 'SIDEARM',       slot: 'sidearm', dmg: 30,  rpm: 400,  mag: 15,  reserve: 90,  reload: 1.5, ads: 0.13, zoom: 1.15, recoilV: 1.3,  recoilH: 0.4,  spread: 1.6, adsSpread: 0.25, range: [20, 55],  minMul: 0.5,  vel: 340, weight: 0.9, modes: ['semi'],          pellets: 1, loud: 14,  unlock: 0, desc: 'Suppressed 9mm. Barely audible past a few metres.' },
  gl:     { name: 'MGL-32 LAUNCHER',  cls: 'SPECIAL',       slot: 'primary', dmg: 190, rpm: 60,   mag: 6,   reserve: 12,  reload: 4.2, ads: 0.35, zoom: 1.2,  recoilV: 3.5,  recoilH: 0.6,  spread: 1.2, adsSpread: 0.5,  range: [7, 7],    minMul: 0.15, vel: 62,  weight: 6.0, modes: ['semi'],          pellets: 1, loud: 90,  unlock: 4, explosive: 7, desc: '40mm grenade launcher. Anti-armour, area denial.' },
};
export const WEAPON_IDS = Object.keys(WEAPONS);
export const BODY_MULT = { head: 2.6, torso: 1.0, limb: 0.72 };

/** Damage of one projectile at a distance (linear falloff between range[0] and range[1]). */
export function damageAt(w, dist) {
  const [a, b] = w.range;
  if (w.explosive) return w.dmg;
  if (dist <= a) return w.dmg;
  if (dist >= b) return w.dmg * w.minMul;
  return w.dmg * (1 - (1 - w.minMul) * ((dist - a) / (b - a)));
}
/** Burst ("paper") DPS: damage × pellets × rounds per second. */
export const burstDps = (w) => (w.dmg * w.pellets * w.rpm) / 60;
/** Probability that one ADS projectile lands on a 0.6 m wide body at `dist`. Mirrors the in-game sampling:
 *  shots are uniform inside a cone of half-angle (ADS spread + sustained-fire bloom + uncompensated recoil climb). */
export function hitChance(w, dist = 40) {
  // steady-state bloom of sustained fire: each aimed shot adds (ADS spread + 0.25)×0.16°, bloom decays at (3 + 2b) °/s (see game/weapons.js)
  const gain = (w.adsSpread + 0.25) * 0.16 * (w.rpm / 60), bloom = Math.min(3.5, (-3 + Math.sqrt(9 + 8 * gain)) / 4);
  const cone = ((w.adsSpread + bloom + w.recoilV * 0.11 * Math.min(1, w.rpm / 600)) * Math.PI) / 180;
  const R = Math.tan(cone) * Math.max(1, dist);
  return Math.max(0.03, Math.min(0.98, (0.3 / R) ** 2));
}
/** Time to empty one magazine and reload it. */
export function cycleTime(w) {
  const reload = w.shellReload ? w.reload * w.mag : w.reload;
  return ((w.mag - 1) * 60) / w.rpm + reload;
}
/** Effective ("field") DPS: includes reload downtime, range falloff and hit probability. */
export function effectiveDps(w, dist = 40) {
  return (damageAt(w, dist) * w.pellets * w.mag * hitChance(w, dist)) / cycleTime(w);
}
/** Shots + seconds to kill a target with `hp` health and `armor` (armor soaks 50% of torso damage). */
export function timeToKill(w, hp = 100, armor = 0, dist = 20) {
  const d = damageAt(w, dist) * w.pellets; let shots = 0, h = hp, a = armor;
  while (h > 0 && shots < 999) { let dm = d; if (a > 0) { const s = Math.min(a, dm * 0.5); a -= s; dm -= s; } h -= dm; shots++; }
  return { shots, time: ((shots - 1) * 60) / w.rpm };
}
export function balanceTable(dist = 40) {
  return WEAPON_IDS.map((id) => { const w = WEAPONS[id]; return { id, name: w.name, cls: w.cls, dmg: w.dmg * w.pellets, rpm: w.rpm, burst: +burstDps(w).toFixed(0), effective: +effectiveDps(w, dist).toFixed(1), hit: +(hitChance(w, dist) * 100).toFixed(0), ttk: +timeToKill(w).time.toFixed(2) }; });
}
