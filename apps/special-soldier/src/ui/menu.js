// Front-end: main menu (over a live 3D scene), campaign / operations / armory / operator / settings screens,
// mission briefing, pause, KIA and after-action report. Every button is wired to working behaviour.
import { G } from '../core/ctx.js';
import { fmtTime } from '../core/util.js';
import { storeSave, resetSave, loadSave, DIFFICULTY } from '../core/save.js';
import { WEAPONS, burstDps, effectiveDps, hitChance, timeToKill, cycleTime } from '../config/weapons.js';
import { MISSIONS, unlockedWeapons } from '../game/missions.js';
import { GEAR } from '../game/gear.js';
import { ENEMY_TYPES } from '../game/enemies.js';

const MAIN = [['campaign', 'CAMPAIGN', 'Operation: Island Invasion — 5 missions'], ['multiplayer', 'MULTIPLAYER', 'Planned expansion — design status'], ['operations', 'OPERATIONS', 'Mission records & intel'], ['weapons', 'WEAPONS', 'Armory, DPS data, loadout'], ['operator', 'OPERATOR', 'Profile, equipment, service record'], ['settings', 'SETTINGS', 'Graphics, controls, audio'], ['exit', 'EXIT GAME', '']];
const KEYS = [['W A S D', 'Move'], ['MOUSE', 'Look'], ['SHIFT', 'Sprint'], ['CTRL / C', 'Crouch · slide while sprinting'], ['Z', 'Prone'], ['SPACE', 'Jump / stand'], ['LMB', 'Fire'], ['RMB', 'Aim down sights (peeks from cover)'], ['R', 'Reload'], ['V', 'Fire mode'], ['1 2 3 · Q · WHEEL', 'Switch weapon'], ['G', 'Frag grenade'], ['E', 'Interact (hold where shown)'], ['F · X', 'Use / cycle tactical equipment'], ['N · T · L', 'Night vision · thermal · tac light'], ['B', 'Recon drone'], ['H', 'Med kit'], ['TAB', 'Tactical map'], ['ESC', 'Pause']];
const bar = (v, max, cls = '') => `<span class="sb ${cls}"><i style="width:${Math.min(100, (v / max) * 100).toFixed(0)}%"></i></span>`;

