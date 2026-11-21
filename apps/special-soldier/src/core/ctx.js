// Global game context. Every system registers itself here so modules stay decoupled
// (a system only needs `G`, never another system's import) — mirrors a UE5 GameInstance/Subsystem layout.
export const G = {
  state: 'boot',           // boot | menu | cinematic | briefing | playing | paused | dead | result
  time: 0, dt: 0, frame: 0,
  settings: null, save: null,
  renderer: null, scene: null, camera: null, post: null,
  world: null, sky: null, fx: null, audio: null, input: null,
  player: null, weapons: null, enemies: null, squad: null, gear: null,
  mission: null, cine: null, hud: null, menu: null,
  test: false,
};
