// Original vector art for ROGUE LEGENDS (drawn for this game; no third-party assets). Each returns an inline SVG string.
// Every drawing gets its own gradient id: several different creatures on one page must not share id="g".
let uid = 0;
const wrap = (body, defs = '') => { const id = 'rg' + ++uid; return `<svg viewBox="0 0 160 160" class="art" aria-hidden="true"><defs>${defs.replace('id="g"', `id="${id}"`)}</defs>${body.split('url(#g)').join(`url(#${id})`)}</svg>`; };
const shadow = '<ellipse cx="80" cy="146" rx="46" ry="8" fill="#000" opacity=".35"/>';
const grad = (id, a, b) => `<radialGradient id="${id}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`;
const eyes = (y, dx = 12, c = '#ffd36b') => `<circle cx="${80 - dx}" cy="${y}" r="5" fill="${c}"/><circle cx="${80 + dx}" cy="${y}" r="5" fill="${c}"/>`;

export const ENEMY_ART = {
  slug: () => wrap(`${shadow}<path d="M22 138 Q30 92 74 88 Q120 84 136 120 Q142 138 120 140 Z" fill="url(#g)"/>
    <path d="M60 92 Q58 66 70 60 M84 90 Q88 64 100 58" stroke="#6f8a3c" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="70" cy="58" r="6" fill="#d9f08a"/><circle cx="100" cy="56" r="6" fill="#d9f08a"/>
    <path d="M40 130 Q70 122 120 130" stroke="#3f5520" stroke-width="3" fill="none" opacity=".6"/>`, grad('g', '#a7c25a', '#3f5520')),
  sentry: () => wrap(`${shadow}<rect x="46" y="70" width="68" height="70" rx="10" fill="url(#g)"/>
    <rect x="54" y="34" width="52" height="40" rx="8" fill="#c99a4b"/><rect x="60" y="46" width="40" height="12" rx="6" fill="#2a1a0c"/>
    <circle cx="80" cy="52" r="5" fill="#ff6a3d"/><rect x="28" y="84" width="18" height="40" rx="6" fill="#8a6430"/><rect x="114" y="84" width="18" height="40" rx="6" fill="#8a6430"/>
    <circle cx="62" cy="100" r="5" fill="#5a3f1a"/><circle cx="98" cy="100" r="5" fill="#5a3f1a"/>`, grad('g', '#e3b56a', '#7a5524')),
  wisp: () => wrap(`<path d="M80 26 Q112 60 104 98 Q100 126 80 136 Q60 126 56 98 Q48 60 80 26 Z" fill="url(#g)"/>
    <path d="M80 50 Q96 76 90 104 Q86 118 80 122 Q74 118 70 104 Q64 76 80 50 Z" fill="#ffe2a6" opacity=".7"/>${eyes(92, 9, '#3a1406')}
    <circle cx="44" cy="70" r="4" fill="#ff9a5a" opacity=".7"/><circle cx="120" cy="58" r="3" fill="#ff9a5a" opacity=".7"/>`, grad('g', '#ffb46a', '#c2381c')),
  boar: () => wrap(`${shadow}<ellipse cx="84" cy="104" rx="56" ry="34" fill="url(#g)"/>
    <path d="M36 92 L22 74 L46 82 M50 76 L44 56 L62 72 M70 72 L72 50 L84 70 M92 72 L100 52 L106 74 M114 78 L128 60 L126 84" fill="#d8cdb8" stroke="#d8cdb8" stroke-width="3"/>
    <ellipse cx="34" cy="110" rx="22" ry="18" fill="#6d4a35"/><path d="M18 116 Q12 104 20 96" stroke="#f3ead8" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="38" cy="102" r="4" fill="#ffd36b"/><rect x="54" y="128" width="12" height="14" rx="4" fill="#4d3324"/><rect x="104" y="128" width="12" height="14" rx="4" fill="#4d3324"/>`, grad('g', '#9a6b4e', '#4d3324')),
  hood: () => wrap(`${shadow}<path d="M80 22 Q122 40 120 92 L126 142 L34 142 L40 92 Q38 40 80 22 Z" fill="url(#g)"/>
    <path d="M80 44 Q104 54 102 86 Q92 98 80 98 Q68 98 58 86 Q56 54 80 44 Z" fill="#140c0a"/>${eyes(74, 10, '#ff5a3a')}
    <path d="M58 118 L102 118" stroke="#d9483b" stroke-width="4"/><circle cx="80" cy="118" r="7" fill="#d9483b"/>`, grad('g', '#6d3a35', '#241212')),
  matron: () => wrap(`${shadow}<path d="M40 142 L48 70 Q80 52 112 70 L120 142 Z" fill="url(#g)"/>
    <circle cx="80" cy="46" r="24" fill="#9aa3ad"/><rect x="62" y="40" width="36" height="10" rx="4" fill="#1a1d22"/><circle cx="72" cy="45" r="3" fill="#ffd36b"/><circle cx="88" cy="45" r="3" fill="#ffd36b"/>
    <path d="M56 22 L64 34 L72 20 L80 34 L88 20 L96 34 L104 22" stroke="#e9b45a" stroke-width="4" fill="none"/>
    <rect x="122" y="40" width="8" height="104" rx="3" fill="#7a8592"/><path d="M114 40 L138 40 L126 18 Z" fill="#c9d2db"/>
    <rect x="26" y="78" width="26" height="40" rx="8" fill="#5f6873" stroke="#e9b45a" stroke-width="2"/>`, grad('g', '#8b959f', '#3b424a')),
  lamp: () => wrap(`<line x1="80" y1="8" x2="80" y2="30" stroke="#5a4a3e" stroke-width="4"/>
    <path d="M56 30 L104 30 L112 50 L48 50 Z" fill="#3b2f27"/><rect x="50" y="50" width="60" height="70" rx="12" fill="url(#g)"/>
    <path d="M50 120 L110 120 L100 136 L60 136 Z" fill="#3b2f27"/>
    <path d="M80 64 Q94 82 86 100 Q80 108 74 100 Q66 82 80 64 Z" fill="#fff2c6"/>${eyes(84, 16, '#3a1406')}`, grad('g', '#ffcf6a', '#d0641c')),
  colossus: () => wrap(`${shadow}<path d="M22 142 L34 64 Q80 30 126 64 L138 142 Z" fill="url(#g)"/>
    <path d="M50 60 Q80 8 110 60 Q80 46 50 60 Z" fill="#2b1a14"/><path d="M64 56 L80 30 L96 56" fill="#ff7a4a" opacity=".85"/>
    <rect x="58" y="70" width="44" height="14" rx="6" fill="#120806"/><circle cx="70" cy="77" r="5" fill="#ffb04a"/><circle cx="90" cy="77" r="5" fill="#ffb04a"/>
    <path d="M44 100 Q80 120 116 100 M48 122 Q80 138 112 122" stroke="#ff7a4a" stroke-width="4" fill="none" opacity=".8"/>
    <circle cx="20" cy="96" r="16" fill="#4a2a1e"/><circle cx="140" cy="96" r="16" fill="#4a2a1e"/>`, grad('g', '#7a4632', '#20110b')),
  spore: () => wrap(`${shadow}<path d="M80 140 Q72 110 78 84" stroke="#4d6b2e" stroke-width="8" fill="none"/><path d="M80 140 Q96 116 104 96" stroke="#4d6b2e" stroke-width="6" fill="none"/>
    <ellipse cx="78" cy="70" rx="38" ry="28" fill="url(#g)"/><ellipse cx="108" cy="90" rx="18" ry="13" fill="url(#g)"/>
    <circle cx="64" cy="62" r="5" fill="#f2f7c0"/><circle cx="88" cy="58" r="4" fill="#f2f7c0"/><circle cx="76" cy="80" r="3" fill="#f2f7c0"/>${eyes(70, 10, '#2a0f2a')}
    <circle cx="40" cy="44" r="3" fill="#c9e27a" opacity=".7"/><circle cx="122" cy="52" r="2.5" fill="#c9e27a" opacity=".7"/>`, grad('g', '#b48ad8', '#4d2a6a')),
  glass: () => wrap(`<path d="M80 74 L20 40 L44 92 Z M80 74 L140 40 L116 92 Z" fill="#9fe3ff" opacity=".55" stroke="#dff6ff" stroke-width="2"/>
    <path d="M80 74 L34 112 L64 100 Z M80 74 L126 112 L96 100 Z" fill="#7fc8ea" opacity=".45" stroke="#dff6ff" stroke-width="1.5"/>
    <ellipse cx="80" cy="84" rx="10" ry="30" fill="url(#g)"/>${eyes(66, 5, '#ff4a8a')}`, grad('g', '#e9f8ff', '#3a7fa8')),
  stone: () => wrap(`${shadow}<path d="M34 142 L40 80 L60 56 L100 54 L122 78 L128 142 Z" fill="url(#g)"/>
    <path d="M60 56 L70 30 L94 30 L100 54" fill="#7a7068"/><path d="M48 96 L70 104 M92 110 L118 98 M60 126 L84 120" stroke="#3b342e" stroke-width="3"/>
    <rect x="66" y="40" width="28" height="8" rx="3" fill="#1d1916"/><circle cx="73" cy="44" r="3" fill="#ffb04a"/><circle cx="87" cy="44" r="3" fill="#ffb04a"/>
    <path d="M22 100 Q34 86 40 100 L40 124 L22 124 Z M138 100 Q126 86 120 100 L120 124 L138 124 Z" fill="#5d554e"/>`, grad('g', '#a39788', '#4a433c')),
  leech: () => wrap(`${shadow}<path d="M26 122 Q30 76 80 70 Q132 66 138 112 Q136 136 108 132 Q80 128 54 134 Q26 140 26 122 Z" fill="url(#g)"/>
    <path d="M40 98 Q80 88 126 96 M36 112 Q80 102 132 112" stroke="#3a0c12" stroke-width="3" fill="none" opacity=".6"/>
    <circle cx="128" cy="96" r="13" fill="#2a070c"/><path d="M120 92 L136 92 M122 100 L134 100 M128 86 L128 106" stroke="#e8c0c6" stroke-width="2"/>`, grad('g', '#a8323e', '#3a0c12')),
  knight: () => wrap(`${shadow}<path d="M44 142 L50 74 Q80 60 110 74 L116 142 Z" fill="url(#g)" stroke="#e6f2ff" stroke-width="2"/>
    <path d="M58 30 Q80 14 102 30 L104 62 Q80 74 56 62 Z" fill="url(#g)" stroke="#e6f2ff" stroke-width="2"/><rect x="64" y="42" width="32" height="6" rx="3" fill="#0d1620"/>
    <circle cx="72" cy="45" r="2.5" fill="#8ff0ff"/><circle cx="88" cy="45" r="2.5" fill="#8ff0ff"/>
    <path d="M118 30 L126 30 L126 120 L118 120 Z" fill="#cfe2f2"/><rect x="108" y="116" width="28" height="6" rx="2" fill="#5a6b7a"/>
    <path d="M26 84 L52 78 L54 124 L28 128 Z" fill="#9fb8cc" opacity=".9" stroke="#e6f2ff" stroke-width="2"/>`, grad('g', '#d6e6f4', '#4a5f72')),
  wyrm: () => wrap(`<path d="M18 150 Q14 96 52 86 Q70 40 108 36 Q148 34 146 70 Q144 96 118 98 Q130 120 110 150 Z" fill="url(#g)"/>
    <path d="M108 36 Q122 14 140 20 Q128 28 126 44 Z" fill="#1b4a5a"/><path d="M70 58 Q62 40 72 30 Q78 44 86 48 Z" fill="#1b4a5a"/>
    <circle cx="118" cy="62" r="7" fill="#ffe27a"/><circle cx="119" cy="62" r="3" fill="#0b1c22"/>
    <path d="M128 80 L144 80 M130 86 L142 88" stroke="#0b1c22" stroke-width="3"/>
    <path d="M30 120 Q60 110 90 124 M40 140 Q70 130 100 142" stroke="#8ff0e0" stroke-width="3" fill="none" opacity=".6"/>`, grad('g', '#3fa3a8', '#0b2a33')),
};

export const HERO_ART = {
  warden: () => wrap(`${shadow}<path d="M80 18 L126 34 L122 92 Q116 128 80 144 Q44 128 38 92 L34 34 Z" fill="url(#g)" stroke="#ffe0a6" stroke-width="3"/>
    <path d="M50 56 L80 84 L110 56 M50 84 L80 112 L110 84" stroke="#5a3a12" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`, grad('g', '#f2c06c', '#8a5a1c')),
  arcanist: () => wrap(`${shadow}<circle cx="80" cy="80" r="52" fill="url(#g)" stroke="#ffd0b8" stroke-width="3"/>
    <path d="M80 40 Q102 70 92 98 Q86 112 80 114 Q74 112 68 98 Q58 70 80 40 Z" fill="#fff0c8"/>
    <circle cx="80" cy="80" r="64" fill="none" stroke="#ff7a59" stroke-width="2" stroke-dasharray="4 8"/>`, grad('g', '#ff9a6a', '#8a2a14')),
};

const icon = (d, c) => `<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true"><path d="${d}" fill="${c}" stroke="#0007" stroke-width="2"/></svg>`;
export const CARD_ICON = {
  attack: (c) => icon('M48 6 L58 6 L58 16 L26 48 L30 52 L24 58 L18 52 L10 60 L4 54 L12 46 L6 40 L12 34 L16 38 Z', c),
  skill: (c) => icon('M32 4 L56 12 L54 34 Q50 52 32 60 Q14 52 10 34 L8 12 Z', c),
  flame: (c) => icon('M32 4 Q50 22 46 40 Q44 54 32 60 Q20 54 18 40 Q16 30 26 20 Q26 32 32 34 Q36 22 32 4 Z', c),
  draw: (c) => icon('M14 10 L40 10 L40 46 L14 46 Z M24 18 L50 18 L50 54 L24 54 Z', c),
  heal: (c) => icon('M26 8 L38 8 L38 26 L56 26 L56 38 L38 38 L38 56 L26 56 L26 38 L8 38 L8 26 L26 26 Z', c),
  power: (c) => icon('M32 4 L38 24 L58 24 L42 36 L48 58 L32 44 L16 58 L22 36 L6 24 L26 24 Z', c),
};
/** Which icon a card shows: what its first effect does (damage → sword, block → shield, burn/rot → flame, …). */
export function cardIcon(d) {
  if (d.type === 'power') return 'power';
  const k = d.fx[0][0], st = d.fx[0][1];
  if (k === 'dmg' || k === 'dmgAll' || k === 'blockHit' || k === 'detonate') return 'attack';
  if (k === 'block') return 'skill';
  if ((k === 'st' || k === 'stAll') && (st === 'burn' || st === 'rot') || k === 'burnX') return 'flame';
  if (k === 'heal') return 'heal';
  if (k === 'draw' || k === 'energy' || k === 'nextEnergy') return 'draw';
  return 'skill';
}
export const RELIC_ICON = { ironBadge: '🛡️', emberCoal: '🔥', lantern: '🏮', cog: '⚙️', fieldkit: '🩹', whetstone: '🗡️', mossstone: '🪨', coinpurse: '👛', thornseed: '🌵', hourglass: '⏳' };
export const NODE_ICON = { fight: '⚔️', elite: '💀', rest: '🔥', shop: '🪙', event: '❔', treasure: '🎁', boss: '👑' };
