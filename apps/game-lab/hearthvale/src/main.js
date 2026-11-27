// HEARTHVALE — browser side: DOM UI over the rules in ./logic.js. Every click becomes an action token (apply), so the
// finished season is a replay proof for BIT PARK (verify.js) and the RP grade for airobotphysical.com (portal.js).
// PP items (docs/game-dev/PORTAL_ECONOMY.md) are bought through the portal; they are cosmetic or an unranked mode.
import { newGame, apply, canDo, CROPS, CROP_IDS, VILLAGERS, VILLAGER_IDS, LEVEL_RULES, DAYS, PLOTS, COLS, FESTIVAL, PERK_HEARTS, MAX_HEARTS,
  maxEnergy, tillCost, seedPrice, waterCost, weatherToday, townOpen, ripe, score, grade, RULES_VERSION } from './logic.js';
import { LEVELS } from './levels.js';
import { createPortal } from './portal.js';

const SLUG = 'hearthvale', SAVE = 'hearthvale.season', OWNED = 'hearthvale.owned';
const portal = createPortal(SLUG);
const $ = (s) => document.querySelector(s), app = $('#app');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const WEATHER = { sun: ['☀️', '맑음'], rain: ['🌧️', '비 — 심은 밭이 저절로 젖음'], storm: ['⛈️', '폭풍 — 마을이 문을 닫음'] };
const store = { get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } } };

let shopMsg = '', S = null, tool = 'water', ranked = true, started = 0, items = null, wallet = null;
let owned = new Set(store.get(OWNED) || []);   // what the portal last said we own (cosmetics keep working offline)

// ------------------------------------------------------------ portal shop
async function refreshShop() {
  const list = await portal.items();
  if (list) { items = list; owned = new Set(list.filter((i) => i.owned).map((i) => i.id)); store.set(OWNED, [...owned]); }
  wallet = await portal.wallet();
  applyCosmetics();
}
function applyCosmetics() { document.body.classList.toggle('sakura', owned.has('hearthvale-theme-sakura')); }
async function buy(id) {
  const say = (t) => { shopMsg = t; const m = $('#shop-msg'); if (m) m.textContent = t; };
  say('포털 확인 창을 기다리는 중…');
  try { await portal.buy(id); await refreshShop(); say('구매 완료! ' + (CATALOG.find((c) => c.id === id)?.name || '')); } catch (e) {
    const why = { not_signed_in: 'BIT PARK에 로그인해야 합니다', insufficient_funds: 'PP가 부족합니다', already_owned: '이미 가지고 있습니다', cancelled: '구매를 취소했습니다',
      item_unavailable: '지금은 판매하지 않는 아이템입니다', unknown_call: '이 포털은 아직 게임 상점을 지원하지 않습니다', portal_timeout: '포털이 응답하지 않습니다' }[e.message];
    say(why || `구매하지 못했습니다 (${e.message})`);
  }
  if (!$('#shop').hidden) shopPanel();
}
const CATALOG = [   // the same list as game.json "items" (the portal's shop_items rows are made from it)
  { id: 'hearthvale-theme-sakura', name: '벚꽃 농장 테마', price: 300, about: '밭·집·하늘을 벚꽃 색으로 바꿉니다.' },
  { id: 'hearthvale-pet-cat', name: '고양이 친구 보리', price: 200, about: '농장에 고양이가 함께 삽니다 (점수와 무관).' },
  { id: 'hearthvale-freeplay', name: '자유 농장 모드', price: 500, about: '원하는 시드·마을로 연습. 순위·RP·PP에 들어가지 않습니다.' },
];
function shopPanel() {
  const el = $('#shop'); el.hidden = false;
  const live = items ? Object.fromEntries(items.map((i) => [i.id, i])) : null;
  el.innerHTML = `<div class="card"><h2>PP 상점</h2>
    <p class="dim">${live ? `보유 PP ${wallet?.PP ?? '—'} · 결제는 BIT PARK 포털이 확인 창을 띄운 뒤 서버에서 처리합니다.` : portal.embedded ? '이 포털에서는 아직 게임 상점을 쓸 수 없습니다.' : 'BIT PARK에서 이 게임을 열면 PP(포털 포인트)로 살 수 있습니다.'}
    유료 아이템은 꾸미기·연습 모드뿐이라 순위 점수에는 영향이 없습니다.</p>
    ${CATALOG.map((c) => { const it = live?.[c.id], have = owned.has(c.id);
      return `<div class="item"><b>${esc(c.name)}</b><span class="dim">${esc(c.about)}</span><span class="price">${it ? `${it.price} ${it.currency}` : `${c.price} PP`}</span>
      ${have ? '<span class="tag">보유</span>' : it ? `<button data-buy="${c.id}">구매</button>` : ''}</div>`; }).join('')}
    <p id="shop-msg" class="dim">${esc(shopMsg)}</p><button data-close>닫기</button></div>`;
}

