// ROGUE LEGENDS — English text for the screen (Korean lives in logic.js and in main.js itself). Screen only: the rules and
// the verifier never read this file. tr('한국어 원문 {n}', { n }) returns the English line when the language is English.
const KEY = 'rogue-legends.lang';
let lang = (() => { let saved = null; try { saved = localStorage.getItem(KEY); } catch { /* private mode */ } return saved || ((navigator.language || '').startsWith('ko') ? 'ko' : 'en'); })();
export const getLang = () => lang;
export function setLang(l) { lang = l === 'en' ? 'en' : 'ko'; try { localStorage.setItem(KEY, lang); } catch { /* private mode */ } document.documentElement.lang = lang; }
document.documentElement.lang = lang;

const fill = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? `{${k}}`));
export function tr(ko, vars) { return fill(lang === 'en' && UI[ko] != null ? UI[ko] : ko, vars); }

// card id → [name, text, upgraded text]
const CARDS = {
  strike: ['Strike', 'Deal 6', 'Deal 9'], guard: ['Raise Shield', 'Block 5', 'Block 8'], shieldbash: ['Shield Bash', 'Deal 5 · Block 5', 'Deal 7 · Block 7'],
  cleave: ['Sweeping Cut', 'Deal 8 to all foes', 'Deal 11 to all foes'], ironwall: ['Iron Wall', 'Block 14', 'Block 19'],
  brace: ['Brace', 'Block 3 · Draw 1', 'Block 5 · Draw 1'], rampart: ['Rampart Charge', 'Deal damage equal to your Block', 'Deal damage equal to your Block (cost 0)'],
  warcry: ['War Cry', 'Strength +2', 'Strength +3'], thornmail: ['Thorn Mail', 'Thorns 3 (attackers take damage)', 'Thorns 5'],
  sunder: ['Sunder', 'Deal 13 · Vulnerable 2', 'Deal 17 · Vulnerable 3'], taunt: ['Taunt', 'All foes Weak 2 · Block 4', 'All foes Weak 3 · Block 6'],
  twincut: ['Twin Blades', 'Deal 4 ×2', 'Deal 6 ×2'], rhythm: ['Battle Breath', 'Energy +1 · Exhaust', 'Energy +2 · Exhaust'],
  holdground: ['Hold Ground', 'Dexterity +2', 'Dexterity +3'], wardrum: ['War Drum', 'Gain 3 Block every turn', 'Gain 5 Block every turn'],
  overrun: ['Overrun', 'Deal 7 ×2 · Draw 1', 'Deal 9 ×2 · Draw 1'],
  bastion: ['Unbroken Keep', 'Your Block no longer fades', 'Your Block no longer fades (cost 1)'],
  shieldwall: ['Shield Wall Shove', 'Deal half your Block to all foes', 'Block 4 · Deal half your Block to all foes'],
  grit: ['Grit', 'Block 6 · Remove Weak and Vulnerable', 'Block 9 · Remove Weak and Vulnerable'],
  execute: ['Execution', 'Deal 10 · Doubled if the target is at half health or less', 'Deal 14 · Doubled if the target is at half health or less'],
  bolt: ['Arcane Bolt', 'Deal 6', 'Deal 9'], ward: ['Ward', 'Block 5', 'Block 8'], kindle: ['Kindle', 'Burn 5', 'Burn 8'],
  focus: ['Focus', 'Draw 2 · Exhaust', 'Draw 3 · Exhaust'], flamewave: ['Flame Wave', 'All foes Burn 6', 'All foes Burn 9'],
  stoke: ['Stoke', "Double the target's Burn", "Double the target's Burn (cost 0)"],
  cindershield: ['Cinder Shield', 'Block 6 · All foes Burn 2', 'Block 8 · All foes Burn 4'],
  detonate: ['Detonate', 'Deal Burn ×2 (consumes Burn)', 'Deal Burn ×3 (consumes Burn)'],
  frostlance: ['Frost Lance', 'Deal 8 · Weak 2', 'Deal 11 · Weak 3'], chainarc: ['Chain Lightning', 'Deal 3 to all foes ×2', 'Deal 5 to all foes ×2'],
  siphon: ['Siphon', 'Deal 7 · Heal 3', 'Deal 10 · Heal 4'], emberheart: ['Ember Heart', 'All foes Burn 3 every turn', 'All foes Burn 3 every turn (cost 1)'],
  study: ['Study', 'Draw 1 more card every turn', 'Draw 1 more card every turn (cost 0)'],
  prism: ['Prism', 'Next turn Energy +2 · Exhaust', 'Next turn Energy +3 · Exhaust'], comet: ['Comet', 'Deal 26', 'Deal 34'],
  rotbloom: ['Rot Bloom', 'Rot 6', 'Rot 9'], inferno: ['Inferno', "Double every foe's Burn", "Double every foe's Burn (cost 2)"],
  frostnova: ['Frost Nova', 'All foes Weak 2 · Block 5', 'All foes Weak 3 · Block 8'], leyline: ['Ley Line', 'Energy +1 every turn', 'Energy +1 every turn (cost 2)'],
  pyroclasm: ['Pyroclasm', 'Deal 6 to all foes · Burn 3', 'Deal 8 to all foes · Burn 5'],
  bandage: ['First Aid', 'Heal 6 · Exhaust', 'Heal 9 · Exhaust'], quickstep: ['Quick Step', 'Block 2 · Draw 1', 'Block 4 · Draw 1'],
  adrenaline: ['Adrenaline', 'Energy +1 · Draw 2 · Exhaust', 'Energy +2 · Draw 2 · Exhaust'], parry: ['Parry', 'Block 6 · Draw 1', 'Block 9 · Draw 1'],
};
export function cardName(id, d) { if (lang !== 'en') return d.name; const b = CARDS[id.replace(/\+$/, '')]; return b ? b[0] + (d.upgraded ? '+' : '') : d.name; }
export function cardText(id, d) { if (lang !== 'en') return d.text; const b = CARDS[id.replace(/\+$/, '')]; return b ? (d.upgraded ? b[2] : b[1]) : d.text; }

