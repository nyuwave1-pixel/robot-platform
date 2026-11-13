"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/client/store";
import { canUse3D } from "@/lib/client/device";
import { track } from "@/lib/client/telemetry";
import { FACE_ZONES } from "@/lib/analysis/zones";
import type { FaceZoneId } from "@/lib/analysis/types";
import { MEASURABLE } from "@/lib/analysis/providers/localCv";
import UploadBox from "./UploadBox";
import FaceFallback from "./FaceFallback";
import DepthText from "./fx/DepthText";
import FaceSequence from "./fx/FaceSequence";
import { Magnetic, Tilt } from "./fx/Interactive";
import type { ShaderKind } from "./fx/ShaderCanvas";

const FaceScene = dynamic(() => import("./FaceScene"), { ssr: false });
const Title3D = dynamic(() => import("./fx/Title3D"), { ssr: false });
const ShaderCanvas = dynamic(() => import("./fx/ShaderCanvas"), { ssr: false });

const KEYWORDS = ["MEDICAL BEAUTY TECH", "AI SKIN INTELLIGENCE", "FUTURE SKIN LAB", "PREMIUM CLINICAL EXPERIENCE", "DIGITAL SKIN ANALYSIS", "SCAN · ANALYZE · CARE · TRANSFORM"];
const TECHS: { id: "rf" | "ultrasonic" | "iontophoresis"; shader: ShaderKind; tint: string }[] = [
  { id: "rf", shader: "rf", tint: "from-amber-400/25" },
  { id: "ultrasonic", shader: "ultrasonic", tint: "from-sky-400/25" },
  { id: "iontophoresis", shader: "ionto", tint: "from-violet-400/25" },
];

const rise = { initial: { opacity: 0, y: 36 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: 0.7, ease: [0.2, 0.75, 0.2, 1] as const } };

function Process({ steps }: { steps: { title: string; desc: string }[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 55%"] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });
  return (
    <ol ref={ref} className="relative mt-10 grid gap-4 lg:grid-cols-5">
      {/* 스크롤 진행에 맞춰 채워지는 연결선 */}
      <div aria-hidden className="absolute left-5 top-0 h-full w-px bg-line lg:left-0 lg:top-6 lg:h-px lg:w-full" />
      <motion.div aria-hidden className="absolute left-5 top-0 h-full w-px origin-top bg-gradient-to-b from-scan to-scan2 shadow-glow lg:hidden" style={{ scaleY: p }} />
      <motion.div aria-hidden className="absolute left-0 top-6 hidden h-px w-full origin-left bg-gradient-to-r from-scan to-scan2 shadow-glow lg:block" style={{ scaleX: p }} />
      {steps.map((s, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, rotateX: -55, y: 40 }}
          whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: i * 0.09, ease: [0.2, 0.75, 0.2, 1] }}
          style={{ transformPerspective: 900, transformOrigin: "50% 0%" }}
          className="relative pl-14 lg:pl-0 lg:pt-14"
        >
          <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-scan/60 bg-ink font-display text-sm text-scan2 shadow-glow lg:top-1">{String(i + 1).padStart(2, "0")}</span>
          <Tilt className="h-full rounded-2xl border border-line bg-panel/80 p-4 backdrop-blur" max={6}>
            <h3 className="text-sm font-semibold">{s.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-silver">{s.desc}</p>
          </Tilt>
        </motion.li>
      ))}
    </ol>
  );
}

