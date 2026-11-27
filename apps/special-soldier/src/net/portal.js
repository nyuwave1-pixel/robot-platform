// BIT PARK / airobotphysical portal bridge for SPECIAL SOLDIER — the shared connector of docs/game-dev/PORTAL_ECONOMY.md
// (tools/game-lab/templates/common/src/portal.js) plus the consumable call this game needs (useGameItem, requested from
// BIT PARK in docs/game-dev/bitpark/SHOP_CONTRACT.md). No accounts, tokens or balances here: the portal page does the paying.
// Outside a portal every call rejects with 'standalone' and the shop only says where items can be bought.
export function createPortal(slug, { win = typeof window !== 'undefined' ? window : null } = {}) {
  const embedded = (() => { try { return !!win && win.parent !== win; } catch { return true; } })();
  const post = (msg) => { if (!embedded) return; try { win.parent.postMessage(msg, '*'); } catch { /* portal gone */ } };
  const pending = new Map(); let seq = 0;
  if (embedded) win.addEventListener('message', (e) => {
    const m = e.data; if (!m || m.source !== 'bitpark-portal' || !pending.has(m.id)) return;
    const p = pending.get(m.id); pending.delete(m.id); clearTimeout(p.t);
    if (m.ok) p.resolve(m.result); else p.reject(new Error(m.error || 'portal_error'));
  });
  const call = (name, args = {}, ms = 8000) => new Promise((resolve, reject) => {
    if (!embedded) return reject(new Error('standalone'));
    const id = `${slug}-${++seq}`;
    pending.set(id, { resolve, reject, t: setTimeout(() => { pending.delete(id); reject(new Error('portal_timeout')); }, ms) });
    post({ source: 'bitpark-game', slug, sdk: '1.0.0', call: name, id, args });
  });
  return {
    embedded, call,
    ready() { post({ source: 'bitpark-game', slug, sdk: '1.0.0', event: 'ready', data: {} }); },
    player: () => call('getPlayer').catch(() => ({ signedIn: false })),
    wallet: () => call('getWallet').catch(() => null),
    /** [{ id, name, price, currency, owned, count? }] or null when the shop is unavailable (standalone, guest, old portal). */
    items: () => call('getGameItems').catch(() => null),
    /** The portal shows its own confirm window and pays on the server: { ok, item } or an error code
     *  (not_signed_in, insufficient_funds, already_owned, cancelled, item_unavailable, standalone, portal_timeout). */
    buy: (id) => call('buyGameItem', { id }, 120000),
    /** Spend one consumable on the server; `ref` makes it idempotent (one use per mission attempt). { ok, left } or an
     *  error (none_left, unknown_call while BIT PARK has not added it yet). */
    use: (id, ref) => call('useGameItem', { id, ref }, 15000),
  };
}
