"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import s from "./review.module.css";

const SRC = "/media/audio/bgm-2.mp3";
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
  const [hint, setHint] = useState(false); // 자동 재생이 막혔을 때 "음악 켜기" 안내를 보여 준다

  const play = useCallback(async () => {
    const a = audio.current; if (!a || !wanted.current) return false;
    try {
      a.volume = 0;
      await a.play();
      window.clearInterval(fade.current);
      fade.current = window.setInterval(() => { a.volume = Math.min(VOLUME, a.volume + 0.03); if (a.volume >= VOLUME) window.clearInterval(fade.current); }, 90);
      setOn(true); setHint(false);
      return true;
    } catch { return false; }
  }, []);

  useEffect(() => {
    try { if (localStorage.getItem(PREF_KEY) === "off") wanted.current = false; } catch { /* 무시 */ }
    const a = new Audio(); a.src = SRC; a.loop = true; a.preload = wanted.current ? "auto" : "none";
    audio.current = a;
    const events = ["click", "touchend", "pointerup", "keydown"] as const; // iOS 는 스크롤이 아닌 "누르기"만 재생 허용으로 친다
    const off = () => events.forEach((e) => window.removeEventListener(e, first));
    // 누른 대상이 음악 버튼이면 버튼이 직접 처리한다(중복 재생 방지)
    const first = (e: Event) => { if ((e.target as HTMLElement | null)?.closest?.("[data-bgm]")) return; void play().then((ok) => { if (ok || !wanted.current) off(); }); };
    if (wanted.current) void play().then((ok) => { if (!ok) { setHint(true); events.forEach((e) => window.addEventListener(e, first, { passive: true })); } });
    let resume = false;
    const vis = () => { if (document.hidden) { resume = !a.paused; a.pause(); } else if (resume && wanted.current) void a.play().catch(() => {}); };
    document.addEventListener("visibilitychange", vis);
    return () => { off(); document.removeEventListener("visibilitychange", vis); window.clearInterval(fade.current); a.pause(); a.src = ""; audio.current = null; };
  }, [play]);

  const toggle = () => {
    const a = audio.current; if (!a) return;
    if (on) { wanted.current = false; window.clearInterval(fade.current); a.pause(); setOn(false); setHint(false); try { localStorage.setItem(PREF_KEY, "off"); } catch { /* 무시 */ } }
    else { wanted.current = true; try { localStorage.removeItem(PREF_KEY); } catch { /* 무시 */ } void play(); }
  };

  // 인트로가 떠 있는 동안에는 뒤 화면이 스크롤되지 않게 한다
  useEffect(() => {
    if (!hint) return;
    const el = document.documentElement, prev = el.style.overflow; el.style.overflow = "hidden";
    return () => { el.style.overflow = prev; };
  }, [hint]);
  const enter = () => { wanted.current = true; void play().then((ok) => { if (!ok) setHint(false); }); };
  const silent = () => { wanted.current = false; setHint(false); try { localStorage.setItem(PREF_KEY, "off"); } catch { /* 무시 */ } };

  return (<>
    {hint && !on && (
      <div data-bgm className={s.intro} role="dialog" aria-modal="true" aria-label="이벤트 입장">
        <div className={s.introGlow} aria-hidden="true" />
        <p className={s.introBrand}>UNI&amp;CORE</p>
        <p className={s.introEn}>1ST BIRTHDAY<br />CREAM</p>
        <p className={s.introKo}>구매 후기 이벤트에 오신 것을 환영합니다</p>
        <button type="button" className={s.introBtn} onClick={enter} autoFocus>입장하기 <span aria-hidden="true">♪</span></button>
        <p className={s.introNote}>입장하면 배경 음악이 함께 재생됩니다</p>
        <button type="button" className={s.introSilent} onClick={silent}>소리 없이 입장하기</button>
      </div>
    )}
    <button type="button" data-bgm className={`${s.bgm} ${on ? s.bgmOn : ""}`} onClick={toggle} aria-pressed={on} aria-label={on ? "배경 음악 끄기" : "배경 음악 켜기"} title={on ? "배경 음악 끄기" : "배경 음악 켜기"}>
      <span className={s.bgmBars} aria-hidden="true"><i /><i /><i /><i /></span>
    </button>
  </>);
}
