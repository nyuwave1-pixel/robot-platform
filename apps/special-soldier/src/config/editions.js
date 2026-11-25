// SPECIAL SOLDIER ships as one game with two editions the player chooses between in the main menu:
//   CLASSIC — this Three.js game: the full five-mission campaign, boot camp, armory, intel.
//   UNITY   — the Unity 6 WebGL edition (apps/unity-studio): the Island Slice mission with HDRI skies, rain and
//             lightning, the UI Toolkit HUD and the same enemy AI / difficulty rules ported from this code.
// The two are hosted on different sites, so the links are absolute. The Unity build reads ?difficulty= and ?sky=,
// and shows a "CLASSIC EDITION" button that returns to ?return= (see docs/game-dev/EDITIONS_ROADMAP.md).

export const UNITY_EDITION = {
  url: 'https://bitpark.airobotphysical.com/play/unity-island-slice/index.html',
  download: 'about 19 MB',
  features: ['Island Slice: take the compound, download the intel, extract — S/A/B/C grade',
    'HDRI skies: day · dawn · storm · dusk · night ([K] cycles), rain and lightning',
    'Compass, rotating minimap, waypoint, damage arcs, kill feed (UI Toolkit)',
    'Same enemy cover / flank / grenade AI and difficulty table as this edition'],
};

/** Link that opens the Unity edition with this player's difficulty and a way back here.
 *  `here` is the page to come back to (defaults to the current page without its query). */
export function unityEditionUrl(difficulty, here = typeof location !== 'undefined' ? location.origin + location.pathname : '') {
  const q = new URLSearchParams();
  if (difficulty) q.set('difficulty', difficulty);
  if (/^https?:/.test(here)) q.set('return', here);   // file:// (desktop build) can't be returned to from a web page
  const s = q.toString();
  return s ? `${UNITY_EDITION.url}?${s}` : UNITY_EDITION.url;
}