// ------------------------------------------------------------ title
function title() {
  S = null; const saved = store.get(SAVE);
  app.innerHTML = `<section class="title"><h1>HEARTHVALE</h1><p class="sub">28일 동안 밭을 가꾸고 마을 사람과 친해지세요. 날씨와 시세는 시즌마다 정해져 있습니다.</p>
    <div class="levels">${LEVELS.map((L, i) => { const R = LEVEL_RULES[L.level]; return `<button data-level="${i}"><b>${R.name}</b>
      <span>목표 ${R.target}점 · 기력 ${R.energy} · 시작 ${R.coins}G${R.water > 1 ? ' · 물 주기 기력 2' : ''}</span></button>`; }).join('')}</div>
    ${saved && saved.rules === RULES_VERSION ? `<button class="wide" data-resume>이어 하기 — ${esc(LEVEL_RULES[saved.level].name)} ${saved.day}일째${saved.ranked ? '' : ' (자유 모드)'}</button>` : ''}
    <div class="row"><button data-shop>🛒 PP 상점</button>${owned.has('hearthvale-freeplay') ? '<button data-free>자유 농장 모드</button>' : ''}</div>
    <p class="dim small">점수 = 골드 + 하트 × 40 · 목표를 넘기면 BIT PARK 검증 기록, 등급(S/A/B/C)에 따라 airobotphysical RP</p></section>`;
}

function start(levelIndex, seed, isRanked = true) {
  const L = LEVELS[levelIndex]; ranked = isRanked; tool = 'water';
  S = newGame({ seed, level: L.level }); S.levelIndex = levelIndex; started = Date.now();
  if (ranked) portal.levelStart(levelIndex + 1);
  render();
}
function resume() {
  const v = store.get(SAVE); if (!v) return title();
  const L = LEVELS.findIndex((x) => x.level === v.level);
  S = newGame({ seed: v.seed, level: v.level }); S.levelIndex = L; ranked = v.ranked; started = Date.now() - (v.seconds || 0) * 1000;
  try { for (const t of v.actions) { const a = decodeTok(t); apply(S, a); } } catch { return title(); }
  if (ranked) portal.levelStart(L + 1);   // the server clock restarts; the proof is the whole season either way
  render();
}
import { decode as decodeTok } from './logic.js';
function persist() { if (S && !S.result) store.set(SAVE, { rules: RULES_VERSION, seed: S.seed, level: S.level, day: S.day, ranked, actions: S.actions, seconds: (Date.now() - started) / 1000 }); }

// ------------------------------------------------------------ game screen
function act(a) {
  const why = canDo(S, a); if (why) { flash(WHY[why] || why); return; }
  apply(S, a); persist();
  if (S.result) return finish();
  render();
}
const WHY = { energy: '기력이 부족합니다 — 잠자리에 드세요', coins: '골드가 부족합니다', busy: '이미 무언가 자라고 있습니다', tilled: '이미 갈아 둔 밭입니다', unripe: '아직 다 자라지 않았습니다',
  nothing: '물을 줄 작물이 없습니다', storm: '폭풍이라 마을이 문을 닫았습니다', done: '오늘은 이미 했습니다', none: '가진 것이 없습니다' };
function flash(t) { const f = $('#flash'); if (!f) return; f.textContent = t; f.classList.add('on'); clearTimeout(f._t); f._t = setTimeout(() => f.classList.remove('on'), 1800); }

function plotClick(i) {
  const p = S.plots[i];
  if (!p.tilled) return act({ a: 'till', i });
  if (ripe(p)) return act({ a: 'harvest', i });
  if (!p.crop) return CROPS[tool] ? act({ a: 'plant', i, c: tool }) : flash('심을 씨앗을 고르세요');
  return act({ a: 'water', i });
}

