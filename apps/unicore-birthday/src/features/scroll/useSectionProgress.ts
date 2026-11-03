"use client";
import { useEffect, useRef, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * 핀(sticky) 섹션의 스크롤 진행률(0~1)을 ref 로 제공합니다.
 * 렌더를 다시 일으키지 않으므로 3D/비디오 스크럽에 그대로 전달할 수 있습니다.
 */
export function useSectionProgress(ref: RefObject<HTMLElement | null>, onUpdate?: (p: number) => void) {
  const progress = useRef(0);
  const cb = useRef(onUpdate);
  cb.current = onUpdate;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        progress.current = self.progress;
        cb.current?.(self.progress);
      },
    });
    return () => st.kill();
  }, [ref]);
  return progress;
}

/** 요소가 뷰포트에 진입할 때 1회 콜백 */
export function useInView(ref: RefObject<HTMLElement | null>, onEnter: () => void, start = "top 75%") {
  const cb = useRef(onEnter);
  cb.current = onEnter;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const st = ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => cb.current() });
    return () => st.kill();
  }, [ref, start]);
}
