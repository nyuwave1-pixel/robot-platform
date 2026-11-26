// Multiplayer client: connects to a room, sends our position, draws other players, turns our bullet hits
// into claims for the Authority, and applies what the Authority decides (damage, kills, respawns, score).
// Techniques used by most online shooters, scaled to this game:
//   - authoritative host / dedicated server: only the Authority changes health and score;
//   - client-side hit detection + server check ("favour the shooter", with drift / damage / rate limits);
//   - snapshot interpolation: other players are drawn ~1.5 send-intervals in the past, smoothly between two reports;
//   - send rate tied to the transport's budget; shots ride along inside the position message.
import * as THREE from 'three';
import { G } from '../core/ctx.js';
import { Authority, MODES, TEAMS, TEAM_NAME, MAX_HP } from './authority.js';
import { rawHeight } from '../world/terrain.js';
import COLLIDERS from './colliders.json';
const AUTH_OPTS = { ground: rawHeight, strict: true, boxes: COLLIDERS.boxes }; // host checks impact points + terrain line of sight like the server
import { SupabaseTransport, WsTransport, SUPABASE_MAX_PLAYERS } from './transport.js';
import { makeSoldier, poseSoldier } from '../game/models.js';
import { WEAPONS } from '../config/weapons.js';
import { damp } from '../core/util.js';
import { MpUi } from '../ui/mp.js';

const ZONES = [[1.64, 0.15, 'head'], [1.3, 0.27, 'torso'], [0.98, 0.26, 'torso'], [0.55, 0.2, 'limb'], [0.2, 0.17, 'limb']];
const _o = new THREE.Vector3(), _d = new THREE.Vector3();
const WKEY = new Map(Object.entries(WEAPONS).map(([k, w]) => [w, k]));
const r2 = (v) => Math.round(v * 100) / 100, r3 = (v) => Math.round(v * 1000) / 1000;
const nowS = () => performance.now() / 1000;

function raySphere(o, d, cx, cy, cz, r, max) {
  const ox = o.x - cx, oy = o.y - cy, oz = o.z - cz, b = ox * d.x + oy * d.y + oz * d.z, c = ox * ox + oy * oy + oz * oz - r * r, h = b * b - c;
  if (h < 0) return -1; const t = -b - Math.sqrt(h); return t >= 0 && t <= max ? t : -1;
}
function newId() { try { const k = 'ss-mp-id', s = sessionStorage.getItem(k); if (s) return s; const v = 'p' + Math.random().toString(36).slice(2, 10); sessionStorage.setItem(k, v); return v; } catch (e) { return 'p' + Math.random().toString(36).slice(2, 10); } }

export class MP {
  constructor() {
    this.id = newId(); this.active = false; this.connected = false; this.transport = null; this.auth = null; this.roster = null;
    this.remotes = new Map(); this.sendT = 0; this.shots = []; this.endLocal = 0; this.myTeam = null; this.respawnAt = 0; this.stats = { sent: 0, recv: 0 };
    this.ui = new MpUi(this);
    // leaving to the main menu always leaves the room
    const toMenu = G.toMenu; G.toMenu = () => { if (this.connected) this.leave(false); toMenu(); };
  }
  get name() { return (G.save && G.save.mpName) || 'OPERATOR-' + this.id.slice(-3).toUpperCase(); }
  set name(v) { G.save.mpName = String(v || '').replace(/[^\w\- ]/g, '').slice(0, 16) || this.name; }
  isHost() { return this.transport && this.transport.kind === 'supabase' && this.transport.isHost(); }
  isLeader() { const T = this.transport; return !!T && (T.kind === 'supabase' ? T.isHost() : T.leader === this.id); }
  lobby() { this.ui.openLobby(); }