function render() {
  const w = weatherToday(S), tomorrow = S.day < DAYS ? S.weather[S.day] : null, prices = S.prices[S.day - 1], E = maxEnergy(S);
  const left = DAYS - S.day;
  app.innerHTML = `<header class="bar">
      <span class="day">${S.day}<small>/${DAYS}일</small></span>
      <span title="${WEATHER[w][1]}">${WEATHER[w][0]} ${WEATHER[w][1].split(' — ')[0]}</span>
      <span class="dim">내일 ${tomorrow ? WEATHER[tomorrow][0] : '—'}</span>${S.day === FESTIVAL ? '<span class="tag">🎪 수확 축제 — 호박 1.5배</span>' : ''}
      <span class="energy" title="기력">${'●'.repeat(S.energy)}<i>${'●'.repeat(Math.max(0, E - S.energy))}</i></span>
      <span>💰 ${S.coins}G</span><span>점수 ${score(S)} / ${LEVEL_RULES[S.level].target}</span>${ranked ? '' : '<span class="tag">자유 모드</span>'}
    </header>
    <main class="main">
      <section class="farm"><h3>밭 <small class="dim">갈기 ${tillCost(S)} · 심기 1 · 물 ${waterCost(S)} · 수확 1</small></h3>
        <div class="tools">${['water', ...CROP_IDS].map((t) => t === 'water' ? `<button class="${tool === t ? 'on' : ''}" data-tool="water">💧 물·수확</button>`
          : `<button class="${tool === t ? 'on' : ''}" data-tool="${t}" ${CROPS[t].days > left + 0 ? 'title="이번 시즌 안에 다 자라지 않습니다"' : ''}>${CROPS[t].icon} ${CROPS[t].name} ${seedPrice(S, t)}G<small>${CROPS[t].days}일${CROPS[t].regrow ? `·${CROPS[t].regrow}일마다` : ''}</small></button>`).join('')}</div>
        <div class="grid" style="--cols:${COLS}">${S.plots.map((p, i) => plotView(p, i)).join('')}</div>
        ${owned.has('hearthvale-pet-cat') ? '<div class="cat" aria-hidden="true">🐈</div>' : ''}
      </section>
      <section class="town"><h3>마을 ${townOpen(S) ? '' : '<span class="tag">폭풍 — 닫힘</span>'}</h3>
        <div class="market">${CROP_IDS.map((c) => `<button data-sell="${c}" ${S.inv[c] && townOpen(S) ? '' : 'disabled'}>${CROPS[c].icon} ${S.inv[c]}개 · ${prices[c]}G<small>${prices[c] > CROPS[c].sell ? '▲' : prices[c] < CROPS[c].sell ? '▼' : ''} 팔기</small></button>`).join('')}</div>
        ${VILLAGER_IDS.map((v) => villagerView(v)).join('')}
      </section>
    </main>
    <footer class="foot"><button class="sleep" data-sleep>🌙 잠자기 (다음 날)</button><button data-menu>메뉴</button>
      <div class="log">${S.log.slice(-4).reverse().map((l) => `<div>${l.day}일 · ${esc(l.msg)}</div>`).join('')}</div></footer>
    <div id="flash" class="flash"></div>`;
}
function plotView(p, i) {
  if (!p.tilled) return `<button class="plot wild" data-plot="${i}" title="갈기 (기력 ${tillCost(S)})">🌿</button>`;
  if (!p.crop) return `<button class="plot soil" data-plot="${i}" title="심기">${CROPS[tool] ? `<span class="ghost">${CROPS[tool].icon}</span>` : ''}</button>`;
  const C = CROPS[p.crop], k = Math.min(1, p.age / C.days);
  return `<button class="plot soil ${p.watered ? 'wet' : ''} ${ripe(p) ? 'ripe' : ''}" data-plot="${i}" title="${C.name} ${p.age}/${C.days}일${p.watered ? ' · 젖음' : ''}">
    <span class="sprout" style="--k:${k.toFixed(2)}">${ripe(p) ? C.icon : k < 0.34 ? '🌱' : k < 0.67 ? '🌿' : C.icon}</span><i style="width:${(k * 100).toFixed(0)}%"></i></button>`;
}
function villagerView(v) {
  const V = VILLAGERS[v], h = S.hearts[v], open = townOpen(S);
  const gifts = CROP_IDS.filter((c) => S.inv[c] > 0);
  return `<div class="villager"><b>${V.name}</b> <span class="dim">${V.role} · ${CROPS[V.likes].icon} 좋아함</span>
    <div class="hearts">${'♥'.repeat(h)}<i>${'♥'.repeat(MAX_HEARTS - h)}</i></div>
    <div class="dim small">${h >= PERK_HEARTS ? '✓ ' : `하트 ${PERK_HEARTS}개: `}${V.perk}</div>
    <div class="row"><button data-talk="${v}" ${open && !S.talked[v] ? '' : 'disabled'}>대화</button>
    ${gifts.map((c) => `<button data-gift="${v}" data-crop="${c}" ${open && !S.gifted[v] ? '' : 'disabled'}>${CROPS[c].icon} 선물</button>`).join('')}</div></div>`;
}

