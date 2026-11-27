// PP SHOP — BIT PARK point items for SPECIAL SOLDIER (config/shop.js, docs/game-dev/PORTAL_ECONOMY.md).
// The portal sells (its own confirm window, server-side shop_buy); this file only shows the catalog, asks the portal to
// buy, remembers what is owned and applies it. Outside a portal: no buy buttons, just where items can be bought.
import { G } from '../core/ctx.js';
import { SLUG, SHOP_ITEMS, ITEM, ownership, effects, SUPPLY, REVIVE_HP } from '../config/shop.js';
import { createPortal } from '../net/portal.js';
import { applyCamo } from '../game/weapons.js';

const CACHE = 'special-soldier-shop-v1';   // owned ids only (cosmetics/unlocks); consumable counts always come from the server
const ERR = { not_signed_in: 'Sign in to BIT PARK first.', insufficient_funds: 'Not enough PP.', already_owned: 'You already own this.', cancelled: 'Purchase cancelled.',
  item_unavailable: 'This item is not on sale right now.', standalone: 'Open the game on BIT PARK to buy items.', portal_timeout: 'The portal did not answer — try again.',
  unknown_call: 'BIT PARK has not switched this on yet.', none_left: 'None left.' };
export const errText = (e) => ERR[e && e.message] || `Portal error (${(e && e.message) || 'unknown'}).`;

export function initShop() {
  G.portal = createPortal(SLUG);
  let cached = []; try { cached = JSON.parse(localStorage.getItem(CACHE) || '[]'); } catch { cached = []; }
  const own = ownership(cached.map((id) => ({ id, owned: true })));
  own.camoPick = G.save.camoPick || null;
  G.shop = { own, fx: effects(own), wallet: null, live: false, status: G.portal.embedded ? 'Connecting to BIT PARK…' : null, supplyPick: false };
  applyCamo(G.shop.fx.camo);
  refreshShop();
}

/** Ask the portal for the player's items + wallet; keeps the cached list when the portal has no shop yet. */
export async function refreshShop() {
  const S = G.shop; if (!G.portal.embedded) return;
  const [list, wallet] = await Promise.all([G.portal.items(), G.portal.wallet()]);
  S.wallet = wallet;
  if (Array.isArray(list)) {
    const own = ownership(list); own.camoPick = G.save.camoPick || null; S.own = own; S.live = true; S.status = null;
    try { localStorage.setItem(CACHE, JSON.stringify([...own.owned])); } catch { /* storage off */ }
  } else S.status = 'The BIT PARK shop is not available for this game yet (sign in, or the portal has not listed the items).';
  S.fx = effects(S.own); applyCamo(S.fx.camo);
  if (G.menu && G.menu.screen === 'shop') G.menu.shop();
}

export async function buyItem(id) {
  try { await G.portal.buy(id); G.shop.msg = `${ITEM[id].name} — purchased.`; await refreshShop(); }
  catch (e) { G.shop.msg = errText(e); }
  if (G.menu.screen === 'shop') G.menu.shop();
}

/** Spend one consumable on the server. ref: one id per use (the server ignores a repeat), so a retry never double-charges. */
export async function useConsumable(id, ref) {
  const S = G.shop; if (!(S.own.counts[id] > 0)) return false;
  try { const r = await G.portal.use(id, ref); S.own.counts[id] = Math.max(0, r && Number.isFinite(+r.left) ? +r.left : S.own.counts[id] - 1); return true; }
  catch (e) { G.hud.toast(errText(e), true); return false; }
}

export function pickCamo(id) { G.save.camoPick = G.save.camoPick === id ? null : id; G.shop.own.camoPick = G.save.camoPick; G.shop.fx = effects(G.shop.own); applyCamo(G.shop.fx.camo); }

/** The shop screen body (inside Menu.frame). */
export function shopBody() {
  const S = G.shop, live = G.portal.embedded && S.live, pp = S.wallet && Number.isFinite(+S.wallet.PP) ? `${S.wallet.PP} PP` : '—';
  const groups = [['cosmetic', 'COSMETICS — LOOKS ONLY'], ['unlock', 'UNLOCKS — CAMPAIGN ONLY, NEVER IN MULTIPLAYER'], ['consumable', 'CONSUMABLES — ONE USE, CAMPAIGN ONLY']];
  const card = (it) => {
    const owned = S.own.owned.has(it.id), n = S.own.counts[it.id] || 0;
    const state = it.kind === 'consumable' ? `${n} LEFT` : owned ? 'OWNED' : `${it.price} PP`;
    const btn = !G.portal.embedded ? '' : it.kind !== 'consumable' && owned
      ? (it.slot === 'camo' ? `<button data-a="camo" data-v="${it.id}" class="${S.fx.camo === it.tint ? 'on' : ''}">${S.fx.camo === it.tint ? 'EQUIPPED' : 'EQUIP'}</button>` : '')
      : live ? `<button class="primary" data-a="buy" data-v="${it.id}">BUY · ${it.price} PP</button>` : '';
    return `<div class="mcard ${owned || n ? 'cur' : ''}"><em>${state}</em><b>${it.name}</b><small>${it.ko}</small><p>${it.about}</p>${btn}</div>`;
  };
  return `<p class="lead">Items are bought with <b>BIT PARK points (PP)</b> earned by playing. The portal shows its own confirm window and charges on its server — this game never sees your account. Nothing here changes multiplayer matches.</p>
    <div class="actions" style="justify-content:flex-start;margin:0 0 10px"><span class="note">WALLET <b>${pp}</b></span>${G.portal.embedded ? '<button data-a="shopRefresh">REFRESH</button>' : ''}</div>
    ${!G.portal.embedded ? '<p class="note">Open SPECIAL SOLDIER on <b>BIT PARK</b> and sign in to buy items. Items you bought there show up here too.</p>' : ''}
    ${S.status ? `<p class="note">${S.status}</p>` : ''}${S.msg ? `<p class="note"><b>${S.msg}</b></p>` : ''}
    ${groups.map(([k, t]) => `<h3>${t}</h3><div class="missions">${SHOP_ITEMS.filter((i) => i.kind === k).map(card).join('')}</div>`).join('')}
    <p class="note">Consumables are spent on the BIT PARK server when you use them (revive on the K.I.A. screen, supply drop on the briefing). Until BIT PARK switches that on, they cannot be used.</p>`;
}

export { SUPPLY, REVIVE_HP };
