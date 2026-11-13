"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { reviewEvent as E } from "@/data/reviewEvent";
import { product } from "@/data/product";
import { keyIngredients } from "@/data/ingredients";
import { howto } from "@/data/howto";
import { clinical } from "@/data/clinical";
import { track } from "@/lib/track";
import { ApiError, getConfig, lookupReview, reviseReview, type EventConfig, type LookupResult, type SubmitResult } from "./api";
import ReviewForm from "./ReviewForm";
import BgMusic from "./BgMusic";
import PhotoField, { emptyPhoto, type PhotoState } from "./PhotoField";
import s from "./review.module.css";

const DONE_KEY = "uc-review-done-v1";
const kDate = (iso: string) => new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" }).format(new Date(iso));
const kDay = (iso: string) => new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Seoul" }).format(new Date(iso));
/** 골드 입자 — 서버·클라이언트가 같은 값을 내도록 순번으로 위치를 정한다 */
const DUST = Array.from({ length: 22 }, (_, i) => ({ left: (i * 37 + 11) % 100, top: (i * 53 + 7) % 100, size: 2 + (i % 4), delay: (i * 0.7) % 9, dur: 9 + (i % 6) * 2 }));

const shot = (name: string) => ({ src: `/media/model/${name}-900.webp`, srcSet: `/media/model/${name}-900.webp 900w, /media/model/${name}-1600.webp 1600w` });

/** 섹션 사이 풀블리드 모델 컷 — 화면에 들어오면 프레임이 열리며 줌아웃, 빛이 한 번 지나간다 */
function ModelCut({ name, alt, eyebrow, en, ko, pos = "50% 30%" }: { name: string; alt: string; eyebrow: string; en: React.ReactNode; ko: string; pos?: string }) {
  return (
    <Reveal className={s.cut}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...shot(name)} sizes="(max-width: 760px) 100vw, 760px" alt={alt} loading="lazy" decoding="async" width={1600} height={2000} style={{ objectPosition: pos }} />
      <span className={s.cutSweep} aria-hidden="true" />
      <span className={s.cutFrame} aria-hidden="true" />
      <div className={s.cutCap}>
        <p className={s.cutEyebrow}>{eyebrow}</p>
        <p className={s.cutEn}>{en}</p>
        <p className={s.cutKo}>{ko}</p>
      </div>
    </Reveal>
  );
}

function Reveal({ children, className = "", as: Tag = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "section" | "li" }) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (!("IntersectionObserver" in window)) { el.dataset.in = "1"; return; }
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { (e.target as HTMLElement).dataset.in = "1"; io.unobserve(e.target); } }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Tag ref={ref as any} className={`${s.reveal} ${className}`}>{children}</Tag>;
}

