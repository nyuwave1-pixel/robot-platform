"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/client/store";
import { canUse3D } from "@/lib/client/device";
import { track } from "@/lib/client/telemetry";
import { FACE_ZONES } from "@/lib/analysis/zones";
import { MEASURABLE } from "@/lib/analysis/providers/localCv";
import UploadBox from "./UploadBox";
import FaceFallback from "./FaceFallback";

const FaceScene = dynamic(() => import("./FaceScene"), { ssr: false });

const fade = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: 0.6 } };

export default function Landing() {
  const { t } = useI18n();
  const { setPendingFile, config } = useApp();
  const router = useRouter();
  const [use3d, setUse3d] = useState<boolean | null>(null);
  useEffect(() => setUse3d(canUse3D()), []);
  const start = (f: File) => {
    setPendingFile(f);
    router.push("/analyze");
  };
  const techs = ["rf", "ultrasonic", "iontophoresis"] as const;
  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 pb-10 pt-8 lg:grid-cols-2 lg:pb-20 lg:pt-14">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_70%_30%,rgba(79,182,255,0.16),transparent)]" />
        <div className="order-2 lg:order-1">
          <p className="text-[10px] tracking-[0.3em] text-scan2/80 sm:text-xs">{t.landing.eyebrow}</p>
          <h1 className="mt-3 font-display text-5xl font-light leading-[0.95] tracking-tight sm:text-7xl">
            {t.landing.title1}
            <br />
            <span className="bg-gradient-to-r from-white via-silver to-scan bg-clip-text font-semibold text-transparent">{t.landing.title2}</span>
          </h1>
          <p className="mt-4 text-xs tracking-[0.2em] text-silver/80">{t.common.slogan}</p>
          <p className="mt-1 text-sm text-white/90">{t.common.sloganLocal}</p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-silver">{t.landing.desc}</p>
          <div className="mt-6 max-w-xl">
            <p className="mb-2 flex items-center gap-2 text-xs text-scan2">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-scan2" />
              {t.landing.onDeviceBadge}
            </p>
            <UploadBox onFile={start} testId="hero-upload" />
          </div>
        </div>
        <div className="relative order-1 mx-auto aspect-square w-full max-w-[300px] sm:max-w-md lg:order-2 lg:max-w-none">
          <div className="absolute inset-[8%] rounded-full border border-silver/10" />
          <div className="absolute inset-[16%] rounded-full border border-scan/15 shadow-glow" />
          {use3d === null ? null : use3d ? <FaceScene /> : <FaceFallback />}
        </div>
      </section>

      {/* ZONES */}
      <motion.section {...fade} className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-2xl font-light sm:text-3xl">{t.landing.zonesTitle}</h2>
        <p className="mt-2 max-w-3xl text-sm text-silver">{t.landing.zonesDesc}</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {[...FACE_ZONES.map((z) => z.id), "neck" as const].map((id, i) => (
              <li key={id} className="flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2">
                <span className="font-display text-[10px] text-scan2">{String(i + 1).padStart(2, "0")}</span>
                <span>{t.zones[id]}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-panel p-4">
              <h3 className="text-sm font-semibold">{t.landing.observeTitle}</h3>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {MEASURABLE.map((m) => (
                  <li key={m} className="rounded-full border border-scan/30 px-2.5 py-1 text-xs text-scan2">{t.metrics[m].name}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-line bg-panel p-4">
              <h3 className="text-sm font-semibold">{t.landing.notMeasureTitle}</h3>
              <p className="mt-2 text-xs leading-relaxed text-silver">{t.landing.notMeasureDesc}</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* TECHNOLOGY */}
      <motion.section {...fade} className="border-y border-line/70 bg-panel/50">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="font-display text-2xl font-light tracking-wide sm:text-3xl">{t.landing.techTitle}</h2>
          <p className="mt-2 max-w-3xl text-sm text-silver">{t.landing.techDesc}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {techs.map((id, i) => (
              <div key={id} className="rounded-2xl border border-line bg-gradient-to-b from-white/[0.05] to-transparent p-5">
                <p className="font-display text-xs tracking-[0.25em] text-scan2">0{i + 1} · {t.care.tech[id].en}</p>
                <h3 className="mt-2 text-lg font-semibold">{t.care.tech[id].name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-silver">{t.care.tech[id].desc}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {t.care.tech[id].tags.map((tag) => (
                    <li key={tag} className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-silver">{tag}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-silver/60">
            {t.care.sourceNote} ·{" "}
            <a className="underline hover:text-white" href="https://dermahome.unincore.com/" target="_blank" rel="noopener noreferrer">dermahome.unincore.com</a>
          </p>
        </div>
      </motion.section>

      {/* PROCESS */}
      <motion.section {...fade} className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-2xl font-light sm:text-3xl">{t.landing.processTitle}</h2>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {t.landing.process.map((p, i) => (
            <li key={i} className="rounded-xl border border-line bg-panel p-4">
              <span className="font-display text-2xl font-light text-scan">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-2 text-sm font-semibold">{p.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-silver">{p.desc}</p>
            </li>
          ))}
        </ol>
      </motion.section>

      {/* PRIVACY */}
      <motion.section {...fade} className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-2xl border border-scan/25 bg-scan/[0.04] p-6 sm:p-8">
          <h2 className="font-display text-xl font-light sm:text-2xl">{t.landing.privacyTitle}</h2>
          <ul className="mt-4 grid gap-2 text-sm text-silver sm:grid-cols-2">
            {t.landing.privacyPoints.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-scan2" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <Link href="/privacy" className="mt-4 inline-block text-xs text-scan2 underline underline-offset-4">{t.consent.details}</Link>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section {...fade} className="mx-auto max-w-3xl px-4 pb-20 pt-6 text-center">
        <h2 className="font-display text-3xl font-light sm:text-4xl">{t.landing.ctaTitle}</h2>
        <p className="mt-2 text-sm text-silver">{t.landing.ctaDesc}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/analyze" className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black shadow-glow transition hover:bg-scan2">{t.common.start}</Link>
          <a href={config.links.freeTrial} target="_blank" rel="noopener noreferrer" onClick={() => track("trial_click")} className="rounded-full border border-silver/40 px-8 py-3.5 text-sm transition hover:border-scan">{t.nav.trial}</a>
        </div>
      </motion.section>
    </div>
  );
}
