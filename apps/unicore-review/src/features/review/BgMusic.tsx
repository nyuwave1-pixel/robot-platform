"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import s from "./review.module.css";

const SRC = "/media/audio/bgm.mp3";
const PREF_KEY = "uc-review-bgm"; // "off" 로 저장되면 다음 방문에도 자동으로 틀지 않는다
const VOLUME = 0.55;

/**
 * 배경 음악 — 접속하면 바로 재생을 시도한다.
 * 휴대폰 브라우저는 화면을 한 번 누르기 전에는 소리 재생을 막으므로, 막히면 첫 터치·키 입력에서 시작한다.
 * 방문자가 끄면 그 선택을 기억하고, 다른 탭·앱으로 나가면 멈춘다.
 */
export default function BgMusic() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const fade = useRef(0);
  const wanted = useRef(true);
  const [on, setOn] = useState(false);

  const play = useCallback(async () => {
    const a = audio.current; if (!a || !wanted.current) return false;
    try {
      a.volume = 0;
      await a.play();
      window.clearInterval(fade.current);
      fade.current = window.setInterval(() => { a.volume = Math.min(VOLUME, a.volume + 0.03); if (a.volume >= VOLUME) window.clearInterval(fade.current); }, 90);
      setOn(true);
      return true;
    } catch { return false; }
  }, []);

  useEffect(() => {
    try { if (localStorage.getItem(PREF_KEY) === "off") wanted.current = false; } catch { /* 무시 */ }
    const a = new Audio(); a.src = SRC; a.loop = true; a.preload = wanted.current ? "auto" : "none";
    audio.current = a;
    const events = ["pointerdown", "touchend", "keydown"] as const;
    const off = () => events.forEach((e) => window.removeEventListener(e, first));
    // 누른 대상이 음악 버튼이면 버튼이 직접 처리한다(중복 재생 방지)
    const first = (e: Event) => { if ((e.target as HTMLElement | null)?.closest?.("[data-bgm]")) return; void play().then((ok) => { if (ok || !wanted.current) off(); }); };
    if (wanted.current) void play().then((ok) => { if (!ok) events.forEach((e) => window.addEventListener(e, first, { passive: true })); });
    let resume = false;
    const vis = () => { if (document.hidden) { resume = !a.paused; a.pause(); } else if (resume && wanted.current) void a.play().catch(() => {}); };
    document.addEventListener("visibilitychange", vis);
    return () => { off(); document.removeEventListener("visibilitychange", vis); window.clearInterval(fade.current); a.pause(); a.src = ""; audio.current = null; };
  }, [play]);

  const toggle = () => {
    const a = audio.current; if (!a) return;
    if (on) { wanted.current = false; window.clearInterval(fade.current); a.pause(); setOn(false); try { localStorage.setItem(PREF_KEY, "off"); } catch { /* 무시 */ } }
    else { wanted.current = true; try { localStorage.removeItem(PREF_KEY); } catch { /* 무시 */ } void play(); }
  };

  return (
    <button type="button" data-bgm className={`${s.bgm} ${on ? s.bgmOn : ""}`} onClick={toggle} aria-pressed={on} aria-label={on ? "배경 음악 끄기" : "배경 음악 켜기"} title={on ? "배경 음악 끄기" : "배경 음악 켜기"}>
      <span className={s.bgmBars} aria-hidden="true"><i /><i /><i /><i /></span>
    </button>
  );
}