function finish() {
  store.set(SAVE, null);
  const r = S.result, seconds = (Date.now() - started) / 1000, proof = { seed: S.seed, actions: S.actions.join(',') };
  let rp = 0;
  if (ranked) rp = portal.result({ level: S.levelIndex + 1, score: r.score, grade: r.grade, mode: S.level, seconds, stars: r.grade === 'S' ? 3 : r.grade === 'A' ? 2 : 1, proof, clear: r.won });
  app.innerHTML = `<section class="title"><h1>${r.won ? '풍성한 계절!' : '계절이 끝났습니다'}</h1>
    <p class="big">${r.score}점 <span class="grade g${r.grade}">${r.grade}</span></p>
    <p>골드 ${r.coins}G · 하트 ${r.hearts}개 · 목표 ${LEVEL_RULES[S.level].target}점 · 판매 ${S.sold}G</p>
    <p class="dim">${!ranked ? '자유 모드 — 기록·포인트 없음' : portal.embedded ? `${r.won ? 'BIT PARK에 검증 기록을 보냈습니다. ' : ''}등급 RP ${rp}` : '포털에서 플레이하면 기록과 포인트가 쌓입니다'}</p>
    <button data-title>처음으로</button></section>`;
  refreshShop();
}

function freePanel() {
  const el = $('#shop'); el.hidden = false;
  el.innerHTML = `<div class="card"><h2>자유 농장 모드</h2><p class="dim">순위·RP·PP에 들어가지 않는 연습 모드입니다.</p>
    <label>마을 <select id="free-level">${LEVELS.map((L, i) => `<option value="${i}">${LEVEL_RULES[L.level].name}</option>`).join('')}</select></label>
    <label>시드 <input id="free-seed" type="number" min="0" max="4294967295" value="${(Math.random() * 1e6) | 0}"></label>
    <div class="row"><button data-free-go>시작</button><button data-close>닫기</button></div></div>`;
}

// ------------------------------------------------------------ input
document.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  const d = b.dataset;
  if (d.level) return start(+d.level, (Math.random() * 2 ** 32) >>> 0);
  if ('resume' in d) return resume();
  if ('shop' in d) { shopMsg = ''; shopPanel(); return refreshShop().then(() => { if (!$('#shop').hidden) shopPanel(); }); }
  if ('free' in d) return freePanel();
  if ('freeGo' in d) { $('#shop').hidden = true; return start(+$('#free-level').value, (+$('#free-seed').value) >>> 0, false); }
  if (d.buy) return buy(d.buy);
  if ('close' in d) { $('#shop').hidden = true; if (!S) title(); return; }
  if ('title' in d) return title();
  if (!S || S.result) return;
  if (d.tool) { tool = d.tool; return render(); }
  if (d.plot) return plotClick(+d.plot);
  if (d.sell) return act({ a: 'sell', c: d.sell });
  if (d.talk) return act({ a: 'talk', v: d.talk });
  if (d.gift) return act({ a: 'gift', v: d.gift, c: d.crop });
  if ('sleep' in d) return act({ a: 'sleep' });
  if ('menu' in d) { persist(); return title(); }
});
addEventListener('keydown', (e) => {
  if (!S || S.result || e.target.closest('input,select')) return;
  if (e.code === 'KeyZ') act({ a: 'sleep' });
  const n = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].indexOf(e.code); if (n >= 0) { tool = ['water', ...CROP_IDS][n]; render(); }
});

// ?debug=1: hooks for automated browser tests
if (new URLSearchParams(location.search).get('debug')) window.__hv = { S: () => S, act, start, plotClick };
applyCosmetics(); title(); portal.ready(); refreshShop();
