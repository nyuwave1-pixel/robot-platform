// Sends the mission result to the page that embeds the WebGL build (BIT PARK / RobotVerse portal),
// the same message the web game posts: { type: 'game_result', game, score, rp, mission, grade }.
mergeInto(LibraryManager.library, {
  SS_PostGameResult: function (gamePtr, missionPtr, gradePtr, score, rp) {
    try {
      if (window.parent === window) return;
      window.parent.postMessage({ type: 'game_result', game: UTF8ToString(gamePtr), engine: 'unity', score: score, rp: rp,
        mission: UTF8ToString(missionPtr), grade: UTF8ToString(gradePtr) }, '*');
    } catch (e) { /* not embedded or blocked: ignore */ }
  },
  // CLASSIC EDITION button: leave the Unity edition for the Three.js campaign in the same tab (the URL was checked
  // against trusted hosts in Core/EditionLinks before it gets here).
  SS_Navigate: function (urlPtr) {
    try { window.location.assign(UTF8ToString(urlPtr)); } catch (e) { /* blocked: ignore */ }
  }
});
