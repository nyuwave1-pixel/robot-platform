"use client";
import { useEffect, useState, type RefObject } from "react";

/** 요소가 뷰포트 근처(rootMargin)에 들어오면 true 로 고정 — 영상 preload 를 metadata → auto 로 올릴 때 사용 */
export function useNearViewport<T extends Element>(ref: RefObject<T | null>, rootMargin = "100% 0px"): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el || near) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, near]);
  return near;
}
