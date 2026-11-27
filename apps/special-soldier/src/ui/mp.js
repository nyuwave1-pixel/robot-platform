// Multiplayer UI: the lobby (drawn inside the normal menu panel) and the in-match overlay
// (score + timer, kill feed, respawn countdown, hold-TAB scoreboard, result screen).
import { G } from '../core/ctx.js';
import { MODES, TEAMS, TEAM_NAME } from '../net/authority.js';
import { SUPABASE_MAX_PLAYERS } from '../net/transport.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const CSS = `
#mpHud{position:fixed;inset:0;pointer-events:none;z-index:12;display:none;font-family:var(--font);text-transform:uppercase;letter-spacing:.12em}
#mpHud.on{display:block}
body.mpOn #aware,body.mpOn #nadeCount{visibility:hidden}
#mpScore{position:absolute;top:10px;left:50%;transform:translateX(-50%);display:flex;gap:14px;align-items:center;font-size:20px;color:#fff;text-shadow:0 1px 3px #000}
#mpScore .b{color:#6fb4ff}#mpScore .r{color:#ff6a5a}#mpScore .t{font-size:13px;color:var(--sil);min-width:54px;text-align:center}
#mpFeed{position:absolute;top:232px;right:16px;display:flex;flex-direction:column;gap:4px;align-items:flex-end;font-size:12px}
#mpFeed div{background:rgba(0,0,0,.45);padding:3px 8px;color:#ddd}#mpFeed .blue{color:#6fb4ff}#mpFeed .red{color:#ff6a5a}#mpFeed .me{border-left:2px solid var(--amber)}
#mpRespawn{position:absolute;top:38%;left:50%;transform:translateX(-50%);text-align:center;color:#fff;font-size:26px;display:none;text-shadow:0 2px 6px #000}
#mpRespawn small{display:block;font-size:13px;color:var(--sil);margin-top:6px}
#mpBoard{position:absolute;top:12%;left:50%;transform:translateX(-50%);width:min(760px,94vw);background:rgba(6,8,7,.9);border:1px solid rgba(207,214,212,.25);padding:14px;display:none;pointer-events:auto}
#mpBoard.on{display:block}.mpCols{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mpTeam h4{margin:0 0 6px;font-size:13px}.mpTeam.blue h4{color:#6fb4ff}.mpTeam.red h4{color:#ff6a5a}
.mpTeam table{width:100%;border-collapse:collapse;font-size:12px;text-transform:none;letter-spacing:.03em}.mpTeam td{padding:3px 6px;border-bottom:1px solid rgba(255,255,255,.07)}
.mpTeam td.n{width:60%}.mpTeam tr.me td{color:var(--amber)}.mpTeam td.dead{opacity:.5}
.mpLobby .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:8px 0}.mpLobby input{font:inherit;background:rgba(0,0,0,.4);color:#fff;border:1px solid rgba(207,214,212,.3);padding:.5em .7em;letter-spacing:.08em}
.mpLobby input.code{width:160px;text-transform:uppercase}.mpLobby input.srv{width:280px}.mpLobby .sel{border-color:var(--amber);color:var(--amber)}
.mpLobby{display:flex;flex-direction:column;gap:2px}.mpLobby .mpMsg{margin-top:12px;color:var(--gr);font-size:12px;min-height:16px;text-transform:none;letter-spacing:.03em}.mpLobby .note{text-transform:none;letter-spacing:.03em}
`;

export class MpUi {
  constructor(mp) {
    this.mp = mp; this.msg = ''; this.tab = false; this.feedEl = null; this.serverOpen = false; this.mode = 'duel';
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const h = (this.hud = document.createElement('div')); h.id = 'mpHud';
    h.innerHTML = `<div id="mpScore"><span class="b">${TEAM_NAME.blue} <b id="mpSB">0</b></span><span class="t" id="mpTime">0:00</span><span class="r"><b id="mpSR">0</b> ${TEAM_NAME.red}</span></div><div id="mpFeed"></div><div id="mpRespawn"></div><div id="mpBoard"></div>`;
    document.body.appendChild(h);
    addEventListener('keydown', (e) => { if (e.code === 'Tab' && this.mp.active) { e.preventDefault(); this.tab = true; this.board(); } });
    addEventListener('keyup', (e) => { if (e.code === 'Tab') { this.tab = false; this.board(); } });
    // lobby buttons live inside #menu; they use data-mp so the campaign menu ignores them
    document.getElementById('menu').addEventListener('click', (e) => { const t = e.target.closest('[data-mp]'); if (t) this.act(t.dataset.mp, t.dataset.v); });
  }
  $(id) { return document.getElementById(id); }
  status(t) { this.msg = t; const el = this.$('mpStatus'); if (el) el.textContent = t; }

  // ---------- lobby ----------
  openLobby() { this.inLobby = true; G.state = 'menu'; this.render(); }
  closeLobby() { this.inLobby = false; }
  refresh() { if (this.inLobby && G.menu.el.classList.contains('on') && this.$('mpLobby')) this.render(); if (this.tab || (this.endShown && this.mp.active === false)) this.board(); }
  render() {
    const mp = this.mp, R = mp.roster, leader = mp.isLeader();
    let body;
    if (!mp.connected) {
      body = `<p class="lead">Fight other players online. <b>1v1 DUEL</b> or <b>TEAM DEATHMATCH</b> up to <b>15 v 15</b> in the Black Cobra base.</p>
      <div class="row"><span class="note">CALLSIGN</span><input id="mpName" maxlength="16" value="${esc(mp.name)}"></div>
      <div class="row"><span class="note">MODE</span>${Object.entries(MODES).map(([k, m]) => `<button data-mp="pickmode" data-v="${k}" class="${this.mode === k ? 'sel' : ''}">${m.name}${k === 'tdm' ? ' · UP TO 15V15' : ''}</button>`).join('')}</div>
      <div class="row"><button data-mp="create">CREATE ROOM</button><input id="mpCode" class="code" maxlength="12" placeholder="ROOM CODE"><button data-mp="join">JOIN</button></div>
      <div class="row"><button data-mp="srvtoggle">${this.serverOpen ? '▾' : '▸'} DEDICATED SERVER</button>${this.serverOpen ? `<input id="mpSrv" class="srv" placeholder="wss://your-server:8787" value="${esc(localStorage.getItem('ss-mp-server') || '')}">` : ''}</div>
      <p class="note">Without a server address, rooms run on Supabase Realtime: the first player in the room hosts the match (up to ${SUPABASE_MAX_PLAYERS} players). Full 15 v 15 rooms need the dedicated server (<code>npm run mp:server</code>).</p>`;
    } else {
      const players = R ? R.players : [], cap = MODES[R ? R.mode : this.mode].perTeam;
      const col = (t) => `<div class="mpTeam ${t}"><h4>${TEAM_NAME[t]} · ${players.filter((p) => p.tm === t).length}/${cap}</h4><table>${players.filter((p) => p.tm === t).map((p) => `<tr class="${p.i === mp.id ? 'me' : ''}"><td class="n">${esc(p.n)}${p.i === mp.id ? ' (YOU)' : ''}</td></tr>`).join('') || '<tr><td class="note">empty</td></tr>'}</table>${mp.myTeam !== t && players.filter((p) => p.tm === t).length < cap ? `<button data-mp="team" data-v="${t}" style="margin-top:6px">SWITCH HERE</button>` : ''}</div>`;
      const link = `${location.origin}${location.pathname}?mp=${mp.room}${mp.transport.kind === 'ws' ? '&server=' + encodeURIComponent(mp.transport.url) : ''}`;
      body = `<div class="row"><span class="lead">ROOM <b>${esc(mp.room)}</b></span><span class="note">${R ? MODES[R.mode].name : ''} · ${players.length} player${players.length === 1 ? '' : 's'} · ${mp.transport.kind === 'ws' ? 'dedicated server' : 'hosted by ' + (mp.isHost() ? 'you' : 'the first player')}</span></div>
      ${leader ? `<div class="row"><span class="note">MODE</span>${Object.entries(MODES).map(([k, m]) => `<button data-mp="mode" data-v="${k}" class="${R && R.mode === k ? 'sel' : ''}">${m.name}</button>`).join('')}</div>` : ''}
      <div class="mpCols">${col('blue')}${col('red')}</div>
      <div class="row"><span class="note">INVITE</span><input id="mpLink" class="srv" readonly value="${esc(link)}"><button data-mp="copy">COPY</button></div>
      <div class="row">${leader ? `<button data-mp="start" ${players.length < 2 ? 'disabled title="Needs a second player"' : ''}>START MATCH</button>` : '<span class="note">Waiting for the host to start…</span>'}<button data-mp="leave">LEAVE ROOM</button></div>`;
    }
    G.menu.open(G.menu.frame('MULTIPLAYER', `<div class="mpLobby" id="mpLobby">${body}<div class="mpMsg" id="mpStatus">${esc(this.msg)}</div></div>`, 'operations'));
  }
  async act(a, v) {
    const mp = this.mp; G.audio.init(); G.audio.play('ui:ok');
    const name = this.$('mpName') ? this.$('mpName').value : undefined, srv = this.$('mpSrv') ? this.$('mpSrv').value.trim() : '';
    if (srv) try { localStorage.setItem('ss-mp-server', srv); } catch (e) { /* private mode */ }
    try {
      switch (a) {
        case 'pickmode': this.mode = v; this.render(); break;
        case 'srvtoggle': this.serverOpen = !this.serverOpen; this.render(); break;
        case 'create': this.status('Creating room…'); await mp.connect({ room: '', server: srv, mode: this.mode, name }); this.render(); break;
        case 'join': { const code = this.$('mpCode').value.trim(); if (!code) { this.status('Enter a room code.'); return; } this.status('Joining…'); await mp.connect({ room: code, server: srv, mode: this.mode, name }); this.render(); break; }
        case 'mode': mp.setMode(v); break;
        case 'team': mp.setTeam(v); break;
        case 'start': mp.start(); break;
        case 'copy': { const el = this.$('mpLink'); el.select(); try { await navigator.clipboard.writeText(el.value); this.status('Invite link copied.'); } catch (e) { this.status('Select the link and copy it.'); } break; }
        case 'leave': mp.leave(true); this.status(''); break;
        case 'lobby': this.endShown = false; this.hideHud(); if (mp.isLeader()) mp.backToLobby(); this.openLobby(); break;
      }
    } catch (err) { this.status('Error: ' + err.message); }
  }

  // ---------- in-match overlay ----------
  showHud() { document.body.classList.add('mpOn'); this.hud.classList.add('on'); this.$('mpFeed').innerHTML = ''; this.endShown = false; this.$('mpBoard').classList.remove('on'); }
  hideHud() { document.body.classList.remove('mpOn'); this.hud.classList.remove('on'); this.$('mpRespawn').style.display = 'none'; }
  tick(respawn, left) {
    const R = this.mp.roster; if (R) { this.$('mpSB').textContent = R.score.blue; this.$('mpSR').textContent = R.score.red; }
    this.$('mpTime').textContent = fmt(left);
    if (respawn > 0) { const el = this.$('mpRespawn'); el.style.display = 'block'; el.firstChild && el.firstChild.nodeType === 3 ? (el.firstChild.textContent = 'RESPAWN IN ' + Math.ceil(respawn)) : null; }
  }
  respawn(sec, by) {
    const el = this.$('mpRespawn'); if (!sec) { el.style.display = 'none'; return; }
    el.innerHTML = `RESPAWN IN ${Math.ceil(sec)}<small>KILLED BY ${esc(by || '?')}</small>`; el.style.display = 'block';
  }
  feed(a, at, b, bt, zone) {
    (this.log = this.log || []).push(`${a}>${b}`); const f = this.$('mpFeed'), d = document.createElement('div'), me = this.mp.name;
    d.innerHTML = `<span class="${at}">${esc(a)}</span> ${zone === 'head' ? '⊕' : zone === 'nade' ? '✸' : '▸'} <span class="${bt}">${esc(b)}</span>`; if (a === me || b === me) d.className = 'me';
    f.prepend(d); while (f.children.length > 6) f.lastChild.remove(); setTimeout(() => d.remove(), 6000);
  }
  board(final) {
    const el = this.$('mpBoard'), R = this.mp.roster; if (!el) return;
    if (!this.tab && !this.endShown) { el.classList.remove('on'); return; }
    const rows = final ? final.board.map((p) => ({ i: p.i, n: p.n, tm: p.tm, k: p.k, d: p.d, al: true })) : R ? R.players : [];
    const col = (t) => `<div class="mpTeam ${t}"><h4>${TEAM_NAME[t]} — ${(final ? final.score : R ? R.score : { blue: 0, red: 0 })[t]}</h4><table><tr><td class="n note">PLAYER</td><td class="note">K</td><td class="note">D</td></tr>${rows.filter((p) => p.tm === t).sort((a, b) => b.k - a.k).map((p) => `<tr class="${p.i === this.mp.id ? 'me' : ''}"><td class="n ${p.al ? '' : 'dead'}">${esc(p.n)}</td><td>${p.k}</td><td>${p.d}</td></tr>`).join('')}</table></div>`;
    const head = final ? `<h3 style="margin:0 0 10px;text-align:center">${final.winner === 'draw' ? 'DRAW' : (final.winner === this.mp.myTeam ? 'VICTORY — ' : 'DEFEAT — ') + TEAM_NAME[final.winner] + ' WINS'}</h3>` : '';
    el.innerHTML = head + `<div class="mpCols">${TEAMS.map(col).join('')}</div>` + (final ? `<div class="actions" style="justify-content:center"><button data-mpend="lobby">BACK TO LOBBY</button></div>` : '');
    el.classList.add('on');
    const b = el.querySelector('[data-mpend]'); if (b) b.onclick = () => this.act('lobby');
  }
  result(e) { this.endShown = true; this.hud.classList.add('on'); this.$('mpRespawn').style.display = 'none'; this.board(e); }
}
