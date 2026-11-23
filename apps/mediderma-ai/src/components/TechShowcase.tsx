"use client";
/**
 * DERMA HOME TECHNOLOGY 전시 — 스크롤에 고정된 한 화면 안에서 RF → 울트라소닉 → 이온토포레시스 세 장면이 차례로 전환된다.
 *  - 배경: 공식 사이트(dermahome.unincore.com)의 기술별 작용 원리 이미지 + GLSL 빛 연출(보이는 장면 하나만 렌더, WebGL 불가 기기는 CSS 그라디언트).
 *  - 가운데: 기술별 공식 헤드 사진(원본 그대로, 흰 면 위) + 지금 보고 있는 모드 표시 — "하나의 기기, 세 가지 기술"
 *  - 글: 큰 번호, 영문 기술명, 현지어 이름·설명·태그가 장면마다 마스크 전환
 *  - '동작 줄이기' 설정이면 고정·전환 없이 세 장면을 차례로 나열한다.
 * 배경 그래픽은 기술 설명을 위한 연출이며 실제 기기 작동 모습이 아님을 화면에 밝힌다.
 */
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { track } from "@/lib/client/telemetry";
import type { ShaderKind } from "./fx/ShaderCanvas";

const ShaderCanvas = dynamic(() => import("./fx/ShaderCanvas"), { ssr: false });

type TechId = "rf" | "ultrasonic" | "iontophoresis";
const SCENES: { id: TechId; head: string; art: string; shader: ShaderKind; short: string; glow: string; accent: string; fallback: string }[] = [
  { id: "rf", head: "/dermahome/rf-head.webp", art: "/dermahome/skin-rf.webp", shader: "rf", short: "RF", glow: "rgba(251,146,60,0.55)", accent: "#fdba74", fallback: "radial-gradient(60% 55% at 62% 42%, rgba(251,146,60,0.42), rgba(244,63,94,0.12) 55%, transparent 75%)" },
  { id: "ultrasonic", head: "/dermahome/us-head.webp", art: "/dermahome/skin-us.webp", shader: "ultrasonic", short: "US", glow: "rgba(108,174,208,0.6)", accent: "#c7e8f2", fallback: "radial-gradient(60% 55% at 60% 44%, rgba(108,174,208,0.45), rgba(56,189,248,0.12) 55%, transparent 75%)" },
  { id: "iontophoresis", head: "/dermahome/ionto-head.webp", art: "/dermahome/skin-ionto.webp", shader: "ionto", short: "ION", glow: "rgba(167,139,250,0.55)", accent: "#ddd6fe", fallback: "radial-gradient(60% 55% at 62% 42%, rgba(167,139,250,0.42), rgba(108,174,208,0.14) 55%, transparent 75%)" },
];
const EASE = [0.2, 0.75, 0.2, 1] as const;

