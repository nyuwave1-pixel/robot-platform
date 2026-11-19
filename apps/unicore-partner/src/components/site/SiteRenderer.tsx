"use client";
/**
 * 사업자 개인 홈페이지 렌더러 (공개 페이지와 스튜디오 미리보기가 같은 코드를 쓴다).
 * 디자인 엔진(theme)별로 색·글꼴·모션·히어로 레이아웃이 달라지고, 섹션 순서·표시 여부는 사업자가 정한다.
 * 공식 제품 카드는 본사 데이터를 그대로 보여주며(이름·이미지·설명 변경 불가), 원본 이미지는 흰 면 위에 그대로 둔다.
 */
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { pageUrl, photoUrl } from "@/lib/env";
import type { HqProduct, Profile, Section, SnsKey } from "@/lib/types";
import { THEMES, type Theme } from "./theme";
import { Magnetic, Marquee, Reveal, SplitText, useParallax, useShift } from "./motion";

export type SiteProfile = Pick<
  Profile,
  "slug" | "display_name" | "title" | "business_name" | "bio" | "phone" | "email" | "address" | "photo_path" | "sns" | "design" | "sections" | "product_ids" | "seo_description"
>;

const SNS_LABEL: Record<SnsKey, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  blog: "Blog",
  facebook: "Facebook",
  tiktok: "TikTok",
  kakao_channel: "KakaoTalk",
  website: "Website",
};
const DEFAULT_LINE = "당신의 이름으로 시작하는 새로운 뷰티 비즈니스";

function contactHref(p: SiteProfile): { href: string; label: string } | null {
  if (p.sns.kakao_channel) return { href: p.sns.kakao_channel, label: "카카오톡 상담" };
  if (p.phone) return { href: `tel:${p.phone.replace(/[^0-9+]/g, "")}`, label: "전화 상담" };
  if (p.email) return { href: `mailto:${p.email}`, label: "메일 문의" };
  return null;
}

function Portrait({ p, className, rounded }: { p: SiteProfile; className?: string; rounded: string }) {
  const src = photoUrl(p.photo_path);
  if (src)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={`${p.display_name} 프로필 사진`} className={`h-full w-full object-cover ${rounded} ${className ?? ""}`} />;
  return (
    <div className={`flex h-full w-full items-center justify-center ${rounded} bg-gradient-to-br from-[#2a2418] via-[#16130d] to-[#0b0a07] ${className ?? ""}`} aria-hidden>
      <span className="font-serif text-[min(30vw,180px)] leading-none text-gold/80">{Array.from(p.display_name.trim())[0] ?? "U"}</span>
    </div>
  );
}

