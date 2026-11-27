// Multiplayer rules — the one place that decides hits, deaths, respawns, scores and the end of a match.
// Pure JavaScript (no three.js, no DOM), so the same code runs in two places, like the "listen server" /
// "dedicated server" split most shooters use:
//   - small matches (1v1 … 4v4): inside the room host's browser, messages over Supabase Realtime;
//   - large matches (up to 15v15): inside server/mp-server.mjs, messages over a WebSocket.
// Clients never change health or scores themselves: they send a hit claim, the authority checks it and
// broadcasts the result. Every output is an event object handed to `emit`.

export const MODES = {
  duel: { name: '1v1 DUEL', perTeam: 1, scoreLimit: 7, timeLimit: 300 },
  tdm: { name: 'TEAM DEATHMATCH', perTeam: 15, scoreLimit: 50, timeLimit: 600 },
};
export const TEAMS = ['blue', 'red'];
export const TEAM_NAME = { blue: 'SQUAD 07', red: 'BLACK COBRA' };
export const MAX_HP = 100, RESPAWN_S = 4, SPAWN_PROTECT_S = 2;
// Arena: the Black Cobra base. Blue spawns at the south gate, red at the north end, spread across the yard.
export const SPAWNS = { blue: { x: 0, z: -14, yaw: 0, spread: 42 }, red: { x: 0, z: -182, yaw: Math.PI, spread: 42 } };
export const ARENA = { x0: -130, x1: 130, z0: -192, z1: 2 };
// Limits a claim must respect. Highest single bullet: the 12-gauge slug / magnum to the head is ~ 110 × 2.6.
const MAX_HIT = 300, MAX_DPS = 1600, MAX_SHOOTER_DRIFT = 9, MAX_RANGE = 950;
// Hit-point check: the claimed impact must sit in the target's body column at one of its positions from the last
// HIST_S seconds (that window is the lag compensation), and the line eye → impact must not pass under the terrain.
// Grenades: the thrower's client simulates the throw and reports where it went off; the Authority checks the report
// (known throw, fuse time, distance from the throw point) and deals the blast damage itself.
export const NADES_PER_LIFE = 2, NADE_R = 7.5, NADE_DMG = 170, NADE_MAX_S = 6, NADE_MAX_DIST = 55;
export const HIST_S = 0.6, BODY_R = 1.2, BODY_LO = -0.4, BODY_HI = 2.2, EYE_DRIFT = 3.5;

// ---- static boxes: uniform grid (16 m cells) + segment / box slab test; boxes shrunk 0.15 m so grazing edges pass ----
const CELL = 16, SHRINK = 0.15;
function boxGrid(list) {
  const g = new Map();
  for (const r of list) { const b = [r[0] + SHRINK, r[1] + SHRINK, r[2] + SHRINK, r[3] - SHRINK, r[4] - SHRINK, r[5] - SHRINK]; if (b[0] >= b[3] || b[2] >= b[5]) continue;
    for (let x = Math.floor(b[0] / CELL); x <= Math.floor(b[3] / CELL); x++) for (let z = Math.floor(b[2] / CELL); z <= Math.floor(b[5] / CELL); z++) { const k = x + ',' + z; if (!g.has(k)) g.set(k, []); g.get(k).push(b); } }
  return g;
}
export function segBox(a, b, x) {
  let t0 = 0, t1 = 1;
  for (let i = 0; i < 3; i++) { const d = b[i] - a[i], lo = x[i], hi = x[i + 3];
    if (Math.abs(d) < 1e-9) { if (a[i] < lo || a[i] > hi) return false; continue; }
    let u = (lo - a[i]) / d, v = (hi - a[i]) / d; if (u > v) [u, v] = [v, u]; t0 = Math.max(t0, u); t1 = Math.min(t1, v); if (t0 > t1) return false; }
  return true;
}

