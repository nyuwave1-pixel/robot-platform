"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { sourcesFor, videos } from "@/data/videos";
import { product } from "@/data/product";
import { audio, type SoundState } from "@/features/audio/audio";
import { useIsMobile, useReducedMotion } from "@/lib/env";
import styles from "./intro.module.css";
import { useDict, fmt } from "@/i18n/context";

type Phase = "wait" | "entry" | "film" | "done";

/**
 * 시네마틱 인트로
 * - BGM 자동재생이 허용되면 바로 필름 재생(사운드 ON), 차단되면 ENTER 화면에서 한 번의 탭으로 사운드+필름 시작.
 * - 필름은 항상 음소거(사이트 사운드는 BGM 하나). 언제든 SKIP 가능. 영상 실패 시 포스터+카피 폴백.
 */
export default function IntroOverlay({ onDone }: { onDone: () => void }) {
  const t = useDict();
  const mobile = useIsMobile();
  const reduced = useReducedMotion();
  const asset = mobile ? videos.filmPortrait : videos.film;
  // 뷰포트 판별(useIsMobile)은 첫 렌더 뒤에 확정되므로, 확정 전에는 <source> 를 붙이지 않는다
  // (첫 렌더에 데스크톱 1080p 소스가 붙어 모바일에서 5MB 를 받기 시작하던 문제 방지)
  const [vpReady, setVpReady] = useState(false);
  useEffect(() => { setVpReady(true); }, []);
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
    <div className={`${styles.overlay} ${visible ? "" : styles.hidden}`} role="dialog" aria-label={t.ui.introAria}>
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
            {vpReady && sourcesFor(asset, mobile).map((s) => <source key={s.src} src={s.src} type={s.type} />)}
          </video>
        ) : (
          <div className={styles.fallback} style={{ backgroundImage: `url(${asset.poster})` }}>
            <div className={styles.fallbackCopy}>
              <p className="headline-ko">{t.copy.intro.q1}</p>
              <p className={styles.fallbackSub}>{t.copy.intro.q2}</p>
            </div>
          </div>
        )}
        <div className={styles.veil} />

        {/* 자동재생이 차단된 경우: 한 번의 탭으로 사운드 + 필름 시작 */}
        {(phase === "entry" || (showFallback && phase !== "done" && phase !== "film")) && (
          <div className={styles.gate} data-sound-gate="">
            <span className={styles.entryBrand}>{product.brand}</span>
            <p className={styles.entryTitle}>{t.copy.intro.q1}</p>
            <p className={styles.gateHint}>{t.copy.intro.soundHint}</p>
            <div className={styles.gateBtns}>
              <button className="btn btn-primary" onClick={() => enter(true)}>{t.copy.intro.enterSound}</button>
              <button className="btn btn-ghost" onClick={() => enter(false)}>{t.copy.intro.enterMute}</button>
            </div>
            <label className={styles.remember}>
              <input type="checkbox" id="intro-remember" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> {t.copy.intro.rememberSkip}
            </label>
          </div>
        )}

        {showFallback && phase === "film" && (
          <div className={styles.gate}>
            <div className={styles.gateBtns}>
              <button className="btn btn-primary" onClick={finish}>{fmt(t.ui.introStart, { brand: product.brand })}</button>
            </div>
          </div>
        )}

        <div className={styles.ui}>
          <span className={styles.brand}>{product.brand}</span>
          <button className={styles.skip} onClick={skip}>{t.copy.intro.skip}</button>
        </div>

        {/* 영상 스킵 버튼 (하단 우측, 재생 중 항상 노출) */}
        {phase === "film" && !showFallback && (
          <button type="button" className={styles.skipBig} onClick={skip} aria-label={t.ui.introSkipAria}>
            <span>{t.copy.intro.skipVideo}</span>
            <i aria-hidden="true" />
          </button>
        )}
        <div className={styles.progress} style={{ transform: `scaleX(${progress})` }} />
      </div>
    </div>
  );
}
