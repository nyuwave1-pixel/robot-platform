// SURVIVAL WORLD — rules (technical prototype). Pure: no browser APIs, no Math.random — everything comes from the world seed
// and an rng kept in the state, so a world can be shared by its seed and tests run in node. main.js draws it with three.js.
// Units: metres, seconds. A day is DAY seconds; night is the last part of it.

// ---------------------------------------------------------------- seeded randomness and noise
function rngNext(s) { const a = (s + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return [a, ((t ^ (t >>> 14)) >>> 0) / 4294967296]; }
export function rand(G) { const [n, v] = rngNext(G.rng); G.rng = n; return v; }
function hash2(seed, ix, iz) { let h = (seed ^ Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
const fade = (t) => t * t * (3 - 2 * t);
function vnoise(seed, x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = fade(x - ix), fz = fade(z - iz);
  const a = hash2(seed, ix, iz), b = hash2(seed, ix + 1, iz), c = hash2(seed, ix, iz + 1), d = hash2(seed, ix + 1, iz + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}
function fbm(seed, x, z, oct = 4) { let s = 0, amp = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += amp * vnoise(seed + i * 101, x * f, z * f); f *= 2; amp *= 0.5; } return s; }
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- world
export const WORLD = 420, ISLAND = 165, DAY = 360, NIGHT_FROM = 0.79, NIGHT_TO = 0.23;   // phase 0.25 = 06:00, night 19:00–05:30
/** Terrain height (water level 0). Same idea as the shared SPECIAL SOLDIER island: a radial falloff plus fractal noise. */
export function heightAt(seed, x, z) {
  const r = Math.hypot(x, z), ang = Math.atan2(z, x);
  const R = ISLAND * (1 + 0.12 * Math.sin(ang * 3 + (seed % 7)) + 0.07 * Math.sin(ang * 5 + (seed % 13)));
  const shore = smooth(1.05, 0.78, r / R);
  const hills = fbm(seed, x * 0.012, z * 0.012) * 34 - 9, detail = fbm(seed + 77, x * 0.05, z * 0.05, 3) * 3;
  return -6 + shore * (7 + Math.max(0, hills) + detail);
}
export const biomeAt = (seed, x, z, h = heightAt(seed, x, z)) => (h < 0.2 ? 'water' : h < 1.6 ? 'beach' : h > 17 ? 'rock' : fbm(seed + 9, x * 0.02, z * 0.02, 3) > 0.52 ? 'forest' : 'grass');

/** Resource nodes, placed from the seed on a jittered grid (trees in forest, rocks up high and a few elsewhere, bushes on grass). */
export function makeWorld(seed) {
  const nodes = [], step = 6;
  let n = 0;
  for (let x = -WORLD / 2; x < WORLD / 2; x += step) for (let z = -WORLD / 2; z < WORLD / 2; z += step) {
    const jx = x + hash2(seed + 3, x, z) * step, jz = z + hash2(seed + 4, x, z) * step, h = heightAt(seed, jx, jz), b = biomeAt(seed, jx, jz, h), r = hash2(seed + 5, x, z);
    let kind = null;
    if (b === 'forest' && r < 0.55) kind = 'tree';
    else if (b === 'grass' && r < 0.07) kind = 'tree';
    else if (b === 'grass' && r < 0.16) kind = 'bush';
    else if (b === 'rock' && r < 0.3) kind = 'rock';
    else if ((b === 'grass' || b === 'beach') && r > 0.975) kind = 'rock';
    if (kind) nodes.push({ id: n++, kind, x: jx, z: jz, y: h, hp: NODE[kind].hp, respawnAt: 0 });
  }
  // spawn: the lowest grass point near the south shore that is dry land
  let spawn = { x: 0, z: ISLAND * 0.6 };
  for (let k = 0; k < 60; k++) { const z = ISLAND * (0.95 - k * 0.015); if (heightAt(seed, 0, z) > 1.8) { spawn = { x: 0, z }; break; } }
  return { seed, nodes, spawn };
}

// ---------------------------------------------------------------- items, nodes, recipes
export const ITEMS = {
  wood: { name: '나무', en: 'Wood' }, stone: { name: '돌', en: 'Stone' }, fiber: { name: '섬유', en: 'Fiber' }, berry: { name: '열매', en: 'Berries', food: 12 },
  meat: { name: '날고기', en: 'Raw meat', food: 10, hurt: 5 }, cooked: { name: '구운 고기', en: 'Cooked meat', food: 38 },
  axe: { name: '돌도끼', en: 'Stone axe', tool: true, dmg: 9 }, pickaxe: { name: '곡괭이', en: 'Pickaxe', tool: true, dmg: 7 }, spear: { name: '나무 창', en: 'Wooden spear', tool: true, dmg: 15 },
  campfire: { name: '모닥불', en: 'Campfire', place: true }, wall: { name: '나무 벽', en: 'Wooden wall', place: true },
};
export const NODE = {
  tree: { hp: 3, drop: { wood: 2 }, bonus: { tool: 'axe', drop: { wood: 4 } }, regrow: 240 },
  rock: { hp: 4, drop: { stone: 2 }, bonus: { tool: 'pickaxe', drop: { stone: 4 } }, regrow: 300 },
  bush: { hp: 1, drop: { berry: 2, fiber: 2 }, regrow: 120 },
};
export const RECIPES = {
  axe: { need: { wood: 3, stone: 2 } }, pickaxe: { need: { wood: 3, stone: 3 } }, spear: { need: { wood: 4, fiber: 3 } },
  campfire: { need: { wood: 5, stone: 4 } }, wall: { need: { wood: 6 } }, cooked: { need: { meat: 1 }, nearFire: true },
};

// ---------------------------------------------------------------- game state
export function newGame(seed = 1) {
  const W = makeWorld(seed);
  return { v: 1, seed, rng: (seed * 2654435761) >>> 0, time: DAY * 0.25, day: 1, world: W,
    player: { x: W.spawn.x, z: W.spawn.z, hp: 100, hunger: 100, thirst: 100, warmth: 100, stamina: 100, hitCd: 0, alive: true },
    inv: { wood: 0, stone: 0, fiber: 0, berry: 2 }, structures: [], wolves: [], wolfSeq: 0, kills: 0, log: [] };
}
export const isNight = (G) => { const k = (G.time % DAY) / DAY; return k >= NIGHT_FROM || k < NIGHT_TO; };
export const dayPhase = (G) => (G.time % DAY) / DAY;
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const nearFire = (G, p = G.player, r = 6) => G.structures.some((s) => s.kind === 'campfire' && dist(s, p) < r);
export const has = (G, need) => Object.entries(need).every(([k, n]) => (G.inv[k] || 0) >= n);
function add(G, drop) { for (const [k, n] of Object.entries(drop)) G.inv[k] = (G.inv[k] || 0) + n; }
function take(G, need) { for (const [k, n] of Object.entries(need)) G.inv[k] -= n; }
const say = (G, t) => { G.log.push({ t: G.time, text: t }); if (G.log.length > 8) G.log.shift(); };

/** Needs, clock, regrowth and wolves for dt seconds. input: { sprinting } */
export function step(G, dt, input = {}) {
  const P = G.player; if (!P.alive) return G;
  const before = Math.floor(G.time / DAY); G.time += dt; if (Math.floor(G.time / DAY) > before) { G.day++; say(G, `day ${G.day}`); }
  const night = isNight(G), fire = nearFire(G);
  P.hunger = Math.max(0, P.hunger - dt * (input.sprinting ? 0.26 : 0.16));
  P.thirst = Math.max(0, P.thirst - dt * (input.sprinting ? 0.34 : 0.22));
  P.stamina = Math.max(0, Math.min(100, P.stamina + dt * (input.sprinting ? -14 : 9)));
  P.warmth = Math.max(0, Math.min(100, P.warmth + dt * (fire ? 4 : night ? -0.45 : 0.8)));
  let hurt = 0;
  if (!P.hunger) hurt += 0.5; if (!P.thirst) hurt += 0.6; if (!P.warmth) hurt += 0.4;
  if (hurt) P.hp -= hurt * dt;
  else if (P.hunger > 60 && P.thirst > 60) P.hp = Math.min(100, P.hp + dt * 0.25);
  P.hitCd = Math.max(0, P.hitCd - dt);
  for (const n of G.world.nodes) if (n.hp <= 0 && G.time >= n.respawnAt) n.hp = NODE[n.kind].hp;
  wolves(G, dt, night);
  if (P.hp <= 0) { P.hp = 0; P.alive = false; say(G, 'died'); }
  return G;
}

// wolves: come at night, hunt within 45 m, keep away from fire, run off at dawn
export const WOLF = { hp: 30, speed: 4.4, bite: 8, every: 1.3, sense: 45, fear: 7, maxAtNight: 4 };
function wolves(G, dt, night) {
  const P = G.player;
  if (night && G.wolves.length < WOLF.maxAtNight + Math.min(4, G.day - 1) && rand(G) < dt * 0.08) {
    const a = rand(G) * Math.PI * 2, r = 38 + rand(G) * 12, w = { id: ++G.wolfSeq, x: P.x + Math.cos(a) * r, z: P.z + Math.sin(a) * r, hp: WOLF.hp, cd: 0 };
    if (heightAt(G.seed, w.x, w.z) > 0.5) G.wolves.push(w);
  }
  for (const w of G.wolves) {
    w.cd = Math.max(0, w.cd - dt);
    const fire = G.structures.find((s) => s.kind === 'campfire' && dist(s, w) < WOLF.fear);
    const d = dist(w, P);
    let tx = 0, tz = 0;
    if (!night) { tx = w.x - P.x; tz = w.z - P.z; }                         // dawn: leave
    else if (fire) { tx = w.x - fire.x; tz = w.z - fire.z; }                // fear of fire
    else if (d < WOLF.sense) { tx = P.x - w.x; tz = P.z - w.z; }            // hunt
    const L = Math.hypot(tx, tz);
    if (L > 0.01 && !(d < 1.5 && night && !fire)) { const nx = w.x + (tx / L) * WOLF.speed * dt, nz = w.z + (tz / L) * WOLF.speed * dt; if (!blocked(G, nx, nz, 0.6)) { w.x = nx; w.z = nz; } }
    if (night && !fire && d < 1.7 && w.cd <= 0 && P.alive) { P.hp -= WOLF.bite; w.cd = WOLF.every; say(G, 'bitten'); }
  }
  G.wolves = G.wolves.filter((w) => w.hp > 0 && (night || dist(w, P) < 70));
}

/** Walls (2 m wide) block movement for the player and wolves. */
export function blocked(G, x, z, r = 0.45) {
  if (heightAt(G.seed, x, z) < -0.6) return true;                          // deep water
  return G.structures.some((s) => s.kind === 'wall' && Math.abs(x - s.x) < 1 + r && Math.abs(z - s.z) < 1 + r);
}
export function movePlayer(G, dx, dz) {
  const P = G.player; if (!P.alive) return;
  if (!blocked(G, P.x + dx, P.z)) P.x += dx;
  if (!blocked(G, P.x, P.z + dz)) P.z += dz;
}

// ---------------------------------------------------------------- actions (return a short result for the screen)
export const REACH = 2.6;
export function nearestNode(G, r = REACH) {
  let best = null, bd = r;
  for (const n of G.world.nodes) { if (n.hp <= 0) continue; const d = dist(n, G.player); if (d < bd) { bd = d; best = n; } }
  return best;
}
export function gather(G, node) {
  if (!node || node.hp <= 0 || dist(node, G.player) > REACH + 0.5) return { ok: false, why: 'far' };
  const D = NODE[node.kind]; node.hp--;
  if (node.hp > 0) return { ok: true, hit: true };
  const drop = D.bonus && G.inv[D.bonus.tool] ? D.bonus.drop : D.drop;
  add(G, drop); node.respawnAt = G.time + D.regrow;
  return { ok: true, drop };
}
export function craft(G, id) {
  const R = RECIPES[id]; if (!R) return { ok: false, why: 'unknown' };
  if (R.nearFire && !nearFire(G)) return { ok: false, why: 'fire' };
  if (!has(G, R.need)) return { ok: false, why: 'need' };
  if (ITEMS[id].tool && G.inv[id]) return { ok: false, why: 'have' };
  take(G, R.need); add(G, { [id]: 1 }); return { ok: true };
}
export function eat(G, id) {
  const I = ITEMS[id]; if (!I || !I.food || !(G.inv[id] > 0)) return { ok: false };
  G.inv[id]--; G.player.hunger = Math.min(100, G.player.hunger + I.food); if (I.hurt) G.player.hp -= I.hurt; return { ok: true };
}
export const canDrink = (G) => [[1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5], [0, 0]].some(([a, b]) => heightAt(G.seed, G.player.x + a, G.player.z + b) < 0.3);
export function drink(G) { if (!canDrink(G)) return { ok: false, why: 'water' }; G.player.thirst = Math.min(100, G.player.thirst + 25); return { ok: true }; }
export const snap = (v) => Math.round(v / 2) * 2;
export function canPlace(G, kind, x, z) {
  if (!ITEMS[kind]?.place || !(G.inv[kind] > 0)) return false;
  x = snap(x); z = snap(z);
  const h = heightAt(G.seed, x, z), slope = Math.abs(heightAt(G.seed, x + 1, z) - heightAt(G.seed, x - 1, z)) + Math.abs(heightAt(G.seed, x, z + 1) - heightAt(G.seed, x, z - 1));
  if (h < 0.6 || slope > 2.2) return false;
  if (G.structures.some((s) => s.x === x && s.z === z)) return false;
  if (G.world.nodes.some((n) => n.hp > 0 && Math.hypot(n.x - x, n.z - z) < 1.6)) return false;
  if (Math.hypot(G.player.x - x, G.player.z - z) < 1.2 && kind === 'wall') return false;   // not on top of yourself
  return true;
}
export function place(G, kind, x, z, rot = 0) {
  if (!canPlace(G, kind, x, z)) return { ok: false };
  G.inv[kind]--; G.structures.push({ kind, x: snap(x), z: snap(z), rot }); return { ok: true };
}
export function attack(G, wolf) {
  const P = G.player; if (!wolf || P.hitCd > 0 || dist(wolf, P) > 2.4) return { ok: false };
  const tool = ['spear', 'axe', 'pickaxe'].find((t) => G.inv[t]); wolf.hp -= tool ? ITEMS[tool].dmg : 5; P.hitCd = 0.55;
  if (wolf.hp <= 0) { G.kills++; add(G, { meat: 2 }); return { ok: true, killed: true }; }
  return { ok: true };
}

// ---------------------------------------------------------------- save (the world is rebuilt from the seed; only what changed is stored)
export function save(G) {
  return JSON.stringify({ v: G.v, seed: G.seed, rng: G.rng, time: G.time, day: G.day, player: G.player, inv: G.inv, structures: G.structures, kills: G.kills,
    nodes: G.world.nodes.filter((n) => n.hp !== NODE[n.kind].hp).map((n) => [n.id, n.hp, n.respawnAt]) });
}
export function load(text) {
  const d = JSON.parse(text), G = newGame(d.seed);
  Object.assign(G, { rng: d.rng, time: d.time, day: d.day, player: d.player, inv: d.inv, structures: d.structures, kills: d.kills || 0 });
  for (const [id, hp, at] of d.nodes || []) { const n = G.world.nodes[id]; if (n) { n.hp = hp; n.respawnAt = at; } }
  return G;
}
