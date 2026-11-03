"use client";
/**
 * 전역 오디오 컨트롤러 — 사용자 제스처 이후에만 소리를 켜고, 동시에 소리 나는 영상이 1개만 존재하도록 관리.
 * BGM/효과음은 라이선스 음원 확정 후 추가 (현재는 영상 원본 오디오만 사용).
 */
type Listener = (enabled: boolean) => void;

class AudioController {
  private enabled = false;
  private unlocked = false;
  private listeners = new Set<Listener>();
  private active: HTMLVideoElement | null = null;

  get isEnabled() { return this.enabled; }

  /** 첫 사용자 제스처에서 호출 */
  unlock() {
    this.unlocked = true;
  }

  setEnabled(v: boolean) {
    this.enabled = v && this.unlocked;
    try { localStorage.setItem("uc.sound", this.enabled ? "1" : "0"); } catch {}
    if (this.active) this.active.muted = !this.enabled;
    this.listeners.forEach((l) => l(this.enabled));
  }

  restore() {
    try { return localStorage.getItem("uc.sound"); } catch { return null; }
  }

  /** 소리 출력권을 넘겨받는 영상 등록 */
  claim(video: HTMLVideoElement) {
    if (this.active && this.active !== video) this.active.muted = true;
    this.active = video;
    video.muted = !this.enabled;
  }

  release(video: HTMLVideoElement) {
    if (this.active === video) this.active = null;
    video.muted = true;
  }

  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => { this.listeners.delete(l); };
  }
}

export const audio = new AudioController();
