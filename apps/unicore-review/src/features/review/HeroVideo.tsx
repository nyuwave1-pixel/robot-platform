"use client";
import { useEffect, useRef } from "react";
import s from "./review.module.css";

/**
 * 첫 화면 배경 영상(소리 없음). 배경 음악과 같은 곡의 영상이라, 음악이 재생 중이면 음악 위치에 장면을 맞춘다.
 *  - 휴대폰: 세로 화면에 맞게 가운데를 잘라 만든 가벼운 파일(540×720, 약 5MB) / PC: 720p
 *  - 데이터 절약 모드에서는 영상을 받지 않고 정지 화면만 보여 준다
 *  - 첫 화면이 보이지 않으면 멈춰 배터리·데이터를 아낀다
 *  - '동작 줄이기' 설정에서는 정지 화면만 보여 준다
 */
export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    const wide = window.matchMedia("(min-width: 900px)").matches;
    v.poster = wide ? "/media/video/hero-poster.webp" : "/media/video/hero-poster-mobile.webp";
    const saveData = (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
    if (saveData || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    v.src = wide ? "/media/video/hero-720.mp4" : "/media/video/hero-mobile.mp4";
    v.muted = true;
    let visible = true;
    const audio = () => (window as unknown as { __ucBgm?: HTMLAudioElement }).__ucBgm;
    const sync = () => {
      const a = audio(); if (!a || a.paused || !v.duration) return;
      const want = a.currentTime % v.duration;
      if (Math.abs(v.currentTime - want) > 0.4) v.currentTime = want;
    };
    const play = () => { if (visible) { sync(); void v.play().catch(() => {}); } };
    const timer = window.setInterval(sync, 2000);
    const onBgm = () => play();
    window.addEventListener("uc-bgm-play", onBgm);
    v.addEventListener("loadedmetadata", play);
    const io = "IntersectionObserver" in window ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) play(); else v.pause(); }, { threshold: 0.05 }) : null;
    io?.observe(v);
    play();
    return () => { window.clearInterval(timer); window.removeEventListener("uc-bgm-play", onBgm); v.removeEventListener("loadedmetadata", play); io?.disconnect(); };
  }, []);
  return (
    <div className={s.heroBg} aria-hidden="true">
      <video ref={ref} muted loop playsInline preload="metadata" tabIndex={-1} disablePictureInPicture />
    </div>
  );
}