function Device({ active, label, note, alt }: { active: number; label: string; note: string; alt: string }) {
  const s = SCENES[active];
  return (
    <div className="relative mx-auto w-[min(34vw,140px)] sm:w-[240px] lg:w-[340px]">
      <motion.div aria-hidden className="absolute -inset-6 rounded-full blur-3xl" animate={{ backgroundColor: s.glow }} transition={{ duration: 0.9 }} style={{ opacity: 0.55 }} />
      <motion.figure
        className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-white via-[#f6f7f8] to-[#dce1e5] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/40"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative aspect-square w-full">
          <AnimatePresence initial={false}>
            <motion.img key={s.head} src={s.head} alt={alt} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain p-3" initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: EASE }} />
          </AnimatePresence>
        </div>
        <figcaption className="border-t border-black/5 px-3 py-2 text-[10px] leading-tight text-[#20252b] sm:flex sm:items-center sm:justify-between sm:gap-2">
          <span className="block font-display font-semibold tracking-[0.18em] max-sm:hidden">DERMA-HOME</span>
          <span className="block text-[#4f5964]">{note}</span>
        </figcaption>
      </motion.figure>
      <ul className="mt-2 flex justify-center gap-1.5 sm:mt-3" aria-label={label}>
        {SCENES.map((x, i) => (
          <li key={x.id} className={`rounded-full px-2.5 py-1 font-display text-[10px] tracking-[0.2em] transition-colors duration-500 ${i === active ? "bg-white text-[#101318]" : "border border-white/15 text-white/45"}`}>
            {x.short}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Copy({ index }: { index: number }) {
  const { t } = useI18n();
  const s = SCENES[index];
  const c = t.care.tech[s.id];
  return (
    <div>
      <p className="font-display text-[11px] tracking-[0.35em]" style={{ color: s.accent }}>
        0{index + 1} / 03 · {c.en}
      </p>
      <h3 className="mt-1.5 font-display text-[clamp(1.7rem,6.4vw,4.2rem)] font-semibold leading-[1.05] tracking-tight text-white">{c.name}</h3>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#dce1e5] sm:mt-3 sm:text-lg">{c.desc}</p>
      <ul className="mt-3 flex flex-wrap gap-1.5 sm:mt-4">
        {c.tags.map((tag) => (
          <li key={tag} className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs text-[#dce1e5] backdrop-blur">
            {tag}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Backdrop({ index, webgl }: { index: number; webgl: boolean }) {
  const s = SCENES[index];
  return (
    <div className="absolute inset-0">
      {/* 공식 사이트(dermahome.unincore.com)의 작용 원리 이미지 — 천천히 다가오는 켄 번스 */}
      <motion.img src={s.art} alt="" aria-hidden loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-70 lg:object-[70%_50%]" initial={{ scale: 1.14 }} animate={{ scale: 1.02 }} transition={{ duration: 9, ease: "easeOut" }} />
      {webgl ? <ShaderCanvas kind={s.shader} className="absolute inset-0 opacity-45 mix-blend-screen" /> : <div className="absolute inset-0 opacity-60" style={{ background: s.fallback }} />}
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,#101318_0%,rgba(16,19,24,0.35)_22%,rgba(16,19,24,0.2)_50%,rgba(16,19,24,0.88)_82%,#101318_100%)]" />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,19,24,0.85),transparent_55%)] max-lg:hidden" />
    </div>
  );
}

export default function TechShowcase({ webgl }: { webgl: boolean }) {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });
  const railScale = useTransform(smooth, [0, 1], [0.04, 1]);
  const ghostX = useTransform(smooth, [0, 1], ["4%", "-10%"]);
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.max(0, Math.min(SCENES.length - 1, Math.floor(v * SCENES.length)))));
  // 장면별 관심도: 실제로 스크롤해 들어온 장면만 세션당 한 번 센다
  const seen = useRef(new Set<string>());
  useEffect(() => {
    const p = scrollYProgress.get();
    if (p <= 0 || p >= 1) return;
    const id = SCENES[active].id;
    if (seen.current.has(id)) return;
    seen.current.add(id);
    track("tech_view", { tech: [id] });
  }, [active, scrollYProgress]);

  const jump = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (span * (i + 0.5)) / SCENES.length, behavior: "smooth" });
  };

  const heading = (
    <div>
      <p className="text-[10px] tracking-[0.25em] text-[#aeb7c0]">{t.landing.oneDevice}</p>
      <h2 className="mt-1 whitespace-nowrap font-display text-[13px] font-semibold tracking-[0.1em] text-white min-[400px]:text-sm sm:text-xl sm:tracking-[0.14em]">{t.landing.techTitle}</h2>
    </div>
  );

  // 동작 줄이기: 고정·전환 없이 차례로 나열
  if (reduce) {
    return (
      <section id="technology" className="theme-dark border-y border-line/70 bg-[#101318]" data-testid="tech-showcase" data-mode="static">
        <div className="mx-auto max-w-6xl px-4 py-14">
          {heading}
          <div className="mt-6">
            <Device active={0} label={t.landing.techTitle} note={t.landing.officialImage} alt={`DERMA-HOME ${t.care.tech[SCENES[0].id].name}`} />
          </div>
          <div className="mt-8 space-y-10">
            {SCENES.map((s, i) => (
              <div key={s.id} className="rounded-3xl border border-line p-6" style={{ background: s.fallback }}>
                <Copy index={i} />
              </div>
            ))}
          </div>
          <p className="mt-6 text-[11px] text-silver-soft">{t.landing.techVisualNote}</p>
        </div>
      </section>
    );
  }

  return (
    <>
    <section id="technology" ref={ref} className="theme-dark relative border-y border-line/70 bg-[#101318]" style={{ height: `${SCENES.length * 90 + 30}svh` }} data-testid="tech-showcase" data-mode="pinned" data-active={active}>
      <div className="sticky top-14 h-[calc(100svh-3.5rem)] overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.div key={active} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: "easeInOut" }}>
            <Backdrop index={active} webgl={webgl} />
          </motion.div>
        </AnimatePresence>

        {/* 장면 번호 — 배경에 깔리는 큰 윤곽 숫자 */}
        <motion.span aria-hidden style={{ x: ghostX, WebkitTextStroke: "1px rgba(220,225,229,0.16)" }} className="pointer-events-none absolute -right-2 top-[8%] select-none font-display text-[42vw] font-semibold leading-none text-transparent lg:top-[2%] lg:text-[26vw]">
          0{active + 1}
        </motion.span>

        <div className="relative mx-auto flex h-full max-w-6xl flex-col px-4 pb-24 pt-4 md:pb-6 lg:pb-10 lg:pt-8">
          <div className="flex items-start justify-between gap-4">
            {heading}
            <div className="flex shrink-0 gap-1.5 pt-1" role="tablist" aria-label={t.landing.techTitle}>
              {SCENES.map((s, i) => (
                <button key={s.id} type="button" role="tab" aria-selected={i === active} aria-label={t.care.tech[s.id].name} onClick={() => jump(i)} className="group flex h-8 w-8 items-center justify-center" data-testid={`tech-tab-${s.id}`}>
                  <span className={`block h-1.5 rounded-full transition-all duration-500 ${i === active ? "w-7 bg-white" : "w-1.5 bg-white/30 group-hover:bg-white/60"}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid min-h-0 flex-1 content-center items-center gap-3 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
            <div className="order-2 lg:order-1">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 28, clipPath: "inset(0 0 100% 0)", filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)", filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -18, filter: "blur(6px)" }}
                  transition={{ duration: 0.55, ease: EASE }}
                  data-testid="tech-copy"
                >
                  <Copy index={active} />
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="order-1 lg:order-2">
              <Device active={active} label={t.landing.techTitle} note={t.landing.officialImage} alt={`DERMA-HOME ${t.care.tech[SCENES[active].id].name}`} />
            </div>
          </div>

          <div>
            <div className="h-px w-full bg-white/10">
              <motion.div className="h-px origin-left bg-gradient-to-r from-[#6caed0] via-white to-[#c7e8f2]" style={{ scaleX: railScale }} />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[10px] text-[#aeb7c0]/80 max-md:hidden">
              <span>{t.landing.techVisualNote}</span>
              <a className="underline underline-offset-2 hover:text-white" href="https://dermahome.unincore.com/" target="_blank" rel="noopener noreferrer">
                dermahome.unincore.com ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
    <p className="theme-dark border-b border-line/70 bg-[#101318] px-4 py-3 text-[11px] leading-relaxed text-[#aeb7c0]/80 md:hidden" data-testid="tech-note-mobile">
      {t.landing.techVisualNote}{" "}
      <a className="underline underline-offset-2" href="https://dermahome.unincore.com/" target="_blank" rel="noopener noreferrer">
        dermahome.unincore.com ↗
      </a>
    </p>
    </>
  );
}