const ENEMIES = { mireslug: 'Mire Slug', brasssentry: 'Brass Sentry', ashling: 'Ashling', boar: 'Thornback Boar', cultist: 'Scorched Acolyte',
  matron: 'Iron Matron', lantern: 'Twin Lantern', sporeling: 'Spore Vine', glasswing: 'Glasswing', stonekin: 'Stonekin', leech: 'Blood Leech',
  mirrorknight: 'Mirror Knight', colossus: 'The Cinder Colossus', tidewyrm: 'The Abyssal Tidewyrm' };
export const enemyName = (kind, ko) => (lang === 'en' ? ENEMIES[kind] || ko : ko);

const RELICS = { ironBadge: ['Iron Badge', 'Start each combat with 6 Block'], emberCoal: ['Undying Coal', 'Start each combat: all foes Burn 3'],
  lantern: ["Explorer's Lantern", '+1 Energy on the first turn of combat'], cog: ['Copper Cog', 'Every 3rd card you play in a turn draws 1'],
  fieldkit: ['Field Kit', 'Heal 5 after winning a combat'], whetstone: ['Whetstone', 'Start each combat with Strength +1'],
  mossstone: ['Moss Stone', '+10 Max HP (when found)'], coinpurse: ['Fat Purse', '+50% gold from combats'],
  thornseed: ['Thorn Seed', 'Start each combat with Thorns 2'], hourglass: ['Hourglass', 'When your hand empties, draw 2'] };
export const relicName = (r, ko) => (lang === 'en' ? RELICS[r]?.[0] || ko : ko);
export const relicText = (r, ko) => (lang === 'en' ? RELICS[r]?.[1] || ko : ko);

const HEROES = { warden: ['Warden of the Wall', 'Stack Block, then hit with it. Holds the line with Strength, Thorns and Plate.'],
  arcanist: ['Ember Arcanist', 'Set foes on fire (Burn) and detonate it all at once. Draws many cards and bends Energy.'] };
export const heroTitle = (id, ko) => (lang === 'en' ? HEROES[id][0] : ko);
export const heroDesc = (id, ko) => (lang === 'en' ? HEROES[id][1] : ko);

const EVENTS = {
  shrine: ['Forgotten Altar', 'A blood-stained altar whispers for an offering.', ['Offer 12 HP for a relic', 'Walk past']],
  smith: ['Wandering Smith', '"40 gold and I\'ll scrap a card for you. Or I can sharpen one, free."', ['Upgrade a card (free)', '40 gold — remove a card', 'Walk past']],
  camp: ['Abandoned Camp', "A still-warm fire and someone's pack.", ['Heal 15', 'Take the 60 gold']],
};
export function eventText(id, E) { if (lang !== 'en') return E; const e = EVENTS[id]; return { name: e[0], text: e[1], options: e[2] }; }

const ST = { str: ['Strength', '+1 attack damage each'], dex: ['Dexterity', '+1 Block each'], vuln: ['Vulnerable', 'Takes 50% more damage'],
  weak: ['Weak', 'Deals 25% less damage'], burn: ['Burn', 'Takes that much at the end of your turn, then halves'],
  rot: ['Rot', 'Takes damage at the start of its turn, then −1'], thorns: ['Thorns', 'Attackers take this damage'],
  plate: ['Plate', 'Gain this much Block every turn'], kindle: ['Ember', 'All foes Burn this much every turn'],
  insight: ['Insight', 'Draw more cards every turn'], bastion: ['Bastion', 'Block does not fade'], surge: ['Surge', '+Energy every turn'] };
