// HEARTHVALE — rules (no DOM). An original cozy life sim played one day at a time: a 28-day season, a 24-plot farm,
// three villagers. Every move is an action token, so a whole season is (seed, level) + tokens and can be replayed
// exactly (src/verify.js). Weather and market prices come from the seed and are fixed for the season.
export const RULES_VERSION = 1;
export const DAYS = 28, PLOTS = 24, COLS = 6, FESTIVAL = 21, HEART_VALUE = 40;

export const CROPS = {
  turnip:     { name: '순무',   en: 'Turnip',     days: 4,  seed: 20, sell: 48,  icon: '🥬' },
  carrot:     { name: '당근',   en: 'Carrot',     days: 6,  seed: 34, sell: 92,  icon: '🥕' },
  strawberry: { name: '딸기',   en: 'Strawberry', days: 8,  seed: 70, sell: 46,  icon: '🍓', regrow: 3 },
  pumpkin:    { name: '호박',   en: 'Pumpkin',    days: 12, seed: 90, sell: 330, icon: '🎃' },
};
export const CROP_IDS = Object.keys(CROPS);

export const VILLAGERS = {
  mira:  { name: '미라', en: 'Mira',  role: '제빵사', likes: 'strawberry', perk: '하루 기력 +2 (파이를 나눠 줌)' },
  tomas: { name: '토마스', en: 'Tomas', role: '대장장이', likes: 'pumpkin', perk: '밭 갈기 기력 2 → 1 (새 괭이)' },
  juno:  { name: '주노', en: 'Juno',  role: '꽃집 주인', likes: 'turnip', perk: '씨앗 20% 할인' },
};
export const VILLAGER_IDS = Object.keys(VILLAGERS);
export const PERK_HEARTS = 4, MAX_HEARTS = 10;

export const COST = { till: 2, plant: 1, harvest: 1, talk: 1, gift: 1 };
export const waterCost = (S) => LEVEL_RULES[S.level].water;   // drought: the well is far

// BIT PARK levels / difficulty: target score at the end of day 28, and how often it rains.
export const LEVEL_RULES = {
  meadow:  { name: '초원 마을', target: 2400, rain: 0.28, energy: 12, coins: 150, water: 1 },
  valley:  { name: '골짜기',    target: 3400, rain: 0.25, energy: 12, coins: 150, water: 1 },
  drought: { name: '가뭄 여름', target: 2600, rain: 0.08, energy: 12, coins: 150, water: 2 },
  frugal:  { name: '빈손 출발', target: 2000, rain: 0.25, energy: 10, coins: 60, water: 1 },
};

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function newGame({ seed = 1, level = 'meadow' } = {}) {
  const L = LEVEL_RULES[level]; if (!L) throw new Error('unknown level ' + level);
  const r = rng(seed), weather = [], prices = [];
  for (let d = 1; d <= DAYS; d++) {
    const x = r(); weather.push(d === 1 ? 'sun' : x < 0.04 ? 'storm' : x < 0.04 + L.rain ? 'rain' : 'sun');
    const p = {}; for (const c of CROP_IDS) p[c] = Math.round(CROPS[c].sell * (0.8 + 0.4 * r()) * (d === FESTIVAL && c === 'pumpkin' ? 1.5 : 1)); prices.push(p);
  }
  const plots = Array.from({ length: PLOTS }, (_, i) => ({ tilled: i < 6, crop: null, age: 0, watered: false }));
  const hearts = {}, talked = {}, gifted = {}; for (const v of VILLAGER_IDS) { hearts[v] = 0; talked[v] = false; gifted[v] = false; }
  return { v: RULES_VERSION, seed: seed >>> 0, level, day: 1, energy: L.energy, coins: L.coins, plots, inv: Object.fromEntries(CROP_IDS.map((c) => [c, 0])),
    hearts, talked, gifted, weather, prices, log: [], sold: 0, result: null, actions: [] };
}

export const maxEnergy = (S) => LEVEL_RULES[S.level].energy + (S.hearts.mira >= PERK_HEARTS ? 2 : 0);
export const tillCost = (S) => (S.hearts.tomas >= PERK_HEARTS ? 1 : COST.till);
export const seedPrice = (S, c) => Math.round(CROPS[c].seed * (S.hearts.juno >= PERK_HEARTS ? 0.8 : 1));
export const weatherToday = (S) => S.weather[S.day - 1];
export const townOpen = (S) => weatherToday(S) !== 'storm';
export const ripe = (p) => !!p.crop && p.age >= CROPS[p.crop].days;
export const score = (S) => S.coins + HEART_VALUE * VILLAGER_IDS.reduce((n, v) => n + S.hearts[v], 0);
export function grade(S) { const k = score(S) / LEVEL_RULES[S.level].target; return k >= 1.3 ? 'S' : k >= 1 ? 'A' : k >= 0.75 ? 'B' : k >= 0.5 ? 'C' : 'D'; }

