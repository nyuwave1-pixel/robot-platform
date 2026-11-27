// SPECIAL SOLDIER — BIT PARK point (PP) items (docs/game-dev/PORTAL_ECONOMY.md). Pure data + rules: imported by the game,
// by node tests and mirrored by game.json `items` for the portal's shop_items rows. The game never charges anything: the
// portal sells (its own confirm window, shop_buy on the server) and tells the game which items the player owns.
//
// Fairness: nothing here changes multiplayer (ranked) matches — `effects()` returns nothing when ctx.ranked is true.
// Consumables need the portal's server-side "use" call (useGameItem, requested in SHOP_CONTRACT.md); until it exists the
// game shows them as "coming soon" and never fakes a use.
export const SLUG = 'special-soldier';

export const SHOP_ITEMS = [
  // cosmetics — permanent, visual only
  { id: 'special-soldier-camo-desert', name: 'DESERT CAMO', ko: '사막 위장 무늬', kind: 'cosmetic', price: 150, slot: 'camo', tint: 0xc8a46a, about: 'Sand-coloured finish on every weapon.' },
  { id: 'special-soldier-camo-urban', name: 'URBAN CAMO', ko: '도시 위장 무늬', kind: 'cosmetic', price: 150, slot: 'camo', tint: 0x8d949c, about: 'Grey urban finish on every weapon.' },
  { id: 'special-soldier-camo-gold', name: 'GOLD FINISH', ko: '황금 마감', kind: 'cosmetic', price: 600, slot: 'camo', tint: 0xe2b33c, about: 'Polished gold on every weapon. Shows off, does nothing else.' },
  { id: 'special-soldier-callsign-gold', name: 'GOLD CALLSIGN', ko: '황금 콜사인', kind: 'cosmetic', price: 200, slot: 'callsign', color: '#ffd36a', about: 'Your callsign in gold on the main menu and in the kill feed.' },
  // unlocks — permanent, campaign only (never in multiplayer)
  { id: 'special-soldier-armory', name: 'FULL ARMORY', ko: '무기고 전체 해제', kind: 'unlock', price: 800, unlock: 'weapons', about: 'Every campaign weapon available from mission 1.' },
  { id: 'special-soldier-mission-select', name: 'MISSION SELECT', ko: '미션 전체 열기', kind: 'unlock', price: 500, unlock: 'missions', about: 'Play any of the five campaign missions without finishing the earlier ones.' },
  { id: 'special-soldier-gear-early', name: 'EARLY GEAR', ko: '전술 장비 조기 지급', kind: 'unlock', price: 300, unlock: 'gear', about: 'Recon drone and thermal imager from mission 1.' },
  // consumables — one use each, campaign only; need the portal's useGameItem (server decrements the count)
  { id: 'special-soldier-revive', name: 'FIELD REVIVE', ko: '현장 부활권', kind: 'consumable', price: 60, use: 'revive', about: 'When you go down, get up where you fell with 60 health instead of restarting from the checkpoint.' },
  { id: 'special-soldier-supply', name: 'SUPPLY DROP', ko: '보급 상자', kind: 'consumable', price: 40, use: 'supply', about: 'Start a mission with 2 extra med kits and 2 extra grenades.' },
];
export const ITEM = Object.fromEntries(SHOP_ITEMS.map((i) => [i.id, i]));

/** Normalise the portal's getGameItems answer ([{ id, owned, count? }]) to { owned: Set, counts: { id: n } }.
 *  Unknown ids are ignored, so a stale or foreign list can never unlock something that is not in this catalog. */
export function ownership(list) {
  const owned = new Set(), counts = {};
  for (const r of Array.isArray(list) ? list : []) {
    const it = r && ITEM[r.id]; if (!it) continue;
    if (it.kind === 'consumable') { const n = Math.max(0, Math.floor(+r.count || 0)); if (n > 0) counts[it.id] = n; }
    else if (r.owned) owned.add(it.id);
  }
  return { owned, counts };
}

/** What the owned items do in this context. ctx: { ranked: bool } — multiplayer gets nothing (fairness rule). */
export function effects(own, ctx = {}) {
  const none = { allWeapons: false, allMissions: false, earlyGear: false, camo: null, callsignColor: null };
  if (!own || ctx.ranked) return none;
  const has = (id) => own.owned.has(id);
  const camo = ['special-soldier-camo-gold', 'special-soldier-camo-urban', 'special-soldier-camo-desert'].find((id) => has(id) && (!own.camoPick || own.camoPick === id)) || null;
  return {
    allWeapons: has('special-soldier-armory'), allMissions: has('special-soldier-mission-select'), earlyGear: has('special-soldier-gear-early'),
    camo: camo ? ITEM[camo].tint : null, callsignColor: has('special-soldier-callsign-gold') ? ITEM['special-soldier-callsign-gold'].color : null,
  };
}

/** Cosmetics may show in multiplayer (they change nothing); this is the only part of the shop a match sees. */
export function cosmetics(own) {
  if (!own) return { camo: null, callsignColor: null };
  const e = effects(own, {}); return { camo: e.camo, callsignColor: e.callsignColor };
}

/** Campaign mission i is open: earned by progress, or the MISSION SELECT unlock. */
export const missionOpen = (i, progress, fx) => i <= progress || !!(fx && fx.allMissions);
/** Supply drop: the mission's starting med kits / grenades. */
export const SUPPLY = { medkits: 2, grenades: 2 };
/** Field revive: health after getting up. */
export const REVIVE_HP = 60;

/** The `items` block for game.json / the portal's shop_items rows (kind game_item, currency PP). */
export const portalRows = () => SHOP_ITEMS.map((i) => ({ id: i.id, name: i.ko, kind: 'game_item', currency: 'PP', price: i.price,
  effect: i.kind === 'cosmetic' ? 'cosmetic' : i.kind === 'unlock' ? 'unranked-unlock' : 'unranked-consumable', about: i.about,
  ...(i.kind === 'consumable' ? { consumable: true, per_user_limit: null } : { per_user_limit: 1 }) }));
