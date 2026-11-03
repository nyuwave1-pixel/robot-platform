"use client";
import { useEffect, useRef, type RefObject } from "react";
import { videos } from "@/data/videos";

/**
 * 시네마틱 필름의 한 구간을 스크롤 진행률로 스크럽합니다.
 * progressRef 는 useSectionProgress 가 돌려주는 ref. 섹션을 벗어나면 디코딩을 멈춥니다.
 */
export default function FilmScrub({
  segment, progressRef, poster, className, blurLabel = false,
}: {
  segment: { start: number; end: number };
  progressRef: RefObject<number>;
  poster?: string;
  className?: string;
  blurLabel?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const ready = useRef(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let raf = 0;
    let last = -1;
    const onCan = () => { ready.current = true; };
    v.addEventListener("loadeddata", onCan);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        v.preload = "auto";
        if (v.readyState === 0) v.load();
        loop();
      } else {
        cancelAnimationFrame(raf);
      }
    }, { rootMargin: "40% 0px" });
    io.observe(v);
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!ready.current || v.seeking) return;
      const p = progressRef.current ?? 0;
      const t = segment.start + Math.min(1, Math.max(0, p)) * (segment.end - segment.start);
      if (Math.abs(t - last) > 0.03) { last = t; v.currentTime = t; }
    };
    return () => { cancelAnimationFrame(raf); io.disconnect(); v.removeEventListener("loadeddata", onCan); };
  }, [segment, progressRef]);

  return (
    <video
      ref={ref}
      className={className}
      poster={poster ?? videos.filmScrub.poster}
      muted
      playsInline
      preload="none"
      aria-hidden="true"
      style={blurLabel ? { filter: "none" } : undefined}
    >
      {videos.filmScrub.sources.map((s) => <source key={s.src} src={s.src} type={s.type} />)}
    </video>
  );
}