  /** Join (or create) a room. server: '' → Supabase Realtime; 'ws(s)://…' → dedicated server. */
  async connect({ room, server = '', mode = 'duel', name }) {
    if (this.connected) this.leave(false);
    if (name) this.name = name;
    room = String(room || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || Math.random().toString(36).slice(2, 7).toUpperCase();
    this.room = room; this.wantMode = mode;
    const T = server ? new WsTransport({ url: server, room, id: this.id, name: this.name }) : new SupabaseTransport({ room, id: this.id, name: this.name });
    this.transport = T; T.onMessage((m) => this.onMsg(m)); T.onPeers((ids) => this.onPeers(ids));
    await T.connect(); this.connected = true; this.ui.status(`Connected · room ${room} · ${T.kind === 'ws' ? 'dedicated server' : 'online (Supabase)'}`);
    if (T.kind === 'supabase') { this.onPeers(T.peers()); this.toHost({ k: 'join', n: this.name }); }
    return room;
  }
  leave(toLobby = true) {
    if (this.transport) { if (this.isHost() && this.auth) this.auth = null; this.transport.close(); }
    this.transport = null; this.connected = false; this.auth = null; this.roster = null; this.active = false; this.myTeam = null;
    for (const r of this.remotes.values()) G.scene.remove(r.model); this.remotes.clear(); this.ui.hideHud();
    if (toLobby) this.ui.openLobby();
  }

  // ---------- room controls (leader only for mode / start / reset) ----------
  start() { if (this.auth) this.auth.start(); else if (this.transport && this.transport.kind === 'ws') this.transport.send({ k: 'start' }); }
  setMode(mode) { this.wantMode = mode; if (this.auth) this.auth.setMode(mode); else if (this.transport && this.transport.kind === 'ws') this.transport.send({ k: 'mode', mode }); }
  setTeam(team) { this.toHost({ k: 'team', team }); }
  backToLobby() { if (this.auth) this.auth.reset(); else if (this.transport && this.transport.kind === 'ws') this.transport.send({ k: 'reset' }); }

  // ---------- host side (Supabase rooms: the oldest peer runs the Authority) ----------
  onPeers(ids) {
    const T = this.transport; if (!T) return;
    if (T.kind === 'supabase') {
      if (ids.length > SUPABASE_MAX_PLAYERS && !this.warnedCap) { this.warnedCap = true; this.ui.status(`More than ${SUPABASE_MAX_PLAYERS} players: use a dedicated server for full 15v15 rooms.`); }
      if (T.isHost() && !this.auth) {
        this.auth = this.roster ? Authority.fromRoster(this.roster, { ...AUTH_OPTS, emit: (e) => this.emitEv(e) }) : new Authority({ ...AUTH_OPTS, mode: this.wantMode, emit: (e) => this.emitEv(e) });
        this.auth.join(this.id, this.name); this.transport.send({ k: 'rejoin' });
      } else if (!T.isHost()) this.auth = null;
      if (this.auth) for (const p of [...this.auth.players.keys()]) if (!ids.includes(p)) this.auth.leave(p);
    }
    for (const id of [...this.remotes.keys()]) if (!ids.includes(id)) this.dropRemote(id);
    this.ui.refresh();
  }
  emitEv(e) { this.transport.send({ k: 'ev', e }); this.onEvent(e); }
  /** Messages meant for the Authority: run locally when we are the host, otherwise send them to the host / server. */
  toHost(m) {
    if (this.auth) { this.hostHandle({ ...m, f: this.id }); return; }
    if (this.transport) this.transport.send(this.transport.kind === 'supabase' ? { ...m, to: 'host' } : m);
  }
  hostHandle(m) {
    const A = this.auth; if (!A) return;
    switch (m.k) {
      case 'join': A.join(m.f, m.n, m.tm); break;
      case 'hit': A.hit({ ...m, i: m.f }); break;
      case 'team': A.setTeam(m.f, m.team); break;
      case 'st': A.state(m.f, m.p); break;
    }
  }

  // ---------- incoming ----------
  onMsg(m) {
    this.stats.recv++;
    if (m.k === 'st') { if (this.auth) this.auth.state(m.f, m.p); if (m.f !== this.id) this.ingest(m); return; }
    if (m.k === 'snap') { for (const row of m.s) if (row[0] !== this.id) this.ingest({ f: row[0], p: [row[1], row[2], row[3]], y: row[4], pt: row[5], s: row[6], w: row[7], a: row[8], sh: row[9] }); return; }
    if (m.k === 'ev') { this.onEvent(m.e); return; }
    if (m.k === 'rejoin') { this.toHost({ k: 'join', n: this.name, tm: this.myTeam }); return; }
    if (m.k === 'disconnected') { this.ui.status('Disconnected from the server.'); this.leave(true); return; }
    if (m.to === 'host' && this.auth) { this.hostHandle(m); return; }
    if (['roster', 'start', 'spawn', 'dmg', 'kill', 'end', 'left', 'full', 'reject', 'chat'].includes(m.k)) this.onEvent(m);
  }
  onEvent(e) {
    switch (e.k) {
      case 'roster': {
        this.roster = e; const me = e.players.find((p) => p.i === this.id); this.myTeam = me ? me.tm : this.myTeam;
        if (e.left) this.endLocal = nowS() + e.left;
        for (const p of e.players) { const r = this.remotes.get(p.i); if (r) { r.name = p.n; if (r.team !== p.tm) this.setRemoteTeam(r, p.tm); } }
        if (e.phase === 'live' && !this.active) this.beginMatch();
        if (e.phase === 'lobby' && this.active) this.endMatch(null);
        this.ui.refresh(); break;
      }
      case 'start': this.endLocal = nowS() + e.left; this.beginMatch(); break;
      case 'spawn': if (e.i === this.id) this.spawnMe(e); else { const r = this.remotes.get(e.i); if (r) { r.alive = true; r.deadT = 0; r.buf.length = 0; r.pos.set(e.x, G.world.groundAt(e.x, e.z, 999), e.z); } } break;
      case 'dmg': if (e.i === this.id) this.hurtMe(e); else if (e.by === this.id) G.hud.hitMarker(e.z === 'head', e.hp <= 0); break;
      case 'kill': this.onKill(e); break;
      case 'end': this.endMatch(e); break;
      case 'full': if (e.i === this.id) { this.ui.status('Room is full (both teams at capacity).'); this.leave(true); } break;
      case 'reject': if (e.i === this.id) { this.lastReject = e.why; if (G.test) console.warn('[mp] hit rejected:', e.why); } break;
      case 'left': this.dropRemote(e.i); break;
    }
  }

  // ---------- remote players ----------
  remote(id) {
    let r = this.remotes.get(id); if (r) return r;
    const info = this.roster && this.roster.players.find((p) => p.i === id);
    r = { id, name: info ? info.n : '?', team: null, model: null, buf: [], pos: new THREE.Vector3(), yaw: 0, pitch: 0, stance: 0, alive: true, deadT: 0, walk: 0, moveK: 0, crouch: 0, interval: 0.1, lastT: 0 };
    this.remotes.set(id, r); this.setRemoteTeam(r, info ? info.tm : 'red'); return r;
  }
  setRemoteTeam(r, team) {
    if (r.team === team && r.model) return; r.team = team; if (r.model) G.scene.remove(r.model);
    r.model = makeSoldier(team === 'blue' ? 'squad' : 'assault'); G.scene.add(r.model); r.model.visible = this.active;
  }
  dropRemote(id) { const r = this.remotes.get(id); if (!r) return; if (r.model) G.scene.remove(r.model); this.remotes.delete(id); }
  ingest(s) {
    const r = this.remote(s.f), t = nowS();
    if (r.lastT) r.interval = r.interval * 0.8 + Math.min(0.5, t - r.lastT) * 0.2; r.lastT = t;
    r.buf.push({ t, x: s.p[0], y: s.p[1], z: s.p[2], yaw: s.y, pitch: s.pt, stance: s.s }); if (r.buf.length > 24) r.buf.shift();
    // the player's own report is the truth for alive/dead, except a stale 'alive' sent just before a kill event arrived
    if (s.a === 0 && r.alive) { r.alive = false; r.deadT = 0; } else if (s.a === 1 && !r.alive && t - (r.killedAt || 0) > 0.8) { r.alive = true; r.deadT = 0; }
    if (s.sh && this.active) for (const sh of s.sh) { const w = WEAPONS[s.w] || WEAPONS.m4; _o.set(sh[0], sh[1], sh[2]); _d.set(sh[3], sh[4], sh[5]).normalize(); G.fx.fire(_o, _d, w, 'remote'); G.audio.play('shot:' + w.cls, { x: sh[0], y: sh[1], z: sh[2] }); }
  }
  updateRemotes(dt) {
    const t = nowS();
    for (const r of this.remotes.values()) {
      if (!r.model) continue; r.model.visible = this.active;
      const delay = Math.max(0.1, r.interval * 1.5), rt = t - delay, b = r.buf;
      if (b.length) {
        let a = b[0], c = b[b.length - 1];
        for (let i = 0; i < b.length - 1; i++) if (b[i].t <= rt && b[i + 1].t >= rt) { a = b[i]; c = b[i + 1]; break; }
        const k = c.t > a.t ? Math.max(0, Math.min(1.25, (rt - a.t) / (c.t - a.t))) : 1; // up to 25 % extrapolation when a report is late
        const nx = a.x + (c.x - a.x) * k, ny = a.y + (c.y - a.y) * k, nz = a.z + (c.z - a.z) * k;
        const sp = Math.hypot(nx - r.pos.x, nz - r.pos.z) / Math.max(dt, 1e-3); r.pos.set(nx, ny, nz);
        let dy = c.yaw - a.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); r.yaw = a.yaw + dy * Math.min(1, k); r.stance = c.stance;
        r.moveK = damp(r.moveK, Math.min(1, sp / 4), 8, dt); r.walk += sp * dt * 1.9;
      }
      r.crouch = damp(r.crouch, r.stance > 0 ? 1 : 0, 8, dt);
      if (!r.alive) { r.deadT += dt; const k = Math.min(1, r.deadT * 2.6); poseSoldier(r.model, { crouch: 0, aim: 0 }); r.model.position.copy(r.pos); r.model.rotation.set(-k * 1.45, r.yaw + Math.PI, k * 0.2); continue; }
      poseSoldier(r.model, { walk: r.walk, moveK: r.moveK, crouch: r.crouch, aim: 0 });
      r.model.position.copy(r.pos); r.model.rotation.set(0, r.yaw + Math.PI, 0);
    }
  }
  /** Ray test against living players of the other team (called for our own bullets only). */
  hitTest(o, d, max) {
    let best = null, bt = max;
    for (const r of this.remotes.values()) {
      if (!r.alive || r.team === this.myTeam) continue; const dx = r.pos.x - o.x, dz = r.pos.z - o.z; if (dx * dx + dz * dz > (max + 4) * (max + 4)) continue;
      const cr = 1 - r.crouch * 0.3;
      for (const [zy, rad, zone] of ZONES) { const t = raySphere(o, d, r.pos.x, r.pos.y + zy * (zy > 0.6 ? cr : 1), r.pos.z, rad, bt); if (t >= 0 && t < bt) { bt = t; best = { remote: r, zone, t }; } }
    }
    return best;
  }
  claimHit(r, dmg, zone, hit) {
    G.audio.play('impact:flesh', { x: r.pos.x, y: r.pos.y + 1, z: r.pos.z }); G.mission.stats.hits++;
    const P = G.player.pos, E = G.player.eye; this.toHost({ k: 'hit', t: r.id, d: Math.round(dmg * 10) / 10, z: zone, sp: [r2(P.x), r2(P.y), r2(P.z)], o: [r2(E.x), r2(E.y), r2(E.z)], h: hit ? [r2(hit[0]), r2(hit[1]), r2(hit[2])] : undefined });
  }
  onShot(o, d) { if (this.shots.length < 4) this.shots.push([r2(o.x), r2(o.y), r2(o.z), r3(d.x), r3(d.y), r3(d.z)]); }

