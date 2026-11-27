// ROGUE LEGENDS — browser side (DOM + CSS + Web Audio). The rules are in ./logic.js; this file only draws the state and turns
// clicks / keys into actions. The run is saved as its action list (localStorage) and replayed on load — the same list is the
// replay proof the portals check with ./verify.js. Keys: 1–9 play a card · Tab next target · E end turn · D deck · Esc cancel.
import { newRun, apply, legal, choices, cardDef, HEROES, RELICS, EVENT_TEXT, ENEMIES, FLOORS, encode, decode, grade } from './logic.js';
import { LEVELS } from './levels.js';
import { ENEMY_ART, HERO_ART, CARD_ICON, cardIcon, RELIC_ICON, NODE_ICON, ST_LABEL } from './art.js';
import { createPortal } from './portal.js';

const $ = (s) => document.querySelector(s);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const store = { get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } } };
const SAVE = 'rogue-legends.run', BEST = 'rogue-legends.best';
const portal = createPortal('rogue-legends'); portal.ready();

let S = null, run = null, armed = -1, target = 0, overlay = null, started = 0, reported = false;
let pickHero = 'warden', pickLevel = 0;

// ------------------------------------------------------------ audio (tiny synth, no files)
let ac = null;
function sfx(kind) {
  try {
    ac = ac || new AudioContext(); const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    const P = { hit: [140, 60, 'square', 0.12, 0.12], block: [520, 380, 'triangle', 0.1, 0.1], card: [660, 880, 'sine', 0.06, 0.08], win: [440, 880, 'triangle', 0.12, 0.5], die: [200, 50, 'sawtooth', 0.12, 0.6], burn: [300, 120, 'sawtooth', 0.06, 0.15] }[kind];
    if (!P) return; o.type = P[2]; o.frequency.setValueAtTime(P[0], t); o.frequency.exponentialRampToValueAtTime(P[1], t + P[4]);
    g.gain.setValueAtTime(P[3], t); g.gain.exponentialRampToValueAtTime(0.0001, t + P[4]); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + P[4]);
  } catch { /* no audio */ }
}

