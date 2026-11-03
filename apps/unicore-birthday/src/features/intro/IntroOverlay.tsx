"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { videos } from "@/data/videos";
import { copy } from "@/data/copy";
import { product } from "@/data/product";
import { audio, type SoundState } from "@/features/audio/audio";
import { useIsMobile, useReducedMotion } from "@/lib/env";
import styles from "./intro.module.css";

type Phase = "wait" | "entry" | "film" | "done";

/**
 * 시네마틱 인트로
 * - BGM 자동재생이 허용되면 바로 필름 재생(사운드 ON), 차단되면 ENTER 화면에서 한 번의 탭으로 사운드+필름 시작.
 * - 필름은 항상 음소거(사이트 사운드는 BGM 하나). 언제든 SKIP 가능. 영상 실패 시 포스터+카피 폴백.
 */
export default function IntroOverlay({ onDone }: { onDone: () => void }) {
  const mobile = useIsMobile();
  const reduced = useReducedMotion();
  const asset = mobile ? videos.filmPortrait : videos.film;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>("wait");
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [remember, setRemember] = useState(false);
  const [visible, setVisible] = useState(true);
  const skipTo = asset.skipTo ?? asset.durationSec;

  const finish = useCallback(() => {
    if (remember) { try { localStorage.setItem("uc.introSeen", "1"); } catch {} }
    setPhase("done");
    setVisible(false);
    window.setTimeout(onDone, 900);
  }, [onDone, remember]);

  // 오디오 상태에 따라 입장 방식 결정: on/off → 바로 필름, blocked → ENTER 화면
  useEffect(() => {
    return audio.subscribe((s: SoundState) => {
      setPhase((p) => {
        if (p === "film" || p === "done") return p;
        if (s === "on" || s === "off") return "film";
        if (s === "blocked") return "entry";
        return p;
      });
    });
  }, []);

  // 재생 제어
  useEffect(() => {
    const v = videoRef.current;
    if (!v || failed || reduced) return;
    v.muted = true;
    if (phase === "film") v.play().catch(() => {/* 자동재생 거부 → 탭하여 재생 */});
  }, [phase, failed, reduced]);

  const onTime = () => {
    const v = videoRef.current; if (!v) return;
    setProgress(v.duration ? v.currentTime / v.duration : 0);
    if (phase === "film" && v.currentTime >= asset.durationSec - 0.15) finish();
  };

  const enter = (sound: boolean) => {
    if (sound) void audio.enable(); else audio.disable();
    setPhase("film");
  };

  const skip = () => {
    const v = videoRef.current;
    if (v && !failed && !reduced && phase === "film" && v.readyState >= 2 && v.currentTime < skipTo) {
      // 로고 컷만 짧게 보여주고 종료
      v.currentTime = skipTo;
      v.play().catch(() => {});
      window.setTimeout(finish, 1100);
    } else {
      finish();
    }
  };

  const showFallback = failed || reduced;

  return (
    <div className={`${styles.overlay} ${visible ? "" : styles.hidden}`} role="dialog" aria-label="인트로 영상">
      <div className={styles.stage}>
        {!showFallback ? (
          <video
            ref={videoRef}
            className={styles.video}
            poster={asset.poster}
            playsInline
            muted
            preload="auto"
            onTimeUpdate={onTime}
            onError={() => setFailed(true)}
            onEnded={finish}
          >
            {asset.sources.map((s) => <source key={s.src} src={s.src} type={s.type} />)}
          </video>
        ) : (
          <div className={styles.fallback} style={{ backgroundImage: `url(${asset.poster})` }}>
            <div className={styles.fallbackCopy}>
              <p className="headline-ko">{copy.intro.q1.text}</p>
              <p className={styles.fallbackSub}>{copy.intro.q2.text}</p>
            </div>
          </div>
        )}
        <div className={styles.veil} />

        {/* 자동재생이 차단된 경우: 한 번의 탭으로 사운드 + 필름 시작 */}
        {(phase === "entry" || (showFallback && phase !== "done" && phase !== "film")) && (
          <div className={styles.gate} data-sound-gate="">
            <span className={styles.entryBrand}>{product.brand}</span>
            <p className={styles.entryTitle}>{copy.intro.q1.text}</p>
            <p className={styles.gateHint}>{copy.intro.soundHint.text}</p>
            <div className={styles.gateBtns}>
              <button className="btn btn-primary" onClick={() => enter(true)}>{copy.intro.enterSound.text}</button>
              <button className="btn btn-ghost" onClick={() => enter(false)}>{copy.intro.enterMute.text}</button>
            </div>
            <label className={styles.remember}>
              <input type="checkbox" id="intro-remember" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> {copy.intro.rememberSkip.text}
            </label>
          </div>
        )}

        {showFallback && phase === "film" && (
          <div className={styles.gate}>
            <div className={styles.gateBtns}>
              <button className="btn btn-primary" onClick={finish}>{product.brand} 시작하기</button>
            </div>
          </div>
        )}

        <div className={styles.ui}>
          <span className={styles.brand}>{product.brand}</span>
          <button className={styles.skip} onClick={skip}>{copy.intro.skip.text}</button>
        </div>

        {/* 영상 스킵 버튼 (하단 우측, 재생 중 항상 노출) */}
        {phase === "film" && !showFallback && (
          <button type="button" className={styles.skipBig} onClick={skip} aria-label="인트로 영상 건너뛰기">
            <span>{copy.intro.skipVideo.text}</span>
            <i aria-hidden="true" />
          </button>
        )}
        <div className={styles.progress} style={{ transform: `scaleX(${progress})` }} />
      </div>
    </div>
  );
}