/* ───────────── HERO: Luxury Black ───────────── */
function HeroLuxury({ p, t }: { p: SiteProfile; t: Theme }) {
  const reduce = useReducedMotion();
  const { ref, px, py } = useParallax();
  const gx = useShift(px, 40);
  const gy = useShift(py, 30);
  const ix = useShift(px, -14);
  const iy = useShift(py, -10);
  const sec = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sec, offset: ["start start", "end start"] });
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const lift = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const cta = contactHref(p);
  return (
    <section ref={sec} className="relative min-h-[100svh] overflow-hidden" data-testid="hero">
      <div ref={ref} className="absolute inset-0">
        <motion.div aria-hidden style={{ x: gx, y: gy }} className="absolute -left-[20%] top-[10%] h-[70vmax] w-[70vmax] rounded-full bg-[radial-gradient(circle,rgba(216,184,120,0.22),transparent_60%)]" />
        <motion.div aria-hidden style={{ x: ix, y: iy }} className="absolute -right-[25%] -top-[20%] h-[60vmax] w-[60vmax] rounded-full bg-[radial-gradient(circle,rgba(243,226,184,0.10),transparent_60%)]" />
        <div aria-hidden className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(216,184,120,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(216,184,120,.6)_1px,transparent_1px)] [background-size:88px_88px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>
      <motion.div style={reduce ? undefined : { opacity: fade, y: lift }} className="relative mx-auto grid min-h-[100svh] max-w-7xl items-center gap-6 px-6 pb-28 pt-20 md:grid-cols-[1.1fr_0.9fr] md:gap-10 md:pb-24 md:pt-24 md:px-10">
        <div className="order-2 md:order-1">
          <motion.p initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 1 }} className={`text-[11px] uppercase ${t.eyebrow}`}>
            {p.business_name || "UNI&CORE PARTNER"}
          </motion.p>
          <h1 className={`mt-5 ${t.displayFont} text-[clamp(3rem,11vw,8.5rem)] font-light leading-[0.95] tracking-tight`}>
            <span className="bg-gradient-to-b from-gold2 via-gold to-[#8e7344] bg-clip-text text-transparent">
              <SplitText text={p.display_name} delay={0.35} stagger={t.motion.stagger} ease={t.motion.ease} />
            </span>
          </h1>
          {p.title && (
            <Reveal delay={0.9} className={`mt-5 text-lg ${t.sub}`}>
              {p.title}
            </Reveal>
          )}
          <Reveal delay={1.05} className={`mt-6 max-w-xl ${t.displayFont} text-2xl leading-snug md:text-3xl`}>
            {p.seo_description || DEFAULT_LINE}
          </Reveal>
          <Reveal delay={1.2} className="mt-10 flex flex-wrap gap-3">
            {cta && (
              <Magnetic>
                <a href={cta.href} target={cta.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={`inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-semibold tracking-wide ${t.accentBg}`} data-testid="hero-cta">
                  {cta.label} <span aria-hidden>→</span>
                </a>
              </Magnetic>
            )}
            {p.sns.instagram && (
              <Magnetic>
                <a href={p.sns.instagram} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center rounded-full px-7 py-4 text-sm tracking-wide ${t.ghost}`}>
                  Instagram
                </a>
              </Magnetic>
            )}
          </Reveal>
        </div>
        <div className="order-1 mx-auto w-[min(58vw,420px)] md:order-2 md:w-[min(78vw,420px)]">
          <motion.div
            className="relative aspect-[3/4] overflow-hidden rounded-t-full border border-gold/25 shadow-[0_40px_120px_-30px_rgba(216,184,120,0.35)]"
            initial={reduce ? false : { clipPath: "inset(100% 0 0 0)" }}
            animate={{ clipPath: "inset(0% 0 0 0)" }}
            transition={{ duration: 1.6, ease: t.motion.ease, delay: 0.1 }}
          >
            <motion.div className="h-full w-full" initial={reduce ? false : { scale: 1.18 }} animate={{ scale: 1 }} transition={{ duration: 2.2, ease: t.motion.ease }}>
              <Portrait p={p} rounded="" />
            </motion.div>
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-onyx/60 via-transparent to-transparent" />
          </motion.div>
        </div>
      </motion.div>
      <div aria-hidden className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] tracking-[0.4em] text-gold/60 md:flex">
        SCROLL
        <motion.span className="block h-10 w-px bg-gradient-to-b from-gold/70 to-transparent" animate={reduce ? undefined : { scaleY: [0.3, 1, 0.3] }} transition={{ duration: 2.4, repeat: Infinity }} style={{ transformOrigin: "top" }} />
      </div>
    </section>
  );
}

/* ───────────── HERO: Premium White ───────────── */
function HeroWhite({ p, t }: { p: SiteProfile; t: Theme }) {
  const reduce = useReducedMotion();
  const sec = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sec, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const cta = contactHref(p);
  return (
    <section ref={sec} className="relative min-h-[100svh] overflow-hidden" data-testid="hero">
      <div aria-hidden className="absolute inset-y-0 left-[8%] hidden w-px bg-graphite/[0.06] md:block" />
      <div aria-hidden className="absolute inset-y-0 right-[8%] hidden w-px bg-graphite/[0.06] md:block" />
      <div className="relative mx-auto grid min-h-[100svh] max-w-7xl items-end gap-10 px-6 pb-20 pt-24 md:grid-cols-[1.25fr_0.75fr] md:items-center md:px-10">
        <div>
          <p className={`text-[11px] uppercase ${t.eyebrow}`}>01 — {p.business_name || "UNI&CORE PARTNER"}</p>
          <h1 className={`mt-6 ${t.displayFont} text-[clamp(3rem,10vw,8rem)] font-extralight leading-[0.92] tracking-[-0.04em]`}>
            <SplitText text={p.display_name} delay={0.2} stagger={t.motion.stagger} ease={t.motion.ease} />
          </h1>
          <div className="mt-8 grid max-w-xl gap-4 border-t border-graphite/10 pt-6 md:grid-cols-[auto_1fr]">
            {p.title && <Reveal delay={0.7} className={`text-sm uppercase tracking-[0.2em] ${t.sub}`}>{p.title}</Reveal>}
            <Reveal delay={0.85} className="text-xl leading-relaxed md:text-2xl">
              {p.seo_description || DEFAULT_LINE}
            </Reveal>
          </div>
          {cta && (
            <Reveal delay={1} className="mt-10">
              <Magnetic>
                <a href={cta.href} target={cta.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={`inline-flex items-center gap-3 rounded-full px-8 py-4 text-sm tracking-wide ${t.accentBg}`} data-testid="hero-cta">
                  {cta.label} <span aria-hidden>↗</span>
                </a>
              </Magnetic>
            </Reveal>
          )}
        </div>
        <motion.div style={reduce ? undefined : { y: imgY }} className="mx-auto w-[min(80vw,380px)] md:w-full">
          <motion.div
            className="aspect-[4/5] overflow-hidden bg-stone"
            initial={reduce ? false : { clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            transition={{ duration: 1.4, ease: t.motion.ease, delay: 0.15 }}
          >
            <motion.div className="h-full w-full" initial={reduce ? false : { scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 2, ease: t.motion.ease }}>
              <Portrait p={p} rounded="" className="grayscale-[15%]" />
            </motion.div>
          </motion.div>
          <p className={`mt-3 text-right text-[11px] uppercase tracking-[0.3em] ${t.sub}`}>{p.display_name} · Portrait</p>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────── 공통 섹션 ───────────── */
function SectionHead({ t, no, title, sub }: { t: Theme; no: string; title: string; sub?: string }) {
  return (
    <Reveal className="mb-10 md:mb-14">
      <p className={`text-[11px] uppercase ${t.eyebrow}`}>{no}</p>
      <h2 className={`mt-3 ${t.displayFont} text-4xl font-light tracking-tight md:text-6xl`}>{title}</h2>
      {sub && <p className={`mt-3 max-w-xl ${t.sub}`}>{sub}</p>}
    </Reveal>
  );
}

function About({ p, t }: { p: SiteProfile; t: Theme }) {
  if (!p.bio) return null;
  const paras = p.bio.split(/\n{2,}|\n/).filter(Boolean);
  return (
    <section className="mx-auto max-w-5xl px-6 py-24 md:px-10 md:py-36" data-testid="sec-about">
      <SectionHead t={t} no="ABOUT" title={p.business_name || p.display_name} />
      <div className="space-y-6">
        {paras.map((para, i) => (
          <Reveal key={i} delay={i * 0.08} className={`${t.displayFont} text-2xl leading-[1.6] md:text-[2rem]`}>
            {para}
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Products({ t, products }: { t: Theme; products: HqProduct[] }) {
  if (products.length === 0) return null;
  return (
    <section className="py-24 md:py-36" data-testid="sec-products">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <SectionHead t={t} no="OFFICIAL PRODUCTS" title="추천 제품" sub="UNI&CORE 본사가 제공하는 공식 제품 정보입니다." />
      </div>
      <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-6 md:px-10 [scrollbar-width:none]">
        {products.map((pr, i) => (
          <Reveal key={pr.id} delay={Math.min(i, 4) * 0.06} className="w-[78vw] max-w-[340px] shrink-0 snap-start">
            <article className={`group h-full overflow-hidden rounded-[28px] ${t.card}`} data-testid={`product-${pr.id}`}>
              <div className={`relative aspect-square overflow-hidden ${t.productCard}`}>
                {pr.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pr.image_url} alt={pr.name} loading="lazy" className="h-full w-full object-contain p-6 transition-transform duration-700 group-hover:scale-[1.04]" />
                )}
                <span className="absolute left-4 top-4 rounded-full bg-black/80 px-3 py-1 text-[10px] tracking-wider text-white">본사 공식</span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold leading-snug">{pr.name}</h3>
                {pr.tagline && <p className={`mt-2 text-sm ${t.sub}`}>{pr.tagline}</p>}
                {pr.certifications && <p className={`mt-3 text-xs ${t.accent}`}>{pr.certifications}</p>}
                {pr.shop_url && (
                  <a href={pr.shop_url} target="_blank" rel="noopener noreferrer" className={`mt-5 inline-flex rounded-full px-5 py-2.5 text-xs tracking-wide ${t.ghost}`}>
                    공식몰에서 보기 ↗
                  </a>
                )}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Sns({ p, t }: { p: SiteProfile; t: Theme }) {
  const items = (Object.entries(p.sns) as [SnsKey, string][]).filter(([, v]) => !!v);
  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-5xl px-6 py-24 md:px-10 md:py-32" data-testid="sec-sns">
      <SectionHead t={t} no="CONNECT" title="SNS" />
      <ul className={`border-t ${t.hairline}`}>
        {items.map(([k, v], i) => (
          <Reveal key={k} delay={i * 0.05}>
            <li className={`border-b ${t.hairline}`}>
              <a href={v} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between py-6 md:py-8">
                <span className={`${t.displayFont} text-3xl font-light transition-transform duration-500 group-hover:translate-x-3 md:text-5xl`}>{SNS_LABEL[k]}</span>
                <span className={`text-2xl transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 ${t.accent}`} aria-hidden>
                  ↗
                </span>
              </a>
            </li>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

function Contact({ p, t }: { p: SiteProfile; t: Theme }) {
  const rows: { k: string; v: string; href?: string }[] = [];
  if (p.phone) rows.push({ k: "TEL", v: p.phone, href: `tel:${p.phone.replace(/[^0-9+]/g, "")}` });
  if (p.email) rows.push({ k: "MAIL", v: p.email, href: `mailto:${p.email}` });
  if (p.sns.kakao_channel) rows.push({ k: "KAKAO", v: "카카오톡 채널", href: p.sns.kakao_channel });
  if (p.address) rows.push({ k: "OFFICE", v: p.address, href: `https://map.naver.com/p/search/${encodeURIComponent(p.address)}` });
  if (rows.length === 0) return null;
  return (
    <section className="mx-auto max-w-5xl px-6 py-24 md:px-10 md:py-32" data-testid="sec-contact">
      <SectionHead t={t} no="CONTACT" title="상담 · 문의" sub="편하신 방법으로 연락 주세요." />
      <dl className="grid gap-4 md:grid-cols-2">
        {rows.map((r, i) => (
          <Reveal key={r.k} delay={i * 0.06}>
            <a href={r.href} target={r.href?.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={`block rounded-3xl p-6 transition-colors ${t.card}`}>
              <dt className={`text-[11px] ${t.eyebrow}`}>{r.k}</dt>
              <dd className="mt-2 break-words text-xl">{r.v}</dd>
            </a>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}

export function useQr(url: string, dark: string, light: string) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(url, { margin: 1, width: 640, color: { dark, light }, errorCorrectionLevel: "M" }).then((d) => alive && setSrc(d));
    return () => {
      alive = false;
    };
  }, [url, dark, light]);
  return src;
}

function Qr({ p, t }: { p: SiteProfile; t: Theme }) {
  const url = pageUrl(p.slug);
  const lux = t.id === "luxury_black";
  const src = useQr(url, lux ? "#07070a" : "#1d1d1f", lux ? "#f3e2b8" : "#ffffff");
  return (
    <section className="mx-auto max-w-5xl px-6 py-24 text-center md:px-10" data-testid="sec-qr">
      <Reveal>
        <p className={`text-[11px] uppercase ${t.eyebrow}`}>SHARE</p>
        <div className={`mx-auto mt-6 w-48 overflow-hidden rounded-3xl p-3 ${lux ? "bg-gold2" : "bg-white shadow-sm"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {src ? <img src={src} alt={`${p.display_name} 홈페이지 QR 코드`} className="w-full" /> : <div className="aspect-square" />}
        </div>
        <p className={`mt-4 text-sm ${t.sub}`}>카메라로 찍으면 이 페이지가 열립니다</p>
        <p className="mt-1 break-all text-xs opacity-60">{url}</p>
      </Reveal>
    </section>
  );
}

function MobileBar({ p, t, preview }: { p: SiteProfile; t: Theme; preview?: boolean }) {
  const cta = contactHref(p);
  if (!cta) return null;
  const lux = t.id === "luxury_black";
  return (
    <div className={`${preview ? "sticky" : "fixed"} inset-x-0 bottom-0 z-40 p-3 md:hidden`} data-testid="mobile-bar">
      <div className={`flex gap-2 rounded-full p-1.5 backdrop-blur ${lux ? "bg-onyx/80 ring-1 ring-gold/25" : "bg-white/85 ring-1 ring-graphite/10"}`}>
        {p.phone && (
          <a href={`tel:${p.phone.replace(/[^0-9+]/g, "")}`} className={`flex-1 rounded-full py-3 text-center text-sm ${t.ghost}`}>
            전화
          </a>
        )}
        <a href={cta.href} target={cta.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={`flex-[2] rounded-full py-3 text-center text-sm font-semibold ${t.accentBg}`}>
          {cta.label}
        </a>
      </div>
    </div>
  );
}

export default function SiteRenderer({ profile: p, products, preview = false }: { profile: SiteProfile; products: HqProduct[]; preview?: boolean }) {
  const t = THEMES[p.design] ?? THEMES.luxury_black;
  const picked = p.product_ids.map((id) => products.find((x) => x.id === id)).filter((x): x is HqProduct => !!x);
  const marquee = [p.business_name || p.display_name, "UNI&CORE", "DERMA HOME", "MEDIDERMA", p.title || "BEAUTY BUSINESS"];
  const render = (s: Section) => {
    switch (s) {
      case "hero":
        return (
          <div key={s}>
            {t.id === "luxury_black" ? <HeroLuxury p={p} t={t} /> : <HeroWhite p={p} t={t} />}
            <Marquee items={marquee} className={`border-y py-5 text-sm uppercase tracking-[0.35em] ${t.hairline} ${t.sub}`} />
          </div>
        );
      case "about":
        return <About key={s} p={p} t={t} />;
      case "products":
        return <Products key={s} t={t} products={picked} />;
      case "sns":
        return <Sns key={s} p={p} t={t} />;
      case "contact":
        return <Contact key={s} p={p} t={t} />;
      case "qr":
        return <Qr key={s} p={p} t={t} />;
    }
  };
  return (
    <div className={`${t.root} ${t.text} relative min-h-screen font-sans antialiased`} data-design={t.id} data-testid="site">
      <header className={`${preview ? "absolute" : "fixed"} inset-x-0 top-0 z-30 mix-blend-difference`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 text-white md:px-10">
          <span className="text-sm font-semibold tracking-[0.3em]">{(p.business_name || p.display_name).toUpperCase()}</span>
          <span className="text-[10px] tracking-[0.3em] opacity-70">UNI&CORE PARTNER</span>
        </div>
      </header>
      <main>{p.sections.map(render)}</main>
      <footer className={`border-t ${t.hairline} px-6 pb-28 pt-10 text-center text-xs md:pb-10 ${t.sub}`}>
        <p>
          {p.business_name || p.display_name} · UNI&CORE 공식 사업자
        </p>
        <p className="mt-1 opacity-70">제품 정보는 UNI&CORE 본사가 제공합니다.</p>
      </footer>
      <MobileBar p={p} t={t} preview={preview} />
    </div>
  );
}
