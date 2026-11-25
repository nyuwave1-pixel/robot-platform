"use client";
import { useEffect, useState } from "react";

let painted = false;

/**
 * 첫 프레임이 그려진 뒤에만 true.
 * GSAP ScrollTrigger·Lenis 초기화처럼 레이아웃을 많이 읽는 작업을 하이드레이션 직후 같은 태스크에서 돌리면
 * 브라우저가 첫 페인트를 그 작업이 끝날 때까지 미루므로(FCP 지연), rAF 두 번 뒤로 넘깁니다.
 * 이미 그려진 뒤 마운트되는 컴포넌트는 즉시 true.
 */
export function useAfterFirstPaint(): boolean {
  const [ready, setReady] = useState(painted);
  useEffect(() => {
    if (painted) { setReady(true); return; }
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => { painted = true; setReady(true); }); });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, []);
  return ready;
}