export default function ReviewEvent() {
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [loadError, setLoadError] = useState("");
  const [done, setDone] = useState<SubmitResult | null>(null);
  const [formInView, setFormInView] = useState(false);
  const jar = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);

  const load = useCallback(() => {
    setLoadError("");
    getConfig().then(setConfig).catch((e: ApiError) => setLoadError(e.message));
  }, []);
  useEffect(() => {
    load();
    try {
      const d = new URLSearchParams(window.location.search).get("d");
      if (d) sessionStorage.setItem("uc-review-dist", d.slice(0, 40));           // 총판 링크(?d=코드) 유입 기억
      const saved = sessionStorage.getItem(DONE_KEY);
      if (saved) setDone(JSON.parse(saved));
    } catch { /* 무시 */ }
  }, [load]);

  // 히어로 제품 3D 패럴랙스 — 포인터(데스크톱)·스크롤(모바일)에 따라 살짝 기울인다
  useEffect(() => {
    const el = jar.current, h = hero.current; if (!el || !h) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, px = 0, py = 0;
    const apply = () => { raf = 0; const p = Math.min(1, Math.max(0, window.scrollY / (h.offsetHeight || 1))); el.style.setProperty("--ry", `${px * 9}deg`); el.style.setProperty("--rx", `${-py * 6 + p * 10}deg`); el.style.setProperty("--ty", `${p * -46}px`); el.style.setProperty("--sc", `${1 - p * 0.08}`); };
    const req = () => { if (!raf) raf = requestAnimationFrame(apply); };
    const move = (e: PointerEvent) => { if (e.pointerType === "touch") return; px = e.clientX / window.innerWidth - 0.5; py = e.clientY / window.innerHeight - 0.5; req(); };
    window.addEventListener("scroll", req, { passive: true }); window.addEventListener("pointermove", move, { passive: true });
    return () => { window.removeEventListener("scroll", req); window.removeEventListener("pointermove", move); cancelAnimationFrame(raf); };
  }, []);

  // 작성 영역이 보이면 하단 고정 버튼을 숨긴다
  useEffect(() => {
    const el = document.getElementById("write"); if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setFormInView(e.isIntersecting), { threshold: 0.02 });
    io.observe(el);
    return () => io.disconnect();
  }, [config, done]);

  const toForm = (placement: string) => { track("review_cta", { placement }); document.getElementById("write")?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const finish = (r: SubmitResult) => { setDone(r); try { sessionStorage.setItem(DONE_KEY, JSON.stringify(r)); } catch { /* 무시 */ } requestAnimationFrame(() => window.scrollTo({ top: 0 })); };

  if (done) return <Complete result={done} onLookup={() => { try { sessionStorage.removeItem(DONE_KEY); } catch { /* 무시 */ } setDone(null); requestAnimationFrame(() => document.getElementById("lookup")?.scrollIntoView()); }} />;

  const rw = config?.rewards;
  const winnerCount = config?.winnerCount ?? 3;
  const shake = rw ? `${rw.participation.productName}` : E.reward.all.product;
  const open = config?.phase === "OPEN";
  const metrics = clinical.filter((c) => c.verified && c.kind === "instrument");

  return (
    <div className={s.page}>
      <header className={s.top}>
        <a href={E.brandSite} className={s.brand} aria-label="UNI&CORE 1ST BIRTHDAY CREAM 브랜드 페이지로">UNI&amp;CORE</a>
        <a href="#lookup" className={s.topLink}>내 접수 확인</a>
        <BgMusic />
      </header>

      <main>
        {/* ===== SECTION 01. HERO ===== */}
        <section className={s.hero} ref={hero} aria-labelledby="hero-title">
          <div className={s.heroVisual}>
            <div className={s.heroShot} ref={jar}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img {...shot("gold-hero")} sizes="(max-width: 680px) 100vw, 680px" alt="UNI&CORE 1ST BIRTHDAY CREAM 을 손에 올려 보이는 모델" fetchPriority="high" decoding="async" width={1600} height={2000} />
            </div>
            <span className={s.heroRing} aria-hidden="true" />
            <span className={`${s.heroRing} ${s.heroRing2}`} aria-hidden="true" />
            <span className={s.heroFlare} aria-hidden="true" />
            <span className={s.heroSweep} aria-hidden="true" />
            <span className={s.heroShade} aria-hidden="true" />
          </div>
          <div className={s.dust} aria-hidden="true">{DUST.map((d, i) => <i key={i} style={{ left: `${d.left}%`, top: `${d.top}%`, width: d.size, height: d.size, animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s` }} />)}</div>
          <div className={s.heroCopy}>
            <p className={s.badge}>{E.hero.badge}</p>
            <h1 id="hero-title" className={s.heroEn}>YOUR SKIN HAS<br />A BIRTHDAY.</h1>
            <p className={s.heroKo}>{E.hero.ko}</p>
            <p className={s.heroProduct}>{E.hero.product}<br /><b>{E.hero.badge}</b></p>
          </div>
          <div className={s.heroText}>
            <p className={s.heroLead}>{E.hero.lead}</p>
            <p className={s.heroSub}>{E.hero.sub1}<br />{E.hero.sub2}</p>
            <button type="button" className={s.btnGold} onClick={() => toForm("hero")}>{E.hero.cta}</button>
            {config && config.phase !== "OPEN" && <p className={s.phaseNote}>{config.phase === "UPCOMING" ? `이벤트는 ${config.startDate ? kDay(config.startDate) : "곧"} 시작됩니다.` : "지금은 이벤트 참여 기간이 아닙니다."}</p>}
            {config?.endDate && open && <p className={s.period}>참여 기간 · {config.startDate ? `${kDay(config.startDate)} ~ ` : ""}{kDay(config.endDate)}까지</p>}
          </div>
        </section>

        {/* ===== SECTION 02. EVENT REWARD ===== */}
        <section className={s.section} aria-labelledby="reward-title">
          <Reveal>
            <p className={s.eyebrow}>EVENT REWARD</p>
            <h2 id="reward-title" className={s.titleEn}>{E.reward.en}</h2>
            <p className={s.titleKo}>{E.reward.ko}</p>
          </Reveal>
          <div className={s.rewards}>
            <Reveal className={s.rewardGold}>
              <div className={s.rewardNo}>{E.reward.winner.no}</div>
              <p className={s.rewardWho}>{E.reward.winner.who} <b className={s.num}>{winnerCount}</b>명</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={s.rewardImg} src={product.images.openBox} alt="UNI&CORE 1ST BIRTHDAY CREAM 50g — 골드 패키지 안의 제품" loading="lazy" width={1662} height={946} />
              <h3 className={s.rewardName}>{E.reward.winner.product}</h3>
              <p className={s.rewardNameKo}>{rw && !rw.winner.productName.toUpperCase().includes("BIRTHDAY CREAM") ? rw.winner.productName : E.reward.winner.productKo}{rw && rw.winner.quantity > 1 ? ` × ${rw.winner.quantity}` : ""}</p>
              <ul className={s.rewardNotes}>{E.reward.winner.notes.filter((_, i) => i < 2 || rw?.winnersAlsoGetParticipation !== false).map((n) => <li key={n}>{n}</li>)}</ul>
            </Reveal>
            <Reveal className={s.rewardAll}>
              <div className={s.rewardNo}>{E.reward.all.no}</div>
              <p className={s.rewardWho}>{E.reward.all.who}</p>
              <div className={s.rewardAllMark} aria-hidden="true"><span>100</span><i>%</i><small>참여자 전원</small></div>
              <h3 className={s.rewardName}>{shake}</h3>
              <ul className={s.rewardNotes}>{E.reward.all.notes.map((n) => <li key={n}>{n}</li>)}</ul>
            </Reveal>
          </div>
        </section>

        <ModelCut name="glow-close" pos="50% 26%" alt="UNI&CORE 1ST BIRTHDAY CREAM 을 얼굴 옆에 든 모델" eyebrow="SKIN RE:BIRTH" en={<>EVERY DAY,<br />A NEW BIRTHDAY.</>} ko="매일 바르는 순간이, 피부의 기념일이 되도록" />

        {/* ===== SECTION 03. HOW TO PARTICIPATE ===== */}
        <section className={`${s.section} ${s.sectionAlt}`} aria-labelledby="guide-title">
          <Reveal>
            <p className={s.eyebrow}>EVENT GUIDE</p>
            <h2 id="guide-title" className={s.titleEn}>{E.guide.en}</h2>
            <p className={s.titleKo}>{E.guide.ko}</p>
          </Reveal>
          <ol className={s.steps}>
            {E.guide.steps.map((st, i) => <Reveal as="li" key={st.no} className={s.stepCard}><span className={s.stepNo}>{String(i + 1).padStart(2, "0")}</span><div><small>{st.no}</small><p>{st.text}</p></div></Reveal>)}
          </ol>
          <Reveal className={s.afterBox}>
            <p className={s.afterTitle}>참여를 완료하시면</p>
            <ul>{E.guide.after.map((a) => <li key={a}>{a}</li>)}</ul>
          </Reveal>
        </section>

        <ModelCut name="vanity-mirror" pos="50% 24%" alt="화장대 앞에서 UNI&CORE 1ST BIRTHDAY CREAM 을 들고 웃는 모델" eyebrow="MY DAILY RITUAL" en={<>THE FIRST CREAM<br />OF MY DAY.</>} ko="하루의 시작과 끝, 벌스데이 크림과 함께" />

        {/* ===== SECTION 04. PRODUCT ===== */}
        <section className={s.section} aria-labelledby="product-title">
          <Reveal>
            <p className={s.eyebrow}>{product.subtitle}</p>
            <h2 id="product-title" className={s.titleEn}>1ST BIRTHDAY CREAM</h2>
            <p className={s.titleKo}>{product.concept}</p>
          </Reveal>
          <Reveal className={s.productShot}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.images.closedBox} alt="UNI&CORE 1ST BIRTHDAY CREAM 패키지 — NET WT. 1.76 oz · 50 g" loading="lazy" width={1304} height={1206} />
            <p>{product.brandKo} {product.nameKo} · {product.volume.g}g</p>
          </Reveal>
          <p className={s.keyTitle}>기억할 건 딱 4가지</p>
          <ul className={s.ingredients}>
            {keyIngredients.map((ing) => (
              <Reveal as="li" key={ing.id} className={s.ing}>
                <span className={s.ingIdx}>{ing.index}</span>
                <div><h3>{ing.name}</h3><p>{ing.claim1} {ing.claim2}</p>{ing.sub && <small>{ing.sub.map((x) => x.name).join(" · ")}</small>}</div>
              </Reveal>
            ))}
          </ul>
          <Reveal className={s.howto}>
            <h3>사용 방법</h3>
            <p className={s.howtoIntro}>{howto.intro}</p>
            <ol>{howto.steps.map((h) => <li key={h.step}><b>{h.area}</b><span>{h.line1} {h.line2}</span></li>)}</ol>
          </Reveal>
          {metrics.length > 0 && (
            <Reveal className={s.clinical}>
              <div className={s.clinicalRow}>{metrics.map((m) => <div key={m.id}><b className={s.num}>{m.value}<i>{m.unit}</i></b><span>{m.label}</span></div>)}</div>
              <details><summary>인체적용시험 정보 및 유의사항</summary>{metrics.map((m) => <p key={m.id}>· {m.footnote}</p>)}</details>
            </Reveal>
          )}
          <Reveal className={s.center}>
            <button type="button" className={s.btnGold} onClick={() => toForm("product")}>{E.productCta}</button>
            <a className={s.textLink} href={E.brandSite} onClick={() => track("review_brand_link", {})}>제품 이야기 자세히 보기 →</a>
          </Reveal>
        </section>

        <ModelCut name="vanity-smile" pos="50% 22%" alt="UNI&CORE 1ST BIRTHDAY CREAM 을 들고 환하게 웃는 모델" eyebrow="YOUR TURN" en={<>NOW, TELL US<br />YOUR STORY.</>} ko="이제 당신의 벌스데이 크림 이야기를 들려주세요" />

        {/* ===== REVIEW FORM ===== */}
        <section className={`${s.section} ${s.sectionAlt} ${s.writeSection}`} id="write" aria-labelledby="write-title">
          <p className={s.eyebrow}>WRITE YOUR REVIEW</p>
          <h2 id="write-title" className={s.titleEn}>MY FIRST BIRTHDAY</h2>
          <p className={s.titleKo}>나의 벌스데이 크림 후기 남기기</p>
          {!config && !loadError && <div className={s.stateBox} role="status"><span className={s.spinner} aria-hidden="true" />이벤트 정보를 불러오는 중입니다…</div>}
          {loadError && <div className={s.stateBox} role="alert"><p>{loadError}</p><button type="button" className={s.btnGhost} onClick={load}>다시 불러오기</button></div>}
          {config && !open && (
            <div className={s.stateBox}>
              <p className={s.stateTitle}>{config.phase === "UPCOMING" ? "이벤트 시작 전입니다" : config.phase === "ENDED" ? "이벤트가 종료되었습니다" : "지금은 참여를 받고 있지 않습니다"}</p>
              <p>{config.phase === "UPCOMING" && config.startDate ? `${kDate(config.startDate)}부터 참여하실 수 있습니다.` : "이미 참여하신 분은 아래 '내 접수 확인'에서 진행 상황을 확인하실 수 있습니다."}</p>
            </div>
          )}
          {config && open && <ReviewForm config={config} onDone={finish} />}
        </section>

        {/* ===== 내 접수 확인 ===== */}
        <section className={s.section} id="lookup" aria-labelledby="lookup-title">
          <p className={s.eyebrow}>MY ENTRY</p>
          <h2 id="lookup-title" className={s.titleKoBig}>내 접수 확인</h2>
          <p className={s.titleKo}>접수하신 휴대폰 번호로 검토 상태와 사은품 지급 현황을 확인하세요.</p>
          <Lookup config={config} />
        </section>

        <section className={s.notes} aria-labelledby="notes-title">
          <h2 id="notes-title">이벤트 유의사항</h2>
          <ul>{E.notes.map((n) => <li key={n}>{n}</li>)}</ul>
        </section>
      </main>

      <footer className={s.footer}>
        <p className={s.footBrand}>UNI&amp;CORE</p>
        <p>{E.company.name} · 고객센터 {E.company.tel}</p>
        <p><a href={E.company.privacy} target="_blank" rel="noopener noreferrer">개인정보처리방침</a> · <a href={E.company.terms} target="_blank" rel="noopener noreferrer">이용약관</a> · <a href={product.urls.brand} target="_blank" rel="noopener noreferrer">유니앤코어 공식몰</a></p>
      </footer>

      {open && <div className={`${s.sticky} ${formInView ? "" : s.stickyShow}`}><button type="button" className={s.btnGold} onClick={() => toForm("sticky")} tabIndex={formInView ? -1 : 0}>{E.hero.cta}</button></div>}
    </div>
  );
}

/* ---------- 접수 완료 ---------- */
function Complete({ result, onLookup }: { result: SubmitResult; onLookup: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(result.applicationNumber); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* 길게 눌러 복사 */ } };
  return (
    <div className={s.page}>
      <header className={s.top}><a href={E.brandSite} className={s.brand}>UNI&amp;CORE</a></header>
      <main className={s.complete}>
        <div className={s.burst} aria-hidden="true">{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ "--a": `${(360 / 28) * i}deg`, "--d": `${90 + (i % 5) * 34}px`, animationDelay: `${(i % 7) * 0.05}s` } as React.CSSProperties} />)}</div>
        <div className={s.seal} aria-hidden="true"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" /><path d="M19 33l9 9 17-19" /></svg></div>
        <h1 className={s.completeEn}>{E.complete.en1}<br />{E.complete.en2}</h1>
        <p className={s.completeKo}>{E.complete.ko1}<br /><b>{E.complete.ko2}</b></p>

        <dl className={s.receipt} aria-label="참여 완료 정보">
          <div><dt>신청자 이름</dt><dd>{result.name}</dd></div>
          <div><dt>접수 번호</dt><dd className={s.receiptNo}>{result.applicationNumber}<button type="button" onClick={copy} aria-live="polite">{copied ? "복사됨" : "복사"}</button></dd></div>
          <div><dt>접수 날짜</dt><dd>{kDate(result.submittedAt)}</dd></div>
        </dl>
        <p className={s.keepNote}>접수하신 휴대폰 번호로 언제든지 신청 내용과 지급 현황을 확인하실 수 있습니다.</p>

        <section className={s.completeRewards} aria-label="참여 보상 안내">
          <div><small>모든 정상 참여자</small><p><b>{result.rewards.participation.productName}</b>를 드립니다.</p></div>
          <div><small>우수 후기 {result.rewards.winnerCount}명</small><p><b>퍼스트 벌스데이 크림</b>을 추가로 드립니다.</p></div>
          <p className={s.completeNote}>당첨 결과는 개별 연락을 통해 안내됩니다. 사은품은 관리자 확인 후 순서대로 발송됩니다.</p>
        </section>
        <div className={s.completeBtns}>
          <a className={s.btnGold} href={E.brandSite}>브랜드 스토리 보러 가기</a>
          <button type="button" className={s.btnGhost} onClick={onLookup}>내 접수 확인하기</button>
        </div>
      </main>
    </div>
  );
}

/* ---------- 내 접수 확인 + 수정 요청 재제출 ---------- */
function Lookup({ config }: { config: EventConfig | null }) {
  const [phone, setPhone] = useState(""); const [member, setMember] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [res, setRes] = useState<LookupResult | null>(null);
  const [title, setTitle] = useState(""); const [content, setContent] = useState(""); const [rating, setRating] = useState(5);
  const [before, setBefore] = useState<PhotoState>(emptyPhoto); const [after, setAfter] = useState<PhotoState>(emptyPhoto);
  const [saved, setSaved] = useState("");
  const [zoom, setZoom] = useState<string | null>(null);

  const find = async (e?: React.FormEvent) => {
    e?.preventDefault(); setBusy(true); setError(""); setSaved("");
    try { const r = await lookupReview(phone); setRes(r); if (r.review) { setTitle(r.review.title); setContent(r.review.content); setRating(r.review.rating); } }
    catch (x) { setRes(null); setError((x as ApiError).message); } finally { setBusy(false); }
  };
  const resend = async () => {
    setBusy(true); setError("");
    try {
      const r = await reviseReview({ phone, memberNumber: member, title, content, rating, ratingExperience: res?.review?.ratingExperience ?? null,
        images: { ...(before.uploaded ? { before: { uploadId: before.uploaded.uploadId, token: before.uploaded.token } } : {}), ...(after.uploaded ? { after: { uploadId: after.uploaded.uploadId, token: after.uploaded.token } } : {}) } });
      setSaved(`다시 제출했습니다. 현재 상태: ${r.reviewStatusLabel}`); setBefore(emptyPhoto); setAfter(emptyPhoto); await find();
    } catch (x) { setError((x as ApiError).message); } finally { setBusy(false); }
  };
  const n = [...content.trim()].length;
  return (
    <div className={s.lookup}>
      <form onSubmit={find} className={s.lookupForm}>
        <label className={s.label} htmlFor="lk-phone">휴대폰 번호</label>
        <input id="lk-phone" className={s.input} value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d-]/g, "").slice(0, 13))} type="tel" inputMode="numeric" placeholder="010-0000-0000" autoComplete="tel-national" required />
        <button className={s.btnGhost} disabled={busy}>{busy ? "확인 중…" : "접수 내용 확인"}</button>
      </form>
      {error && <p className={s.formError} role="alert">{error}</p>}
      {saved && <p className={s.okNote} role="status">{saved}</p>}
      {res && (
        <div className={s.lookupResult} aria-live="polite">
          <p className={s.lookupHead}><b>{res.name}</b> 님 · {res.applicationNumber}<small>{kDate(res.submittedAt)} 접수</small></p>
          <dl>
            <div><dt>후기 검토</dt><dd><span className={s.pill} data-st={res.reviewStatus}>{res.reviewStatusLabel}</span></dd></div>
            <div><dt>사진</dt><dd>사용 전 {res.photos.before ? "제출" : "미제출"} · 사용 후 {res.photos.after ? "제출" : "미제출"}</dd></div>
            {res.isWinner && <div><dt>우수 후기</dt><dd><span className={s.pill} data-st="WIN">선정되셨습니다 🎉</span></dd></div>}
            {res.rewards.map((r) => <div key={r.type}><dt>{r.productName}</dt><dd><span className={s.pill} data-st={r.status}>{r.statusLabel}</span>{r.trackingNumber && <small>{r.carrier} {r.trackingNumber}</small>}</dd></div>)}
            {!res.rewards.length && res.reviewStatus === "PENDING" && <div><dt>사은품</dt><dd>후기 확인 후 지급 대상으로 등록됩니다</dd></div>}
          </dl>
          {res.statusReason && <p className={s.reason}><b>{res.reviewStatus === "REJECTED" ? "반려 사유" : "수정 요청 내용"}</b>{res.statusReason}</p>}
          {res.canRevise && config && (
            <div className={s.revise}>
              <p className={s.label}>후기를 수정해 다시 제출해 주세요</p>
              <input className={s.input} value={member} maxLength={30} onChange={(e) => setMember(e.target.value.replace(/[^A-Za-z0-9-]/g, ""))} placeholder="본인 확인: 유니앤코어 회원번호" aria-label="유니앤코어 회원번호" autoComplete="off" />
              <input className={s.input} value={title} maxLength={config.titleMaxChars} onChange={(e) => setTitle(e.target.value)} aria-label="후기 제목" />
              <textarea className={s.textarea} rows={7} value={content} onChange={(e) => setContent(e.target.value)} aria-label="후기 내용" />
              <div className={s.counter}><b>{n.toLocaleString()}</b> / {config.maxChars.toLocaleString()}자 <i>(최소 {config.minChars}자)</i></div>
              <p className={s.hint}>사진을 바꾸려면 새 사진을 올려 주세요. 올리지 않으면 기존 사진이 유지됩니다.</p>
              <div className={s.photos}>
                <PhotoField kind="BEFORE" label="사용 전 사진" state={before} maxBytes={config.maxImageBytes} onChange={setBefore} onZoom={setZoom} />
                <PhotoField kind="AFTER" label="사용 후 사진" state={after} maxBytes={config.maxImageBytes} onChange={setAfter} onZoom={setZoom} />
              </div>
              <button type="button" className={s.btnGold} onClick={resend} disabled={busy || [before, after].some((p) => p.status === "uploading" || p.status === "processing")}>수정한 후기 다시 제출</button>
            </div>
          )}
        </div>
      )}
      {zoom && (
        <div className={s.zoom} role="dialog" aria-modal="true" aria-label="사진 크게 보기" onClick={() => setZoom(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="크게 보기" /><button type="button" aria-label="닫기">×</button>
        </div>
      )}
    </div>
  );
}
