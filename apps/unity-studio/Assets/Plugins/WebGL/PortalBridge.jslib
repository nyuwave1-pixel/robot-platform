// Sends the mission result to the page that embeds the WebGL build (BIT PARK / RobotVerse portal),
// the same message the web game posts: { type: 'game_result', game, score, rp, mission, grade }.
mergeInto(LibraryManager.library, {
  SS_PostGameResult: function (gamePtr, missionPtr, gradePtr, score, rp) {
    try {
      if (window.parent === window) return;
      window.parent.postMessage({ type: 'game_result', game: UTF8ToString(gamePtr), engine: 'unity', score: score, rp: rp,
        mission: UTF8ToString(missionPtr), grade: UTF8ToString(gradePtr) }, '*');
    } catch (e) { /* not embedded or blocked: ignore */ }
  }
});