  // ---------- local player ----------
  beginMatch() {
    if (this.active) return; this.active = true;
    G.enemies.clear(); G.squad.clear(); G.fx.reset(); G.gear.reset();
    const M = G.mission; M.objs = []; M.oi = 0; M.def = null; M.completeT = -1; M.interactables.length = 0; M.intelItems = []; M.boss = null; M.stats = M.newStats();
    G.audio.init(); G.audio.hush(); G.audio.stopLoops(); G.menu.hide(); this.ui.closeLobby(); G.hud.show(true); G.hud.objective(MODES[this.roster ? this.roster.mode : this.wantMode].name + ' — ' + this.room);
    G.weapons.equip(G.save.loadout); G.weapons.root.visible = true; G.player.reset(); G.player.alive = false; G.state = 'playing';
    this.ui.showHud(); if (!G.test) G.input.lock();
  }
  spawnMe(e) {
    const P = G.player; P.reset(); P.place(e.x, e.z, e.yaw); P.health = MAX_HP; P.armor = 0; G.weapons.equip(G.save.loadout); G.weapons.root.visible = true;
    this.respawnAt = 0; if (G.state === 'dead' || G.state === 'deadMenu') G.state = 'playing'; this.ui.respawn(0);
  }
  hurtMe(e) {
    const P = G.player; if (!P.alive) return; const lost = P.health - e.hp; P.health = e.hp; P.hurt = Math.min(1, P.hurt + lost / 45); P.lastHurt = G.time; P.shake = Math.max(P.shake, 0.25);
    G.hud.hitFrom(Math.atan2(e.fx - P.pos.x, e.fz - P.pos.z)); G.audio.play('hurt');
  }
  onKill(e) {
    const name = (id) => { if (id === this.id) return this.name; const p = this.roster && this.roster.players.find((q) => q.i === id); return p ? p.n : '?'; };
    const team = (id) => { if (id === this.id) return this.myTeam; const p = this.roster && this.roster.players.find((q) => q.i === id); return p ? p.tm : 'red'; };
    this.ui.feed(name(e.by), team(e.by), name(e.i), team(e.i), e.z === 'head');
    if (this.roster) { this.roster.score = e.score; for (const p of this.roster.players) { if (p.i === e.by) p.k++; if (p.i === e.i) { p.d++; p.al = false; } } }
    if (e.by === this.id) { G.hud.hitMarker(e.z === 'head', true); G.audio.play('kill'); G.mission.stats.kills++; if (e.z === 'head') G.mission.stats.headshots++; }
    if (e.i === this.id) { const P = G.player; P.health = 0; P.alive = false; G.mission.stats.deaths++; this.respawnAt = nowS() + e.respawn; this.ui.respawn(e.respawn, name(e.by)); }
    else { const r = this.remotes.get(e.i); if (r) { r.alive = false; r.deadT = 0; r.killedAt = nowS(); } }
    this.ui.refresh();
  }
  endMatch(e) {
    if (!this.active) return; this.active = false; G.input.unlock(); G.hud.show(false); G.weapons.root.visible = false;
    for (const r of this.remotes.values()) if (r.model) r.model.visible = false;
    G.state = 'menu'; if (e) this.ui.result(e); else this.ui.openLobby();
  }

