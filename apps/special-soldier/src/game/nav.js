// Grid A* around box colliders (v0.15) — fixes AI getting stuck on building corners / indoor walls.
// The world is a heightmap + axis-aligned box colliders (world.js), so a local occupancy grid is enough; no navmesh build,
// no WASM. Agents still walk straight at their goal; only when they stop making progress do they ask for a path and
// follow its waypoints. Pure functions over a `world` with heightAt(x,z), near(x,z,r,out) and moveCircle-style boxes,
// so tests can run it in Node with a stub world (tests/nav.test.mjs).

const CELL = 0.5, MAX_SPAN = 90, MAX_EXPAND = 9000;

/** Can a capsule (radius r, height h, feet at y) stand at x,z? Same rules as World.moveCircle + the water check AI uses. */
export function standable(world, x, z, y, r = 0.38, h = 1.7, list = []) {
  if (y > -30 && world.heightAt(x, z) < 0.15) return false; // sea
  world.near(x, z, r + 1, list);
  for (const c of list) {
    if (c.max.y < y + 0.55 || c.min.y > y + h || c.pass) continue;
    const cx = Math.max(c.min.x, Math.min(x, c.max.x)), cz = Math.max(c.min.z, Math.min(z, c.max.z));
    if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return false;
  }
  return true;
}

/** Walkable straight segment (sampled every 0.4 m). */
export function clearLine(world, ax, az, bx, bz, y, r = 0.38) {
  const d = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(d / 0.4)), list = [];
  for (let i = 1; i <= n; i++) { const t = i / n; if (!standable(world, ax + (bx - ax) * t, az + (bz - az) * t, y, r, 1.7, list)) return false; }
  return true;
}

/**
 * A* from (ax,az) to (bx,bz) on a 0.5 m grid inside a window around both points.
 * Returns a smoothed list of {x,z} waypoints (excluding the start), or null if no route inside the window/budget.
 * If the goal cell is blocked (goal inside a crate etc.) the nearest reached cell is used.
 */
export function findPath(world, ax, az, bx, bz, y, r = 0.38) {
  const span = Math.min(MAX_SPAN, Math.max(Math.abs(bx - ax), Math.abs(bz - az)) + 24);
  const ox = Math.min(ax, bx) - (span - Math.abs(bx - ax)) / 2, oz = Math.min(az, bz) - (span - Math.abs(bz - az)) / 2;
  const W = Math.ceil(span / CELL), H = W, N = W * H;
  const toI = (x, z) => { const i = Math.floor((x - ox) / CELL), j = Math.floor((z - oz) / CELL); return i < 0 || j < 0 || i >= W || j >= H ? -1 : j * W + i; };
  const cx = (k) => ox + ((k % W) + 0.5) * CELL, cz = (k) => oz + (((k / W) | 0) + 0.5) * CELL;
  const s = toI(ax, az), t = toI(bx, bz); if (s < 0 || t < 0) return null;
  const free = new Int8Array(N); // 0 unknown, 1 free, -1 blocked (lazily evaluated: only cells A* touches)
  const list = [];
  const ok = (k) => { if (!free[k]) free[k] = standable(world, cx(k), cz(k), y, r, 1.7, list) ? 1 : -1; return free[k] > 0; };
  const g = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const heap = []; const push = (k, f) => { heap.push([f, k]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, rr = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (rr < heap.length && heap[rr][0] < heap[m][0]) m = rr; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top[1]; };
  const hx = cx(t), hz = cz(t), h = (k) => Math.hypot(cx(k) - hx, cz(k) - hz);
  g[s] = 0; push(s, h(s)); let best = s, bestH = h(s), n = 0;
  while (heap.length && n++ < MAX_EXPAND) {
    const k = pop(); if (closed[k]) continue; closed[k] = 1;
    const hk = h(k); if (hk < bestH) { bestH = hk; best = k; }
    if (k === t) { best = t; break; }
    const i = k % W, j = (k / W) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= W || nj >= H) continue;
      const nk = nj * W + ni; if (closed[nk] || !ok(nk)) continue;
      if (di && dj && (!ok(j * W + ni) || !ok(nj * W + i))) continue; // no corner cutting
      const ng = g[k] + (di && dj ? 1.4142 : 1) * CELL; if (ng < g[nk]) { g[nk] = ng; from[nk] = k; push(nk, ng + h(nk)); }
    }
  }
  if (best === s) return null;
  if (best !== t && bestH > 2.5) return null; // could not get near the goal inside the window
  const raw = []; for (let k = best; k !== -1 && k !== s; k = from[k]) raw.push({ x: cx(k), z: cz(k) }); raw.reverse();
  if (best === t) raw[raw.length - 1] = { x: bx, z: bz };
  // string pulling: skip waypoints that can be reached in a straight walkable line
  const out = []; let px = ax, pz = az, i = 0;
  while (i < raw.length) { let j = raw.length - 1; while (j > i && !clearLine(world, px, pz, raw[j].x, raw[j].z, y, r)) j--; out.push(raw[j]); px = raw[j].x; pz = raw[j].z; i = j + 1; }
  return out;
}

/**
 * Path-following helper. Call each frame with the agent's current goal; returns the point to steer at.
 * `a.nav` keeps { gx, gz, pts, i } — invalidated when the goal moves more than 1.5 m.
 */
export function steerTarget(a, goal) {
  const n = a.nav; if (!n || !n.pts || Math.hypot(n.gx - goal.x, n.gz - goal.z) > 1.5) return goal;
  // advance when the next waypoint is in a clear straight line from where the agent actually stands (body radius + 2 cm),
  // or the agent is right on the waypoint. Advancing by distance alone (0.6 m, then 0.15 m) made agents cut the corner
  // and snag on the box they were walking round; overshooting a waypoint is fine — once past it the line clears.
  while (n.i < n.pts.length - 1) {
    const p = n.pts[n.i], q = n.pts[n.i + 1];
    if (Math.hypot(p.x - a.pos.x, p.z - a.pos.z) < 0.05 || (n.world && clearLine(n.world, a.pos.x, a.pos.z, q.x, q.z, a.pos.y, 0.38))) n.i++; else break;
  }
  return n.pts[n.i];
}
/** Ask for a path after the agent got stuck. Returns true if one was found (agent will follow it). */
export function replan(world, a, goal) {
  const pts = findPath(world, a.pos.x, a.pos.z, goal.x, goal.z, a.pos.y, PLAN_R);
  a.nav = pts && pts.length ? { gx: goal.x, gz: goal.z, pts, i: 0, world } : null;
  return !!a.nav;
}
const PLAN_R = 0.45; // agents move with r = 0.35–0.36; plan with a margin so smoothed segments keep clear of corners
