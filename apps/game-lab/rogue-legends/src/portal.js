// Portal bridge — the same game runs standalone, on airobotphysical.com (RP) and on BIT PARK (PP). No accounts or tokens here:
// the portal page that embeds the game does the crediting and the paying.
//  - airobotphysical.com: parent.postMessage({ type: 'game_result', game, score, rp, mission, grade }) — the page caps rp
//    (min(65, rpReward × 2)), credits it once per game per day, and only accepts it from the game's own origin.
//  - BIT PARK: SDK v1 events { source: 'bitpark-game', slug, event, data } — levelStart starts the server clock, levelClear
//    sends a proof that the server replays with this game's src/verify.js before anything is stored or paid.
//  - BIT PARK SDK calls { source: 'bitpark-game', slug, call, id, args } → { source: 'bitpark-portal', id, ok, result | error }:
//    getPlayer, getWallet, and the game shop (docs/game-dev/PORTAL_ECONOMY.md): getGameItems → [{ id, name, price, currency, owned }],
//    buyGameItem({ id }) — the PORTAL asks the player to confirm and pays with shop_buy on the server; the game only learns the result.
// Outside a portal (no parent window) every call is a no-op and the shop says where items can be bought.
export const RP_BY_GRADE = { S: 30, A: 22, B: 15, C: 8 };

export function createPortal(slug) {
  const embedded = (() => { try { return window.parent !== window; } catch { return true; } })();
  const post = (msg) => { if (!embedded) return; try { window.parent.postMessage(msg, '*'); } catch { /* portal gone */ } };
  const bp = (event, data = {}) => post({ source: 'bitpark-game', slug, sdk: '1.0.0', event, data });
  const pending = new Map(); let seq = 0;
  if (embedded) addEventListener('message', (e) => {
    const m = e.data; if (!m || m.source !== 'bitpark-portal' || !pending.has(m.id)) return;
    const p = pending.get(m.id); pending.delete(m.id); clearTimeout(p.t);
    if (m.ok) p.resolve(m.result); else p.reject(new Error(m.error || 'portal_error'));
  });
  /** One SDK call; rejects with 'standalone' outside a portal, 'portal_timeout' when nobody answers. */
  const call = (name, args = {}, ms = 8000) => new Promise((resolve, reject) => {
    if (!embedded) return reject(new Error('standalone'));
    const id = `${slug}-${++seq}`;
    pending.set(id, { resolve, reject, t: setTimeout(() => { pending.delete(id); reject(new Error('portal_timeout')); }, ms) });
    post({ source: 'bitpark-game', slug, sdk: '1.0.0', call: name, id, args });
  });
  return {
    embedded, call,
    ready() { post({ type: 'game_ready', game: slug }); bp('ready'); },
    /** level: 1-based level number as BIT PARK counts them. */
    levelStart(level) { bp('levelStart', { level }); },
    /** One finished play. grade S/A/B/C/D decides the RP; proof is what verify.js replays. clear: false for a lost run —
     *  it still earns its RP grade, but is not sent to BIT PARK as a level clear. */
    result({ level, score, grade, mode, seconds = 0, stars = 0, proof, clear = true }) {
      const rp = RP_BY_GRADE[grade] || 0;
      post({ type: 'game_result', game: slug, score: Math.max(0, Math.round(score)), rp, mission: mode, grade });
      if (clear) bp('levelClear', { level, stars, seconds, moves: 0, proof });
      return rp;
    },
    player: () => call('getPlayer').catch(() => ({ signedIn: false })),
    wallet: () => call('getWallet').catch(() => null),
    /** The game's PP items with ownership, or null when the shop is unavailable (standalone, guest, old portal). */
    items: () => call('getGameItems').catch(() => null),
    /** Ask the portal to sell one item; resolves { ok, item } or rejects with the portal's error code
     *  (not_signed_in, insufficient_funds, already_owned, cancelled, item_unavailable, standalone, portal_timeout). */
    buy: (id) => call('buyGameItem', { id }, 120000),
  };
}