/** 사진이 기기 밖으로 나가지 않는다는 것을 보여 주는 모션 다이어그램 */
function OnDeviceVisual() {
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="od-g" x1="0" x2="1">
          <stop offset="0" stopColor="#4fb6ff" />
          <stop offset="1" stopColor="#7fe0ff" />
        </linearGradient>
      </defs>
      {/* 기기 */}
      <rect x="92" y="18" width="104" height="164" rx="16" fill="rgba(79,182,255,0.06)" stroke="url(#od-g)" strokeWidth="1.5" />
      <rect x="126" y="26" width="36" height="5" rx="2.5" fill="#1c232d" />
      <circle cx="144" cy="92" r="26" fill="none" stroke="#c9d1d9" strokeWidth="1" opacity="0.7" />
      <path d="M131 88q13-16 26 0M134 100q10 9 20 0" fill="none" stroke="#c9d1d9" strokeWidth="1" opacity="0.7" />
      {/* 기기 안에서만 도는 데이터 */}
      <g style={{ transformOrigin: "144px 92px", animation: "orbit 6s linear infinite" }}>
        <circle cx="144" cy="52" r="3.2" fill="#7fe0ff" />
        <circle cx="184" cy="92" r="2.4" fill="#4fb6ff" />
        <circle cx="144" cy="132" r="2.8" fill="#7fe0ff" />
      </g>
      <circle cx="144" cy="92" r="40" fill="none" stroke="#4fb6ff" strokeWidth="0.8" strokeDasharray="3 5" style={{ animation: "dash 2s linear infinite" }} />
      <rect x="112" y="146" width="64" height="5" rx="2.5" fill="#1c232d" />
      <rect x="112" y="146" width="64" height="5" rx="2.5" fill="url(#od-g)">
        <animate attributeName="width" values="0;64;64;0" keyTimes="0;0.6;0.9;1" dur="4s" repeatCount="indefinite" />
      </rect>
      {/* 서버·외부 AI 로 가는 길은 막혀 있다 */}
      <path d="M204 92h52" stroke="#5b6672" strokeWidth="1.2" strokeDasharray="4 5" />
      <g transform="translate(272 92)">
        <path d="M-16 8a10 10 0 0 1 2-19 13 13 0 0 1 25 3 9 9 0 0 1 1 16z" fill="none" stroke="#5b6672" strokeWidth="1.4" />
      </g>
      <g transform="translate(230 92)">
        <circle r="11" fill="#05070a" stroke="#fb7185" strokeWidth="1.6" />
        <path d="M-6-6 6 6M6-6-6 6" stroke="#fb7185" strokeWidth="1.8" strokeLinecap="round" />
      </g>
      <path d="M32 92h52" stroke="url(#od-g)" strokeWidth="1.4" strokeDasharray="4 5" style={{ animation: "dash 1.2s linear infinite reverse" }} />
      <rect x="10" y="78" width="24" height="28" rx="4" fill="none" stroke="#c9d1d9" strokeWidth="1.2" />
      <circle cx="22" cy="88" r="4" fill="none" stroke="#c9d1d9" strokeWidth="1" />
      <path d="M14 102q8-8 16 0" fill="none" stroke="#c9d1d9" strokeWidth="1" />
    </svg>
  );
}

