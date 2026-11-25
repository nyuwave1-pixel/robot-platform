// Interface language (English / 한국어). The game's text stays English in the code; when Korean is selected,
// every text node shown in the menu, HUD, cinematics and multiplayer / door-gun overlays is looked up in
// src/config/i18n-ko.js (exact English → Korean, then a few patterns for text with numbers). Originals are kept,
// so switching back to English restores them. Missing entries simply stay English.
import { G } from '../core/ctx.js';
import { KO, KO_RULES, setInner } from '../config/i18n-ko.js';

export const LANGS = [['en', 'English'], ['ko', '한국어']];
const orig = new WeakMap(); // text node → English original
const KOSET = new Set(Object.values(KO));
export const lang = () => (G.settings && G.settings.lang) || 'en';

/** Translate one English string (whole-string match, then patterns, then objective parts). */
export function tr(s) {
  if (lang() !== 'ko' || !s) return s;
  const t = s.trim(); if (!t || KOSET.has(t)) return s;
  const pre = s.slice(0, s.indexOf(t)), post = s.slice(s.indexOf(t) + t.length), wrap = (x) => pre + x + post;
  if (KO[t]) return wrap(KO[t]);
  // objective with tasks: "Two tasks — any order: ○ A (8)   ✓ B"
  const c = t.match(/^(.+?): ((?:[✓○] .+?)(?: {3}[✓○] .+?)*)$/);
  if (c) return wrap(`${KO[c[1]] || c[1]}: ` + c[2].split('   ').map((p) => { const m = p.match(/^([✓○]) (.+?)(?: \((\d+)\))?$/); return m ? `${m[1]} ${KO[m[2]] || m[2]}${m[3] ? ` (${m[3]})` : ''}` : p; }).join('   '));
  const d = t.match(/^(.+) — (\d+:\d\d)$/); if (d && KO[d[1]]) return wrap(`${KO[d[1]]} — ${d[2]}`);
  for (const [re, rep] of KO_RULES) { if (!rep) continue; const m = t.match(re); if (!m) continue; const out = typeof rep === 'function' ? rep(...m) : t.replace(re, rep); if (out) return wrap(out); }
  return s;
}
setInner((s) => { const x = tr(s); return x === s && KO[s] ? KO[s] : x; });

function fixNode(n) {
  const cur = n.nodeValue; if (!cur || !/[A-Za-z]/.test(cur) && !orig.has(n)) return;
  if (lang() === 'ko') {
    const base = orig.has(n) && n.nodeValue === orig.get(n).out ? orig.get(n).en : cur;
    const out = tr(base); if (out !== base) { orig.set(n, { en: base, out }); if (n.nodeValue !== out) n.nodeValue = out; }
  } else if (orig.has(n)) { const o = orig.get(n); if (n.nodeValue === o.out) n.nodeValue = o.en; orig.delete(n); }
}
function fixAttrs(el) { for (const a of ['placeholder', 'title']) { const v = el.getAttribute && el.getAttribute(a); if (v && lang() === 'ko' && KO[v]) { el.dataset['en' + a] = v; el.setAttribute(a, KO[v]); } else if (lang() !== 'ko' && el.dataset && el.dataset['en' + a]) el.setAttribute(a, el.dataset['en' + a]); } }
export function translateTree(root) {
  if (!root) return; const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) fixNode(n);
  if (root.querySelectorAll) for (const el of root.querySelectorAll('[placeholder],[title]')) fixAttrs(el);
}
let obs = null, busy = false;
const ROOTS = ['menu', 'hud', 'cine', 'lockHint', 'mpHud', 'gunnerHud', 'loading'];
/** Start translating (called once at boot) and whenever the language changes. */
export function applyLanguage() {
  document.documentElement.lang = lang();
  for (const id of ROOTS) translateTree(document.getElementById(id));
  if (obs) return;
  obs = new MutationObserver((list) => {
    if (busy || (lang() !== 'ko')) return; busy = true;
    try { for (const m of list) { if (m.type === 'characterData') fixNode(m.target); else for (const a of m.addedNodes) { if (a.nodeType === 3) fixNode(a); else if (a.nodeType === 1) translateTree(a); } } } finally { busy = false; }
  });
  const watch = () => { for (const id of ROOTS) { const el = document.getElementById(id); if (el && !el.dataset.i18n) { el.dataset.i18n = '1'; obs.observe(el, { childList: true, subtree: true, characterData: true }); } } };
  watch(); setInterval(watch, 2000); // overlays created later (multiplayer, door gun) join on their own
}
/** Pick the default once: Korean when the browser is Korean, otherwise English. */
export function initLanguage() {
  if (!G.settings.lang) G.settings.lang = (navigator.language || '').toLowerCase().startsWith('ko') ? 'ko' : 'en';
  applyLanguage();
}
