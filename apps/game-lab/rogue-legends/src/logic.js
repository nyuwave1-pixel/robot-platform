// ROGUE LEGENDS — rules. Pure and deterministic: no browser APIs, no Math.random, no imports (BIT PARK copies this file,
// levels.js and verify.js to its score server). A whole run is (seed, hero, level) + the list of actions the player took;
// replaying those actions through apply() rebuilds the run exactly — that list is the save file AND the score proof.
// All heroes, cards, relics and enemies are original to this game.
// Rules version 2 (2026-11-27): two acts (each 12 map floors + a boss). A proof replays under the rules version it was made with.
export const RULES_VERSION = 2;

// ---------------------------------------------------------------- RNG
function rngNext(s) { // mulberry32 step on a uint32 state → [nextState, value 0..1)
  const a = (s + 0x6d2b79f5) >>> 0; let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [a, ((t ^ (t >>> 14)) >>> 0) / 4294967296];
}
function rand(S) { const [n, v] = rngNext(S.rng); S.rng = n; return v; }
function rint(S, n) { return Math.floor(rand(S) * n); }
function pick(S, arr) { return arr[rint(S, arr.length)]; }
function shuffle(S, arr) { for (let i = arr.length - 1; i > 0; i--) { const j = rint(S, i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

// ---------------------------------------------------------------- content
// Card effect ops: ['dmg', n, hits=1] target · ['dmgAll', n] · ['block', n] · ['draw', n] · ['energy', n] · ['st', key, n] status on
// target · ['stAll', key, n] · ['self', key, n] status on hero · ['heal', n] · ['blockHit'] damage = current block ·
// ['detonate', k] damage = target burn × k, burn cleared · ['burnX', k] target burn × k · ['burnXAll', k] every foe's burn × k ·
// ['nextEnergy', n] · ['blockHalfAll'] every foe takes half your block · ['cleanse'] remove your weak/vuln · ['execute', n] n, doubled
// if the target is at half health or less.
// Statuses: str (+dmg) · dex (+block) · vuln (+50% taken) · weak (−25% dealt) · burn (end of your turn: take burn, burn halves) ·
// rot (start of its turn: take rot, rot −1) · thorns (attacker takes n) · plate (start of turn gain n block) · kindle (start of
// turn: burn n on all foes) · insight (draw +n each turn) · bastion (your block no longer fades) · surge (+n energy each turn).
export const HEROES = {
  warden: { name: 'WARDEN', title: '성벽의 수호자', hp: 80, color: '#e0a24a',
    deck: ['strike', 'strike', 'strike', 'strike', 'strike', 'guard', 'guard', 'guard', 'guard', 'shieldbash'], relic: 'ironBadge' },
  arcanist: { name: 'ARCANIST', title: '잿불의 마도사', hp: 74, color: '#ff7a59',
    deck: ['bolt', 'bolt', 'bolt', 'bolt', 'ward', 'ward', 'ward', 'ward', 'kindle', 'focus'], relic: 'emberCoal' },
};

const C = (name, cost, type, target, text, fx, up, extra = {}) => ({ name, cost, type, target, text, fx, up, ...extra });
export const CARDS = {
  // WARDEN
  strike: C('베기', 1, 'attack', 'enemy', '피해 6', [['dmg', 6]], { fx: [['dmg', 9]], text: '피해 9' }, { hero: 'warden', starter: true }),
  guard: C('방패 들기', 1, 'skill', 'self', '방어 5', [['block', 5]], { fx: [['block', 8]], text: '방어 8' }, { hero: 'warden', starter: true }),
  shieldbash: C('방패 강타', 1, 'attack', 'enemy', '피해 5 · 방어 5', [['dmg', 5], ['block', 5]], { fx: [['dmg', 7], ['block', 7]], text: '피해 7 · 방어 7' }, { hero: 'warden', starter: true }),
  cleave: C('횡베기', 1, 'attack', 'all', '모든 적에게 피해 8', [['dmgAll', 8]], { fx: [['dmgAll', 11]], text: '모든 적에게 피해 11' }, { hero: 'warden' }),
  ironwall: C('철벽', 2, 'skill', 'self', '방어 14', [['block', 14]], { fx: [['block', 19]], text: '방어 19' }, { hero: 'warden' }),
  brace: C('버티기', 0, 'skill', 'self', '방어 3 · 카드 1장', [['block', 3], ['draw', 1]], { fx: [['block', 5], ['draw', 1]], text: '방어 5 · 카드 1장' }, { hero: 'warden' }),
  rampart: C('성벽 돌진', 1, 'attack', 'enemy', '현재 방어만큼 피해', [['blockHit']], { cost: 0, text: '현재 방어만큼 피해 (비용 0)' }, { hero: 'warden' }),
  warcry: C('함성', 1, 'power', 'self', '힘 +2', [['self', 'str', 2]], { fx: [['self', 'str', 3]], text: '힘 +3' }, { hero: 'warden' }),
  thornmail: C('가시 갑옷', 1, 'power', 'self', '가시 3 (공격받으면 반사)', [['self', 'thorns', 3]], { fx: [['self', 'thorns', 5]], text: '가시 5' }, { hero: 'warden' }),
  sunder: C('쪼개기', 2, 'attack', 'enemy', '피해 13 · 취약 2', [['dmg', 13], ['st', 'vuln', 2]], { fx: [['dmg', 17], ['st', 'vuln', 3]], text: '피해 17 · 취약 3' }, { hero: 'warden' }),
  taunt: C('도발', 1, 'skill', 'all', '모든 적 약화 2 · 방어 4', [['stAll', 'weak', 2], ['block', 4]], { fx: [['stAll', 'weak', 3], ['block', 6]], text: '모든 적 약화 3 · 방어 6' }, { hero: 'warden' }),
  twincut: C('쌍검', 1, 'attack', 'enemy', '피해 4 ×2', [['dmg', 4, 2]], { fx: [['dmg', 6, 2]], text: '피해 6 ×2' }, { hero: 'warden' }),
  rhythm: C('전투의 호흡', 0, 'skill', 'self', '에너지 +1 · 소멸', [['energy', 1]], { fx: [['energy', 2]], text: '에너지 +2 · 소멸' }, { hero: 'warden', exhaust: true }),
  holdground: C('굳건히', 2, 'power', 'self', '민첩 +2', [['self', 'dex', 2]], { fx: [['self', 'dex', 3]], text: '민첩 +3' }, { hero: 'warden' }),
  wardrum: C('전쟁 북', 1, 'power', 'self', '매 턴 방어 3', [['self', 'plate', 3]], { fx: [['self', 'plate', 5]], text: '매 턴 방어 5' }, { hero: 'warden' }),
  overrun: C('돌파', 2, 'attack', 'enemy', '피해 7 ×2 · 카드 1장', [['dmg', 7, 2], ['draw', 1]], { fx: [['dmg', 9, 2], ['draw', 1]], text: '피해 9 ×2 · 카드 1장' }, { hero: 'warden' }),
  // ARCANIST
  bolt: C('비전 화살', 1, 'attack', 'enemy', '피해 6', [['dmg', 6]], { fx: [['dmg', 9]], text: '피해 9' }, { hero: 'arcanist', starter: true }),
  ward: C('보호막', 1, 'skill', 'self', '방어 5', [['block', 5]], { fx: [['block', 8]], text: '방어 8' }, { hero: 'arcanist', starter: true }),
  kindle: C('점화', 1, 'skill', 'enemy', '화상 5', [['st', 'burn', 5]], { fx: [['st', 'burn', 8]], text: '화상 8' }, { hero: 'arcanist', starter: true }),
  focus: C('집중', 0, 'skill', 'self', '카드 2장 · 소멸', [['draw', 2]], { fx: [['draw', 3]], text: '카드 3장 · 소멸' }, { hero: 'arcanist', starter: true, exhaust: true }),
  flamewave: C('화염 파도', 2, 'skill', 'all', '모든 적 화상 6', [['stAll', 'burn', 6]], { fx: [['stAll', 'burn', 9]], text: '모든 적 화상 9' }, { hero: 'arcanist' }),
  stoke: C('불씨 키우기', 1, 'skill', 'enemy', '대상의 화상 2배', [['burnX', 2]], { cost: 0, text: '대상의 화상 2배 (비용 0)' }, { hero: 'arcanist' }),
  cindershield: C('잿불 방패', 1, 'skill', 'all', '방어 6 · 모든 적 화상 2', [['block', 6], ['stAll', 'burn', 2]], { fx: [['block', 8], ['stAll', 'burn', 4]], text: '방어 8 · 모든 적 화상 4' }, { hero: 'arcanist' }),
  detonate: C('폭발', 2, 'attack', 'enemy', '화상 ×2 피해 (화상 소모)', [['detonate', 2]], { fx: [['detonate', 3]], text: '화상 ×3 피해 (화상 소모)' }, { hero: 'arcanist' }),
  frostlance: C('서리 창', 1, 'attack', 'enemy', '피해 8 · 약화 2', [['dmg', 8], ['st', 'weak', 2]], { fx: [['dmg', 11], ['st', 'weak', 3]], text: '피해 11 · 약화 3' }, { hero: 'arcanist' }),
  chainarc: C('연쇄 번개', 1, 'attack', 'all', '모든 적 피해 3 ×2', [['dmgAll', 3], ['dmgAll', 3]], { fx: [['dmgAll', 5], ['dmgAll', 5]], text: '모든 적 피해 5 ×2' }, { hero: 'arcanist' }),
  siphon: C('흡수', 1, 'attack', 'enemy', '피해 7 · 회복 3', [['dmg', 7], ['heal', 3]], { fx: [['dmg', 10], ['heal', 4]], text: '피해 10 · 회복 4' }, { hero: 'arcanist' }),
  emberheart: C('잿불 심장', 2, 'power', 'self', '매 턴 모든 적 화상 3', [['self', 'kindle', 3]], { cost: 1, text: '매 턴 모든 적 화상 3 (비용 1)' }, { hero: 'arcanist' }),
  study: C('탐구', 1, 'power', 'self', '매 턴 카드 +1장', [['self', 'insight', 1]], { cost: 0, text: '매 턴 카드 +1장 (비용 0)' }, { hero: 'arcanist' }),
  prism: C('프리즘', 0, 'skill', 'self', '다음 턴 에너지 +2 · 소멸', [['nextEnergy', 2]], { fx: [['nextEnergy', 3]], text: '다음 턴 에너지 +3 · 소멸' }, { hero: 'arcanist', exhaust: true }),
  comet: C('혜성', 3, 'attack', 'enemy', '피해 26', [['dmg', 26]], { fx: [['dmg', 34]], text: '피해 34' }, { hero: 'arcanist' }),
  rotbloom: C('부패의 꽃', 1, 'skill', 'enemy', '부패 6', [['st', 'rot', 6]], { fx: [['st', 'rot', 9]], text: '부패 9' }, { hero: 'arcanist' }),
  bastion: C('불락의 성채', 2, 'power', 'self', '방어가 턴이 지나도 사라지지 않음', [['self', 'bastion', 1]], { cost: 1, text: '방어가 턴이 지나도 사라지지 않음 (비용 1)' }, { hero: 'warden' }),
  shieldwall: C('방패 벽 밀치기', 1, 'attack', 'all', '모든 적에게 방어의 절반만큼 피해', [['blockHalfAll']], { fx: [['block', 4], ['blockHalfAll']], text: '방어 4 · 모든 적에게 방어의 절반만큼 피해' }, { hero: 'warden' }),
  grit: C('이 악물기', 1, 'skill', 'self', '방어 6 · 약화·취약 해제', [['block', 6], ['cleanse']], { fx: [['block', 9], ['cleanse']], text: '방어 9 · 약화·취약 해제' }, { hero: 'warden' }),
  execute: C('처단', 2, 'attack', 'enemy', '피해 10 · 대상 체력 절반 이하면 2배', [['execute', 10]], { fx: [['execute', 14]], text: '피해 14 · 대상 체력 절반 이하면 2배' }, { hero: 'warden' }),
  inferno: C('대화재', 3, 'skill', 'all', '모든 적의 화상 2배', [['burnXAll', 2]], { cost: 2, text: '모든 적의 화상 2배 (비용 2)' }, { hero: 'arcanist' }),
  frostnova: C('서리 폭발', 1, 'skill', 'all', '모든 적 약화 2 · 방어 5', [['stAll', 'weak', 2], ['block', 5]], { fx: [['stAll', 'weak', 3], ['block', 8]], text: '모든 적 약화 3 · 방어 8' }, { hero: 'arcanist' }),
  leyline: C('지맥', 3, 'power', 'self', '매 턴 에너지 +1', [['self', 'surge', 1]], { cost: 2, text: '매 턴 에너지 +1 (비용 2)' }, { hero: 'arcanist' }),
  pyroclasm: C('화쇄류', 2, 'attack', 'all', '모든 적 피해 6 · 화상 3', [['dmgAll', 6], ['stAll', 'burn', 3]], { fx: [['dmgAll', 8], ['stAll', 'burn', 5]], text: '모든 적 피해 8 · 화상 5' }, { hero: 'arcanist' }),
  // shared
  adrenaline: C('아드레날린', 0, 'skill', 'self', '에너지 +1 · 카드 2장 · 소멸', [['energy', 1], ['draw', 2]], { fx: [['energy', 2], ['draw', 2]], text: '에너지 +2 · 카드 2장 · 소멸' }, { exhaust: true }),
  parry: C('받아넘기기', 1, 'skill', 'self', '방어 6 · 카드 1장', [['block', 6], ['draw', 1]], { fx: [['block', 9], ['draw', 1]], text: '방어 9 · 카드 1장' }),
  bandage: C('응급 처치', 1, 'skill', 'self', '회복 6 · 소멸', [['heal', 6]], { fx: [['heal', 9]], text: '회복 9 · 소멸' }, { exhaust: true }),
  quickstep: C('빠른 발', 0, 'skill', 'self', '방어 2 · 카드 1장', [['block', 2], ['draw', 1]], { fx: [['block', 4], ['draw', 1]], text: '방어 4 · 카드 1장' }),
};
export const cardDef = (id) => { const up = id.endsWith('+'), base = CARDS[up ? id.slice(0, -1) : id]; if (!base) return null; return up ? { ...base, ...base.up, name: base.name + '+', upgraded: true } : base; };

export const RELICS = {
  ironBadge: { name: '철 휘장', text: '전투 시작 시 방어 6' },
  emberCoal: { name: '꺼지지 않는 숯', text: '전투 시작 시 모든 적 화상 3' },
  lantern: { name: '탐험가의 등불', text: '전투 첫 턴 에너지 +1' },
  cog: { name: '구리 톱니', text: '한 턴에 카드 3장째마다 카드 1장' },
  fieldkit: { name: '야전 구급낭', text: '전투 승리 후 체력 5 회복' },
  whetstone: { name: '숫돌', text: '전투 시작 시 힘 +1' },
  mossstone: { name: '이끼 돌', text: '최대 체력 +10 (획득 즉시)' },
  coinpurse: { name: '두툼한 지갑', text: '전투 보상 골드 +50%' },
  thornseed: { name: '가시 씨앗', text: '전투 시작 시 가시 2' },
  hourglass: { name: '모래시계', text: '매 턴 시작 시 손이 비면 카드 2장 더' },
};
const RELIC_POOL = ['lantern', 'cog', 'fieldkit', 'whetstone', 'mossstone', 'coinpurse', 'thornseed', 'hourglass'];

// Enemy moves: { t:'atk', n, hits } · { t:'def', n } · { t:'buff', st, n } · { t:'debuff', st, n } (on hero) · { t:'atkdeb', n, st, k }
// A pattern is a cycle (deterministic) or 'rand' weights. hp is a [min, max] range.
export const ENEMIES = {
  mireslug: { name: '늪 민달팽이', hp: [18, 22], art: 'slug', moves: [{ t: 'atk', n: 6 }, { t: 'debuff', st: 'weak', n: 1 }, { t: 'atk', n: 7 }] },
  brasssentry: { name: '놋쇠 파수기', hp: [24, 28], art: 'sentry', moves: [{ t: 'def', n: 8 }, { t: 'atk', n: 10 }, { t: 'atk', n: 4, hits: 2 }] },
  ashling: { name: '잿가루 정령', hp: [11, 14], art: 'wisp', moves: [{ t: 'atk', n: 4 }, { t: 'buff', st: 'str', n: 1 }, { t: 'atk', n: 5 }] },
  boar: { name: '가시등 멧돼지', hp: [30, 34], art: 'boar', moves: [{ t: 'buff', st: 'thorns', n: 2 }, { t: 'atk', n: 11 }, { t: 'atk', n: 8 }] },
  cultist: { name: '그을린 신도', hp: [40, 45], art: 'hood', moves: [{ t: 'buff', st: 'str', n: 3 }, { t: 'atk', n: 6 }, { t: 'atk', n: 6 }] },
  // elites
  matron: { name: '강철 여족장', hp: [70, 76], art: 'matron', elite: true, moves: [{ t: 'atk', n: 14 }, { t: 'def', n: 12 }, { t: 'atkdeb', n: 8, st: 'vuln', k: 2 }, { t: 'buff', st: 'str', n: 2 }] },
  lantern: { name: '쌍둥이 초롱', hp: [34, 38], art: 'lamp', elite: true, moves: [{ t: 'atkdeb', n: 6, st: 'weak', k: 1 }, { t: 'atk', n: 5, hits: 2 }, { t: 'def', n: 7 }] },
  // act 2
  sporeling: { name: '포자 덩굴', hp: [26, 30], art: 'spore', act: 2, moves: [{ t: 'debuff', st: 'weak', n: 2 }, { t: 'atk', n: 9 }, { t: 'atk', n: 5, hits: 2 }] },
  glasswing: { name: '유리날개', hp: [22, 26], art: 'glass', act: 2, moves: [{ t: 'atk', n: 3, hits: 4 }, { t: 'def', n: 6 }, { t: 'atk', n: 12 }] },
  stonekin: { name: '바위 혈족', hp: [48, 54], art: 'stone', act: 2, moves: [{ t: 'def', n: 14 }, { t: 'atk', n: 16 }, { t: 'buff', st: 'str', n: 2 }] },
  leech: { name: '피거머리', hp: [30, 34], art: 'leech', act: 2, moves: [{ t: 'drain', n: 8 }, { t: 'debuff', st: 'vuln', n: 1 }, { t: 'atk', n: 10 }] },
  mirrorknight: { name: '거울 기사', hp: [95, 100], art: 'knight', elite: true, act: 2, moves: [{ t: 'buff', st: 'thorns', n: 3 }, { t: 'atk', n: 9, hits: 2 }, { t: 'atkdeb', n: 14, st: 'weak', k: 2 }, { t: 'def', n: 15 }] },
  // bosses
  tidewyrm: { name: '심연의 조수룡', hp: [220, 220], art: 'wyrm', boss: true, act: 2, moves: [{ t: 'atk', n: 7, hits: 3 }, { t: 'buff', st: 'plate', n: 8 }, { t: 'atkdeb', n: 20, st: 'vuln', k: 2 }, { t: 'debuff', st: 'weak', n: 3 }, { t: 'drain', n: 14 }, { t: 'buff', st: 'str', n: 3 }] },
  colossus: { name: '잿불 거상', hp: [150, 150], art: 'colossus', boss: true, act: 1, moves: [{ t: 'buff', st: 'plate', n: 6 }, { t: 'atk', n: 18 }, { t: 'atk', n: 6, hits: 3 }, { t: 'atkdeb', n: 10, st: 'vuln', k: 2 }, { t: 'buff', st: 'str', n: 3 }] },
};
const FIGHTS = [['mireslug', 'ashling'], ['brasssentry'], ['ashling', 'ashling', 'ashling'], ['boar'], ['mireslug', 'mireslug'], ['cultist'], ['brasssentry', 'ashling']];
const EASY = [['mireslug'], ['ashling', 'ashling'], ['brasssentry']];
const HARD = [['boar', 'ashling'], ['cultist', 'mireslug'], ['brasssentry', 'brasssentry'], ['boar', 'mireslug']];
const ELITES = [['matron'], ['lantern', 'lantern']];
const FIGHTS2 = [['sporeling', 'glasswing'], ['stonekin'], ['leech', 'sporeling'], ['glasswing', 'glasswing'], ['leech', 'leech']];
const HARD2 = [['stonekin', 'glasswing'], ['stonekin', 'leech'], ['sporeling', 'sporeling', 'glasswing']];
const ELITES2 = [['mirrorknight'], ['mirrorknight']];
const BOSSES = ['colossus', 'tidewyrm'];
const EVENTS = ['shrine', 'smith', 'camp'];
export const EVENT_TEXT = {
  shrine: { name: '잊힌 제단', text: '피 묻은 제단이 무언가를 바치라고 속삭인다.', options: ['체력 12를 바치고 유물을 얻는다', '지나친다'] },
  smith: { name: '떠돌이 대장장이', text: '"골드 40이면 한 장 버려 주지. 공짜로 하나 벼려 줄 수도 있고."', options: ['카드 1장 강화 (무료)', '골드 40 — 카드 1장 제거', '지나친다'] },
  camp: { name: '버려진 야영지', text: '아직 따뜻한 모닥불과 누군가의 짐 꾸러미가 있다.', options: ['체력 15 회복', '골드 60을 챙긴다'] },
};

export const FLOORS = 13;          // per act: floors 0..11 on the map, floor 12 = boss
export const ACTS = 2;
/** Floors climbed so far over the whole run (act 1 = 0..12, act 2 = 13..25). */
export const depth = (S) => S.act * FLOORS + Math.max(0, S.floor);
export const HAND = 5, ENERGY = 3;

// ---------------------------------------------------------------- run
export function newRun({ seed = 1, hero = 'warden', level = 0 } = {}) {
  const H = HEROES[hero]; if (!H) throw new Error('unknown hero ' + hero);
  const S = { v: RULES_VERSION, seed: seed >>> 0, hero, level, rng: (seed * 2654435761) >>> 0, phase: 'map', act: 0, floor: -1, node: null, path: [],
    hp: H.hp, maxHp: H.hp, gold: 99, deck: H.deck.slice(), relics: [H.relic], turns: 0, kills: 0, elites: 0, log: [],
    map: null, combat: null, reward: null, shop: null, event: null, pickFor: null, result: null, actions: 0 };
  S.map = makeMap(S);
  return S;
}

/** The map: 12 floors × 7 columns; 4 paths wander up from the bottom, the union of their nodes and edges is the map. */
function makeMap(S) {
  const W = 7, rows = FLOORS - 1, nodes = {}, key = (f, x) => `${f}:${x}`;
  for (let p = 0; p < 4; p++) {
    let x = p === 0 ? 1 + rint(S, 2) : p === 1 ? 4 + rint(S, 2) : rint(S, W);
    for (let f = 0; f < rows; f++) {
      const k = key(f, x); nodes[k] = nodes[k] || { f, x, next: [] };
      if (f < rows - 1) {
        const nx = Math.max(0, Math.min(W - 1, x + rint(S, 3) - 1)), nk = key(f + 1, nx);
        if (!nodes[k].next.includes(nk)) nodes[k].next.push(nk);
        x = nx;
      } else if (!nodes[k].next.includes('boss')) nodes[k].next.push('boss');
    }
  }
  for (const n of Object.values(nodes)) {
    const f = n.f, r = rand(S);
    n.type = f === 0 ? 'fight' : f === 5 ? 'treasure' : f === rows - 1 ? 'rest'
      : f < 3 ? (r < 0.75 ? 'fight' : r < 0.9 ? 'event' : 'shop')
      : r < 0.42 ? 'fight' : r < 0.58 ? 'elite' : r < 0.7 ? 'rest' : r < 0.82 ? 'shop' : 'event';
  }
  nodes.boss = { f: rows, x: 3, next: [], type: 'boss' };
  return nodes;
}

/** Nodes the player may move to now. */
export function choices(S) {
  if (S.phase !== 'map') return [];
  if (S.floor < 0) return Object.keys(S.map).filter((k) => S.map[k].f === 0);
  return S.map[S.node].next.slice();
}

// ---------------------------------------------------------------- combat helpers
const st = (o, k) => o.st[k] || 0;
function addSt(o, k, n) { o.st[k] = (o.st[k] || 0) + n; if (o.st[k] <= 0) delete o.st[k]; }
function dealDamage(S, src, dst, base) {
  let d = base + (src ? st(src, 'str') : 0);
  if (src && st(src, 'weak')) d = Math.floor(d * 0.75);
  if (st(dst, 'vuln')) d = Math.floor(d * 1.5);
  d = Math.max(0, d);
  const absorbed = Math.min(dst.block, d); dst.block -= absorbed; const lost = d - absorbed;
  dst.hp -= lost;
  S.combat.fx.push({ who: dst.id, n: lost, blocked: absorbed });
  if (src && st(dst, 'thorns') && src !== dst) { src.hp -= st(dst, 'thorns'); S.combat.fx.push({ who: src.id, n: st(dst, 'thorns'), thorns: true }); }
  return lost;
}
function gainBlock(o, n) { o.block += Math.max(0, n + st(o, 'dex')); }

/** Extra damage on every enemy hit: +1 per difficulty level and +1 every 4 floors (act 2 restarts the count at +1). */
export const enemyBonus = (S) => S.level + (S.act ? 1 + (Math.max(0, S.floor) >> 2) : Math.max(0, S.floor) >> 2);

function rollIntent(S, e) {
  const D = ENEMIES[e.kind]; e.intent = D.moves[e.step % D.moves.length]; e.step++;
}

function startCombat(S, group, kind) {
  const lvl = S.level, scale = (1 + lvl * 0.08) * (kind === 'boss' ? 1 : 1 + Math.max(0, S.floor) * (S.act ? 0.03 : 0.04));   // act 2 has its own, tougher roster   // deeper floors hit harder
  const enemies = group.map((k, i) => {
    const D = ENEMIES[k], hp = Math.round((D.hp[0] + rint(S, D.hp[1] - D.hp[0] + 1)) * scale);
    return { id: 'e' + i, kind: k, name: D.name, hp, maxHp: hp, block: 0, st: {}, step: rint(S, D.boss ? 1 : D.moves.length), intent: null };
  });
  const P = { id: 'p', hp: S.hp, block: 0, st: {} };
  S.combat = { kind, enemies, P, draw: shuffle(S, S.deck.slice()), hand: [], discard: [], exhaust: [], energy: ENERGY, nextEnergy: 0,
    turn: 0, playedThisTurn: 0, fx: [] };
  S.phase = 'combat';
  const has = (r) => S.relics.includes(r);
  if (has('ironBadge')) gainBlock(P, 6);
  if (has('whetstone')) addSt(P, 'str', 1);
  if (has('thornseed')) addSt(P, 'thorns', 2);
  if (has('emberCoal')) for (const e of enemies) addSt(e, 'burn', 3);
  for (const e of enemies) rollIntent(S, e);
  startTurn(S, true);
}

function draw(S, n) {
  const c = S.combat;
  for (let i = 0; i < n; i++) {
    if (!c.draw.length) { if (!c.discard.length) return; c.draw = shuffle(S, c.discard); c.discard = []; }
    if (c.hand.length >= 10) return;
    c.hand.push(c.draw.pop());
  }
}

function startTurn(S, first = false) {
  const c = S.combat, P = c.P;
  c.turn++; S.turns++; c.playedThisTurn = 0;
  if (!first && !st(P, 'bastion')) P.block = 0;
  c.energy = ENERGY + st(P, 'surge') + c.nextEnergy + (first && S.relics.includes('lantern') ? 1 : 0); c.nextEnergy = 0;
  if (st(P, 'plate')) gainBlock(P, st(P, 'plate'));
  if (st(P, 'kindle')) for (const e of alive(c)) addSt(e, 'burn', st(P, 'kindle'));
  draw(S, HAND + st(P, 'insight'));
}
const alive = (c) => c.enemies.filter((e) => e.hp > 0);

function runFx(S, card, target) {
  const c = S.combat, P = c.P;
  for (const op of card.fx) {
    const [k, a, b] = op;
    if (k === 'dmg') for (let h = 0; h < (b || 1); h++) { if (target.hp > 0) dealDamage(S, P, target, a); }
    else if (k === 'dmgAll') for (const e of alive(c)) dealDamage(S, P, e, a);
    else if (k === 'block') gainBlock(P, a);
    else if (k === 'draw') draw(S, a);
    else if (k === 'energy') c.energy += a;
    else if (k === 'nextEnergy') c.nextEnergy += a;
    else if (k === 'st') addSt(target, a, b);
    else if (k === 'stAll') for (const e of alive(c)) addSt(e, a, b);
    else if (k === 'self') addSt(P, a, b);
    else if (k === 'heal') P.hp = Math.min(S.maxHp, P.hp + a);
    else if (k === 'blockHit') dealDamage(S, P, target, P.block);
    else if (k === 'detonate') { const n = st(target, 'burn') * a; delete target.st.burn; target.hp -= n; c.fx.push({ who: target.id, n, burn: true }); }
    else if (k === 'burnX') { if (st(target, 'burn')) target.st.burn *= a; }
    else if (k === 'burnXAll') { for (const e of alive(c)) if (st(e, 'burn')) e.st.burn *= a; }
    else if (k === 'blockHalfAll') { const n = Math.floor(P.block / 2); for (const e of alive(c)) dealDamage(S, P, e, n); }
    else if (k === 'cleanse') { delete P.st.weak; delete P.st.vuln; }
    else if (k === 'execute') { const half = target.hp * 2 <= target.maxHp; dealDamage(S, P, target, half ? a * 2 : a); }
  }
}

function checkEnd(S) {
  const c = S.combat;
  for (const e of c.enemies) if (e.hp <= 0 && !e.dead) { e.dead = true; e.hp = 0; S.kills++; }
  if (c.P.hp <= 0) { S.hp = 0; finish(S, false); return true; }
  if (!alive(c).length) { winCombat(S); return true; }
  return false;
}

function enemyTurn(S) {
  const c = S.combat, P = c.P;
  // end of the hero's turn: burn ticks on foes and halves
  for (const e of alive(c)) if (st(e, 'burn')) { const n = st(e, 'burn'); e.hp -= n; c.fx.push({ who: e.id, n, burn: true }); e.st.burn = Math.floor(n / 2); if (!e.st.burn) delete e.st.burn; }
  for (const k of ['weak', 'vuln']) if (st(P, k)) addSt(P, k, -1);
  if (checkEnd(S)) return;
  for (const e of alive(c)) {
    e.block = 0;
    if (st(e, 'rot')) { e.hp -= st(e, 'rot'); c.fx.push({ who: e.id, n: st(e, 'rot'), rot: true }); addSt(e, 'rot', -1); if (e.hp <= 0) continue; }
    if (st(e, 'plate')) e.block += st(e, 'plate');
    const m = e.intent;
    if (m.t === 'atk' || m.t === 'atkdeb') for (let h = 0; h < (m.hits || 1); h++) { if (P.hp > 0 && e.hp > 0) dealDamage(S, e, P, m.n + enemyBonus(S)); }
    if (m.t === 'drain' && P.hp > 0 && e.hp > 0) { const lost = dealDamage(S, e, P, m.n + enemyBonus(S)); e.hp = Math.min(e.maxHp, e.hp + lost); }
    if (m.t === 'atkdeb' || m.t === 'debuff') addSt(P, m.st, m.k || m.n);
    if (m.t === 'def') e.block += m.n;
    if (m.t === 'buff') addSt(e, m.st, m.n);
    for (const k of ['weak', 'vuln']) if (st(e, k)) addSt(e, k, -1);
    if (P.hp <= 0) break;
  }
  if (checkEnd(S)) return;
  for (const e of alive(c)) rollIntent(S, e);
  startTurn(S);
}

function winCombat(S) {
  const c = S.combat, kind = c.kind;
  S.hp = Math.max(1, c.P.hp);
  if (S.relics.includes('fieldkit')) S.hp = Math.min(S.maxHp, S.hp + 5);
  if (kind === 'elite') S.elites++;
  S.combat = null;
  if (kind === 'boss') {
    if (S.act >= ACTS - 1) { finish(S, true); return; }
    // next act: heal 60 % of what is missing, a new tower, a boss reward (2 upgraded cards + 1, 100 gold, a relic)
    S.act++; S.hp = Math.min(S.maxHp, S.hp + Math.round((S.maxHp - S.hp) * 0.6)); S.gold += 100;
    S.map = makeMap(S); S.node = null; S.floor = -1; S.path = [];
    const cards = cardOffer(S, 3, true); cards[1] = cards[1].endsWith('+') ? cards[1] : cards[1] + '+';
    S.reward = { gold: 100, cards, relic: relicOffer(S), actClear: S.act };
    if (S.reward.relic) gainRelic(S, S.reward.relic);
    S.phase = 'reward'; return;
  }
  let gold = kind === 'elite' ? 30 + rint(S, 11) : 12 + rint(S, 9);
  if (S.relics.includes('coinpurse')) gold = Math.floor(gold * 1.5);
  S.gold += gold;
  S.reward = { gold, cards: cardOffer(S, 3, kind === 'elite'), relic: kind === 'elite' ? relicOffer(S) : null };
  if (S.reward.relic) gainRelic(S, S.reward.relic);
  S.phase = 'reward';
}

function cardOffer(S, n, rich) {
  const pool = Object.keys(CARDS).filter((k) => !CARDS[k].starter && (!CARDS[k].hero || CARDS[k].hero === S.hero));
  const out = [];
  while (out.length < n && out.length < pool.length) { const k = pick(S, pool); if (!out.includes(k)) out.push(k); }
  if (rich) out[0] = out[0] + '+';
  return out;
}
function relicOffer(S) { const left = RELIC_POOL.filter((r) => !S.relics.includes(r)); return left.length ? pick(S, left) : null; }
function gainRelic(S, r) { S.relics.push(r); if (r === 'mossstone') { S.maxHp += 10; S.hp += 10; } }

function finish(S, won) {
  const killedBy = !won && S.combat ? alive(S.combat).map((e) => e.kind) : [];
  S.phase = won ? 'victory' : 'defeat'; S.combat = null;
  S.result = { won, killedBy, act: S.act + 1, depth: depth(S), floor: S.floor, turns: S.turns, kills: S.kills, elites: S.elites, hp: S.hp, maxHp: S.maxHp, gold: S.gold, score: score(S, won) };
}
/** Run score: progress, elites and the boss, plus what is left of your health. */
export function score(S, won = S.phase === 'victory') {
  return Math.max(0, (depth(S) + 1) * 20 + S.elites * 40 + S.kills * 5 + (won ? 300 + S.hp * 2 + Math.max(0, 200 - S.turns) : 0));
}
/** S A B C D: a win grades by health left, a loss by how far you got (for the portals' points). */
export function grade(S) {
  if (!S.result) return null;
  if (S.result.won) { const k = S.hp / S.maxHp; return k >= 0.5 ? 'S' : k >= 0.25 ? 'A' : 'B'; }
  return depth(S) >= 8 ? 'C' : 'D';
}

function enterNode(S, k) {
  const n = S.map[k]; S.node = k; S.floor = n.f; S.path.push(k);
  if (n.type === 'fight') startCombat(S, S.act ? (S.floor < 6 ? pick(S, FIGHTS2) : pick(S, HARD2)) : S.floor < 3 ? pick(S, EASY) : S.floor < 7 ? pick(S, FIGHTS) : pick(S, HARD), 'fight');
  else if (n.type === 'elite') startCombat(S, pick(S, S.act ? ELITES2 : ELITES), 'elite');
  else if (n.type === 'boss') startCombat(S, [BOSSES[S.act]], 'boss');
  else if (n.type === 'rest') S.phase = 'rest';
  else if (n.type === 'treasure') { const r = relicOffer(S); if (r) gainRelic(S, r); S.reward = { gold: 0, cards: [], relic: r }; S.phase = 'reward'; }
  else if (n.type === 'shop') { S.shop = makeShop(S); S.phase = 'shop'; }
  else if (n.type === 'event') { S.event = pick(S, EVENTS); S.phase = 'event'; }
}

function makeShop(S) {
  const cards = cardOffer(S, 4, false).map((id) => ({ id, price: 45 + rint(S, 30) }));
  const r = relicOffer(S);
  return { cards, relic: r ? { id: r, price: 140 + rint(S, 40) } : null, removePrice: 60, removed: false };
}

// ---------------------------------------------------------------- the one entry point
/** Legal actions in the current state (used by the UI, the bot and verify). */
export function legal(S) {
  const A = [];
  if (S.phase === 'map') for (const k of choices(S)) A.push({ a: 'go', k });
  else if (S.phase === 'combat') {
    const c = S.combat;
    c.hand.forEach((id, i) => {
      const d = cardDef(id); if (d.cost > c.energy) return;
      if (d.target === 'enemy') c.enemies.forEach((e, t) => { if (e.hp > 0) A.push({ a: 'play', i, t }); });
      else A.push({ a: 'play', i, t: -1 });
    });
    A.push({ a: 'end' });
  } else if (S.phase === 'reward') { S.reward.cards.forEach((_, i) => A.push({ a: 'take', i })); A.push({ a: 'skip' }); }
  else if (S.phase === 'rest') { A.push({ a: 'rest', o: 'heal' }); A.push({ a: 'rest', o: 'smith' }); }
  else if (S.phase === 'shop') {
    S.shop.cards.forEach((c, i) => { if (c && S.gold >= c.price) A.push({ a: 'buy', i }); });
    if (S.shop.relic && S.gold >= S.shop.relic.price) A.push({ a: 'buy', i: -1 });
    if (!S.shop.removed && S.gold >= S.shop.removePrice && S.deck.length > 5) A.push({ a: 'remove' });
    A.push({ a: 'leave' });
  } else if (S.phase === 'event') EVENT_TEXT[S.event].options.forEach((_, i) => A.push({ a: 'opt', i }));
  else if (S.phase === 'pick') { S.deck.forEach((id, i) => { if (S.pickFor !== 'upgrade' || !id.endsWith('+')) A.push({ a: 'pick', i }); }); A.push({ a: 'cancel' }); }
  return A;
}

/** Apply one action; throws on an illegal one (verify turns that into a rejected proof). Returns S. */
export function apply(S, act) {
  const bad = (why) => { throw new Error(`illegal ${JSON.stringify(act)} in ${S.phase}: ${why}`); };
  S.actions++;
  if (S.phase === 'map') {
    if (act.a !== 'go' || !choices(S).includes(act.k)) bad('not a reachable node');
    enterNode(S, act.k);
  } else if (S.phase === 'combat') {
    const c = S.combat; c.fx = [];
    if (act.a === 'end') {
      for (const id of c.hand) c.discard.push(id); c.hand = [];
      enemyTurn(S);
    } else if (act.a === 'play') {
      const id = c.hand[act.i]; if (id == null) bad('no card');
      const d = cardDef(id); if (d.cost > c.energy) bad('energy');
      let target = null;
      if (d.target === 'enemy') { target = c.enemies[act.t]; if (!target || target.hp <= 0) bad('target'); }
      c.energy -= d.cost; c.hand.splice(act.i, 1);
      runFx(S, d, target);
      if (d.type === 'power') { /* stays in play */ } else if (d.exhaust) c.exhaust.push(id); else c.discard.push(id);
      c.playedThisTurn++;
      if (S.relics.includes('cog') && c.playedThisTurn % 3 === 0) draw(S, 1);
      if (S.relics.includes('hourglass') && !c.hand.length) draw(S, 2);
      checkEnd(S);
    } else bad('combat action');
  } else if (S.phase === 'reward') {
    if (act.a === 'take') { const id = S.reward.cards[act.i]; if (!id) bad('card'); S.deck.push(id); }
    else if (act.a !== 'skip') bad('reward action');
    S.reward = null; S.phase = 'map';
  } else if (S.phase === 'rest') {
    if (act.a !== 'rest') bad('rest action');
    if (act.o === 'heal') { S.hp = Math.min(S.maxHp, S.hp + Math.round(S.maxHp * 0.3)); S.phase = 'map'; }
    else if (act.o === 'smith') { S.pickFor = 'upgrade'; S.back = 'rest'; S.phase = 'pick'; }
    else bad('rest option');
  } else if (S.phase === 'shop') {
    const sh = S.shop;
    if (act.a === 'buy' && act.i >= 0) { const c = sh.cards[act.i]; if (!c || S.gold < c.price) bad('buy'); S.gold -= c.price; S.deck.push(c.id); sh.cards[act.i] = null; }
    else if (act.a === 'buy') { if (!sh.relic || S.gold < sh.relic.price) bad('buy relic'); S.gold -= sh.relic.price; gainRelic(S, sh.relic.id); sh.relic = null; }
    else if (act.a === 'remove') { if (sh.removed || S.gold < sh.removePrice) bad('remove'); S.pickFor = 'removePaid'; S.back = 'shop'; S.phase = 'pick'; }
    else if (act.a === 'leave') { S.shop = null; S.phase = 'map'; }
    else bad('shop action');
  } else if (S.phase === 'event') {
    if (act.a !== 'opt' || !EVENT_TEXT[S.event].options[act.i]) bad('event option');
    const ev = S.event; S.event = null; S.phase = 'map';
    if (ev === 'shrine' && act.i === 0) { S.hp = Math.max(1, S.hp - 12); const r = relicOffer(S); if (r) gainRelic(S, r); }
    if (ev === 'smith' && act.i === 0) { S.pickFor = 'upgrade'; S.back = 'map'; S.phase = 'pick'; }
    if (ev === 'smith' && act.i === 1) { if (S.gold < 40) bad('gold'); S.gold -= 40; S.pickFor = 'remove'; S.back = 'map'; S.phase = 'pick'; }
    if (ev === 'camp') { if (act.i === 0) S.hp = Math.min(S.maxHp, S.hp + 15); else S.gold += 60; }
  } else if (S.phase === 'pick') {
    const back = S.back === 'shop' ? 'shop' : S.back === 'rest' ? 'rest' : 'map';
    if (act.a === 'cancel') { S.pickFor = null; S.phase = back; return S; }
    if (act.a !== 'pick' || S.deck[act.i] == null) bad('pick');
    if (S.pickFor === 'upgrade') { if (S.deck[act.i].endsWith('+')) bad('already upgraded'); S.deck[act.i] += '+'; S.phase = back === 'rest' ? 'map' : back; }
    else { S.deck.splice(act.i, 1); if (S.pickFor === 'removePaid') { S.gold -= S.shop.removePrice; S.shop.removed = true; } S.phase = back; }
    S.pickFor = null;
  } else bad('run is over');
  return S;
}

// ---------------------------------------------------------------- action codec (save file + proof)
export function encode(act) {
  switch (act.a) {
    case 'go': return 'g' + act.k; case 'play': return `p${act.i}.${act.t}`; case 'end': return 'e';
    case 'take': return 't' + act.i; case 'skip': return 's'; case 'rest': return act.o === 'heal' ? 'rh' : 'rs';
    case 'buy': return 'b' + act.i; case 'remove': return 'r'; case 'leave': return 'l';
    case 'opt': return 'o' + act.i; case 'pick': return 'k' + act.i; case 'cancel': return 'c';
    default: throw new Error('cannot encode ' + JSON.stringify(act));
  }
}
export function decode(tok) {
  let m;
  if ((m = /^g(\d+:\d+|boss)$/.exec(tok))) return { a: 'go', k: m[1] };
  if ((m = /^p(\d+)\.(-?\d+)$/.exec(tok))) return { a: 'play', i: +m[1], t: +m[2] };
  if (tok === 'e') return { a: 'end' }; if (tok === 's') return { a: 'skip' };
  if (tok === 'rh') return { a: 'rest', o: 'heal' }; if (tok === 'rs') return { a: 'rest', o: 'smith' };
  if (tok === 'r') return { a: 'remove' }; if (tok === 'l') return { a: 'leave' }; if (tok === 'c') return { a: 'cancel' };
  if ((m = /^([tbok])(-?\d+)$/.exec(tok))) return { a: { t: 'take', b: 'buy', o: 'opt', k: 'pick' }[m[1]], i: +m[2] };
  return null;
}