// ------------------------------------------------------------ actions
// { a: 'till'|'plant'|'water'|'harvest', i, c? } · { a: 'sell', c } · { a: 'talk'|'gift', v, c? } · { a: 'sleep' }
export function canDo(S, act) {
  if (S.result) return 'over';
  const p = S.plots[act.i];
  const spend = (n) => (S.energy >= n ? '' : 'energy');
  switch (act.a) {
    case 'till': return !p ? 'plot' : p.tilled ? 'tilled' : spend(tillCost(S));
    case 'plant': return !p ? 'plot' : !p.tilled || p.crop ? 'busy' : !CROPS[act.c] ? 'crop' : S.coins < seedPrice(S, act.c) ? 'coins' : spend(COST.plant);
    case 'water': return !p ? 'plot' : !p.crop || p.watered || ripe(p) ? 'nothing' : spend(waterCost(S));
    case 'harvest': return !p ? 'plot' : !ripe(p) ? 'unripe' : spend(COST.harvest);
    case 'sell': return !CROPS[act.c] ? 'crop' : !townOpen(S) ? 'storm' : S.inv[act.c] <= 0 ? 'none' : '';
    case 'talk': return !VILLAGERS[act.v] ? 'who' : !townOpen(S) ? 'storm' : S.talked[act.v] ? 'done' : spend(COST.talk);
    case 'gift': return !VILLAGERS[act.v] ? 'who' : !townOpen(S) ? 'storm' : S.gifted[act.v] ? 'done' : !CROPS[act.c] || S.inv[act.c] <= 0 ? 'none' : spend(COST.gift);
    case 'sleep': return '';
    default: return 'unknown';
  }
}

export function apply(S, act) {
  const why = canDo(S, act); if (why) throw new Error(`illegal ${act.a}: ${why}`);
  const p = S.plots[act.i];
  S.actions.push(encode(act));
  switch (act.a) {
    case 'till': S.energy -= tillCost(S); p.tilled = true; break;
    case 'plant': S.energy -= COST.plant; S.coins -= seedPrice(S, act.c); Object.assign(p, { crop: act.c, age: 0, watered: weatherToday(S) !== 'sun' }); break;
    case 'water': S.energy -= waterCost(S); p.watered = true; break;
    case 'harvest': {
      S.energy -= COST.harvest; S.inv[p.crop]++;
      const C = CROPS[p.crop];
      if (C.regrow) p.age = C.days - C.regrow; else Object.assign(p, { crop: null, age: 0 });
      p.watered = false; break;
    }
    case 'sell': { const n = S.inv[act.c], gain = n * S.prices[S.day - 1][act.c]; S.inv[act.c] = 0; S.coins += gain; S.sold += gain; note(S, `${CROPS[act.c].name} ${n}개 판매 +${gain}`); break; }
    case 'talk': S.energy -= COST.talk; S.talked[act.v] = true; heart(S, act.v, 1); break;
    case 'gift': {
      S.energy -= COST.gift; S.gifted[act.v] = true; S.inv[act.c]--;
      heart(S, act.v, VILLAGERS[act.v].likes === act.c ? 3 : 1); break;
    }
    case 'sleep': sleep(S); break;
  }
  return S;
}

function heart(S, v, n) {
  const before = S.hearts[v]; S.hearts[v] = Math.min(MAX_HEARTS, before + n);
  if (before < PERK_HEARTS && S.hearts[v] >= PERK_HEARTS) note(S, `${VILLAGERS[v].name}와(과) 친해졌다 — ${VILLAGERS[v].perk}`);
}
function note(S, msg) { S.log.push({ day: S.day, msg }); if (S.log.length > 60) S.log.shift(); }

function sleep(S) {
  // overnight: watered crops grow one day; tomorrow's rain waters everything that is planted
  for (const p of S.plots) { if (p.crop && p.watered && !ripe(p)) p.age++; p.watered = false; }
  if (S.day >= DAYS) { S.result = { score: score(S), coins: S.coins, hearts: VILLAGER_IDS.reduce((n, v) => n + S.hearts[v], 0), won: score(S) >= LEVEL_RULES[S.level].target, grade: grade(S) }; return; }
  S.day++; S.energy = maxEnergy(S);
  for (const v of VILLAGER_IDS) { S.talked[v] = false; S.gifted[v] = false; }
  if (weatherToday(S) !== 'sun') for (const p of S.plots) if (p.crop && !ripe(p)) p.watered = true;
}

// ------------------------------------------------------------ tokens: t3 · p3.turnip→p3t · w3 · h3 · st · km · gm.s · z
const CROP_CODE = { turnip: 't', carrot: 'c', strawberry: 's', pumpkin: 'p' }, CODE_CROP = Object.fromEntries(Object.entries(CROP_CODE).map(([k, v]) => [v, k]));
const VIL_CODE = { mira: 'm', tomas: 't', juno: 'j' }, CODE_VIL = Object.fromEntries(Object.entries(VIL_CODE).map(([k, v]) => [v, k]));
export function encode(a) {
  switch (a.a) {
    case 'till': return 't' + a.i; case 'water': return 'w' + a.i; case 'harvest': return 'h' + a.i;
    case 'plant': return 'p' + a.i + CROP_CODE[a.c];
    case 'sell': return 's' + CROP_CODE[a.c];
    case 'talk': return 'k' + VIL_CODE[a.v];
    case 'gift': return 'g' + VIL_CODE[a.v] + CROP_CODE[a.c];
    case 'sleep': return 'z';
  }
  throw new Error('bad action');
}
export function decode(tok) {
  let m;
  if (tok === 'z') return { a: 'sleep' };
  if ((m = /^([twh])(\d{1,2})$/.exec(tok))) return { a: { t: 'till', w: 'water', h: 'harvest' }[m[1]], i: +m[2] };
  if ((m = /^p(\d{1,2})([tcsp])$/.exec(tok))) return { a: 'plant', i: +m[1], c: CODE_CROP[m[2]] };
  if ((m = /^s([tcsp])$/.exec(tok))) return { a: 'sell', c: CODE_CROP[m[1]] };
  if ((m = /^k([mtj])$/.exec(tok))) return { a: 'talk', v: CODE_VIL[m[1]] };
  if ((m = /^g([mtj])([tcsp])$/.exec(tok))) return { a: 'gift', v: CODE_VIL[m[1]], c: CODE_CROP[m[2]] };
  return null;
}