  // ---------- per frame (called from the main loop in every state) ----------
  update(dt) {
    if (!this.connected) return;
    if (this.auth) this.auth.tick();
    this.updateRemotes(dt);
    if (this.active) {
      if (G.state === 'dead' || G.state === 'deadMenu') G.state = 'playing';
      G.weapons.root.visible = G.player.alive; // multiplayer death is handled here, not by the campaign death screen
      const T = this.transport; this.sendT -= dt;
      if (T && this.sendT <= 0) {
        this.sendT = 1 / T.sendHz; const P = G.player, w = G.weapons.slot ? G.weapons.slot.w : null;
        const m = { k: 'st', p: [r2(P.pos.x), r2(P.pos.y), r2(P.pos.z)], y: r3(P.yaw), pt: r3(P.pitch), s: P.stance, w: WKEY.get(w) || 'm4', a: P.alive ? 1 : 0 };
        if (this.shots.length) { m.sh = this.shots; this.shots = []; }
        if (this.auth) this.auth.state(this.id, m.p);
        T.send(m); this.stats.sent++;
      }
      this.ui.tick(this.respawnAt ? Math.max(0, this.respawnAt - nowS()) : 0, Math.max(0, this.endLocal - nowS()));
    }
  }
  /** Invite link / tests: ?mp=ROOM[&server=wss://…][&mode=tdm][&name=…] joins on boot. */
  fromUrl() {
    const q = new URLSearchParams(location.search); if (!q.has('mp')) return false;
    const room = q.get('mp'), server = q.get('server') || '', mode = q.get('mode') || 'duel', name = q.get('name') || undefined;
    this.ui.openLobby(); this.ui.status('Joining room ' + room + '…');
    this.connect({ room, server, mode, name }).catch((err) => this.ui.status('Could not join: ' + err.message));
    return true;
  }
}
export { TEAMS, TEAM_NAME, MODES };
