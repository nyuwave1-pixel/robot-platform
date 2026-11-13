// Persistent profile + settings (localStorage). UE5 equivalent: SaveGame object + GameUserSettings.
const KEY = 'special-soldier-save-v1';
export const DEFAULT_SETTINGS = { quality: 'high', scale: 1, fov: 78, sens: 1, volume: 0.7, shadows: true, fpsCap: 0, invertY: false, voice: true, difficulty: 'regular', showFps: true, ssao: false };
export const DIFFICULTY = {
  recruit: { label: 'RECRUIT', detect: 0.7, react: 1.5, acc: 1.6, dmg: 0.6 },
  regular: { label: 'REGULAR', detect: 1.0, react: 1.0, acc: 1.0, dmg: 1.0 },
  veteran: { label: 'VETERAN', detect: 1.3, react: 0.65, acc: 0.7, dmg: 1.45 },
};
export function loadSave() {
  let s = {}; try { s = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { s = {}; }
  return { callsign: 'GHOST 0-7', progress: 0, loadout: { primary: 'm4', secondary: 'smg', sidearm: 'pistol' }, best: {}, stats: { kills: 0, headshots: 0, shots: 0, hits: 0, deaths: 0, time: 0 }, ...s, settings: { ...DEFAULT_SETTINGS, ...(s.settings || {}) } };
}
export function storeSave(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage unavailable */ } }
export function resetSave() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }
