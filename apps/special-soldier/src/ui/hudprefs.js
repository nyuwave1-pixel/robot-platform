// HUD visibility settings (genre convention: each element Always / Contextual / Hidden, plus presets).
// Contextual = only while it matters: ammo while firing / reloading / low, health while hurt, objective for a few
// seconds after it changes, stealth meter while anyone is suspicious. Stored in G.settings.hud.
import { G } from '../core/ctx.js';

export const HUD_ITEMS = [
  // key, label, element ids, allowed modes
  ['minimap', 'Minimap', ['mini', 'miniInfo'], ['always', 'hidden']],
  ['objective', 'Objective & waypoint', ['objPanel', 'wp'], ['always', 'context', 'hidden']],
  ['ammo', 'Weapon & ammo', ['ammo', 'slots', 'gearRow'], ['always', 'context', 'hidden']],
  ['vitals', 'Health & armour', ['vitals'], ['always', 'context', 'hidden']],
  ['crosshair', 'Crosshair', ['cross'], ['always', 'hidden']],
  ['hitmarkers', 'Hit markers', ['hitm'], ['always', 'hidden']],
  ['stealth', 'Stealth meter', ['aware'], ['always', 'context', 'hidden']],
  ['squad', 'Squad status', ['squad'], ['always', 'hidden']],
];
export const HUD_PRESETS = {
  standard: { minimap: 'always', objective: 'always', ammo: 'always', vitals: 'always', crosshair: 'always', hitmarkers: 'always', stealth: 'always', squad: 'always' },
  minimal: { minimap: 'always', objective: 'context', ammo: 'context', vitals: 'context', crosshair: 'always', hitmarkers: 'always', stealth: 'context', squad: 'hidden' },
  hardcore: { minimap: 'hidden', objective: 'context', ammo: 'hidden', vitals: 'hidden', crosshair: 'hidden', hitmarkers: 'hidden', stealth: 'hidden', squad: 'hidden' },
};
const MODE_LABEL = { always: 'Always', context: 'Contextual', hidden: 'Hidden' };
export const hudPrefs = () => ({ ...HUD_PRESETS.standard, ...((G.settings && G.settings.hud) || {}) });
export function presetOf(p) { for (const [k, v] of Object.entries(HUD_PRESETS)) if (Object.keys(v).every((i) => v[i] === p[i])) return k; return 'custom'; }

/** Settings-menu block (inserted into the SETTINGS screen). */
export function hudSettingsHtml() {
  const p = hudPrefs(), pre = presetOf(p);
  return `<h3>HUD</h3><label>Preset</label><select data-hudpreset>${['standard', 'minimal', 'hardcore', 'custom'].map((k) => `<option value="${k}" ${pre === k ? 'selected' : ''} ${k === 'custom' ? 'disabled' : ''}>${k}</option>`).join('')}</select><b>${pre === 'hardcore' ? 'no minimap, ammo, health or crosshair' : ''}</b>`
    + HUD_ITEMS.map(([k, label, , modes]) => `<label>${label}</label><select data-hud="${k}">${modes.map((m) => `<option value="${m}" ${p[k] === m ? 'selected' : ''}>${MODE_LABEL[m]}</option>`).join('')}</select><b></b>`).join('');
}
function save(p) { G.settings.hud = p; import('../core/save.js').then(({ storeSave }) => storeSave(G.save)); }
/** Wire the selects once (the menu re-renders its HTML, so listen on the menu root). */
export function bindHudSettings(menuEl) {
  menuEl.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.hudpreset !== undefined && HUD_PRESETS[t.value]) { save({ ...HUD_PRESETS[t.value] }); if (G.menu.settings) G.menu.settings(G.menu.settingsBack || 'main'); }
    else if (t.dataset.hud) { const p = hudPrefs(); p[t.dataset.hud] = t.value; save(p); const sel = menuEl.querySelector('[data-hudpreset]'); if (sel) sel.value = presetOf(p); }
  });
}

let lastObj = '', objT = -99;
/** Called every HUD frame: shows / hides each element by its setting and the current context. */
export function applyHudPrefs() {
  const p = hudPrefs(), t = G.time, P = G.player, W = G.weapons, $ = (id) => document.getElementById(id);
  const objNow = ($('objText') || {}).textContent || ''; if (objNow !== lastObj) { lastObj = objNow; objT = t; }
  const slot = W && W.slot, low = slot && slot.mag <= Math.ceil(slot.w.mag * 0.3);
  const ctx = {
    objective: t - objT < 6,
    ammo: !!W && (t - W.lastShot < 3 || W.reloading || W.switchT > 0 || low),
    vitals: !!P && (P.health < 100 || (P.armor < 100 && !(G.mp && G.mp.active)) || t - P.lastHurt < 4),
    stealth: !!G.enemies && (G.enemies.maxDetect > 0.02 || G.enemies.inCombat > 0),
  };
  for (const [k, , ids] of HUD_ITEMS) {
    const m = p[k], show = m === 'always' || (m === 'context' && ctx[k]);
    for (const id of ids) { const el = $(id); if (el) el.classList.toggle('hudOff', !show); }
  }
}