export class Authority {
  constructor({ mode = 'duel', now = () => Date.now() / 1000, emit = () => {}, rnd = Math.random, ground = null, strict = false, boxes = null } = {}) {
    this.mode = MODES[mode] ? mode : 'duel'; this.now = now; this.emit = emit; this.rnd = rnd; this.ground = ground; this.strict = strict; this.grid = boxes ? boxGrid(boxes) : null; // ground(x, z) → terrain height, or null to skip the line-of-sight check
    this.players = new Map(); this.score = { blue: 0, red: 0 }; this.phase = 'lobby'; this.endsAt = 0; this.winner = null; this.rejected = 0;
  }
  get cfg() { return MODES[this.mode]; }
  teamCount(t) { let n = 0; for (const p of this.players.values()) if (p.team === t) n++; return n; }
  /** A player asks to join. Returns false when both teams are full. */
  join(id, name, pref) {
    if (this.players.has(id)) { this.emitRoster(); return true; }
    const cap = this.cfg.perTeam, open = TEAMS.filter((t) => this.teamCount(t) < cap);
    if (!open.length) { this.emit({ k: 'full', i: id }); return false; }
    const team = open.includes(pref) ? pref : open.sort((a, b) => this.teamCount(a) - this.teamCount(b))[0];
    this.players.set(id, { id, name: String(name || 'OPERATOR').slice(0, 16), team, hp: MAX_HP, alive: false, kills: 0, deaths: 0, respawnAt: 0, protectUntil: 0, pos: null, posT: 0, dmgWindow: [] });
    if (this.phase === 'live') this.spawn(this.players.get(id));
    this.emitRoster(); return true;
  }
  leave(id) { if (this.players.delete(id)) { this.emit({ k: 'left', i: id }); this.emitRoster(); } }
  setTeam(id, team) { const p = this.players.get(id); if (!p || this.phase !== 'lobby' || !TEAMS.includes(team) || p.team === team || this.teamCount(team) >= this.cfg.perTeam) return; p.team = team; this.emitRoster(); }
  setMode(mode) { if (this.phase !== 'lobby' || !MODES[mode]) return; this.mode = mode; // re-balance if the new mode has fewer slots
    for (const t of TEAMS) { const extra = [...this.players.values()].filter((p) => p.team === t).slice(this.cfg.perTeam); for (const p of extra) { const o = TEAMS.find((x) => x !== t); if (this.teamCount(o) < this.cfg.perTeam) p.team = o; else this.players.delete(p.id); } }
    this.emitRoster(); }
  /** Latest position report of a player (for claim checks). */
  state(id, pos) { const p = this.players.get(id); if (!p || !pos) return; const t = this.now(); p.pos = pos; p.posT = t; (p.hist = p.hist || []).push({ t, pos }); while (p.hist.length && t - p.hist[0].t > 1) p.hist.shift(); }
  /** Was point h inside the target's body column at any position it reported in the last HIST_S seconds? */
  inBody(v, h) {
    const now = this.now(), list = [...(v.hist || []).filter((e) => now - e.t <= HIST_S).map((e) => e.pos), v.pos].filter(Boolean);
    return list.some((p) => Math.hypot(h[0] - p[0], h[2] - p[2]) <= BODY_R && h[1] >= p[1] + BODY_LO && h[1] <= p[1] + BODY_HI);
  }
  /** Does the segment a → b miss every static wall / building box (src/net/colliders.json)? */
  clearOfBoxes(a, b) {
    if (!this.grid) return true; const seen = new Set(), L = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.max(1, Math.ceil(L / (CELL / 2)));
    for (let i = 0; i <= n; i++) { const k = i / n, cx = Math.floor((a[0] + (b[0] - a[0]) * k) / CELL), cz = Math.floor((a[2] + (b[2] - a[2]) * k) / CELL);
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const bx of this.grid.get(cx + dx + ',' + (cz + dz)) || []) { if (seen.has(bx)) continue; seen.add(bx); if (segBox(a, b, bx)) return false; } }
    return true;
  }
  /** Does the segment a → b stay above the terrain (sampled every 3 m, ends excluded)? */
  clearOfTerrain(a, b) {
    if (!this.ground) return true; const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.floor(L / 3);
    for (let i = 1; i < n; i++) { const k = i / n, x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k, z = a[2] + (b[2] - a[2]) * k; if (this.ground(x, z) > y + 0.8) return false; }
    return true;
  }
  start() {
    if (this.phase === 'live') return false;
    this.phase = 'live'; this.score = { blue: 0, red: 0 }; this.winner = null; this.endsAt = this.now() + this.cfg.timeLimit;
    this.emit({ k: 'start', mode: this.mode, endsAt: this.endsAt, left: this.cfg.timeLimit }); // before the spawns: clients reset on 'start'
    for (const p of this.players.values()) { p.kills = p.deaths = 0; this.spawn(p); }
    this.emitRoster(); return true;
  }
  spawnPoint(team) {
    const s = SPAWNS[team], x = s.x + (this.rnd() - 0.5) * 2 * s.spread, z = s.z + (this.rnd() - 0.5) * 8;
    return { x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10, yaw: s.yaw };
  }
  spawn(p) {
    const sp = this.spawnPoint(p.team); p.hp = MAX_HP; p.alive = true; p.nadesLeft = NADES_PER_LIFE; p.nades = new Map(); p.respawnAt = 0; p.protectUntil = this.now() + SPAWN_PROTECT_S; p.pos = [sp.x, 0, sp.z]; p.posT = this.now();
    this.emit({ k: 'spawn', i: p.id, x: sp.x, z: sp.z, yaw: sp.yaw });
  }
  /** A client claims that its bullet hit someone. Checked against what the authority knows, then applied. */
  hit({ i, t, d, z, sp, o, h }) {
    const s = this.players.get(i), v = this.players.get(t), now = this.now();
    const no = (why) => { this.rejected++; this.emit({ k: 'reject', i, why }); return false; };
    if (this.phase !== 'live') return no('not live');
    if (!s || !v || !s.alive || !v.alive) return no('dead or unknown');
    if (s.team === v.team) return no('friendly');
    if (now < v.protectUntil) return no('spawn protection');
    const dmg = Number(d); if (!(dmg > 0) || dmg > MAX_HIT) return no('damage');
    if (Array.isArray(sp) && s.pos) { const drift = Math.hypot(sp[0] - s.pos[0], sp[2] - s.pos[2]); if (drift > MAX_SHOOTER_DRIFT + (now - s.posT) * 8) return no('shooter position'); }
    if (s.pos && v.pos && Math.hypot(s.pos[0] - v.pos[0], s.pos[2] - v.pos[2]) > MAX_RANGE) return no('range');
    if (Array.isArray(h) && Array.isArray(o)) { // impact point + shooter eye: body column, eye drift, terrain line of sight
      if (v.pos && !this.inBody(v, h)) return no('not on target');
      if (s.pos && Math.hypot(o[0] - s.pos[0], o[2] - s.pos[2]) > EYE_DRIFT + (now - s.posT) * 8) return no('eye position');
      if (!this.clearOfTerrain(o, h)) return no('terrain');
      if (!this.clearOfBoxes(o, h)) return no('wall');
    } else if (this.strict) return no('no impact point');
    s.dmgWindow = s.dmgWindow.filter((w) => now - w.t < 1); const recent = s.dmgWindow.reduce((a, w) => a + w.d, 0);
    if (recent + dmg > MAX_DPS) return no('rate');
    s.dmgWindow.push({ t: now, d: dmg });
    this.applyDamage(s, v, dmg, z, s.pos);
    return true;
  }
  applyDamage(s, v, dmg, z, from) {
    v.hp = Math.max(0, v.hp - dmg);
    this.emit({ k: 'dmg', i: v.id, by: s.id, hp: Math.round(v.hp), z, d: Math.round(dmg), fx: from ? from[0] : 0, fz: from ? from[2] : 0 });
    if (v.hp <= 0) this.kill(s, v, z);
  }
  /** A player threw a grenade (id chosen by the client, position = the throw point). */
  nade(i, id, p) {
    const s = this.players.get(i); if (this.phase !== 'live' || !s || !s.alive || !Array.isArray(p)) return false;
    s.nadesLeft = s.nadesLeft ?? NADES_PER_LIFE; if (s.nadesLeft <= 0) { this.rejected++; this.emit({ k: 'reject', i, why: 'no grenades' }); return false; }
    s.nadesLeft--; (s.nades = s.nades || new Map()).set(id, { t: this.now(), p }); return true;
  }
  /** That grenade went off at p: checked, then blast damage to everyone in range (cover reduces it to a quarter). */
  boom(i, id, p) {
    const s = this.players.get(i), no = (why) => { this.rejected++; this.emit({ k: 'reject', i, why }); return false; };
    const n = s && s.nades && s.nades.get(id); if (this.phase !== 'live' || !n || !Array.isArray(p)) return no('unknown grenade');
    s.nades.delete(id);
    if (this.now() - n.t > NADE_MAX_S) return no('grenade too late');
    if (Math.hypot(p[0] - n.p[0], p[1] - n.p[1], p[2] - n.p[2]) > NADE_MAX_DIST) return no('grenade too far');
    this.emit({ k: 'boom', i, x: p[0], y: p[1], z: p[2] });
    for (const v of [...this.players.values()]) {
      if (!v.alive || !v.pos || (v.team === s.team && v !== s) || this.now() < v.protectUntil) continue;
      const c = [v.pos[0], v.pos[1] + 1, v.pos[2]], d = Math.hypot(c[0] - p[0], c[1] - p[1], c[2] - p[2]); if (d > NADE_R) continue;
      let k = 1 - d / NADE_R; const e = [p[0], p[1] + 0.6, p[2]]; if (d > 1.5 && !(this.clearOfTerrain(e, c) && this.clearOfBoxes(e, c))) k *= 0.25;
      const dmg = NADE_DMG * k * (v === s ? 0.6 : 1); if (dmg > 1) this.applyDamage(s, v, dmg, 'nade', p);
    }
    return true;
  }
  kill(s, v, zone) {
    v.alive = false; v.deaths++; v.respawnAt = this.now() + RESPAWN_S; if (s !== v) { s.kills++; this.score[s.team]++; } // own grenade: a death, no score
    this.emit({ k: 'kill', by: s.id, i: v.id, z: zone, score: { ...this.score }, respawn: RESPAWN_S });
    if (s !== v && this.score[s.team] >= this.cfg.scoreLimit) this.end(s.team);
  }
  end(winner) {
    if (this.phase !== 'live') return; this.phase = 'ended'; this.winner = winner;
    this.emit({ k: 'end', winner, score: { ...this.score }, board: this.board() }); this.emitRoster();
  }
  /** Back to the lobby after the result screen. */
  reset() { this.phase = 'lobby'; this.score = { blue: 0, red: 0 }; for (const p of this.players.values()) { p.alive = false; p.hp = MAX_HP; } this.emitRoster(); }
  tick() {
    if (this.phase !== 'live') return; const now = this.now();
    for (const p of this.players.values()) if (!p.alive && p.respawnAt && now >= p.respawnAt) this.spawn(p);
    if (now >= this.endsAt) this.end(this.score.blue === this.score.red ? 'draw' : this.score.blue > this.score.red ? 'blue' : 'red');
  }
  board() { return [...this.players.values()].map((p) => ({ i: p.id, n: p.name, tm: p.team, k: p.kills, d: p.deaths })).sort((a, b) => b.k - a.k || a.d - b.d); }
  roster() { return { mode: this.mode, phase: this.phase, endsAt: this.endsAt, left: this.phase === 'live' ? Math.max(0, Math.round(this.endsAt - this.now())) : 0, score: { ...this.score }, players: [...this.players.values()].map((p) => ({ i: p.id, n: p.name, tm: p.team, hp: Math.round(p.hp), al: p.alive, k: p.kills, d: p.deaths })) }; }
  emitRoster() { this.emit({ k: 'roster', ...this.roster() }); }
  /** Host migration: a new host rebuilds the authority from the last roster it saw. */
  static fromRoster(r, opts) {
    const a = new Authority({ ...opts, mode: r.mode }); a.phase = r.phase; a.endsAt = r.endsAt; a.score = { ...r.score };
    for (const p of r.players) a.players.set(p.i, { id: p.i, name: p.n, team: p.tm, hp: p.hp, alive: p.al, kills: p.k, deaths: p.d, respawnAt: p.al ? 0 : a.now() + RESPAWN_S, protectUntil: 0, pos: null, posT: 0, dmgWindow: [] });
    return a;
  }
}