// ------------------------------------------------------------ run lifecycle
function startRun(hero, levelIdx, fixedSeed = null) {
  const L = LEVELS.find((l) => l.hero === hero && l.level === levelIdx);
  const seed = fixedSeed != null ? fixedSeed >>> 0 : (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
  run = { seed, hero, level: levelIdx, li: LEVELS.indexOf(L), tokens: [] };
  S = newRun({ seed, hero, level: levelIdx }); started = Date.now(); reported = false; armed = -1; target = 0;
  store.set(SAVE, run); portal.levelStart(run.li + 1); render();
}
function resume() {
  const r = store.get(SAVE); if (!r) return false;
  try { const s = newRun({ seed: r.seed, hero: r.hero, level: r.level }); for (const t of r.tokens) apply(s, decode(t)); run = r; S = s; started = Date.now(); reported = !!s.result; return true; }
  catch { store.set(SAVE, null); return false; }
}

function act(a) {
  if (!S || S.result) return;
  const beforeHp = S.combat ? S.combat.P.hp : S.hp;
  try { apply(S, a); } catch (e) { toast('할 수 없는 행동입니다'); console.warn(e.message); return; }
  run.tokens.push(encode(a)); store.set(SAVE, run);
  if (a.a === 'play') sfx('card');
  armed = -1;
  if (S.combat && target >= S.combat.enemies.length) target = 0;
  if (S.combat && S.combat.enemies[target]?.hp <= 0) target = S.combat.enemies.findIndex((e) => e.hp > 0);
  render();
  if (S.combat) showFx(S.combat.fx, beforeHp);
  if (S.result) finishRun();
}

function finishRun() {
  if (reported) return; reported = true;
  const g = grade(S), r = S.result;
  const best = store.get(BEST) || {}, key = `${run.hero}-${run.level}`;
  if (!best[key] || r.score > best[key].score) { best[key] = { score: r.score, won: r.won, grade: g }; store.set(BEST, best); r.newBest = true; }
  r.rp = portal.result({ level: run.li + 1, score: r.score, grade: g, mode: `${run.hero.toUpperCase()} L${run.level}`, seconds: Math.round((Date.now() - started) / 1000),
    stars: { S: 3, A: 2, B: 1 }[g] || 0, proof: { seed: run.seed, actions: run.tokens.join(',') }, clear: r.won });
  sfx(r.won ? 'win' : 'die');
  render();
}

// ------------------------------------------------------------ rendering
function render() {
  const top = $('#top'), scr = $('#screen');
  if (!S) { top.hidden = true; scr.innerHTML = titleHtml(); bindTitle(); closeOverlay(); return; }
  top.hidden = false; top.innerHTML = topHtml();
  top.querySelector('[data-deck]').onclick = () => showDeck();
  top.querySelector('[data-quit]').onclick = () => { if (S.result || confirm('이번 원정을 포기하고 처음 화면으로 갈까요?')) { store.set(SAVE, null); S = null; render(); } };
  closeOverlay();
  if (S.phase === 'map') { scr.innerHTML = mapHtml(); bindMap(); }
  else if (S.phase === 'combat') { scr.innerHTML = combatHtml(); bindCombat(); }
  else { if (!['reward', 'rest', 'shop', 'event', 'pick', 'victory', 'defeat'].includes(S.phase)) return; scr.innerHTML = mapHtml(); openPanel(); }
}

function titleHtml() {
  const saved = store.get(SAVE), best = store.get(BEST) || {};
  const hero = (id) => { const H = HEROES[id]; return `<button class="heroCard ${pickHero === id ? 'sel' : ''}" data-hero="${id}" style="--hc:${H.color}">
      ${HERO_ART[id]()}<h3>${H.name}</h3><p>${esc(H.title)} · 체력 ${H.hp}</p>
      <p>${id === 'warden' ? '방어를 쌓고 그 방어로 친다. 힘·가시·판금으로 버티며 밀어붙이는 전사.' : '적을 불태우고(화상) 한 번에 터뜨린다. 카드를 많이 뽑고 에너지를 끌어 쓰는 마도사.'}</p>
      <p style="color:var(--ink3)">최고 기록 ${[0, 1, 2].map((l) => best[`${id}-${l}`] ? `L${l} ${best[`${id}-${l}`].score}` : '').filter(Boolean).join(' · ') || '없음'}</p></button>`; };
  return `<div class="title"><div>
    <h1>ROGUE LEGENDS</h1><div class="sub">DECKBUILDING ROGUELIKE</div>
    <div class="heroes">${hero('warden')}${hero('arcanist')}</div>
    <div class="levels">${[0, 1, 2].map((l) => `<button class="btn ${pickLevel === l ? 'sel' : ''}" data-level="${l}">난이도 ${l}${l ? ` (+${l * 8}% 체력·+${l} 피해)` : ' (기본)'}</button>`).join('')}</div>
    <div class="row"><button class="btn primary" data-start>원정 시작</button>${saved && !saved.done ? '<button class="btn" data-resume>이어 하기</button>' : ''}</div>
    <p class="note">13층의 탑을 올라 잿불 거상을 쓰러뜨리세요 · 카드 숫자키 1–9 · Tab 대상 · E 턴 종료 · D 덱 보기<br/>모든 원정은 행동 기록으로 저장되고, 같은 기록으로 결과를 다시 계산해 확인할 수 있습니다.</p>
  </div></div>`;
}
function bindTitle() {
  document.querySelectorAll('[data-hero]').forEach((b) => (b.onclick = () => { pickHero = b.dataset.hero; render(); }));
  document.querySelectorAll('[data-level]').forEach((b) => (b.onclick = () => { pickLevel = +b.dataset.level; render(); }));
  $('[data-start]').onclick = () => startRun(pickHero, pickLevel);
  const r = $('[data-resume]'); if (r) r.onclick = () => { if (resume()) render(); };
}

function topHtml() {
  const H = HEROES[S.hero], hp = S.combat ? S.combat.P.hp : S.hp;
  return `<span class="hero" style="color:${H.color}">${H.name}</span>
    <span class="stat">❤️ <b>${Math.max(0, hp)}/${S.maxHp}</b></span><span class="stat">🪙 <b>${S.gold}</b></span>
    <span class="stat">층 <b>${Math.max(1, S.floor + 1)}/${FLOORS}</b></span><span class="stat">난이도 <b>${S.level}</b></span>
    <span class="relics">${S.relics.map((r) => `<span class="relic" data-tip="${esc(RELICS[r].name)}\n${esc(RELICS[r].text)}">${RELIC_ICON[r]}</span>`).join('')}</span>
    <span class="grow"></span><button class="btn" data-deck>덱 ${S.deck.length}</button><button class="btn danger" data-quit>${S.result ? '처음으로' : '포기'}</button>`;
}

// map
function walked() { return run.tokens.filter((t) => t[0] === 'g').map((t) => t.slice(1)); }
function mapHtml() {
  const rows = FLOORS - 1, W = 7, cx = (x) => 50 + x * 76, cy = (f) => 40 + (rows - f) * 70;
  const pos = (k) => (k === 'boss' ? [cx(3), 40 - 10] : [cx(S.map[k].x), cy(S.map[k].f)]);
  const path = walked(), can = new Set(choices(S)); let edges = '', nodes = '';
  for (const [k, n] of Object.entries(S.map)) for (const nk of n.next) {
    const [x1, y1] = pos(k), [x2, y2] = pos(nk), w = path.includes(k) && path.includes(nk) && path.indexOf(nk) === path.indexOf(k) + 1;
    edges += `<line class="medge ${w ? 'walked' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }
  for (const [k, n] of Object.entries(S.map)) {
    const [x, y] = pos(k), r = k === 'boss' ? 30 : 22;
    nodes += `<g class="mnode ${can.has(k) ? 'can' : ''} ${path.includes(k) ? 'done' : ''} ${S.node === k ? 'here' : ''}" data-node="${k}">
      <circle cx="${x}" cy="${y}" r="${r}"/><text x="${x}" y="${y}">${NODE_ICON[n.type]}</text></g>`;
  }
  return `<div class="mapWrap"><svg viewBox="0 0 ${50 * 2 + (W - 1) * 76} ${cy(0) + 50}">${edges}${nodes}</svg></div>
    <div class="legend">⚔️ 전투 · 💀 정예 · 🔥 모닥불 · 🪙 상점<br/>❔ 사건 · 🎁 보물 · 👑 보스 — 빛나는 칸으로 이동</div>`;
}
function bindMap() {
  document.querySelectorAll('.mnode.can').forEach((g) => (g.onclick = () => act({ a: 'go', k: g.dataset.node })));
  const here = document.querySelector('.mnode.can') || document.querySelector('.mnode.here');
  if (here) here.scrollIntoView({ block: 'center' });
}

// combat
function intentOf(e) {
  const m = e.intent; if (!m) return '';
  if (m.t === 'atk' || m.t === 'atkdeb') {
    let d = m.n + S.level + (S.floor >> 2) + (e.st.str || 0); if (e.st.weak) d = Math.floor(d * 0.75); if (S.combat.P.st.vuln) d = Math.floor(d * 1.5);
    return `<div class="intent atk" data-tip="공격${m.hits ? ` ${m.hits}회` : ''}${m.st ? ` + ${ST_LABEL[m.st]} ${m.k}` : ''}">⚔️ ${Math.max(0, d)}${m.hits ? `×${m.hits}` : ''}${m.st ? ' ✦' : ''}</div>`;
  }
  if (m.t === 'def') return `<div class="intent def" data-tip="방어 ${m.n}">🛡️ ${m.n}</div>`;
  if (m.t === 'buff') return `<div class="intent buff" data-tip="${ST_LABEL[m.st]} +${m.n}">⬆️ ${ST_LABEL[m.st]}</div>`;
  return `<div class="intent debuff" data-tip="당신에게 ${ST_LABEL[m.st]} ${m.n}">🌀 ${ST_LABEL[m.st]}</div>`;
}
const stsHtml = (o) => Object.entries(o.st).map(([k, v]) => `<span class="st" data-tip="${ST_TIP[k] || ''}">${ST_LABEL[k] || k} ${v}</span>`).join('');
const ST_TIP = { str: '공격 피해 +1씩', dex: '방어 +1씩', vuln: '받는 피해 +50%', weak: '주는 피해 −25%', burn: '내 턴이 끝날 때 그만큼 피해, 절반으로 줄어듦', rot: '자기 턴 시작에 피해, 1씩 줄어듦', thorns: '공격한 상대에게 반사 피해', plate: '매 턴 시작에 방어', kindle: '매 턴 모든 적 화상', insight: '매 턴 카드 추가' };
const bar = (o) => `<div class="bar"><i style="width:${Math.max(0, (100 * o.hp) / o.maxHp)}%"></i><span>${Math.max(0, o.hp)} / ${o.maxHp}</span></div>`;

function cardHtml(id, i = -1, opts = {}) {
  const d = cardDef(id), H = d.hero ? HEROES[d.hero].color : '#9aa3ad';
  const off = opts.off ? 'off' : '', type = { attack: '공격', skill: '기술', power: '능력' }[d.type];
  return `<div class="card ${off} ${d.upgraded ? 'up' : ''} ${armed === i && i >= 0 ? 'armed' : ''}" style="--cc:${H}" ${i >= 0 ? `data-card="${i}"` : ''} ${opts.attr || ''}>
    <div class="cost">${d.cost}</div><div class="cname">${esc(d.name)}</div><div class="cart">${CARD_ICON[cardIcon(d)](H)}</div>
    <div class="ctype">${type}${d.exhaust ? ' · 소멸' : ''}</div><div class="ctext">${esc(d.text)}</div>${i >= 0 && i < 9 ? `<span class="key">${i + 1}</span>` : ''}</div>`;
}

function combatHtml() {
  const c = S.combat, P = c.P;
  const enemies = c.enemies.map((e, i) => `<div class="unit enemy ${e.hp <= 0 ? 'dead' : ''} ${i === target ? 'target' : ''}" data-enemy="${i}" id="u-${e.id}">
      ${intentOf(e)}${e.block ? `<div class="blockPip"><b>${e.block}</b></div>` : ''}${ENEMY_ART[ENEMIES[e.kind].art]()}
      <div class="name">${esc(e.name)}${ENEMIES[e.kind].elite ? ' · 정예' : ENEMIES[e.kind].boss ? ' · 보스' : ''}</div>${bar(e)}<div class="sts">${stsHtml(e)}</div></div>`).join('');
  const hand = c.hand.map((id, i) => cardHtml(id, i, { off: cardDef(id).cost > c.energy })).join('');
  return `<div class="combat">
    <div class="field">
      <div class="unit" id="u-p">${P.block ? `<div class="blockPip"><b>${P.block}</b></div>` : ''}${HERO_ART[S.hero]()}<div class="name">${HEROES[S.hero].name}</div>${bar({ hp: P.hp, maxHp: S.maxHp })}<div class="sts">${stsHtml(P)}</div></div>
      <div style="display:flex;gap:3vw">${enemies}</div>
    </div>
    ${armed >= 0 ? '<div class="hint">대상을 고르세요 (클릭 · Tab 후 같은 숫자키) · Esc 취소</div>' : ''}
    <div class="dock">
      <div class="pile"><div class="energy" title="에너지">${c.energy}</div>뽑을 카드 <b>${c.draw.length}</b></div>
      <div class="hand">${hand}</div>
      <div class="pile"><button class="btn primary endTurn" data-end>턴 종료 (E)</button>버린 카드 <b>${c.discard.length}</b>${c.exhaust.length ? `<br/>소멸 ${c.exhaust.length}` : ''}</div>
    </div></div>`;
}
function bindCombat() {
  document.querySelectorAll('[data-card]').forEach((el) => (el.onclick = () => playCard(+el.dataset.card)));
  document.querySelectorAll('[data-enemy]').forEach((el) => (el.onclick = () => { target = +el.dataset.enemy; if (armed >= 0) playCard(armed, true); else render(); }));
  $('[data-end]').onclick = () => act({ a: 'end' });
}
function playCard(i, confirmTarget = false) {
  const c = S.combat, id = c.hand[i]; if (id == null) return;
  const d = cardDef(id); if (d.cost > c.energy) { toast('에너지가 부족합니다'); return; }
  if (d.target !== 'enemy') { act({ a: 'play', i, t: -1 }); return; }
  const live = c.enemies.map((e, k) => (e.hp > 0 ? k : -1)).filter((k) => k >= 0);
  if (live.length === 1) { act({ a: 'play', i, t: live[0] }); return; }
  if (confirmTarget || armed === i) { act({ a: 'play', i, t: live.includes(target) ? target : live[0] }); return; }
  armed = i; render();
}

function showFx(fx, beforeHp) {
  for (const f of fx) {
    const el = document.getElementById('u-' + f.who); if (!el) continue;
    const span = document.createElement('div');
    span.className = 'float ' + (f.burn ? 'burn' : f.rot ? 'rot' : f.n ? 'dmg' : 'blk');
    span.textContent = f.n ? `-${f.n}` : f.blocked ? `🛡 ${f.blocked}` : '0';
    el.appendChild(span); setTimeout(() => span.remove(), 900);
    if (f.n) { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
  }
  if (fx.some((f) => f.n && f.who !== 'p')) sfx(fx.some((f) => f.burn) ? 'burn' : 'hit');
  if (S.combat && S.combat.P.hp < beforeHp) sfx('hit'); else if (fx.some((f) => f.blocked && f.who === 'p')) sfx('block');
}

// panels
function closeOverlay() { const o = $('#overlay'); o.hidden = true; o.innerHTML = ''; overlay = null; }
function panel(html) { const o = $('#overlay'); o.hidden = false; o.innerHTML = `<div class="panel">${html}</div>`; overlay = o; return o; }
function openPanel() {
  if (S.phase === 'reward') {
    const R = S.reward;
    const o = panel(`<h2>${R.cards.length ? '승리!' : '보물'}</h2><p class="lead">${R.gold ? `골드 +${R.gold}` : ''}${R.relic ? ` · 유물: <b>${esc(RELICS[R.relic].name)}</b> — ${esc(RELICS[R.relic].text)}` : ''}</p>
      ${R.cards.length ? `<p class="lead">덱에 넣을 카드 1장을 고르세요.</p><div class="row">${R.cards.map((id, i) => cardHtml(id, -1, { attr: `data-take="${i}"` })).join('')}</div>` : ''}
      <div class="actions"><button class="btn" data-skip>${R.cards.length ? '건너뛰기' : '계속'}</button></div>`);
    o.querySelectorAll('[data-take]').forEach((el) => (el.onclick = () => act({ a: 'take', i: +el.dataset.take })));
    o.querySelector('[data-skip]').onclick = () => act({ a: 'skip' });
  } else if (S.phase === 'rest') {
    const o = panel(`<h2>모닥불</h2><p class="lead">잠시 숨을 돌립니다.</p><div class="opts">
      <button class="btn" data-o="heal">🔥 쉬기 — 체력 ${Math.round(S.maxHp * 0.3)} 회복</button><button class="btn" data-o="smith">⚒️ 벼리기 — 카드 1장 강화</button></div>`);
    o.querySelectorAll('[data-o]').forEach((el) => (el.onclick = () => act({ a: 'rest', o: el.dataset.o })));
  } else if (S.phase === 'shop') {
    const sh = S.shop;
    const o = panel(`<h2>떠돌이 상인</h2><p class="lead">가진 골드 ${S.gold}</p>
      <div class="row">${sh.cards.map((c, i) => (c ? `<div>${cardHtml(c.id, -1, { attr: `data-buy="${i}"`, off: S.gold < c.price })}<div class="price">🪙 ${c.price}</div></div>` : '')).join('')}</div>
      <div class="opts">${sh.relic ? `<button class="btn" data-buy="-1" ${S.gold < sh.relic.price ? 'disabled' : ''}>${RELIC_ICON[sh.relic.id]} ${esc(RELICS[sh.relic.id].name)} — ${esc(RELICS[sh.relic.id].text)} · 🪙 ${sh.relic.price}</button>` : ''}
      <button class="btn" data-remove ${sh.removed || S.gold < sh.removePrice || S.deck.length <= 5 ? 'disabled' : ''}>✂️ 카드 1장 제거 · 🪙 ${sh.removePrice}</button></div>
      <div class="actions"><button class="btn primary" data-leave>떠나기</button></div>`);
    o.querySelectorAll('[data-buy]').forEach((el) => (el.onclick = () => { const i = +el.dataset.buy; if (i >= 0 && S.gold < sh.cards[i].price) return toast('골드가 부족합니다'); act({ a: 'buy', i }); }));
    o.querySelector('[data-remove]').onclick = () => act({ a: 'remove' });
    o.querySelector('[data-leave]').onclick = () => act({ a: 'leave' });
  } else if (S.phase === 'event') {
    const E = EVENT_TEXT[S.event];
    const o = panel(`<h2>${esc(E.name)}</h2><p class="lead">${esc(E.text)}</p><div class="opts">${E.options.map((t, i) => `<button class="btn" data-opt="${i}" ${S.event === 'smith' && i === 1 && S.gold < 40 ? 'disabled' : ''}>${esc(t)}</button>`).join('')}</div>`);
    o.querySelectorAll('[data-opt]').forEach((el) => (el.onclick = () => act({ a: 'opt', i: +el.dataset.opt })));
  } else if (S.phase === 'pick') {
    const up = S.pickFor === 'upgrade', ok = new Set(legal(S).filter((x) => x.a === 'pick').map((x) => x.i));
    const o = panel(`<h2>${up ? '강화할 카드' : '제거할 카드'}</h2><p class="lead">${up ? '강화하면 수치가 오르거나 비용이 줄어듭니다.' : '덱이 얇을수록 좋은 카드를 자주 뽑습니다.'}</p>
      <div class="deckGrid">${S.deck.map((id, i) => cardHtml(id, -1, { attr: ok.has(i) ? `data-pick="${i}"` : '', off: !ok.has(i) })).join('')}</div>
      <div class="actions"><button class="btn" data-cancel>취소</button></div>`);
    o.querySelectorAll('[data-pick]').forEach((el) => (el.onclick = () => act({ a: 'pick', i: +el.dataset.pick })));
    o.querySelector('[data-cancel]').onclick = () => act({ a: 'cancel' });
  } else if (S.result) {
    const r = S.result, g = grade(S);
    const o = panel(`<div class="end"><h2>${r.won ? '거상을 쓰러뜨렸다!' : '원정 실패'}</h2><div class="big" style="color:${r.won ? 'var(--gold)' : 'var(--blood)'}">${g}</div>
      <table><tr><td>도달한 층</td><td>${r.floor + 1} / ${FLOORS}</td></tr><tr><td>처치</td><td>${r.kills} (정예 ${r.elites})</td></tr>
      <tr><td>턴</td><td>${r.turns}</td></tr><tr><td>남은 체력</td><td>${r.hp} / ${r.maxHp}</td></tr><tr><td>점수</td><td>${r.score}${r.newBest ? ' · 최고 기록!' : ''}</td></tr>
      ${portal.embedded && r.rp ? `<tr><td>포털 보상</td><td>+${r.rp} RP</td></tr>` : ''}</table>
      <p class="lead">이 원정의 행동 ${run.tokens.length}개가 저장되었고, 같은 기록으로 결과를 다시 계산해 확인할 수 있습니다.</p>
      <div class="actions" style="justify-content:center"><button class="btn primary" data-again>새 원정</button></div></div>`);
    o.querySelector('[data-again]').onclick = () => { store.set(SAVE, null); S = null; render(); };
  }
}
function showDeck() {
  const o = panel(`<h2>덱 (${S.deck.length})</h2><div class="deckGrid">${S.deck.slice().sort().map((id) => cardHtml(id)).join('')}</div><div class="actions"><button class="btn" data-close>닫기</button></div>`);
  o.querySelector('[data-close]').onclick = () => render();
}
let toastT = 0;
function toast(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (el.hidden = true), 1400); }

// ------------------------------------------------------------ keys
addEventListener('keydown', (e) => {
  if (!S || S.phase !== 'combat' || overlay) { if (e.key === 'Escape' && overlay && S && S.phase === 'combat') render(); return; }
  const c = S.combat;
  if (/^[1-9]$/.test(e.key)) { const i = +e.key - 1; if (armed === i) playCard(i, true); else if (i < c.hand.length) playCard(i); }
  else if (e.key === 'Tab') { e.preventDefault(); const live = c.enemies.map((x, k) => (x.hp > 0 ? k : -1)).filter((k) => k >= 0); target = live[(live.indexOf(target) + 1) % live.length]; render(); }
  else if (e.key === 'e' || e.key === 'E') act({ a: 'end' });
  else if (e.key === 'd' || e.key === 'D') showDeck();
  else if (e.key === 'Escape') { armed = -1; render(); }
});

// boot: ?seed=123&hero=arcanist&level=1 starts a fixed run (shareable daily seeds / tests)
const q = new URLSearchParams(location.search);
if (q.get('seed')) { pickHero = HEROES[q.get('hero')] ? q.get('hero') : 'warden'; startRun(pickHero, Math.min(2, Math.max(0, +q.get('level') || 0)), +q.get('seed')); }
else render();
