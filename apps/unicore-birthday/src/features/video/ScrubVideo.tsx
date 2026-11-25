"use client";
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useNearViewport } from "./useNearViewport";

/** 단독 영상 파일을 스크롤 진행률로 스크럽. 무음. 재생 실패 시 폴백 이미지 */
export default function ScrubVideo({ src, poster, fallback, progressRef, className }: {
  src: string; poster?: string; fallback?: string; progressRef: MutableRefObject<number>; className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  // 뷰포트 한 화면 근처에 오기 전까지는 metadata 만 받는다(초기 로드 시 수백 KB~MB 절약)
  const near = useNearViewport(ref);
  useEffect(() => { const v = ref.current; if (v && near && v.preload !== "auto") { v.preload = "auto"; v.load(); } }, [near]);
  useEffect(() => {
    const v = ref.current; if (!v || failed) return;
    v.muted = true; v.defaultMuted = true;
    let raf = 0, active = false, last = -1;
    const tick = () => {
      if (active && v.readyState >= 1 && v.duration) {
        const t = progressRef.current * Math.max(0, v.duration - 0.05);
        if (Math.abs(t - last) > 0.02) { v.currentTime = t; last = t; }
      }
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => { active = e.isIntersecting; }, { rootMargin: "20% 0px" });
    io.observe(v); raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [failed, progressRef]);
  if (failed && fallback) return <div className={className} style={{ backgroundImage: `url(${fallback})`, backgroundSize: "cover", backgroundPosition: "center" }} aria-hidden="true" />;
  return (
    <video ref={ref} className={className} poster={poster} playsInline muted preload="metadata" onError={() => setFailed(true)} aria-hidden="true">
      <source src={src} type="video/mp4" />
    </video>
  );
}
