"use client";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { GUIDE_VIDEO, type VideoChapter } from "@/lib/care/knowledge";
import { track } from "@/lib/client/telemetry";

export interface GuideVideoHandle {
  play: (chapter: VideoChapter) => void;
}
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * 공식 사용법 영상 (유니앤코어 공식 YouTube). 누르기 전에는 YouTube 로 어떤 요청도 보내지 않는다 (youtube-nocookie, 클릭 시 로드).
 */
const GuideVideo = forwardRef<GuideVideoHandle>(function GuideVideo(_, ref) {
  const { t } = useI18n();
  const [start, setStart] = useState<number | null>(null);
  const [active, setActive] = useState<VideoChapter | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const play = (chapter: VideoChapter) => {
    const c = GUIDE_VIDEO.chapters.find((x) => x.key === chapter)!;
    setStart(c.start);
    setActive(chapter);
    track("video_play", { reason: chapter });
    box.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  useImperativeHandle(ref, () => ({ play }));
  return (
    <div ref={box} className="rounded-2xl border border-line bg-panel p-4 sm:p-5" data-testid="guide-video" data-no-export>
      <h3 className="text-sm font-semibold">{t.care.video.title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-silver">{t.care.video.desc}</p>
      <div className="mt-3 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-black">
          {start === null ? (
            <button onClick={() => play("faceIonto")} data-testid="video-play" className="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(79,182,255,0.18),transparent)]">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-xl text-black shadow-glow transition group-hover:scale-110">▶</span>
              <span className="text-sm font-medium">{t.care.video.play}</span>
              <span className="px-6 text-center text-[11px] text-silver/80">{t.care.video.consent}</span>
            </button>
          ) : (
            <iframe
              key={start}
              data-testid="video-frame"
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${GUIDE_VIDEO.id}?start=${start}&autoplay=1&rel=0&playsinline=1`}
              title={t.care.video.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
            />
          )}
        </div>
        <div>
          <ul className="space-y-1.5">
            {GUIDE_VIDEO.chapters.map((c) => (
              <li key={c.key}>
                <button onClick={() => play(c.key)} data-testid={`chapter-${c.key}`} className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${active === c.key ? "border-scan bg-scan/15 text-scan2" : "border-line hover:border-silver/50"}`}>
                  <span>{t.care.video.chapters[c.key]}</span>
                  <span className="tabular-nums text-xs text-silver">≈ {mmss(c.start)}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-silver/60">{t.care.video.approx} {t.care.video.consent}</p>
          <a href={GUIDE_VIDEO.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[11px] text-scan2 underline underline-offset-4">YouTube ↗</a>
        </div>
      </div>
    </div>
  );
});
export default GuideVideo;
