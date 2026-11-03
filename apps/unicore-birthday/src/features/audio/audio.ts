"use client";
/**
 * 전역 오디오 컨트롤러 — 사이트 사운드는 BGM 한 트랙만 사용합니다.
 * - 진입 즉시 자동재생을 시도하고, 브라우저가 소리 자동재생을 막으면 'blocked' 상태로
 *   첫 사용자 제스처(ENTER 버튼/클릭/터치/키)에서 시작합니다.
 * - 영상은 항상 음소거로 재생되어 BGM 과 겹치지 않습니다.
 */
export type SoundState = "unknown" | "on" | "off" | "blocked";
type Listener = (s: SoundState) => void;

const BGM_SRC = ["/audio/bgm_luxury_film.m4a", "/audio/bgm_luxury_film.mp3"];
const BGM_VOLUME = 0.6;

class AudioController {
  state: SoundState = "unknown";
  private bgm: HTMLAudioElement | null = null;
  private listeners = new Set<Listener>();
  private fadeTimer: number | null = null;
  private unlockBound = false;
  private autoplayTried = false;

  private ensure() {
    if (typeof window === "undefined" || this.bgm) return;
    const a = new Audio();
    const src = BGM_SRC.find((s) => a.canPlayType(s.endsWith(".m4a") ? "audio/mp4" : "audio/mpeg")) || BGM_SRC[1];
    a.src = src; a.loop = true; a.preload = "auto"; a.volume = 0;
    this.bgm = a;
  }

  get isOn() { return this.state === "on"; }

  restorePreference(): "1" | "0" | null {
    try { const v = localStorage.getItem("uc.sound"); return v === "1" || v === "0" ? v : null; } catch { return null; }
  }

  /** 사이트 진입 시 1회 호출: 자동재생 시도. 사용자가 과거에 OFF 를 선택했으면 시도하지 않음 */
  async autoplay() {
    if (this.autoplayTried) return;
    this.autoplayTried = true;
    this.ensure();
    if (!this.bgm) return;
    if (this.restorePreference() === "0") { this.set("off"); return; }
    try {
      await this.bgm.play();
      this.fadeTo(BGM_VOLUME, 1500);
      this.set("on");
    } catch {
      this.set("blocked");
      this.bindUnlock();
    }
  }

  /** 자동재생 차단 시: 첫 사용자 제스처에서 시작 (인트로 입장 버튼은 자체 처리) */
  private bindUnlock() {
    if (this.unlockBound || typeof window === "undefined") return;
    this.unlockBound = true;
    const unlock = (e: Event) => {
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
      this.fadeTo(BGM_VOLUME, 1000);
      this.set("on");
    } catch {
      this.set("blocked");
      this.bindUnlock();
    }
  }

  disable() {
    try { localStorage.setItem("uc.sound", "0"); } catch {}
    this.fadeTo(0, 500, () => this.bgm?.pause());
    this.set("off");
  }

  toggle() { if (this.state === "on") this.disable(); else void this.enable(); }

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
