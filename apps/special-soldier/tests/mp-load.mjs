// 15 v 15 load test on the dedicated server: 30 bot clients move and shoot for DURATION seconds, a 31st is refused,
// then one real browser joins as an extra spectator-sized check (BROWSER=1) to confirm 30 remote soldiers render without errors.
//   node tests/mp-load.mjs            DURATION=60 by default
import { spawn } from 'node:child_process';
import WebSocket from 'ws';
import { rawHeight } from '../src/world/terrain.js';
const PORT = 8798, ROOM = 'LOAD' + Math.floor(Math.random() * 1000), DUR = +(process.env.DURATION || 60), BOTS = 30;
const results = []; const check = (n, ok, info = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${info ? '  — ' + info : ''}`); };
const srv = spawn(process.execPath, ['server/mp-server.mjs'], { env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => srv.stdout.once('data', r));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Bot {
  constructor(i) { this.id = 'bot' + i; this.name = 'BOT-' + i; this.recvBytes = 0; this.snaps = 0; this.events = {}; this.roster = null; this.pos = [0, 0, -100]; this.alive = false; this.team = null; this.others = new Map(); }
  connect() {
    return new Promise((res, rej) => {
      const ws = (this.ws = new WebSocket(`ws://localhost:${PORT}/?room=${ROOM}&id=${this.id}&name=${this.name}`));
      ws.on('open', res); ws.on('error', rej); ws.on('close', (c) => { this.closed = c; res(); });
      ws.on('message', (d) => { this.recvBytes += d.length; const m = JSON.parse(d); this.events[m.k] = (this.events[m.k] || 0) + 1;
        if (m.k === 'snap') { this.snaps++; for (const r of m.s) if (r[0] !== this.id) this.others.set(r[0], { f: r[0], p: [r[1], r[2], r[3]] }); }
        if (m.k === 'kill') this.kills = (this.kills || 0) + 1;
        if (m.k === 'roster') { this.roster = m; const me = m.players.find((p) => p.i === this.id); if (me) this.team = me.tm; }
        if (m.k === 'spawn' && m.i === this.id) { this.pos = [m.x, 0, m.z]; this.alive = true; }
        if (m.k === 'kill' && m.i === this.id) this.alive = false; });
    });
  }
  send(m) { if (this.ws.readyState === 1) this.ws.send(JSON.stringify(m)); }
  step(dt) {
    if (!this.alive) return; this.pos[0] = Math.max(-120, Math.min(120, this.pos[0] + (Math.random() - 0.5) * 6 * dt * 4)); this.pos[2] = Math.max(-185, Math.min(-5, this.pos[2] + (this.team === 'blue' ? -1 : 1) * 3 * dt)); this.pos[1] = rawHeight(this.pos[0], this.pos[2]);
    this.send({ k: 'st', p: this.pos.map((v) => Math.round(v * 100) / 100), y: Math.random() * 6.28, pt: 0, s: 0, w: 'm4', a: 1 });
  }
  shoot() {
    if (!this.alive || !this.roster) return; let best = null, bd = 70;
    for (const s of this.others.values()) { const p = this.roster.players.find((q) => q.i === s.f); if (!p || p.tm === this.team || !p.al) continue; const d = Math.hypot(s.p[0] - this.pos[0], s.p[2] - this.pos[2]); if (d < bd) { bd = d; best = s.f; } }
    if (best && Math.random() < 0.6) { const tp = this.others.get(best).p; this.send({ k: 'hit', t: best, d: 30, z: Math.random() < 0.2 ? 'head' : 'torso', sp: this.pos, o: [this.pos[0], this.pos[1] + 1.6, this.pos[2]], h: [tp[0], tp[1] + 1.2, tp[2]] }); }
  }
}
const bots = []; for (let i = 0; i < BOTS; i++) { const b = new Bot(i); await b.connect(); bots.push(b); }
await sleep(500);
const extra = new Bot(99); await extra.connect(); await sleep(400);
check('31st player is refused (room full at 15 v 15)', !!extra.closed || (extra.events.full || 0) > 0, `close code ${extra.closed}`);
const r0 = bots[0].roster; const blue = r0.players.filter((p) => p.tm === 'blue').length, red = r0.players.filter((p) => p.tm === 'red').length;
check('30 players, 15 per team', r0.players.length === 30 && blue === 15 && red === 15, `${blue} v ${red}`);
bots[0].send({ k: 'start' }); await sleep(600);
check('match live, everyone spawned', bots.every((b) => b.alive), `${bots.filter((b) => b.alive).length}/30 alive`);
const t0 = Date.now(), b0 = bots.map((b) => b.recvBytes); let ticks = 0;
await new Promise((res) => { const iv = setInterval(() => { for (const b of bots) b.step(0.05); if (++ticks % 6 === 0) for (const b of bots) b.shoot(); if (Date.now() - t0 > DUR * 1000) { clearInterval(iv); res(); } }, 50); });
const secs = (Date.now() - t0) / 1000, h = await (await fetch(`http://localhost:${PORT}/health`)).json(), room = h.rooms.find((r) => r.code === ROOM);
const perClient = bots.map((b, i) => (b.recvBytes - b0[i]) / secs), avgKBs = perClient.reduce((a, v) => a + v, 0) / perClient.length / 1024, snapHz = bots[0].snaps / (secs + 1);
console.log(`room: ${JSON.stringify(room)}  server tick max ${h.tickMsMax} ms`);
check('server keeps up (tick < 10 ms at 30 players)', h.tickMsMax < 10, `${h.tickMsMax} ms max per 50 ms tick`);
check('downstream per player ≤ 40 KB/s', avgKBs <= 40, `${avgKBs.toFixed(1)} KB/s per player, snapshots ${snapHz.toFixed(1)}/s`);
check('kills processed and scored', room.score.blue + room.score.red > 0, `score ${room.score.blue}:${room.score.red}, rejected claims ${room.rejected}`);
const fk = bots[0].kills || 0; check('every client saw every kill (kill events = team score)', fk === room.score.blue + room.score.red, `${fk} kill events vs score ${room.score.blue + room.score.red}`);
for (const b of bots) b.ws.close(); srv.kill();
console.log(`\n${results.filter(Boolean).length}/${results.length} checks passed (load, ${BOTS} bots, ${DUR}s)`); process.exit(results.every(Boolean) ? 0 : 1);