const ST_KO = { str: ['힘', '공격 피해 +1씩'], dex: ['민첩', '방어 +1씩'], vuln: ['취약', '받는 피해 +50%'], weak: ['약화', '주는 피해 −25%'],
  burn: ['화상', '내 턴이 끝날 때 그만큼 피해, 절반으로 줄어듦'], rot: ['부패', '자기 턴 시작에 피해, 1씩 줄어듦'], thorns: ['가시', '공격한 상대에게 반사 피해'],
  plate: ['판금', '매 턴 시작에 방어'], kindle: ['잿불', '매 턴 모든 적 화상'], insight: ['통찰', '매 턴 카드 추가'], bastion: ['성채', '방어가 사라지지 않음'], surge: ['지맥', '매 턴 에너지 추가'] };
export const stLabel = (k) => ((lang === 'en' ? ST : ST_KO)[k] || [k])[0];
export const stTip = (k) => ((lang === 'en' ? ST : ST_KO)[k] || [k, ''])[1];

// interface lines: Korean original → English
const UI = {
  'PP 상점': 'PP shop', '구매': 'Buy', '보유': 'Owned', '닫기': 'Close', '구매 완료!': 'Purchased!', '포털 확인 창을 기다리는 중…': 'Waiting for the portal to confirm…',
  '보유 PP {pp} · 결제는 BIT PARK 포털이 확인 창을 띄운 뒤 서버에서 처리합니다.': 'You have {pp} PP · BIT PARK asks you to confirm, then its server takes payment.',
  '이 포털에서는 아직 게임 상점을 쓸 수 없습니다.': 'This portal does not offer the game shop yet.', 'BIT PARK에서 이 게임을 열면 PP(포털 포인트)로 살 수 있습니다.': 'Open this game on BIT PARK to buy with PP (portal points).',
  '꾸미기 아이템이라 점수·순위에는 영향이 없습니다.': 'Cosmetic only: scores and rankings are not affected.',
  'BIT PARK에 로그인해야 합니다': 'Sign in to BIT PARK first', 'PP가 부족합니다': 'Not enough PP', '이미 가지고 있습니다': 'Already owned', '구매를 취소했습니다': 'Purchase cancelled',
  '지금은 판매하지 않는 아이템입니다': 'Not on sale right now', '이 포털은 아직 게임 상점을 지원하지 않습니다': 'This portal does not support the game shop yet', '포털이 응답하지 않습니다': 'The portal did not answer', '구매하지 못했습니다': 'Purchase failed',
  '수호자 스킨: 서리 갑주': 'Warden skin: Frost Plate', '수호자의 갑옷이 차가운 서리빛으로 바뀝니다.': "The Warden's armour turns frost-blue.",
  '비전술사 스킨: 공허': 'Arcanist skin: Void', '비전술사의 불꽃이 보랏빛 공허로 바뀝니다.': "The Arcanist's flames turn to violet void.",
  '황금 카드 테두리': 'Gilded card frames', '모든 카드에 금박 테두리와 빛이 들어갑니다.': 'Every card gets a gold-leaf frame and glow.',
  '할 수 없는 행동입니다': 'You cannot do that', '이번 원정을 포기하고 처음 화면으로 갈까요?': 'Abandon this expedition and return to the title?',
  '체력': 'HP', '최고 기록': 'Best', '없음': 'none', '난이도 {l}': 'Difficulty {l}', ' (+{p}% 체력·+{l} 피해)': ' (+{p}% HP · +{l} damage)', ' (기본)': ' (standard)',
  '원정 시작': 'Begin expedition', '이어 하기': 'Continue',
  '두 개의 탑(각 13층)을 올라 잿불 거상과 심연의 조수룡을 쓰러뜨리세요 · 카드 숫자키 1–9 · Tab 대상 · E 턴 종료 · D 덱 보기 · M 음악':
    'Climb two towers (13 floors each) and defeat the Cinder Colossus and the Abyssal Tidewyrm · cards 1–9 · Tab target · E end turn · D deck · M music · gamepad supported',
  '모든 원정은 행동 기록으로 저장되고, 같은 기록으로 결과를 다시 계산해 확인할 수 있습니다.': 'Every expedition is saved as its list of actions, and the same list re-computes the result for verified rankings.',
  '{a}막': 'Act {a}', '{f}/{n}층': 'Floor {f}/{n}', '난이도': 'Difficulty', '덱 {n}': 'Deck {n}', '처음으로': 'Title', '포기': 'Abandon',
  '⚔️ 전투 · 💀 정예 · 🔥 모닥불 · 🪙 상점': '⚔️ fight · 💀 elite · 🔥 campfire · 🪙 shop', '❔ 사건 · 🎁 보물 · 👑 보스 — 빛나는 칸으로 이동': '❔ event · 🎁 treasure · 👑 boss — move to a glowing node',
  '공격': 'Attack', '{n}회': '{n} hits', '흡혈 공격 — 준 피해만큼 회복': 'Draining attack — heals by the damage dealt', '방어 {n}': 'Block {n}', '당신에게 {s} {n}': '{s} {n} on you',
  '기술': 'Skill', '능력': 'Power', ' · 소멸': ' · Exhaust', ' · 정예': ' · Elite', ' · 보스': ' · Boss',
  '대상을 고르세요 (클릭 · Tab 후 같은 숫자키) · Esc 취소': 'Choose a target (click, or Tab then the same number) · Esc to cancel',
  '에너지': 'Energy', '뽑을 카드': 'Draw pile', '턴 종료 (E)': 'End turn (E)', '버린 카드': 'Discard', '소멸 {n}': 'Exhausted {n}',
  '에너지가 부족합니다': 'Not enough Energy', '{h} — {a}막 돌파! {b}막의 탑이 열린다': '{h} — Act {a} cleared! The tower of Act {b} opens',
  '승리!': 'Victory!', '보물': 'Treasure', '잃은 체력의 60%를 회복했습니다.': 'You recovered 60% of your missing HP.', '골드 +{n}': 'Gold +{n}', ' · 유물: ': ' · Relic: ',
  '덱에 넣을 카드 1장을 고르세요.': 'Choose a card to add to your deck.', '건너뛰기': 'Skip', '계속': 'Continue',
  '모닥불': 'Campfire', '잠시 숨을 돌립니다.': 'You catch your breath.', '🔥 쉬기 — 체력 {n} 회복': '🔥 Rest — heal {n}', '⚒️ 벼리기 — 카드 1장 강화': '⚒️ Smith — upgrade a card',
  '떠돌이 상인': 'Wandering Merchant', '가진 골드 {n}': 'Your gold: {n}', '✂️ 카드 1장 제거 · 🪙 {n}': '✂️ Remove a card · 🪙 {n}', '떠나기': 'Leave', '골드가 부족합니다': 'Not enough gold',
  '강화할 카드': 'Upgrade a card', '제거할 카드': 'Remove a card', '강화하면 수치가 오르거나 비용이 줄어듭니다.': 'Upgrading raises numbers or lowers cost.',
  '덱이 얇을수록 좋은 카드를 자주 뽑습니다.': 'A thinner deck draws its best cards more often.', '취소': 'Cancel',
  '두 탑을 모두 정복했다!': 'Both towers conquered!', '원정 실패': 'Expedition failed', '도달한 층': 'Reached', '{a}막 {f}층 (전체 {d} / {n})': 'Act {a} floor {f} ({d} / {n} overall)',
  '처치': 'Kills', '{k} (정예 {e})': '{k} ({e} elites)', '턴': 'Turns', '남은 체력': 'HP left', '점수': 'Score', ' · 최고 기록!': ' · new best!', '포털 보상': 'Portal reward',
  '이 원정의 행동 {n}개가 저장되었고, 같은 기록으로 결과를 다시 계산해 확인할 수 있습니다.': 'The {n} actions of this expedition were saved; the same list re-computes the result.',
  '새 원정': 'New expedition', '규칙: 기본': 'Rules: Classic', '규칙: 메아리': 'Rules: Echo', '규칙: 밀물': 'Rules: Tide',
  '덱빌딩 로그라이크 기본 규칙': 'The base deckbuilding roguelike rules',
  '전투에서 4번째 카드마다 피해·방어·상태 효과가 한 번 더 (대신 적 체력 +25%)': 'Every 4th card in a combat repeats its damage, block and statuses (foes have +25% HP)',
  '손패가 턴을 넘어 남고, 남은 카드는 턴마다 피해·방어 +2 (최대 +6). 새 카드는 손패 5장까지만': 'Your hand stays between turns and held cards swell +2 damage/block per turn (max +6); you only draw back up to 5',
  '밀물: 피해·방어 +{n}': 'Tide: damage/block +{n}', '메아리까지 {n}장': 'Echo in {n} cards', '플레이 기록 {n}판 · 승리 {w}': 'Play history: {n} runs · {w} won', '기록 내보내기 (JSON)': 'Export history (JSON)', '덱 ({n})': 'Deck ({n})', '닫기': 'Close',
};
