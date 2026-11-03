"use client";
/**
 * 전역 오디오 컨트롤러
 * - BGM(루프)과 인트로 보이스 라인을 관리하고, 사이트 진입 시 자동재생을 시도합니다.
 * - 브라우저 자동재생 정책상 소리 있는 재생은 사용자 제스처가 필요할 수 있어, 차단되면
 *   첫 제스처(클릭/터치/키)에서 자동으로 시작하고 그 전까지 SOUND ON 안내를 보여줍니다.
 * - 영상 오디오와 BGM 이 겹치지 않도록 소리 출력권은 한 번에 하나만 가집니다.
 */
export type SoundState = "unknown" | "on" | "off" | "blocked";
type Listener = (s: SoundState) => void;

const BGM_SRC = ["/audio/bgm_luxury_film.m4a", "/audio/bgm_luxury_film.mp3"];
const VOICE_SRC = "/audio/voice_intro.mp3";
const BGM_VOLUME = 0.55;
const DUCK_VOLUME = 0.22;

class AudioController {
  state: SoundState = "unknown";
  private bgm: HTMLAudioElement | null = null;
  private voice: HTMLAudioElement | null = null;
  private listeners = new Set<Listener>();
  private activeVideo: HTMLVideoElement | null = null;
  private videoSoundPreferred = false;
  private voicePlayed = false;
  private fadeTimer: number | null = null;
  private unlockBound = false;

  private ensure() {
    if (typeof window === "undefined") return;
    if (!this.bgm) {
      const a = new Audio();
      const src = BGM_SRC.find((s) => a.canPlayType(s.endsWith(".m4a") ? "audio/mp4" : "audio/mpeg")) || BGM_SRC[1];
      a.src = src; a.loop = true; a.preload = "auto"; a.volume = 0; a.crossOrigin = "anonymous";
      this.bgm = a;
    }
    if (!this.voice) {
      const v = new Audio(VOICE_SRC); v.preload = "auto"; v.volume = 1;
      this.voice = v;
    }
  }

  get isOn() { return this.state === "on"; }

  restorePreference(): "1" | "0" | null {
    try { const v = localStorage.getItem("uc.sound"); return v === "1" || v === "0" ? v : null; } catch { return null; }
  }

  /** 사이트 진입 시 호출: 자동재생 시도. 사용자가 과거에 OFF 를 선택했으면 시도하지 않음 */
  async autoplay() {
    this.ensure();
    if (!this.bgm) return;
    if (this.restorePreference() === "0") { this.set("off"); return; }
    try {
      await this.bgm.play();
      this.fadeTo(BGM_VOLUME, 1800);
      this.set("on");
      this.playVoiceOnce();
    } catch {
      this.set("blocked");
      this.bindUnlock();
    }
  }

  /** 자동재생 차단 시: 첫 사용자 제스처에서 시작 */
  private bindUnlock() {
    if (this.unlockBound || typeof window === "undefined") return;
    this.unlockBound = true;
    const unlock = (e: Event) => {
      // 인트로 사운드 게이트 안의 버튼은 스스로 ON/OFF 를 결정하므로 여기서 가로채지 않음
      const t = e.target as Element | null;
      if (t && typeof t.closest === "function" && t.closest("[data-sound-gate]")) return;
      if (this.state === "blocked") void this.enable();
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
      window.removeEventListener("touchend", unlock, true);
      this.unlockBound = false;
    };
    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
    window.addEventListener("touchend", unlock, true);
  }

  async enable() {
    this.ensure();
    if (!this.bgm) return;
    try { localStorage.setItem("uc.sound", "1"); } catch {}
    try {
      if (this.bgm.paused) await this.bgm.play();
      this.fadeTo(BGM_VOLUME, 1200);
      this.set("on");
      this.playVoiceOnce();
      if (this.activeVideo) this.activeVideo.muted = !this.videoSoundPreferred;
    } catch {
      this.set("blocked");
      this.bindUnlock();
    }
  }

  disable() {
    try { localStorage.setItem("uc.sound", "0"); } catch {}
    this.fadeTo(0, 600, () => this.bgm?.pause());
    if (this.voice) { this.voice.pause(); }
    if (this.activeVideo) this.activeVideo.muted = true;
    this.set("off");
  }

  toggle() { if (this.state === "on") this.disable(); else void this.enable(); }

  /** 인트로 보이스 라인: BGM 시작 직후 1회, 재생 동안 BGM 덕킹 */
  private playVoiceOnce() {
    if (this.voicePlayed || !this.voice) return;
    this.voicePlayed = true;
    const v = this.voice;
    window.setTimeout(() => {
      this.fadeTo(DUCK_VOLUME, 500);
      v.currentTime = 0;
      v.play().then(() => {
        v.onended = () => this.fadeTo(BGM_VOLUME, 1400);
      }).catch(() => this.fadeTo(BGM_VOLUME, 800));
    }, 900);
  }

  /** 영상이 소리 출력권을 요청 (사용자가 영상 사운드를 선택한 경우에만 BGM 덕킹 + 영상 unmute) */
  claimVideo(video: HTMLVideoElement, preferVideoSound: boolean) {
    this.activeVideo = video;
    this.videoSoundPreferred = preferVideoSound;
    if (this.state === "on" && preferVideoSound) { video.muted = false; this.fadeTo(0.08, 800); }
    else video.muted = true;
  }

  releaseVideo(video: HTMLVideoElement) {
    if (this.activeVideo === video) {
      this.activeVideo = null; video.muted = true;
      if (this.state === "on") this.fadeTo(BGM_VOLUME, 1200);
    }
  }

  private fadeTo(target: number, ms: number, done?: () => void) {
    const a = this.bgm; if (!a) return;
    if (this.fadeTimer) window.clearInterval(this.fadeTimer);
    const start = a.volume, t0 = performance.now();
    this.fadeTimer = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / ms);
      a.volume = start + (target - start) * p;
      if (p >= 1) { if (this.fadeTimer) window.clearInterval(this.fadeTimer); this.fadeTimer = null; done?.(); }
    }, 50);
  }

  private set(s: SoundState) { this.state = s; this.listeners.forEach((l) => l(s)); }
  subscribe(l: Listener) { this.listeners.add(l); l(this.state); return () => { this.listeners.delete(l); }; }
}

export const audio = new AudioController();
