"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { videos } from "@/data/videos";
import { copy } from "@/data/copy";
import { product } from "@/data/product";
import { audio } from "@/features/audio/audio";
import { useIsMobile, useReducedMotion } from "@/lib/env";
import styles from "./intro.module.css";

type Phase = "film1" | "gate" | "film2" | "done";

/**
 * 시네마틱 인트로: 필름 자동재생(muted) → gateAt 에서 정지하고 사운드 선택 → 이어서 재생 → 로고 컷 → 메인.
 * 항상 스킵 가능. 영상 실패 시 포스터+카피 폴백.
 */
export default function IntroOverlay({ onDone }: { onDone: () => void }) {
  const mobile = useIsMobile();
  const reduced = useReducedMotion();
  const asset = mobile ? videos.filmPortrait : videos.film;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>("film1");
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [remember, setRemember] = useState(false);
  const [visible, setVisible] = useState(true);
  const gateAt = asset.gateAt ?? 12;
  const skipTo = asset.skipTo ?? asset.durationSec;

  const finish = useCallback(() => {
    if (remember) { try { localStorage.setItem("uc.introSeen", "1"); } catch {} }
    setPhase("done");
    setVisible(false);
    window.setTimeout(onDone, 900);
  }, [onDone, remember]);

  // 재생 제어
  useEffect(() => {
    const v = videoRef.current;
    if (!v || failed) return;
    if (reduced) return; // 감소 모션: 자동재생 안 함
    if (phase === "film1" || phase === "film2") {
      v.play().catch(() => {/* 자동재생 거부 → 탭하여 재생 */});
    } else if (phase === "gate") {
      v.pause();
    }
  }, [phase, failed, reduced]);

  const onTime = () => {
    const v = videoRef.current; if (!v) return;
    setProgress(v.duration ? v.currentTime / v.duration : 0);
    if (phase === "film1" && v.currentTime >= gateAt) setPhase("gate");
    if (phase === "film2" && v.currentTime >= asset.durationSec - 0.15) finish();
  };

  const choose = (sound: boolean) => {
    audio.unlock();
    audio.setEnabled(sound);
    const v = videoRef.current;
    if (v) { audio.claim(v); v.muted = !sound; }
    setPhase("film2");
  };

  const skip = () => {
    audio.unlock();
    const v = videoRef.current;
    if (v && !failed && !reduced && v.readyState >= 2 && v.currentTime < skipTo) {
      // 로고 컷만 짧게 보여주고 종료
      v.currentTime = skipTo;
      v.muted = true;
      v.play().catch(() => {});
      setPhase("film2");
      window.setTimeout(finish, 1100);
    } else {
      finish();
    }
  };

  return (
    <div className={`${styles.overlay} ${visible ? "" : styles.hidden}`} role="dialog" aria-label="인트로 영상">
      <div className={styles.stage}>
        {!failed && !reduced ? (
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

        {phase === "gate" && (
          <div className={styles.gate}>
            <p className={styles.gateHint}>{copy.intro.soundHint.text}</p>
            <div className={styles.gateBtns}>
              <button className="btn btn-primary" onClick={() => choose(true)}>{copy.intro.soundOn.text}</button>
              <button className="btn btn-ghost" onClick={() => choose(false)}>{copy.intro.soundOff.text}</button>
              <button className="btn btn-ghost" onClick={skip}>{copy.intro.skip.text}</button>
            </div>
            <label className={styles.remember}>
              <input type="checkbox" id="intro-remember" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> {copy.intro.rememberSkip.text}
            </label>
          </div>
        )}

        {(failed || reduced) && phase !== "done" && (
          <div className={styles.gate}>
            <div className={styles.gateBtns}>
              <button className="btn btn-primary" onClick={() => { audio.unlock(); finish(); }}>{product.brand} 시작하기</button>
            </div>
          </div>
        )}

        <div className={styles.ui}>
          <span className={styles.brand}>{product.brand}</span>
          <button className={styles.skip} onClick={skip}>{copy.intro.skip.text}</button>
        </div>
        <div className={styles.progress} style={{ transform: `scaleX(${progress})` }} />
      </div>
    </div>
  );
}
