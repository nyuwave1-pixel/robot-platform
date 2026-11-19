import Link from "next/link";
import { THEMES } from "@/components/site/theme";
import { SplitText, Reveal } from "@/components/site/motion";

export default function Home() {
  const steps = [
    ["01", "정보 입력", "이름·사진·사업장·연락처·SNS를 입력합니다."],
    ["02", "디자인 선택", "디자인 엔진을 고르고 섹션 순서를 정합니다. 바로 미리보기로 확인해요."],
    ["03", "본사 승인 후 공개", "본사 확인이 끝나면 나만의 주소(/@아이디)와 QR 코드로 공개됩니다."],
  ];
  return (
    <main className="min-h-screen bg-onyx text-[#f5f1e8]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <span className="text-sm font-semibold tracking-[0.35em]">UNI&CORE PARTNER</span>
        <Link href="/login" className="rounded-full border border-gold/40 px-5 py-2 text-sm text-gold2 hover:bg-gold/10" data-testid="nav-login">
          로그인
        </Link>
      </header>
      <section className="relative mx-auto max-w-7xl overflow-hidden px-6 pb-24 pt-16 md:px-10 md:pt-28">
        <div aria-hidden className="absolute -left-40 top-0 h-[60vmax] w-[60vmax] rounded-full bg-[radial-gradient(circle,rgba(216,184,120,0.18),transparent_60%)]" />
        <p className="relative text-[11px] tracking-[0.45em] text-gold/80">YOUR BEAUTY BUSINESS, YOUR BRAND</p>
        <h1 className="relative mt-6 font-serif text-[clamp(2.8rem,9vw,7.5rem)] font-light leading-[0.98]">
          <SplitText text="당신의 이름으로" delay={0.1} />
          <br />
          <span className="bg-gradient-to-b from-gold2 via-gold to-[#8e7344] bg-clip-text text-transparent">
            <SplitText text="시작하는 브랜드" delay={0.5} />
          </span>
        </h1>
        <Reveal delay={0.9} className="relative mt-8 max-w-xl text-lg text-[#a7a294]">
          UNI&CORE 사업자라면 누구나, 몇 가지 정보만 입력하면 프리미엄 개인 브랜드 홈페이지가 만들어집니다.
        </Reveal>
        <Reveal delay={1.05} className="relative mt-10 flex flex-wrap gap-3">
          <Link href="/login?mode=signup" className="rounded-full bg-gradient-to-r from-gold to-gold2 px-8 py-4 text-sm font-semibold text-onyx" data-testid="cta-start">
            내 홈페이지 만들기 →
          </Link>
          <Link href="/studio" className="rounded-full border border-gold/40 px-8 py-4 text-sm text-gold2">
            스튜디오 열기
          </Link>
        </Reveal>
      </section>
      <section className="mx-auto grid max-w-7xl gap-4 px-6 pb-24 md:grid-cols-3 md:px-10">
        {steps.map(([n, title, d], i) => (
          <Reveal key={n} delay={i * 0.08} className="rounded-3xl border border-gold/10 bg-coal/70 p-7">
            <p className="font-serif text-4xl text-gold">{n}</p>
            <h2 className="mt-4 text-xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#a7a294]">{d}</p>
          </Reveal>
        ))}
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-32 md:px-10">
        <Reveal>
          <p className="text-[11px] tracking-[0.45em] text-gold/80">DESIGN ENGINES</p>
          <h2 className="mt-3 font-serif text-4xl font-light md:text-5xl">디자인 엔진</h2>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {Object.values(THEMES).map((t, i) => (
            <Reveal key={t.id} delay={i * 0.08}>
              <div className={`${t.root} ${t.text} overflow-hidden rounded-3xl border border-white/10 p-8`}>
                <p className={`text-[11px] uppercase ${t.eyebrow}`}>ENGINE {String(i + 1).padStart(2, "0")}</p>
                <p className={`mt-6 ${t.displayFont} text-5xl font-light`}>{t.label}</p>
                <p className={`mt-3 ${t.sub}`}>{t.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      <footer className="border-t border-gold/10 px-6 py-10 text-center text-xs text-[#a7a294]">© UNI&CORE · 사업자 전용 플랫폼</footer>
    </main>
  );
}
