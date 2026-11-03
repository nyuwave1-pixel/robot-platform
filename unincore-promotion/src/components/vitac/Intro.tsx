"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { BRAND } from "@/data/brand";
import { claimAudio, releaseAudio, startAmbientPad } from "@/lib/audio";

const KEY = "uc_intro_seen";
const DURATION = 8200;

/**
 * Inline decision script, rendered right after the overlay markup so it runs
 * before the hero paints: the intro plays on a first visit only, never for
 * reduced-motion users or automated browsers, and always with ?intro=1.
 */
const DECIDE = `try{var e=document.getElementById('vc-intro');var q=/[?&]intro=1/.test(location.search);var s=null;try{s=localStorage.getItem('${KEY}')}catch(_){}var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;if(e&&(q||(!s&&!rm&&!navigator.webdriver))){e.setAttribute('data-state','play');document.documentElement.style.overflow='hidden'}}catch(_){}`;

export function Intro({ products }: { products: { key: string; name: string; image?: string }[] }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stopSound = useRef<null | (() => void)>(null);
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState(false);

  const finish = useCallback(() => {
    const el = root.current;
    if (!el || el.getAttribute("data-state") !== "play") return;
    el.setAttribute("data-state", "leaving");
    document.documentElement.style.overflow = "";
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    stopSound.current?.();
    stopSound.current = null;
    releaseAudio("intro");
    setTimeout(() => el.setAttribute("data-state", "done"), 900);
    setPlaying(false);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || el.getAttribute("data-state") !== "play") return;
    setPlaying(true);
    const timer = setTimeout(finish, DURATION);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && finish();
    window.addEventListener("keydown", onKey);

    // Gold dust: a light 2D canvas, so the intro never waits on three.js.
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    let raf = 0;
    if (c && ctx) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = () => {
        c.width = c.clientWidth * dpr;
        c.height = c.clientHeight * dpr;
      };
      size();
      const n = window.innerWidth < 768 ? 70 : 160;
      const pts = Array.from({ length: n }, () => ({
        a: Math.random() * Math.PI * 2,
        r: Math.random(),
        s: 0.4 + Math.random() * 1.6,
        v: 0.15 + Math.random() * 0.5,
        h: Math.random(),
      }));
      const t0 = performance.now();
      const draw = () => {
        const t = (performance.now() - t0) / 1000;
        const w = c.width, h = c.height;
        ctx.clearRect(0, 0, w, h);
        const spread = Math.min(1, Math.max(0, (t - 0.8) / 2.2)); // particles burst outward with the light
        for (const p of pts) {
          const rad = (0.02 + p.r * 0.62 * spread) * Math.min(w, h) + p.v * t * 18 * dpr;
          const x = w / 2 + Math.cos(p.a + t * 0.05) * rad * 1.35;
          const y = h / 2 + Math.sin(p.a + t * 0.05) * rad - t * p.v * 8 * dpr;
          const tw = 0.5 + 0.5 * Math.sin(t * 2 + p.h * 20);
          ctx.beginPath();
          ctx.fillStyle = p.h > 0.5 ? `rgba(233,185,77,${0.55 * tw})` : `rgba(198,161,106,${0.5 * tw})`;
          ctx.arc(x, y, p.s * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
        raf = requestAnimationFrame(draw);
      };
      draw();
      window.addEventListener("resize", size);
      return () => {
        clearTimeout(timer);
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", size);
        window.removeEventListener("keydown", onKey);
      };
    }
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [finish]);

  const toggleSound = () => {
    if (sound) {
      stopSound.current?.();
      stopSound.current = null;
      releaseAudio("intro");
      setSound(false);
      return;
    }
    try {
      const stop = startAmbientPad();
      stopSound.current = stop;
      claimAudio("intro", () => {
        stop();
        setSound(false);
      });
      setSound(true);
    } catch {
      setSound(false);
    }
  };

  return (
    <>
      <div ref={root} id="vc-intro" className="vc-intro" data-state="off" suppressHydrationWarning role="dialog" aria-modal="true" aria-label={`${BRAND.name} ${BRAND.collection} intro`}>
        <canvas ref={canvas} className="vc-intro-dust" aria-hidden />
        <div className="vc-intro-orb" aria-hidden />
        <div className="vc-intro-copy">
          <p className="vc-intro-mark">
            UNI<span>&amp;</span>CORE
          </p>
          <p className="vc-intro-collection">{BRAND.collection}</p>
          <p className="vc-intro-line">{BRAND.intro.lines[0]}</p>
          <p className="vc-intro-line vc-intro-line-2">{BRAND.intro.lines[1]}</p>
        </div>
        <div className="vc-intro-products">
          <ul>
            {products.map((p, i) => (
              <li key={p.key} style={{ ["--i" as string]: i }}>
                {p.image && <Image src={p.image} alt={p.name} width={240} height={300} sizes="(max-width:768px) 26vw, 180px" />}
              </li>
            ))}
          </ul>
          <p>{BRAND.intro.reveal}</p>
        </div>
        <div className="vc-intro-ctrl">
          <button type="button" onClick={toggleSound} aria-pressed={sound} tabIndex={playing ? 0 : -1}>
            {sound ? "Sound off" : "Sound on"}
          </button>
          <button type="button" onClick={finish}>
            Skip intro
          </button>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: DECIDE }} />
    </>
  );
}
