// In-game HUD (DOM overlay): vitals, ammo, objectives, minimap, tactical map, squad status, awareness meter,
// hit indicators, kill feed, subtitles, scope / drone / vision overlays. UE5 equivalent: Common UI / UMG widgets.
import * as THREE from 'three';
import { G } from '../core/ctx.js';
import { clamp, fmtTime } from '../core/util.js';
import { SIZE, N, FLATS } from '../world/world.js';
import { ZONES, POI } from '../world/build.js';
import { ST } from '../game/enemies.js';

const $ = (id) => document.getElementById(id), _v = new THREE.Vector3();
export class Hud {
  constructor() {
    const root = (this.root = $('hud'));
    root.innerHTML = `
      <div id="vision"></div><div id="scope"><div class="sc-ring"></div><i class="h"></i><i class="v"></i><span id="scopeRange"></span></div>
      <div id="droneOv"><div class="d-frame"></div><b>RECON DRONE · LIVE FEED</b><span id="droneInfo"></span><em>WASD fly · SPACE/CTRL altitude · B recall</em></div>
      <div id="cross"><i></i><i></i><i></i><i></i><u></u></div><div id="hitm"></div>
      <div id="dmgDir"></div>
      <div id="objPanel"><div id="objCode"></div><div id="objText"></div></div>
      <div id="aware"><span id="awareLabel">HIDDEN</span><div><i id="awareBar"></i></div></div>
      <div id="bossBar"><span>COMMANDER VIPER</span><div><i id="bossHp"></i><u id="bossAr"></u></div></div>
      <div id="mini"><canvas id="miniC" width="176" height="176"></canvas><div id="miniInfo"></div></div>
      <div id="squad"></div><div id="feed"></div>
      <div id="vitals"><div class="row"><label>ARMOR</label><div class="bar ar"><i id="arBar"></i></div><b id="arNum"></b></div><div class="row"><label>HEALTH</label><div class="bar hp"><i id="hpBar"></i></div><b id="hpNum"></b></div><div class="row"><label>STAMINA</label><div class="bar st"><i id="stBar"></i></div><b id="stance"></b></div></div>
      <div id="ammo"><div id="wName"></div><div id="wAmmo"><b id="magN"></b><span id="resN"></span></div><div id="wMode"></div><div id="slots"></div><div id="gearRow"></div></div>
      <div id="prompt"><span id="promptKey">E</span><span id="promptText"></span><div><i id="promptBar"></i></div></div>
      <div id="toasts"></div><div id="radio"></div><div id="banner"><h2></h2><p></p></div>
      <div id="wp"><i></i><span></span></div><div id="tags"></div>
      <div id="tacmap"><div class="tm-head">TACTICAL MAP — <span id="tmZone"></span></div><canvas id="tmC" width="760" height="760"></canvas><div class="tm-legend"><b class="lg-p"></b>YOU <b class="lg-s"></b>SQUAD 07 <b class="lg-o"></b>OBJECTIVE <b class="lg-e"></b>TAGGED HOSTILE</div></div>
      <div id="fps"></div>`;
    this.cine = $('cine'); this.sub = $('cineSub');
    this.tags = []; for (let i = 0; i < 14; i++) { const d = document.createElement('i'); $('tags').appendChild(d); this.tags.push(d); }
    this.t = 0; this.fpsT = 0; this.fpsN = 0; this.fps = 0; this.frameMax = 0; this.hitT = 0; this.dirs = []; this.mapImg = null; this.mapOpen = false; this.lastObj = '';
    this.cross = [...$('cross').querySelectorAll('i')];
  }
  buildMap() { // top-down terrain image from the heightfield (1 px = 4 m)
    const S = 300, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), img = g.createImageData(S, S), W = G.world;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const wx = -SIZE / 2 + (x / S) * SIZE, wz = -SIZE / 2 + (y / S) * SIZE, h = W.heightAt(wx, wz), i = (y * S + x) * 4; let r, gg, b;
      if (h < 0) { const d = clamp(-h / 7, 0, 1); r = 14 - d * 6; gg = 40 - d * 14; b = 52 - d * 14; } else if (h < 2.6) { r = 120; gg = 112; b = 82; } else { const k = clamp(h / 45, 0, 1), s = (W.heightAt(wx + 4, wz) - h) * 6; r = 34 + k * 40 + s; gg = 62 + k * 34 + s; b = 34 + k * 26 + s; }
      for (const f of FLATS) if (wx > f.x0 && wx < f.x1 && wz > f.z0 && wz < f.z1) { r = 74; gg = 76; b = 74; }
      img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0); g.fillStyle = 'rgba(30,32,34,.9)';
    for (const c2 of W.colliders) { const w = c2.max.x - c2.min.x, d = c2.max.z - c2.min.z; if (c2.kind === 'tree' || c2.min.y < -30 || w * d < 3 || c2.thin) continue; g.fillRect(((c2.min.x + SIZE / 2) / SIZE) * S, ((c2.min.z + SIZE / 2) / SIZE) * S, Math.max(1, (w / SIZE) * S), Math.max(1, (d / SIZE) * S)); }
    this.mapImg = c;
  }
  show(on) { this.root.style.display = on ? 'block' : 'none'; }
  cinematic(on) { this.cine.classList.toggle('on', on); this.root.classList.toggle('cin', on); if (!on) this.sub.textContent = ''; }
  subtitle(t) { this.sub.textContent = t; }
  banner(h, p) { const b = $('banner'); b.querySelector('h2').textContent = h; b.querySelector('p').textContent = p; b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); }
  toast(msg, warn) { const box = $('toasts'), d = document.createElement('div'); d.textContent = msg; if (warn) d.className = 'warn'; box.appendChild(d); while (box.children.length > 4) box.firstChild.remove(); setTimeout(() => d.remove(), 3200); }
  radio(line) { const r = $('radio'); r.textContent = '◢ ' + line; r.classList.add('on'); clearTimeout(this.radioT); this.radioT = setTimeout(() => r.classList.remove('on'), 5200); G.audio.say(line); }
  objective(text, flash) { if (text === this.lastObj && !flash) return; this.lastObj = text; $('objCode').textContent = G.mission.def ? `${G.mission.def.code} · ${G.mission.def.name}` : ''; const el = $('objText'); el.textContent = '▸ ' + text; if (flash) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } }
  hitFrom(angle) { const d = document.createElement('i'); $('dmgDir').appendChild(d); this.dirs.push({ d, angle, t: 1.6 }); }
  hitMarker(head, kill) { const h = $('hitm'); h.className = (head ? 'head ' : '') + (kill ? 'kill ' : '') + 'on'; this.hitT = 0.22; }
  killFeed(name, head) { const f = $('feed'), d = document.createElement('div'); d.innerHTML = `<b>${G.save.callsign}</b> ${head ? '◎ HEADSHOT' : '▸'} <span>${name}</span>`; f.appendChild(d); while (f.children.length > 5) f.firstChild.remove(); setTimeout(() => d.remove(), 4500); }
  update(dt) {
    const P = G.player, wp = G.weapons, s = wp.slot, cam = G.camera, w = innerWidth, h = innerHeight;
    // fps
    this.fpsN++; this.fpsT += dt; this.frameMax = Math.max(this.frameMax, dt); if (this.fpsT >= 0.5) { this.fps = this.fpsN / this.fpsT; $('fps').textContent = G.settings.showFps ? `${this.fps.toFixed(0)} FPS · ${(this.frameMax * 1000).toFixed(0)} ms max · ${G.stats ? G.stats.calls : 0} draws · ${G.stats ? (G.stats.tris / 1000).toFixed(0) : 0}k tris` : ''; this.fpsN = 0; this.fpsT = 0; this.frameMax = 0; }
    // crosshair
    const drone = G.gear.droneActive, gap = 4 + wp.spreadDeg() * 7, showCross = !drone && wp.adsT < 0.6 && P.alive;
    $('cross').style.opacity = showCross ? 1 : 0; const c = this.cross; c[0].style.transform = `translate(-50%,-${gap + 9}px)`; c[1].style.transform = `translate(-50%,${gap}px)`; c[2].style.transform = `translate(-${gap + 9}px,-50%)`; c[3].style.transform = `translate(${gap}px,-50%)`;
    if (this.hitT > 0 && (this.hitT -= dt) <= 0) $('hitm').className = '';
    $('scope').style.display = wp.scoped && !drone ? 'block' : 'none'; $('droneOv').style.display = drone ? 'block' : 'none';
    const vis = $('vision'); vis.className = G.gear.vision === 1 ? 'nvg' : G.gear.vision === 2 ? 'thermal' : '';
    for (let i = this.dirs.length - 1; i >= 0; i--) { const d = this.dirs[i]; d.t -= dt; if (d.t <= 0) { d.d.remove(); this.dirs.splice(i, 1); continue; } d.d.style.opacity = Math.min(1, d.t); d.d.style.transform = `rotate(${((P.yaw - d.angle) * 180) / Math.PI + 180}deg)`; }
    // interaction prompt
    const it = P.interact, pr = $('prompt'); if (it && !drone) { pr.style.display = 'flex'; $('promptText').textContent = (it.hold ? 'HOLD — ' : '') + it.label; $('promptBar').style.width = it.hold ? `${(P.holdT / it.hold) * 100}%` : '0'; } else pr.style.display = 'none';
    // waypoint + tagged hostiles (world → screen)
    const m = G.mission.marker(), wpEl = $('wp');
    if (m) { _v.set(m.x, (m.y ?? G.world.heightAt(m.x, m.z)) + 2.2, m.z); const dist = Math.hypot(m.x - P.pos.x, m.z - P.pos.z); _v.project(cam); const behind = _v.z > 1; let sx = (_v.x * 0.5 + 0.5) * w, sy = (-_v.y * 0.5 + 0.5) * h; if (behind) { sx = w - sx; sy = h - 60; } sx = clamp(sx, 40, w - 40); sy = clamp(sy, 60, h - 120); wpEl.style.display = 'block'; wpEl.style.transform = `translate(${sx}px,${sy}px)`; wpEl.lastChild.textContent = `${dist.toFixed(0)} m`; } else wpEl.style.display = 'none';
    let ti = 0; for (const e of G.enemies.list) { if (ti >= this.tags.length) break; if (!e.alive || G.time - e.marked > 30) continue; _v.set(e.pos.x, e.pos.y + (e.type.vehicle ? 3.4 : 2.05), e.pos.z).project(cam); if (_v.z > 1 || Math.abs(_v.x) > 1 || Math.abs(_v.y) > 1) continue; const t = this.tags[ti++]; t.style.display = 'block'; t.style.transform = `translate(${(_v.x * 0.5 + 0.5) * w}px,${(-_v.y * 0.5 + 0.5) * h}px) rotate(45deg)`; }
    for (; ti < this.tags.length; ti++) this.tags[ti].style.display = 'none';
    if (G.input.pressed('Tab')) { this.mapOpen = !this.mapOpen; $('tacmap').style.display = this.mapOpen ? 'block' : 'none'; G.audio.play('ui:ok'); }
    // throttled text + canvases
    if ((this.t -= dt) > 0) return; this.t = 0.09;
    $('hpBar').style.width = P.health + '%'; $('arBar').style.width = P.armor + '%'; $('stBar').style.width = P.stamina + '%'; $('hpNum').textContent = Math.ceil(P.health); $('arNum').textContent = Math.ceil(P.armor); $('hpBar').parentNode.classList.toggle('low', P.health < 35);
    $('stance').textContent = (P.sliding > 0 ? 'SLIDE' : ['STAND', 'CROUCH', 'PRONE'][P.stance]) + (P.inCover ? ' · IN COVER' : '');
    $('wName').textContent = s.w.name; $('magN').textContent = wp.reloading ? '--' : s.mag; $('magN').className = s.mag <= s.w.mag * 0.25 ? 'low' : ''; $('resN').textContent = ' / ' + s.reserve; $('wMode').textContent = `${s.mode.toUpperCase()} · ${s.w.cls}${wp.reloading ? ' · RELOADING' : ''}`;
    $('slots').innerHTML = wp.slots.map((x, i) => `<span class="${i === wp.cur ? 'on' : ''}">${i + 1} ${x.w.name.split(' ')[0]}</span>`).join('');
    const gl = G.gear.list(); $('gearRow').innerHTML = `<span>G FRAG ×${wp.grenades}</span><span>H MED ×${P.medkits}</span><span class="on">F ${gl[G.gear.sel % gl.length].name}</span>${G.gear.has('drone') ? `<span>B DRONE ${(G.gear.battery * 100).toFixed(0)}%</span>` : ''}`;
    if (drone) $('droneInfo').textContent = `ALT ${(G.gear.dronePos.y - Math.max(0, G.world.heightAt(G.gear.dronePos.x, G.gear.dronePos.z))).toFixed(0)} m · BATTERY ${(G.gear.battery * 100).toFixed(0)}% · RANGE ${Math.hypot(G.gear.dronePos.x - P.pos.x, G.gear.dronePos.z - P.pos.z).toFixed(0)} m`;
    if (wp.scoped) { cam.getWorldDirection(_v); const hit = G.world.raycast(P.eye, _v, 600, { water: true }); $('scopeRange').textContent = hit ? `${hit.t.toFixed(0)} m` : '--- m'; }
    // awareness
    const E = G.enemies, det = Math.max(E.maxDetect, G.mission.camDetect || 0); G.mission.camDetect = 0; const aw = $('aware'); let label = 'HIDDEN', cls = '';
    if (E.inCombat > 0) { label = `COMBAT · ${E.inCombat} ENGAGING`; cls = 'combat'; } else if (det > 0.75) { label = 'DETECTED'; cls = 'warn'; } else if (det > 0.3) { label = 'SUSPICIOUS'; cls = 'sus'; }
    aw.className = cls; $('awareLabel').textContent = label; $('awareBar').style.width = (E.inCombat ? 100 : clamp(det, 0, 1) * 100) + '%';
    // boss
    const b = G.mission.boss, bb = $('bossBar'); if (b && b.alive && b.state >= ST.SEARCH) { bb.style.display = 'block'; $('bossHp').style.width = (b.hp / 950) * 100 + '%'; $('bossAr').style.width = (b.armor / 320) * 100 + '%'; } else bb.style.display = 'none';
    // squad
    $('squad').innerHTML = G.squad.list.map((q) => `<div class="${q.down ? 'down' : ''}"><b>${q.name}</b><span><i style="width:${clamp(q.hp / 2, 0, 100)}%"></i></span><em>${q.down ? 'DOWN' : q.tgt && q.tgt.alive ? 'ENGAGING' : G.squad.free ? 'READY' : 'HOLD FIRE'}</em></div>`).join('');
    this.drawMini(); if (this.mapOpen) this.drawMap();
  }
  enemyVisible(e) { return e.alive && (G.time - e.marked < 30 || G.time - e.lastFire < 2.5); }
  drawMini() {
    const cv = $('miniC'), g = cv.getContext('2d'), P = G.player, R = 88, scale = R / 70, yaw = G.gear.droneActive ? G.gear.dyaw : P.yaw, cx = G.gear.droneActive ? G.gear.dronePos.x : P.pos.x, cz = G.gear.droneActive ? G.gear.dronePos.z : P.pos.z, under = P.pos.y < -30;
    g.save(); g.clearRect(0, 0, 176, 176); g.beginPath(); g.arc(R, R, R - 2, 0, 6.3); g.clip(); g.fillStyle = under ? '#0b0d0e' : '#0d1a1c'; g.fillRect(0, 0, 176, 176);
    g.translate(R, R); g.rotate(yaw); g.scale(scale, scale); g.translate(-cx, -cz);
    if (!under && this.mapImg) { g.globalAlpha = 0.85; g.drawImage(this.mapImg, -SIZE / 2, -SIZE / 2, SIZE, SIZE); g.globalAlpha = 1; }
    if (under) { g.fillStyle = '#5a6468'; for (const c of G.world.near(cx, cz, 75, [])) if (c.min.y < -30) g.fillRect(c.min.x, c.min.z, c.max.x - c.min.x, c.max.z - c.min.z); }
    const dot = (x, z, col, r = 2.2) => { g.fillStyle = col; g.beginPath(); g.arc(x, z, r / scale, 0, 6.3); g.fill(); };
    for (const e of G.enemies.list) if (this.enemyVisible(e) && (e.pos.y < -30) === under) dot(e.pos.x, e.pos.z, '#ff3b30', e.type.vehicle ? 4 : 2.6);
    for (const q of G.squad.list) dot(q.pos.x, q.pos.z, q.down ? '#777' : '#4fd0ff');
    const m = G.mission.marker(); g.restore();
    if (m) { let dx = m.x - cx, dz = m.z - cz; const c = Math.cos(yaw), s = Math.sin(yaw); let rx = (dx * c - dz * s) * scale, rz = (dx * s + dz * c) * scale; const l = Math.hypot(rx, rz); if (l > R - 10) { rx *= (R - 10) / l; rz *= (R - 10) / l; } g.fillStyle = '#ffd23a'; g.beginPath(); g.moveTo(R + rx, R + rz - 6); g.lineTo(R + rx + 5, R + rz); g.lineTo(R + rx, R + rz + 6); g.lineTo(R + rx - 5, R + rz); g.fill(); }
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(R, R - 7); g.lineTo(R + 5, R + 5); g.lineTo(R, R + 2); g.lineTo(R - 5, R + 5); g.fill();
    g.strokeStyle = 'rgba(180,200,190,.5)'; g.lineWidth = 2; g.beginPath(); g.arc(R, R, R - 2, 0, 6.3); g.stroke();
    const na = yaw, nx = R + Math.sin(na) * (R - 12) * -1, nz = R - Math.cos(na) * (R - 12); g.fillStyle = '#ff5a4a'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.fillText('N', R - Math.sin(-na) * (R - 12), R - Math.cos(-na) * (R - 12) + 4);
    const hd = ((((-yaw * 180) / Math.PI) % 360) + 360) % 360; let zone = under ? 'ZONE 04 · UNDERGROUND FACILITY' : 'OPEN WATER'; if (!under) { let bd = 1e9; for (const z of ZONES) { const d = Math.hypot(P.pos.x - z.x, P.pos.z - z.z) / z.r; if (d < bd) { bd = d; zone = z.name; } } }
    this.zone = zone; $('miniInfo').textContent = `${String(Math.round(hd)).padStart(3, '0')}° · ${zone}`;
  }
  drawMap() {
    const cv = $('tmC'), g = cv.getContext('2d'), S = 760, P = G.player, k = S / SIZE, X = (x) => (x + SIZE / 2) * k, Z = (z) => (z + SIZE / 2) * k; $('tmZone').textContent = `${this.zone} · ${G.sky.target ? G.sky.target.label : ''}`;
    g.imageSmoothingEnabled = true; g.drawImage(this.mapImg, 0, 0, S, S); g.strokeStyle = 'rgba(190,220,200,.12)'; g.lineWidth = 1; for (let i = 0; i <= 12; i++) { g.beginPath(); g.moveTo((i * S) / 12, 0); g.lineTo((i * S) / 12, S); g.moveTo(0, (i * S) / 12); g.lineTo(S, (i * S) / 12); g.stroke(); }
    g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; for (const z of ZONES) { g.strokeStyle = 'rgba(255,210,58,.35)'; g.setLineDash([6, 5]); g.beginPath(); g.arc(X(z.x), Z(z.z), z.r * k, 0, 6.3); g.stroke(); g.setLineDash([]); g.fillStyle = 'rgba(255,230,150,.9)'; g.fillText(z.name, X(z.x), Z(z.z) - z.r * k - 5); }
    g.fillStyle = 'rgba(255,230,150,.9)'; g.fillText('ZONE 04 · UNDERGROUND (below base)', X(POI.fac.x), Z(POI.fac.z - 40));
    for (const e of G.enemies.list) if (this.enemyVisible(e)) { g.fillStyle = '#ff3b30'; g.fillRect(X(e.pos.x) - 3, Z(e.pos.z) - 3, 6, 6); }
    for (const q of G.squad.list) { g.fillStyle = '#4fd0ff'; g.beginPath(); g.arc(X(q.pos.x), Z(q.pos.z), 3.5, 0, 6.3); g.fill(); }
    const m = G.mission.marker(); if (m) { g.fillStyle = '#ffd23a'; g.save(); g.translate(X(m.x), Z(m.z)); g.rotate(Math.PI / 4); g.fillRect(-6, -6, 12, 12); g.restore(); }
    g.save(); g.translate(X(P.pos.x), Z(P.pos.z)); g.rotate(-P.yaw); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, -10); g.lineTo(7, 8); g.lineTo(0, 4); g.lineTo(-7, 8); g.fill(); g.restore();
  }
}
