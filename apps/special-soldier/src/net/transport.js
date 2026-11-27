// Network transports with one interface, so the match code does not care which one is used:
//   send(msg)            — to everyone in the room (Supabase) or to the server (WebSocket)
//   onMessage(fn)        — fn(msg) for every message from someone else; msg.f is the sender id
//   onPeers(fn)          — fn(ids) when the set of connected players changes
//   hostId()             — who runs the Authority: the oldest peer (Supabase) or 'server' (WebSocket)
//   sendHz               — how often to send our own position (kept under the transport's message budget)
import { RealtimeClient } from '@supabase/realtime-js';

// Public Supabase project (BIT PARK, Seoul region). The publishable key only allows Realtime channels here — no tables are used.
export const SUPABASE = { url: 'wss://riibgvirrbcuujbsbase.supabase.co/realtime/v1', key: 'sb_publishable_MLhhVBK8hkOfcF1K3e_7RA_lh-4iw_i' };
// Supabase free plan: 100 events / s per project, and every broadcast also counts once per receiver toward 2 M messages / month.
// Positions are sent at budget / players per second (15 Hz in a duel, 10 Hz at 8 players). Past 8 players use the WebSocket server.
export const SUPABASE_MAX_PLAYERS = 8, SUPABASE_EVENT_BUDGET = 80;

export class SupabaseTransport {
  constructor({ room, id, name }) { this.room = room; this.id = id; this.name = name; this.kind = 'supabase'; this.msgFns = []; this.peerFns = []; this.members = new Map(); this.sent = 0; this.recv = 0; }
  connect() {
    return new Promise((resolve, reject) => {
      this.client = new RealtimeClient(SUPABASE.url, { params: { apikey: SUPABASE.key, eventsPerSecond: 100 } });
      const ch = (this.ch = this.client.channel('ss-mp-' + this.room, { config: { broadcast: { self: false }, presence: { key: this.id } } }));
      ch.on('broadcast', { event: 'm' }, ({ payload }) => { this.recv++; if (!payload || (payload.to && payload.to !== this.id && !(payload.to === 'host' && this.isHost()))) return; for (const fn of this.msgFns) fn(payload); });
      ch.on('presence', { event: 'sync' }, () => {
        this.members.clear(); const st = ch.presenceState();
        for (const [key, metas] of Object.entries(st)) { const m = metas[0] || {}; this.members.set(key, { at: m.at || 0, name: m.name }); }
        for (const fn of this.peerFns) fn(this.peers());
      });
      const timer = setTimeout(() => reject(new Error('Realtime connection timed out')), 12000);
      ch.subscribe(async (status, err) => {
        if (status === 'SUBSCRIBED') { clearTimeout(timer); await ch.track({ at: Date.now(), name: this.name }); resolve(this); }
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { clearTimeout(timer); reject(err || new Error(status)); }
      });
    });
  }
  peers() { return [...this.members.keys()]; }
  hostId() { let best = null; for (const [k, m] of this.members) if (!best || m.at < best.at || (m.at === best.at && k < best.k)) best = { k, at: m.at }; return best ? best.k : this.id; }
  isHost() { return this.hostId() === this.id; }
  get sendHz() { return Math.max(3, Math.min(15, Math.floor(SUPABASE_EVENT_BUDGET / Math.max(1, this.members.size)))); }
  send(msg) { if (!this.ch) return; msg.f = this.id; this.sent++; this.ch.send({ type: 'broadcast', event: 'm', payload: msg }); }
  onMessage(fn) { this.msgFns.push(fn); }
  onPeers(fn) { this.peerFns.push(fn); }
  close() { try { this.ch && this.ch.unsubscribe(); this.client && this.client.disconnect(); } catch (e) { /* closing anyway */ } this.ch = null; }
}

/** Dedicated server (server/mp-server.mjs). The server runs the Authority and batches positions into one snapshot per tick. */
export class WsTransport {
  constructor({ url, room, id, name }) { this.url = url; this.room = room; this.id = id; this.name = name; this.kind = 'ws'; this.msgFns = []; this.peerFns = []; this.ids = []; this.sent = 0; this.recv = 0; }
  connect() {
    return new Promise((resolve, reject) => {
      const u = new URL(this.url); u.searchParams.set('room', this.room); u.searchParams.set('id', this.id); u.searchParams.set('name', this.name);
      const ws = (this.ws = new WebSocket(u.toString())); const timer = setTimeout(() => { reject(new Error('Server connection timed out')); try { ws.close(); } catch (e) { /* ignore */ } }, 8000);
      ws.onopen = () => { clearTimeout(timer); resolve(this); };
      ws.onerror = () => { clearTimeout(timer); reject(new Error('Could not reach the multiplayer server')); };
      ws.onclose = () => { for (const fn of this.msgFns) fn({ k: 'disconnected', f: 'server' }); };
      ws.onmessage = (e) => { this.recv++; let m; try { m = JSON.parse(e.data); } catch (err) { return; }
        if (m.k === 'peers') { this.ids = m.ids; this.leader = m.leader; for (const fn of this.peerFns) fn(this.ids); return; }
        for (const fn of this.msgFns) fn(m); };
    });
  }
  peers() { return this.ids; }
  hostId() { return 'server'; }
  isHost() { return false; }
  get sendHz() { return 20; }
  send(msg) { if (this.ws && this.ws.readyState === 1) { msg.f = this.id; this.sent++; this.ws.send(JSON.stringify(msg)); } }
  onMessage(fn) { this.msgFns.push(fn); }
  onPeers(fn) { this.peerFns.push(fn); }
  close() { try { this.ws && this.ws.close(); } catch (e) { /* ignore */ } this.ws = null; }
}
