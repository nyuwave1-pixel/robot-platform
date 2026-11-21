// Live tuning panel (F2, or ?tune in the URL): a slider for every balance value of the equipped weapon plus
// global multipliers. Values change the running game immediately; "Copy JSON" exports what was changed so it
// can be pasted back into config/weapons.js. Development tool — not part of the player-facing UI.
import { G } from '../core/ctx.js';
import { burstDps, effectiveDps } from '../config/weapons.js';

export const TUNE = { enemyAcc: 1, enemyDetect: 1, enemyDmg: 1, moveSpeed: 1 };
const GLOBAL = [['enemyAcc', 'Enemy spread ×', 0.3, 3, 0.05], ['enemyDetect', 'Enemy sight range ×', 0.3, 2, 0.05], ['enemyDmg', 'Damage taken ×', 0, 3, 0.05], ['moveSpeed', 'Move speed ×', 0.5, 2, 0.05]];
const WEAPON = [['dmg', 'Damage', 1, 250, 1], ['rpm', 'Fire rate (rpm)', 30, 1200, 10], ['recoilV', 'Recoil vertical °', 0, 8, 0.05], ['recoilH', 'Recoil horizontal °', 0, 3, 0.05], ['spread', 'Hip spread °', 0, 8, 0.1], ['adsSpread', 'ADS spread °', 0, 4, 0.01], ['mag', 'Magazine', 1, 200, 1], ['reload', 'Reload s', 0.3, 8, 0.1], ['ads', 'ADS time s', 0.05, 0.8, 0.01], ['vel', 'Muzzle velocity m/s', 40, 1200, 10], ['weight', 'Weight kg', 0.5, 12, 0.1]];

export class TunePanel {
  constructor() {
    this.el = document.createElement('div'); this.el.id = 'tune'; document.body.appendChild(this.el); this.open = false; this.changed = {}; this.id = '';
    this.el.addEventListener('input', (e) => { const t = e.target, k = t.dataset.k, v = +t.value; if (t.dataset.g) TUNE[k] = v; else { const s = G.weapons.slot; s.w[k] = v; (this.changed[s.id] ||= {})[k] = v; if (k === 'mag') s.mag = Math.min(s.mag, v); } t.nextElementSibling.textContent = v; this.summary(); });
    this.el.addEventListener('click', (e) => { if (e.target.dataset.copy === undefined) return; const out = JSON.stringify({ weapons: this.changed, global: TUNE }, null, 2); console.log(out); if (navigator.clipboard) navigator.clipboard.writeText(out).catch(() => {}); e.target.textContent = 'COPIED (also in console)'; });
    addEventListener('keydown', (e) => { if (e.code === 'F2') { e.preventDefault(); this.toggle(); } });
    if (new URLSearchParams(location.search).has('tune')) this.toggle();
  }
  toggle() { this.open = !this.open; this.el.classList.toggle('on', this.open); if (this.open) { this.render(); if (G.state === 'playing') G.input.unlock(); } }
  row(k, label, min, max, step, v, g) { return `<label>${label}</label><input type="range" data-k="${k}" ${g ? 'data-g="1"' : ''} min="${min}" max="${max}" step="${step}" value="${v}"><b>${v}</b>`; }
  render() {
    const s = G.weapons.slots.length ? G.weapons.slot : null; this.id = s ? s.id : '';
    this.el.innerHTML = `<h3>TUNING — F2 to close</h3><div class="g">${GLOBAL.map(([k, l, a, b, st]) => this.row(k, l, a, b, st, TUNE[k], true)).join('')}</div>` + (s ? `<h3>${s.w.name}</h3><div class="g">${WEAPON.map(([k, l, a, b, st]) => this.row(k, l, a, b, st, s.w[k])).join('')}</div><p id="tuneSum"></p>` : '<p>Start a mission to tune the equipped weapon.</p>') + '<button data-copy>COPY JSON</button>';
    this.summary();
  }
  summary() { const el = document.getElementById('tuneSum'), s = G.weapons.slots.length ? G.weapons.slot : null; if (el && s) el.textContent = `Burst DPS ${burstDps(s.w).toFixed(0)} · field DPS @40 m ${effectiveDps(s.w, 40).toFixed(0)}`; }
  update() { if (this.open && G.weapons.slots.length && G.weapons.slot.id !== this.id) this.render(); }
}
