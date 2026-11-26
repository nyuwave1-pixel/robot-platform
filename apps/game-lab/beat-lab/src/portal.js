// Portal bridge — the same game runs standalone, on airobotphysical.com (RP) and on BIT PARK (PP). No accounts or tokens here:
// the portal page that embeds the game does the crediting.
//  - airobotphysical.com: parent.postMessage({ type: 'game_result', game, score, rp, mission, grade }) — the page caps rp
//    (min(65, rpReward × 2)), credits it once per game per day, and only accepts it from the game's own origin.
//  - BIT PARK: SDK v1 events { source: 'bitpark-game', slug, event, data } — levelStart starts the server clock, levelClear
//    sends a proof that the server replays with this game's src/verify.js before anything is stored or paid.
// Outside a portal (no parent window) every call is a no-op.
export const RP_BY_GRADE = { S: 30, A: 22, B: 15, C: 8 };

export function createPortal(slug) {
  const embedded = (() => { try { return window.parent !== window; } catch { return true; } })();
  const post = (msg) => { if (!embedded) return; try { window.parent.postMessage(msg, '*'); } catch { /* portal gone */ } };
  const bp = (event, data = {}) => post({ source: 'bitpark-game', slug, sdk: '1.0.0', event, data });
  return {
    embedded,
    ready() { post({ type: 'game_ready', game: slug }); bp('ready'); },
    /** level: 1-based level number as BIT PARK counts them. */
    levelStart(level) { bp('levelStart', { level }); },
    /** One finished play. grade S/A/B/C/D decides the RP; proof is what verify.js replays. */
    result({ level, score, grade, mode, seconds = 0, stars = 0, proof }) {
      const rp = RP_BY_GRADE[grade] || 0;
      post({ type: 'game_result', game: slug, score: Math.max(0, Math.round(score)), rp, mission: mode, grade });
      bp('levelClear', { level, stars, seconds, moves: 0, proof });
      return rp;
    },
  };
}