export class Menu {
  constructor() {
    this.el = document.getElementById('menu'); this.screen = null; this.sel = 'm4';
    this.el.addEventListener('click', (e) => { const t = e.target.closest('[data-a]'); if (!t || t.classList.contains('locked')) return; G.audio.init(); G.audio.play('ui:ok'); this.act(t.dataset.a, t.dataset.v); });
    this.el.addEventListener('mouseover', (e) => { const t = e.target.closest('[data-a]'); if (t && t !== this.hov) { this.hov = t; G.audio.play('ui:hover'); } });
    this.el.addEventListener('input', (e) => { const t = e.target; if (t.dataset.set) this.setting(t.dataset.set, t.type === 'checkbox' ? t.checked : t.type === 'range' ? +t.value : t.value, t); if (t.dataset.cs !== undefined) { G.save.callsign = t.value.toUpperCase().slice(0, 14) || 'GHOST 0-7'; storeSave(G.save); } });
  }
  open(html, cls = '') { this.el.className = 'on ' + cls; this.el.innerHTML = html; }
  hide() { this.el.className = ''; this.el.innerHTML = ''; this.screen = null; }
  frame(title, body, back = 'main') { return `<div class="panel"><header><h2>${title}</h2><button data-a="${back}">◂ BACK</button></header><div class="body">${body}</div></div>`; }
  act(a, v) {
    switch (a) {
      case 'main': return this.main(); case 'campaign': return this.campaign(); case 'operations': return this.operations(); case 'weapons': return this.weapons(); case 'operator': return this.operator(); case 'settings': return this.settings(v || 'main'); case 'multiplayer': return this.multiplayer(); case 'exit': return this.exit(); case 'pauseBack': return this.pause();
      case 'brief': return this.briefing(+v); case 'deploy': return G.startMission(+v);
      case 'diff': G.settings.difficulty = v; storeSave(G.save); return this.campaign();
      case 'wsel': this.sel = v; return this.weapons();
      case 'equip': { const L = G.save.loadout, w = WEAPONS[this.sel]; if (w.slot === 'sidearm') L.sidearm = this.sel; else if (v === 'secondary') { if (L.primary === this.sel) L.primary = L.secondary; L.secondary = this.sel; } else { if (L.secondary === this.sel) L.secondary = L.primary; L.primary = this.sel; } storeSave(G.save); return this.weapons(); }
      case 'resume': return G.resume(); case 'restart': return G.respawn(); case 'restartMission': return G.startMission(G.mission.idx, true); case 'quit': return G.toMenu();
      case 'next': return G.mission.idx + 1 < MISSIONS.length ? this.briefing(G.mission.idx + 1) : this.credits();
      case 'wipe': if (v === 'yes') { resetSave(); G.save = loadSave(); G.settings = G.save.settings; G.applySettings(); return this.operator(); } return this.operator(true);
      case 'exitYes': G.audio.stopLoops(); window.close(); return this.open(`<div class="panel small"><h2>SESSION ENDED</h2><p>Your progress is saved. You can close this window.</p><button data-a="main">RETURN TO MAIN MENU</button></div>`);
    }
  }
  main() {
    this.screen = 'main'; const p = G.save.progress;
    this.open(`<div class="title"><div class="kicker">INTERNATIONAL SPECIAL OPERATIONS COMMAND · SQUAD 07</div><h1>SPECIAL<br><span>SOLDIER</span></h1><div class="sub">OPERATION: ISLAND INVASION</div></div>
      <nav>${MAIN.map(([a, t, d], i) => `<button data-a="${a}"><em>0${i + 1}</em><b>${t}</b><small>${d}</small></button>`).join('')}</nav>
      <div class="status"><div><b>${G.save.callsign}</b> · CAMPAIGN ${Math.min(p, 5)}/5 · ${DIFFICULTY[G.settings.difficulty].label}</div><div>PLAYABLE PROTOTYPE v0.5 · THREE.JS / WEBGL2 · MODELS: BLENDER 5.3 · TEXTURES & AUDIO: PROCEDURAL PLACEHOLDERS</div></div>`, 'main');
  }
  campaign() {
    const p = G.save.progress;
    this.open(this.frame('CAMPAIGN — OPERATION: ISLAND INVASION', `<p class="lead">2029. An unregistered island in the outer Pacific hides a bio-chemical research facility run by the armed organisation <b>BLACK COBRA</b>. SQUAD 07 goes in by boat, before dawn.</p>
      <div class="diff">DIFFICULTY ${Object.entries(DIFFICULTY).map(([k, d]) => `<button data-a="diff" data-v="${k}" class="${G.settings.difficulty === k ? 'on' : ''}">${d.label}</button>`).join('')}<small>Scales enemy detection range, reaction time, accuracy and damage.</small></div>
      <div class="missions">${MISSIONS.map((m, i) => { const locked = i > p, best = G.save.best[i]; return `<button data-a="brief" data-v="${i}" class="mcard ${locked ? 'locked' : ''} ${i === Math.min(p, 4) ? 'cur' : ''}"><em>${m.code}</em><b>${m.name}</b><small>${m.zone}</small><span>${locked ? '🔒 LOCKED' : best ? `GRADE ${best.grade} · ${fmtTime(best.time)}` : 'AVAILABLE'}</span></button>`; }).join('')}</div>`));
  }
  briefing(i) {
    const m = MISSIONS[i];
    this.open(this.frame(`${m.code} — ${m.name}`, `<div class="brief"><div><h3>${m.zone}</h3>${m.brief.map((b) => `<p>${b}</p>`).join('')}<h3>OBJECTIVES</h3><ol>${m.objectives.map((o) => `<li>${o.text}</li>`).join('')}</ol></div>
      <aside><h3>LOADOUT</h3><ul>${['primary', 'secondary', 'sidearm'].map((s, k) => `<li><em>${k + 1}</em> ${WEAPONS[G.save.loadout[s]].name}</li>`).join('')}</ul><button data-a="weapons">CHANGE LOADOUT</button><h3>REWARD</h3><ul>${m.unlocks.map((u) => `<li>${u}</li>`).join('')}</ul><h3>DIFFICULTY</h3><p>${DIFFICULTY[G.settings.difficulty].label}</p></aside></div>
      <div class="actions"><button class="primary" data-a="deploy" data-v="${i}">▶ DEPLOY</button></div>`, 'campaign'));
  }
  operations() {
    this.open(this.frame('OPERATIONS — MISSION RECORDS', `<table class="tbl"><tr><th>OPERATION</th><th>ZONE</th><th>STATUS</th><th>GRADE</th><th>TIME</th><th>KILLS</th><th>ACCURACY</th><th>ALARMS</th></tr>${MISSIONS.map((m, i) => { const b = G.save.best[i]; return `<tr><td><b>${m.code}</b> ${m.name}</td><td>${m.zone}</td><td>${b ? 'COMPLETE' : i <= G.save.progress ? 'AVAILABLE' : 'LOCKED'}</td><td>${b ? b.grade : '—'}</td><td>${b ? fmtTime(b.time) : '—'}</td><td>${b ? b.kills : '—'}</td><td>${b ? b.acc + '%' : '—'}</td><td>${b ? b.alarms : '—'}</td></tr>`; }).join('')}</table>
      <h3>THREAT INTEL — BLACK COBRA ORDER OF BATTLE</h3><table class="tbl"><tr><th>TYPE</th><th>HEALTH</th><th>ARMOR</th><th>BEHAVIOUR</th><th>BURST DPS</th></tr>${Object.values(ENEMY_TYPES).map((t) => `<tr><td><b>${t.name}</b></td><td>${t.hp}</td><td>${t.armor}</td><td>${{ cover: 'Holds cover, peeks to fire, falls back when hurt', push: 'Advances cover to cover', hold: t.vehicle ? 'Turret; immune to small arms (10% damage)' : 'Static overwatch, laser-aimed single shots', suppress: 'Slow advance, long suppressive bursts', flank: t.boss ? 'Flanks, grenades, calls reserves at 50% health' : 'Flanks wide, throws grenades at cover' }[t.behavior]}</td><td>${((t.gun.dmg * t.rpm) / 60).toFixed(0)}</td></tr>`).join('')}</table>`));
  }
  weapons() {
    const p = G.save.progress, un = unlockedWeapons(p), w = WEAPONS[this.sel], L = G.save.loadout, locked = !un.includes(this.sel), tk = timeToKill(w, 100, 0, 15), ta = timeToKill(w, 150, 90, 15), near = w.cls === 'SHOTGUN' || w.cls === 'SMG' || w.cls === 'SIDEARM' ? 12 : w.cls === 'SNIPER RIFLE' ? 150 : 40;
    this.open(this.frame('WEAPONS — ARMORY', `<div class="armory"><div class="wlist">${Object.entries(WEAPONS).map(([id, x]) => `<button data-a="wsel" data-v="${id}" class="${id === this.sel ? 'on' : ''} ${un.includes(id) ? '' : 'dim'}"><b>${x.name}</b><small>${x.cls}${un.includes(id) ? (Object.values(L).includes(id) ? ' · EQUIPPED' : '') : ` · UNLOCK: MISSION 0${x.unlock}`}</small></button>`).join('')}</div>
      <div class="wdetail"><h3>${w.name} <small>${w.cls}</small></h3><p>${w.desc}</p>
      <div class="stats"><label>DAMAGE</label>${bar(w.dmg * w.pellets, 190)}<b>${w.dmg}${w.pellets > 1 ? '×' + w.pellets : ''}</b><label>FIRE RATE</label>${bar(w.rpm, 1000)}<b>${w.rpm} rpm</b><label>RECOIL</label>${bar(w.recoilV, 5.5, 'neg')}<b>${w.recoilV.toFixed(2)}°</b><label>ACCURACY (ADS)</label>${bar(1 / (w.adsSpread + 0.05), 17)}<b>${w.adsSpread}°</b><label>HIP SPREAD</label>${bar(w.spread, 5.5, 'neg')}<b>${w.spread}°</b><label>RANGE</label>${bar(w.range[0], 200)}<b>${w.range[0]}–${w.range[1]} m</b><label>MAGAZINE</label>${bar(w.mag, 100)}<b>${w.mag} / ${w.reserve}</b><label>RELOAD</label>${bar(cycleTime(w) - ((w.mag - 1) * 60) / w.rpm, 6, 'neg')}<b>${(cycleTime(w) - ((w.mag - 1) * 60) / w.rpm).toFixed(1)} s</b><label>ADS SPEED</label>${bar(w.ads, 0.45, 'neg')}<b>${(w.ads * 1000).toFixed(0)} ms</b><label>WEIGHT</label>${bar(w.weight, 8.5, 'neg')}<b>${w.weight} kg</b><label>MUZZLE VELOCITY</label>${bar(w.vel, 950)}<b>${w.vel} m/s</b></div>
      <div class="dps"><div><em>BURST DPS</em><b>${burstDps(w).toFixed(0)}</b><small>damage × pellets × rpm ÷ 60</small></div><div><em>FIELD DPS @ ${near} m</em><b>${effectiveDps(w, near).toFixed(0)}</b><small>incl. reload, falloff, ${(hitChance(w, near) * 100).toFixed(0)}% hit chance</small></div><div><em>TTK · SENTRY</em><b>${tk.time.toFixed(2)} s</b><small>${tk.shots} shot${tk.shots > 1 ? 's' : ''} to body</small></div><div><em>TTK · ELITE (ARMOR)</em><b>${ta.time.toFixed(2)} s</b><small>${ta.shots} shots to body</small></div></div>
      <div class="actions">${locked ? `<span class="lock">🔒 Complete MISSION 0${w.unlock} to unlock</span>` : w.slot === 'sidearm' ? `<button class="primary" data-a="equip" data-v="sidearm">EQUIP AS SIDEARM [3]</button>` : `<button class="primary" data-a="equip" data-v="primary">EQUIP AS PRIMARY [1]</button><button data-a="equip" data-v="secondary">EQUIP AS SECONDARY [2]</button>`}</div>
      <p class="note">Loadout: <b>1</b> ${WEAPONS[L.primary].name} · <b>2</b> ${WEAPONS[L.secondary].name} · <b>3</b> ${WEAPONS[L.sidearm].name}</p></div></div>`));
  }
  operator(confirmWipe) {
    const s = G.save.stats, acc = s.shots ? ((s.hits / s.shots) * 100).toFixed(0) : 0;
    this.open(this.frame('OPERATOR — SQUAD 07 COMMANDER', `<div class="brief"><div><h3>CALLSIGN</h3><input data-cs maxlength="14" value="${G.save.callsign}"><h3>SERVICE RECORD</h3><table class="tbl"><tr><td>Missions completed</td><td>${Object.keys(G.save.best).length} / 5</td></tr><tr><td>Hostiles neutralised</td><td>${s.kills}</td></tr><tr><td>Headshots</td><td>${s.headshots}</td></tr><tr><td>Accuracy</td><td>${acc}%</td></tr><tr><td>KIA (restarts)</td><td>${s.deaths}</td></tr><tr><td>Time in the field</td><td>${fmtTime(s.time)}</td></tr></table>
      <div class="actions">${confirmWipe ? `<span class="lock">Erase all progress and settings?</span><button data-a="wipe" data-v="yes">YES, ERASE</button><button data-a="operator">CANCEL</button>` : `<button data-a="wipe">RESET PROFILE</button>`}</div></div>
      <aside><h3>TACTICAL EQUIPMENT</h3><ul>${GEAR.map((g) => `<li class="${G.save.progress >= g.unlock ? '' : 'dim'}"><em>${g.key}</em> ${g.name} ${G.save.progress >= g.unlock ? '' : `— unlock: MISSION 0${g.unlock}`}</li>`).join('')}<li><em>—</em> BALLISTIC VEST (100 armor, absorbs 60%)</li><li><em>—</em> SQUAD RADIO (team-mate call-outs)</li></ul></aside></div>`));
  }
  settings(back = 'main') {
    const s = G.settings, sl = (k, min, max, step, fmt) => `<input type="range" data-set="${k}" min="${min}" max="${max}" step="${step}" value="${s[k]}"><b id="sv_${k}">${fmt(s[k])}</b>`;
    this.settingsBack = back;
    this.open(this.frame('SETTINGS', `<div class="set"><h3>GRAPHICS</h3>
      <label>Quality preset</label><select data-set="quality">${['low', 'medium', 'high', 'ultra'].map((q) => `<option ${s.quality === q ? 'selected' : ''}>${q}</option>`).join('')}</select><b></b>
      <label>Resolution scale</label>${sl('scale', 0.5, 1.5, 0.05, (v) => `${(v * 100).toFixed(0)}% → ${Math.round(innerWidth * G.pixelRatio())}×${Math.round(innerHeight * G.pixelRatio())}`)}
      <label>Field of view</label>${sl('fov', 60, 100, 1, (v) => v + '°')}
      <label>Shadows</label><input type="checkbox" data-set="shadows" ${s.shadows ? 'checked' : ''}><b></b>
      <label>Ambient occlusion (GTAO · High/Ultra)</label><input type="checkbox" data-set="ssao" ${s.ssao ? 'checked' : ''}><b>experimental</b>
      <label>Frame limit</label><select data-set="fpsCap">${[[0, 'Unlimited (v-sync)'], [30, '30'], [60, '60'], [120, '120']].map(([v, t]) => `<option value="${v}" ${+s.fpsCap === v ? 'selected' : ''}>${t}</option>`).join('')}</select><b></b>
      <label>Show performance counter</label><input type="checkbox" data-set="showFps" ${s.showFps ? 'checked' : ''}><b></b>
      <h3>CONTROLS</h3><label>Mouse sensitivity</label>${sl('sens', 0.2, 3, 0.05, (v) => v.toFixed(2))}<label>Invert Y</label><input type="checkbox" data-set="invertY" ${s.invertY ? 'checked' : ''}><b></b>
      <h3>AUDIO</h3><label>Master volume</label>${sl('volume', 0, 1, 0.05, (v) => (v * 100).toFixed(0) + '%')}<label>Radio voice (speech synthesis)</label><input type="checkbox" data-set="voice" ${s.voice ? 'checked' : ''}><b></b></div>
      <h3>KEY BINDINGS</h3><div class="keys">${KEYS.map(([k, d]) => `<div><kbd>${k}</kbd>${d}</div>`).join('')}</div>`, back));
  }
  setting(k, v, el) {
    const s = G.settings; s[k] = k === 'fpsCap' ? +v : v; storeSave(G.save); G.applySettings();
    const out = document.getElementById('sv_' + k); if (out) out.textContent = k === 'scale' ? `${(v * 100).toFixed(0)}% → ${Math.round(innerWidth * G.pixelRatio())}×${Math.round(innerHeight * G.pixelRatio())}` : k === 'fov' ? v + '°' : k === 'sens' ? v.toFixed(2) : (v * 100).toFixed(0) + '%';
  }
  multiplayer() {
    this.open(this.frame('MULTIPLAYER — PLANNED EXPANSION', `<p class="lead"><b>Not playable in this build.</b> The campaign is single-player. This screen documents what the code base is prepared for; nothing here is a working online mode.</p>
      <table class="tbl"><tr><th>MODE</th><th>STATUS</th><th>NOTES</th></tr><tr><td>5 v 5 Tactical</td><td>Design only</td><td>Round-based, no respawn, plant / defuse on the base map</td></tr><tr><td>10 v 10 Team Deathmatch</td><td>Design only</td><td>Airfield & port</td></tr><tr><td>Co-op Infiltration (4 players)</td><td>Design only</td><td>Campaign missions with squad slots replaced by players</td></tr><tr><td>Survival</td><td>Design only</td><td>Reuses the wave spawner from Missions 04 / 05</td></tr><tr><td>Ranking · matchmaking · customisation</td><td>Not started</td><td>Requires backend services</td></tr></table>
      <h3>WHAT ALREADY SUPPORTS IT</h3><ul class="plain"><li>Damage, ballistics and AI run in systems separate from input and rendering — they can move to an authoritative server unchanged.</li><li>Every shot is a simulated projectile with an owner id, so server-side hit validation and lag-compensated rewind have a single entry point (<code>FX.fire</code>).</li><li>Weapon balance is pure data (<code>config/weapons.js</code>) shared by client and tests.</li></ul><p class="note">See docs/TECHNICAL.md §8 and docs/UE5_ARCHITECTURE.md for the network design (server authority, lag compensation, anti-cheat).</p>`));
  }
  exit() { this.open(`<div class="panel small"><h2>EXIT GAME</h2><p>Progress is saved automatically.</p><div class="actions"><button class="primary" data-a="exitYes">EXIT</button><button data-a="main">CANCEL</button></div></div>`); }
  pause() { const m = G.mission; this.open(`<div class="panel small"><h2>PAUSED</h2><p>${m.def.code} — ${m.def.name}<br><small>${m.objText()}</small></p><div class="col"><button class="primary" data-a="resume">RESUME</button><button data-a="restart">RESTART FROM CHECKPOINT</button><button data-a="restartMission">RESTART MISSION</button><button data-a="settings" data-v="pauseBack">SETTINGS</button><button data-a="quit">ABORT TO MAIN MENU</button></div></div>`, 'dim'); }
  death(kind) { this.open(`<div class="panel small kia"><h2>K.I.A.</h2><p>${{ bullet: 'You were shot.', explosion: 'You were killed by an explosion.', fall: 'You fell.' }[kind] || 'You were killed.'} SQUAD 07 falls back to the last checkpoint.</p><div class="col"><button class="primary" data-a="restart">RESTART FROM CHECKPOINT</button><button data-a="restartMission">RESTART MISSION</button><button data-a="quit">ABORT TO MAIN MENU</button></div></div>`, 'red'); }
  result(r) {
    this.open(`<div class="panel"><header><h2>AFTER-ACTION REPORT — ${r.code} ${r.name}</h2></header><div class="body"><div class="result"><div class="grade g${r.grade}">${r.grade}</div><table class="tbl"><tr><td>Mission time</td><td>${fmtTime(r.time)}</td></tr><tr><td>Hostiles neutralised</td><td>${r.kills}</td></tr><tr><td>Headshots</td><td>${r.headshots}</td></tr><tr><td>Accuracy</td><td>${r.acc}% (${r.hits}/${r.shots})</td></tr><tr><td>Alarms raised</td><td>${r.alarms}</td></tr><tr><td>Times KIA</td><td>${r.deaths}</td></tr><tr><td>Score</td><td>${r.score}</td></tr></table></div>
      ${r.unlocks.length ? `<h3>UNLOCKED</h3><div class="unl">${r.unlocks.map((u) => `<span>${u}</span>`).join('')}</div>` : ''}
      <div class="actions"><button class="primary" data-a="next">${r.last ? 'CONTINUE' : 'NEXT MISSION ▸'}</button><button data-a="weapons">ARMORY</button><button data-a="main">MAIN MENU</button></div></div></div>`, 'dim');
  }
  credits() { this.open(`<div class="panel small"><h2>OPERATION COMPLETE</h2><p>The BLACK COBRA facility is neutralised and the bio-sample is in friendly hands. SQUAD 07 is going home.</p><p class="note">SPECIAL SOLDIER — playable prototype. Every model, texture and sound in this build is generated in code and stands in for production assets (see docs/ASSET_LIST.md).</p><div class="col"><button class="primary" data-a="campaign">REPLAY MISSIONS</button><button data-a="main">MAIN MENU</button></div></div>`, 'dim'); }
}