export default function Landing() {
  const { t } = useI18n();
  const { setPendingFile, config } = useApp();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [use3d, setUse3d] = useState<boolean | null>(null);
  const [titleReady, setTitleReady] = useState(false);
  const [zone, setZone] = useState<FaceZoneId | null>(null);
  useEffect(() => setUse3d(canUse3D()), []);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const faceY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const faceScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const start = (f: File) => {
    setPendingFile(f);
    router.push("/analyze");
  };
  const zoneIds = [...FACE_ZONES.map((z) => z.id), "neck" as const];
  return (
    <div className="overflow-hidden">
      {/* ── HERO ───────────────────────────────────────────── */}
      <section ref={heroRef} className="relative">
        <div aria-hidden className="grid-floor pointer-events-none absolute inset-x-0 bottom-0 h-64 opacity-60" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-4 px-4 pb-12 pt-6 lg:grid-cols-[1.05fr_1fr] lg:pb-20 lg:pt-10">
          <div className="order-2 lg:order-1">
            <motion.p initial={{ opacity: 0, letterSpacing: "0.6em" }} animate={{ opacity: 1, letterSpacing: "0.3em" }} transition={{ duration: 1.1 }} className="text-[10px] text-scan2/80 sm:text-xs">
              {t.landing.eyebrow}
            </motion.p>
            {/* 실제 헤딩(스크린리더·검색엔진용). 3D 타이틀이 준비되면 시각적으로만 대체한다 */}
            <h1 className="sr-only">{t.landing.title1} {t.landing.title2}</h1>
            {use3d ? (
              <div className="relative -ml-1 mt-2 aspect-[2.35/1] w-full max-w-[640px]">
                {!titleReady && (
                  <div aria-hidden className="absolute inset-0 flex flex-col justify-center font-display text-5xl font-light leading-[0.95] tracking-tight text-white/30 sm:text-7xl">
                    <span>{t.landing.title1}</span>
                    <span className="font-semibold">{t.landing.title2}</span>
                  </div>
                )}
                <Title3D line1={t.landing.title1} line2={t.landing.title2} onReady={() => setTitleReady(true)} />
              </div>
            ) : (
              <div className="mt-3" aria-hidden>
                <DepthText as="p" text={t.landing.title1} size="xl" accent="none" className="!font-light" />
                <DepthText as="p" text={t.landing.title2} size="xl" accent="all" />
              </div>
            )}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}>
              <p className="mt-3 text-xs tracking-[0.2em] text-silver/80">{t.common.slogan}</p>
              <p className="mt-1 text-sm text-white/90">{t.common.sloganLocal}</p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-silver">{t.landing.desc}</p>
              <div className="mt-6 max-w-xl">
                <p className="mb-2 flex items-center gap-2 text-xs text-scan2">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-scan2" />
                  {t.landing.onDeviceBadge}
                </p>
                <div className="rounded-[1.1rem] bg-gradient-to-br from-scan/50 via-white/10 to-scan2/40 p-px shadow-glow">
                  <div className="rounded-2xl bg-ink/90 backdrop-blur">
                    <UploadBox onFile={start} testId="hero-upload" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          <motion.div style={reduce ? undefined : { y: faceY, scale: faceScale }} className="relative order-1 mx-auto aspect-square w-full max-w-[320px] [mask-image:radial-gradient(closest-side,#000_66%,transparent_100%)] sm:max-w-md lg:order-2 lg:max-w-none">
            {use3d === null ? null : use3d ? (
              <FaceScene labels={[t.zones.forehead, t.zones.right_cheek, t.zones.left_under_eye, t.zones.right_jawline]} />
            ) : (
              /* WebGL 을 쓰지 않는 기기: Blender 로 미리 렌더링한 이미지 시퀀스(가짜 3D) */
              <FaceSequence mode="pointer" />
            )}
          </motion.div>
        </div>
        {/* 키워드 마키 */}
        <div aria-hidden className="relative border-y border-line/70 bg-panel/40 py-3 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
          <div className="marquee-track gap-10 font-display text-[11px] tracking-[0.35em] text-silver/70">
            {[...KEYWORDS, ...KEYWORDS, ...KEYWORDS, ...KEYWORDS].map((k, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap">
                {k}
                <span className="h-1 w-1 rounded-full bg-scan" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── ZONES ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <DepthText text={t.landing.zonesTitle} />
        <motion.p {...rise} className="mt-3 max-w-3xl text-sm text-silver">{t.landing.zonesDesc}</motion.p>
        <div className="mt-8 grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div {...rise}>
            <Tilt className="mx-auto aspect-[10/11] w-full max-w-sm rounded-3xl border border-line bg-gradient-to-b from-white/[0.05] to-transparent p-4" max={12}>
              <div className="h-full w-full [transform:translateZ(40px)]">
                <FaceFallback active={zone} onHover={setZone} mesh />
              </div>
              <p className="absolute bottom-4 left-0 right-0 text-center text-sm font-medium text-scan2 [transform:translateZ(60px)]">{zone ? t.zones[zone] : " "}</p>
            </Tilt>
          </motion.div>
          <div className="space-y-4">
            <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {zoneIds.map((id, i) => {
                const on = zone === id;
                return (
                  <motion.li
                    key={id}
                    initial={{ opacity: 0, x: 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.035 }}
                    onPointerEnter={() => id !== "neck" && setZone(id)}
                    onPointerLeave={() => setZone(null)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition ${on ? "border-scan bg-scan/15 shadow-glow" : "border-line bg-panel"}`}
                  >
                    <span className="font-display text-[10px] text-scan2">{String(i + 1).padStart(2, "0")}</span>
                    <span>{t.zones[id]}</span>
                  </motion.li>
                );
              })}
            </ul>
            <motion.div {...rise} className="rounded-xl border border-line bg-panel p-4">
              <h3 className="text-sm font-semibold">{t.landing.observeTitle}</h3>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {MEASURABLE.map((m) => (
                  <li key={m} className="rounded-full border border-scan/30 px-2.5 py-1 text-xs text-scan2">{t.metrics[m].name}</li>
                ))}
              </ul>
            </motion.div>
            <motion.div {...rise} className="rounded-xl border border-line bg-panel p-4">
              <h3 className="text-sm font-semibold">{t.landing.notMeasureTitle}</h3>
              <p className="mt-2 text-xs leading-relaxed text-silver">{t.landing.notMeasureDesc}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TECHNOLOGY ─────────────────────────────────────── */}
      <section className="relative border-y border-line/70 bg-panel/50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <DepthText text={t.landing.techTitle} className="tracking-wide" />
          <motion.p {...rise} className="mt-3 max-w-3xl text-sm text-silver">{t.landing.techDesc}</motion.p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {TECHS.map(({ id, shader, tint }, i) => (
              <motion.div key={id} initial={{ opacity: 0, y: 50, rotateY: -18 }} whileInView={{ opacity: 1, y: 0, rotateY: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.8, delay: i * 0.12, ease: [0.2, 0.75, 0.2, 1] }} style={{ transformPerspective: 1000 }}>
                <Tilt className="h-full overflow-hidden rounded-2xl border border-line bg-ink">
                  <div className={`relative h-40 bg-gradient-to-b ${tint} to-transparent`}>
                    {use3d && <ShaderCanvas kind={shader} />}
                    <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-transparent" />
                    <span className="absolute left-4 top-3 font-display text-4xl font-light text-white/90 [text-shadow:0_2px_0_#1b2733,0_4px_0_#121b24,0_10px_18px_rgba(0,0,0,.6)]">0{i + 1}</span>
                  </div>
                  <div className="p-5 [transform:translateZ(30px)]">
                    <p className="font-display text-[11px] tracking-[0.25em] text-scan2">{t.care.tech[id].en}</p>
                    <h3 className="mt-1.5 text-lg font-semibold">{t.care.tech[id].name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-silver">{t.care.tech[id].desc}</p>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {t.care.tech[id].tags.map((tag) => (
                        <li key={tag} className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-silver">{tag}</li>
                      ))}
                    </ul>
                  </div>
                </Tilt>
              </motion.div>
            ))}
          </div>
          <p className="mt-5 text-xs text-silver/60">
            {t.care.sourceNote} ·{" "}
            <a className="underline hover:text-white" href="https://dermahome.unincore.com/" target="_blank" rel="noopener noreferrer">dermahome.unincore.com</a>
          </p>
        </div>
      </section>

      {/* ── PROCESS ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <DepthText text={t.landing.processTitle} />
        <Process steps={t.landing.process} />
      </section>

      {/* ── PRIVACY ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <motion.div {...rise}>
          <Tilt className="rounded-3xl border border-scan/25 bg-scan/[0.04] p-6 sm:p-10" max={4}>
            <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <DepthText as="h2" size="md" text={t.landing.privacyTitle} />
                <ul className="mt-5 space-y-2.5 text-sm text-silver">
                  {t.landing.privacyPoints.map((p, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.1 }} className="flex gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-scan2 shadow-glow" />
                      <span>{p}</span>
                    </motion.li>
                  ))}
                </ul>
                {config.aiInsight.available && <p className="mt-3 text-xs leading-relaxed text-silver/80">{t.ai.exception}</p>}
                <Link href="/privacy" className="mt-5 inline-block text-xs text-scan2 underline underline-offset-4">{t.consent.details}</Link>
              </div>
              <div className="mx-auto aspect-[16/10] w-full max-w-sm">
                <OnDeviceVisual />
              </div>
            </div>
          </Tilt>
        </motion.div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="relative mt-10 overflow-hidden border-t border-line/70">
        <div aria-hidden className="absolute inset-0 opacity-80">{use3d ? <ShaderCanvas kind="aurora" /> : <div className="h-full w-full bg-[radial-gradient(60%_80%_at_50%_100%,rgba(79,182,255,0.25),transparent)]" />}</div>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-ink via-ink/40 to-ink/80" />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center">
          {/* 스크롤에 따라 회전하는 Blender 렌더 시퀀스 */}
          <div className="mx-auto mb-4 w-48 sm:w-60">
            <FaceSequence mode="scroll" />
          </div>
          <DepthText text={t.landing.ctaTitle} size="lg" className="mx-auto" />
          <motion.p {...rise} className="mt-3 text-sm text-silver">{t.landing.ctaDesc}</motion.p>
          <motion.div {...rise} className="mt-8 flex flex-wrap justify-center gap-4">
            <Magnetic>
              <Link href="/analyze" className="sheen inline-block rounded-full bg-white px-9 py-4 text-sm font-semibold text-black shadow-glow transition hover:bg-scan2">{t.common.start}</Link>
            </Magnetic>
            <Magnetic>
              <a href={config.links.freeTrial} target="_blank" rel="noopener noreferrer" onClick={() => track("trial_click")} className="inline-block rounded-full border border-silver/40 bg-ink/60 px-9 py-4 text-sm backdrop-blur transition hover:border-scan">{t.nav.trial}</a>
            </Magnetic>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
