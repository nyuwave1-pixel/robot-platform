// SPECIAL SOLDIER dedicated multiplayer server (up to 15v15 per room).
//   node server/mp-server.mjs            → ws://localhost:8787   (PORT=… to change)
// Clients connect with ?room=CODE&id=…&name=…  The server runs the same Authority as a browser host
// (src/net/authority.js), so hits, deaths and scores are decided here, never by a client.
// Positions: each client sends its own state ~20 times a second; every 50 ms tick the server sends every
// client ONE snapshot with everyone's latest state (instead of relaying N×N messages). GET /health → room stats.
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { Authority, MODES } from '../src/net/authority.js';

const PORT = +(process.env.PORT || 8787), TICK_MS = 50;
const rooms = new Map();
// snapshot row: [id, x, y, z, yaw, pitch, stance, weapon, alive, shots?] — about half the size of the keyed object
const pack = (m) => { const row = [m.f, m.p[0], m.p[1], m.p[2], m.y, m.pt, m.s, m.w, m.a]; if (m.sh) { row.push(m.sh); delete m.sh; } return row; };
let bytesOut = 0, msgsIn = 0, tickMsMax = 0;

function room(code) {
  let r = rooms.get(code); if (r) return r;
  r = { code, clients: new Map(), states: new Map(), dirty: false, leader: null };
  r.auth = new Authority({ mode: 'tdm', emit: (ev) => broadcast(r, ev) });
  rooms.set(code, r); return r;
}
function sendRaw(ws, s) { if (ws.readyState === 1) { ws.send(s); bytesOut += s.length; } }
function broadcast(r, ev) { const s = JSON.stringify(ev); for (const ws of r.clients.values()) sendRaw(ws, s); }
function peers(r) { broadcast(r, { k: 'peers', ids: [...r.clients.keys()], leader: r.leader }); }

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/health')) {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify({ ok: true, rooms: [...rooms.values()].map((r) => ({ code: r.code, players: r.clients.size, phase: r.auth.phase, mode: r.auth.mode, score: r.auth.score, rejected: r.auth.rejected })), bytesOut, msgsIn, tickMsMax: +tickMsMax.toFixed(2) }));
    return;
  }
  res.writeHead(404); res.end();
});
const wss = new WebSocketServer({ server, maxPayload: 16 * 1024 });

wss.on('connection', (ws, req) => {
  const q = new URL(req.url, 'http://x').searchParams, code = (q.get('room') || 'PUBLIC').slice(0, 24).toUpperCase(), id = (q.get('id') || '').slice(0, 40), name = q.get('name') || 'OPERATOR';
  if (!id) { ws.close(4000, 'missing id'); return; }
  const r = room(code);
  if (!r.auth.join(id, name, q.get('team'))) { sendRaw(ws, JSON.stringify({ k: 'full', i: id })); ws.close(4001, 'room full'); return; }
  const old = r.clients.get(id); if (old && old !== ws) old.close(4002, 'replaced');
  r.clients.set(id, ws); if (!r.leader) r.leader = id; peers(r); r.auth.emitRoster();
  ws.on('message', (data) => {
    msgsIn++; let m; try { m = JSON.parse(data); } catch (e) { return; }
    m.f = id; // never trust a client-supplied sender
    switch (m.k) {
      case 'st': r.states.set(id, m); r.auth.state(id, m.p); r.dirty = true; break;
      case 'hit': r.auth.hit({ ...m, i: id }); break;
      case 'team': r.auth.setTeam(id, m.team); break;
      case 'mode': if (id === r.leader) r.auth.setMode(m.mode); break;
      case 'start': if (id === r.leader) r.auth.start(); break;
      case 'reset': if (id === r.leader) r.auth.reset(); break;
      case 'chat': broadcast(r, { k: 'chat', f: id, t: String(m.t || '').slice(0, 120) }); break;
    }
  });
  ws.on('close', () => {
    if (r.clients.get(id) !== ws) return;
    r.clients.delete(id); r.states.delete(id); r.auth.leave(id);
    if (r.leader === id) r.leader = r.clients.keys().next().value || null;
    if (!r.clients.size) rooms.delete(code); else peers(r);
  });
});

setInterval(() => {
  const t0 = performance.now();
  for (const r of rooms.values()) {
    r.auth.tick();
    if (r.dirty) { r.dirty = false; const s = JSON.stringify({ k: 'snap', s: [...r.states.values()].map(pack) }); for (const ws of r.clients.values()) sendRaw(ws, s); }
  }
  tickMsMax = Math.max(tickMsMax * 0.999, performance.now() - t0);
}, TICK_MS);

server.listen(PORT, () => console.log(`[mp] SPECIAL SOLDIER server on ws://localhost:${PORT} — modes: ${Object.keys(MODES).join(', ')}`));
export { server, wss, rooms };
