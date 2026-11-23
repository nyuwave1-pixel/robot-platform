"use client";
/**
 * 화면 아래쪽 구역의 '지연 하이드레이션'.
 * 서버가 그린 HTML(글자·이미지·링크)은 처음부터 그대로 보이고 검색엔진도 읽는다.
 * 브라우저는 그 구역에 가까이 스크롤했을 때(기본 300px 전)에야 React 를 붙여 애니메이션·상호작용을 켠다.
 * 첫 화면을 띄울 때 할 일이 줄어 모바일에서 화면이 덜 멈춘다(Total Blocking Time).
 *
 * 동작: 하이드레이션 중에는 빈 innerHTML + suppressHydrationWarning 으로 서버 DOM 을 건드리지 않고 남겨 두고,
 * 가까워지면 실제 children 을 렌더해 교체한다. 클라이언트 이동(서버 HTML 없음)일 때는 가까워지면 바로 그린다.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * size: 화면 밖에 있는 동안 브라우저가 배치 계산을 건너뛰도록(content-visibility) 쓸 대략적인 높이(px).
 * 0 이면 쓰지 않는다 (스크롤에 붙어 움직이는 긴 구역 등).
 */
export default function LazyHydrate({ children, margin = "0px 0px 300px 0px", size = 900 }: { children: ReactNode; margin?: string; size?: number }) {
  const style = size ? { contentVisibility: "auto" as const, containIntrinsicSize: `auto ${size}px` } : undefined;
  const ref = useRef<HTMLDivElement>(null);
  // 서버에서는 children 을 그리고, 브라우저 첫 렌더(하이드레이션)에서는 건너뛴다
  const [on, setOn] = useState(typeof window === "undefined");
  useEffect(() => {
    if (on) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setOn(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    // 해시 링크(#technology 등)로 바로 이동하는 경우에도 붙는다
    const onHash = () => setOn(true);
    window.addEventListener("hashchange", onHash);
    return () => {
      io.disconnect();
      window.removeEventListener("hashchange", onHash);
    };
  }, [on, margin]);
  if (!on) return <div ref={ref} style={style} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: "" }} />;
  return <div ref={ref} style={style}>{children}</div>;
}
