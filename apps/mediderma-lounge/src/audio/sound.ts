/**
 * 게임 사운드 (WebAudio). 파일은 public/audio — 출처·라이선스는 docs/ASSET_LICENSES.md.
 *  - 배경음악: 라운지·타이틀 = Apple Cider, 광장 = Hot Springs Town (서로 교차 페이드)
 *  - 환경음: 광장의 새소리, 분수 물소리(분수와의 거리로 음량 조절)
 *  - 효과음: 버튼·패널·보상·획득·하트·소원
 * 브라우저 자동재생 규칙 때문에 첫 터치/키 입력 뒤에 소리가 시작된다. 소리 설정이 꺼져 있으면 아무것도 불러오지 않는다.
 */
export type Sfx = "ui_click" | "ui_open" | "ui_close" | "reward" | "pickup" | "error" | "heart" | "chime";
export type Scene = "lounge" | "plaza" | "none";

const BASE = "./audio/";
const LOOPS = { bgm_lounge: 0.32, bgm_plaza: 0.3, amb_birds: 0.28, amb_water: 0 } as const;
type Loop = keyof typeof LOOPS;
const SCENES: Record<Scene, Loop[]> = { lounge: ["bgm_lounge"], plaza: ["bgm_plaza", "amb_birds", "amb_water"], none: [] };
/** MP3 인코더가 앞뒤에 넣는 짧은 무음을 루프에서 건너뛴다 */
const PAD = 0.06;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let sfxBus: GainNode | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
const playing = new Map<Loop, { src: AudioBufferSourceNode; gain: GainNode }>();
let scene: Scene = "none";
let enabled = true;
let musicVol = 0.8;
let waterLevel = 0;
let unlocked = false;

/** 첫 사용자 입력에서 AudioContext 를 만든다 (자동재생 규칙) */
export function initAudio() {
  const go = () => {
    if (unlocked) return;
    unlocked = true;
    if (!enabled) return;
    ensure();
    void ctx?.resume();
    applyScene();
  };
  window.addEventListener("pointerdown", go, { once: false, capture: true });
  window.addEventListener("keydown", go, { once: false, capture: true });
  // 버튼을 누르면 짧은 클릭음 (게임 화면의 버튼 전부에 공통)
  window.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement | null)?.closest?.("button");
    if (b && !b.disabled && !b.hasAttribute("data-silent")) play("ui_click", 0.5);
  }, true);
}

function ensure() {
  if (ctx || typeof AudioContext === "undefined") return;
  ctx = new AudioContext();
  master = ctx.createGain();
  master.connect(ctx.destination);
  musicBus = ctx.createGain();
  musicBus.gain.value = musicVol;
  musicBus.connect(master);
  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.7;
  sfxBus.connect(master);
}

function load(name: string) {
  let p = buffers.get(name);
  if (!p) {
    p = fetch(BASE + name + ".mp3")
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then((a) => ctx!.decodeAudioData(a))
      .catch(() => null);
    buffers.set(name, p);
  }
  return p;
}

export function play(name: Sfx, vol = 1) {
  if (!enabled || !unlocked) return;
  ensure();
  if (!ctx || !sfxBus) return;
  void load(name).then((buf) => {
    if (!buf || !ctx || !sfxBus) return;
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    g.gain.value = vol;
    src.buffer = buf;
    src.connect(g).connect(sfxBus);
    src.start();
  });
}

function target(l: Loop) {
  return l === "amb_water" ? LOOPS.amb_water + waterLevel * 0.5 : LOOPS[l];
}

function startLoop(l: Loop) {
  if (playing.has(l) || !ctx || !musicBus) return;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(musicBus);
  const entry = { src: ctx.createBufferSource(), gain };
  playing.set(l, entry);
  void load(l).then((buf) => {
    if (!buf || !ctx || playing.get(l) !== entry) return;
    entry.src.buffer = buf;
    entry.src.loop = true;
    entry.src.loopStart = PAD;
    entry.src.loopEnd = Math.max(PAD * 2, buf.duration - PAD);
    entry.src.connect(gain);
    entry.src.start(0, PAD);
    gain.gain.setTargetAtTime(target(l), ctx.currentTime, 0.8);
  });
}

function stopLoop(l: Loop) {
  const e = playing.get(l);
  if (!e || !ctx) return;
  playing.delete(l);
  e.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
  try { e.src.stop(ctx.currentTime + 2.5); } catch { /* 아직 시작 전 */ }
}

function applyScene() {
  if (!ctx || !enabled) return;
  const want = new Set(SCENES[scene]);
  for (const l of [...playing.keys()]) if (!want.has(l)) stopLoop(l);
  for (const l of want) startLoop(l);
}

/** 화면이 바뀔 때 배경음악·환경음을 바꾼다 */
export function setScene(s: Scene) {
  if (s === scene) return;
  scene = s;
  if (unlocked) applyScene();
}

/** 분수와 가까울수록 물소리를 키운다 (0..1) */
export function setWater(level: number) {
  waterLevel = Math.max(0, Math.min(1, level));
  const e = playing.get("amb_water");
  if (e && ctx) e.gain.gain.setTargetAtTime(target("amb_water"), ctx.currentTime, 0.3);
}

export function setAudioSettings(on: boolean, music: number) {
  enabled = on;
  musicVol = music;
  if (!on) {
    for (const l of [...playing.keys()]) stopLoop(l);
    return;
  }
  if (!unlocked) return;
  ensure();
  if (musicBus && ctx) musicBus.gain.setTargetAtTime(music, ctx.currentTime, 0.1);
  applyScene();
}

/** 토스트 문구로 보상음을 고른다: +숫자 가 있으면 보상, 없으면 소리 없음 */
export function soundForToast(text: string): Sfx | null {
  return /\+\s?\d/.test(text) ? "reward" : null;
}

/** 테스트용: 현재 상태 */
export const audioState = () => ({ scene, enabled, unlocked, musicVol, loops: [...playing.keys()] });
