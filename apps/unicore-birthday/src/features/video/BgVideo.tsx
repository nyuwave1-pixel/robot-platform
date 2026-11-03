"use client";
import { useEffect, useRef, useState } from "react";

/** 무음 배경 영상 — 뷰포트 안에서만 재생, 실패 시 포스터/폴백 이미지. 사이트 사운드는 BGM 단일 */
export default function BgVideo({ src, poster, fallback, className, loop = true, opacity = 1, position = "center" }: {
  src: string; poster?: string; fallback?: string; className?: string; loop?: boolean; opacity?: number; position?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ok, setOk] = useState(true);
  useEffect(() => {
    const v = ref.current; if (!v || !ok) return;
    v.muted = true; v.defaultMuted = true;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.1 });
    io.observe(v); return () => io.disconnect();
  }, [ok]);
  if (!ok) return <div className={className} style={{ position: "absolute", inset: 0, backgroundImage: `url(${fallback || poster})`, backgroundSize: "cover", backgroundPosition: position, opacity }} aria-hidden="true" />;
  return (
    <video ref={ref} className={className} poster={poster} playsInline muted loop={loop} preload="metadata" onError={() => setOk(false)} aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: position, opacity }}>
      <source src={src} type="video/mp4" />
    </video>
  );
}
