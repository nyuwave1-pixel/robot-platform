"use client";

import { useEffect, useRef, useState } from "react";
import { Play, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { track } from "@/lib/analytics";

/** Only one creator video plays with sound at a time. */
const SOUND_EVENT = "uc-video-sound";

/**
 * Vertical creator video (JYT revision 2, item 6). It plays by itself, muted and looping, while at
 * least half of it is on screen, and pauses when it leaves. Browsers only allow muted autoplay, so
 * there is a sound button. The file is only fetched once the card comes on screen.
 *
 * With reduced motion turned on, or when the browser refuses autoplay (e.g. iOS Low Power Mode),
 * it shows the poster with a play button instead.
 */
export function VideoCard({ src, poster, caption, duration }: { src: string; poster: string; caption: string; duration: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const loaded = useRef(false);
  const [blocked, setBlocked] = useState(false);
  const [muted, setMuted] = useState(true);

  const load = () => {
    const v = ref.current;
    if (!v || loaded.current) return;
    loaded.current = true;
    v.src = src;
  };

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      setBlocked(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          load();
          v.play().catch(() => setBlocked(true));
        } else {
          v.pause();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(v);
    // Another card turned its sound on: this one goes quiet.
    const onSound = (ev: Event) => {
      if ((ev as CustomEvent<string>).detail !== src) {
        v.muted = true;
        setMuted(true);
      }
    };
    window.addEventListener(SOUND_EVENT, onSound);
    return () => {
      io.disconnect();
      window.removeEventListener(SOUND_EVENT, onSound);
    };
  }, [src]);

  const setSound = (on: boolean) => {
    const v = ref.current;
    if (!v) return;
    v.muted = !on;
    setMuted(!on);
    if (on) {
      window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: src }));
      track("video_play", { label: caption });
    }
  };

  const playByHand = () => {
    const v = ref.current;
    if (!v) return;
    load();
    setSound(true);
    v.play()
      .then(() => setBlocked(false))
      .catch(() => {});
  };

  return (
    <div className="relative aspect-[9/16] overflow-hidden rounded-[20px] bg-[#16150F] shadow-[0_0_0_1.5px_rgb(255_255_255/0.9),0_18px_34px_-24px_rgb(var(--acc-deep)/0.55)]">
      <video ref={ref} className="h-full w-full object-cover" poster={poster} muted loop playsInline preload="none" aria-label={caption} />
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />

      {blocked && (
        <button type="button" onClick={playByHand} aria-label={`Play video: ${caption}`} className="group absolute inset-0 grid place-items-center">
          <span aria-hidden className="lens w-12 text-[#16150F] transition-transform duration-200 ease-out group-hover:scale-105 group-active:scale-95">
            <Play size={18} weight="fill" className="translate-x-[1px]" />
          </span>
        </button>
      )}

      <span aria-hidden className="pointer-events-none absolute bottom-2.5 left-2.5 rounded-[8px] bg-black/55 px-2 py-1 text-[11.5px] font-semibold tabular-nums text-white backdrop-blur-md">
        {duration}
      </span>
      {!blocked && (
        <button
          type="button"
          onClick={() => setSound(muted)}
          aria-label={muted ? `Turn sound on: ${caption}` : `Turn sound off: ${caption}`}
          aria-pressed={!muted}
          className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-[10px] bg-black/55 text-white backdrop-blur-md transition-transform duration-150 ease-out active:scale-95"
        >
          {muted ? <SpeakerSlash size={17} weight="fill" aria-hidden /> : <SpeakerHigh size={17} weight="fill" aria-hidden />}
        </button>
      )}
    </div>
  );
}
