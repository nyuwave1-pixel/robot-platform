"use client";
/**
 * 사업자 디자인 스튜디오.
 *  - 로그인한 사업자 본인의 페이지만 읽고 쓴다 (DB 행 단위 보안이 최종 보장).
 *  - 왼쪽: 정보·사진·SNS·디자인·섹션 순서(끌어서 이동)·공식 제품 선택·공유(QR)
 *  - 오른쪽: 실시간 미리보기 (모바일/태블릿/PC 폭 그대로 렌더)
 *  - 저장 전 검사(입력 규칙), 저장 전으로 되돌리기, 저장 안 한 변경 경고
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Reorder } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import QRCode from "qrcode";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { pageUrl, photoUrl, PHOTO_BUCKET } from "@/lib/env";
import { SECTIONS, SNS_KEYS, type EditableProfile, type HqProduct, type Profile, type Section, type SnsKey } from "@/lib/types";
import { checkImage, cleanSns, validateProfile, type FieldErrors } from "@/lib/validate";
import { THEMES } from "@/components/site/theme";

const SECTION_LABEL: Record<Section, string> = { hero: "첫 화면", about: "소개", products: "추천 제품", sns: "SNS", contact: "상담·문의", qr: "QR 공유" };
const SNS_LABEL: Record<SnsKey, string> = { instagram: "인스타그램", youtube: "유튜브", blog: "블로그", facebook: "페이스북", tiktok: "틱톡", kakao_channel: "카카오톡 채널(상담 링크)", website: "웹사이트" };
const STATUS: Record<Profile["status"], { label: string; cls: string; desc: string }> = {
  pending: { label: "승인 대기", cls: "bg-amber-400/15 text-amber-200 ring-amber-400/30", desc: "본사 확인 후 공개됩니다. 그동안 자유롭게 수정하세요." },
  approved: { label: "공개 중", cls: "bg-emerald-400/15 text-emerald-200 ring-emerald-400/30", desc: "누구나 내 주소로 볼 수 있어요." },
  suspended: { label: "비공개", cls: "bg-rose-400/15 text-rose-200 ring-rose-400/30", desc: "본사에서 공개를 멈췄습니다. 본사에 문의하세요." },
};
const DEVICES = { mobile: 390, tablet: 820, pc: 1440 } as const;
type Device = keyof typeof DEVICES;
type Tab = "info" | "design" | "sections" | "products" | "share";

const toEditable = (p: Profile): EditableProfile => ({
  slug: p.slug,
  display_name: p.display_name,
  title: p.title ?? "",
  business_name: p.business_name ?? "",
  bio: p.bio ?? "",
  phone: p.phone ?? "",
  email: p.email ?? "",
  address: p.address ?? "",
  photo_path: p.photo_path,
  sns: p.sns ?? {},
  design: p.design,
  sections: p.sections,
  product_ids: p.product_ids,
  seo_description: p.seo_description ?? "",
});

function Field({ label, error, children, hint }: { label: string; error?: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && !error && <span className="mt-1 block text-[11px] text-muted/70">{hint}</span>}
      {error && (
        <span role="alert" className="mt-1 block text-[11px] text-rose-300">
          {error}
        </span>
      )}
    </label>
  );
}
const inputCls = "w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm outline-none transition focus:border-accent";

function Onboard({ user, isHq, onCreated }: { user: User; isHq: boolean; onCreated: (p: Profile) => void }) {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const draft: EditableProfile = { slug: slug.trim().toLowerCase(), display_name: name.trim(), title: "", business_name: "", bio: "", phone: "", email: "", address: "", photo_path: null, sns: {}, design: "luxury_black", sections: [...SECTIONS], product_ids: [], seo_description: "" };
    const v = validateProfile(draft);
    setErr(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    const { data, error } = await supabaseBrowser().from("site_profiles").insert({ slug: draft.slug, display_name: draft.display_name, owner_id: user.id }).select("*").single();
    setBusy(false);
    if (error) return setErr({ slug: error.code === "23505" ? "이미 사용 중인 주소입니다" : "저장하지 못했습니다. 다시 시도해 주세요." });
    onCreated(data as Profile);
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-5 text-white">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-3xl border border-line bg-panel p-7" data-testid="onboard">
        <p className="text-[11px] tracking-[0.4em] text-gold/80">STEP 1</p>
        <h1 className="text-2xl font-semibold">내 홈페이지 주소 만들기</h1>
        <Field label="이름 (홈페이지에 크게 표시돼요)" error={err.display_name}>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="홍길동" data-testid="onboard-name" />
        </Field>
        <Field label="주소 아이디" error={err.slug} hint="영문 소문자·숫자·하이픈, 3~30자">
          <div className="flex items-center rounded-xl border border-line bg-canvas pl-3.5 text-sm focus-within:border-accent">
            <span className="text-muted">/@</span>
            <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} className="w-full bg-transparent px-1 py-2.5 outline-none" placeholder="hong" data-testid="onboard-slug" />
          </div>
        </Field>
        <button disabled={busy} className="w-full rounded-full bg-gradient-to-r from-gold to-gold2 py-3.5 font-semibold text-onyx disabled:opacity-60" data-testid="onboard-submit">
          {busy ? "만드는 중…" : "시작하기"}
        </button>
        {isHq && (
          <Link href="/hq" className="block rounded-full border border-line py-3 text-center text-sm text-muted hover:text-white" data-testid="nav-hq">
            본사 관리 화면으로
          </Link>
        )}
      </form>
    </main>
  );
}

export default function Studio() {
  const router = useRouter();
  const sb = supabaseBrowser();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<EditableProfile | null>(null);
  const [products, setProducts] = useState<HqProduct[]>([]);
  const [isHq, setIsHq] = useState(false);
  const [tab, setTab] = useState<Tab>("info");
  const [device, setDevice] = useState<Device>("mobile");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ w: 800, h: 640 });
  const [qr, setQr] = useState<string | null>(null);

  // 로그인 확인 + 데이터 불러오기
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await sb.auth.getUser();
      if (!data.user) return router.replace("/login");
      if (!alive) return;
      setUser(data.user);
      const [prof, prods, hq] = await Promise.all([
        sb.from("site_profiles").select("*").eq("owner_id", data.user.id).maybeSingle(),
        sb.from("site_hq_products").select("*").eq("published", true).order("sort"),
        sb.from("site_hq_admins").select("user_id").eq("user_id", data.user.id).maybeSingle(),
      ]);
      if (!alive) return;
      if (prof.data) {
        setSaved(prof.data as Profile);
        setDraft(toEditable(prof.data as Profile));
      }
      setProducts((prods.data ?? []) as HqProduct[]);
      setIsHq(!!hq.data);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [router, sb]);

  const dirty = useMemo(() => !!saved && !!draft && JSON.stringify(toEditable(saved)) !== JSON.stringify({ ...draft, sns: cleanSns(draft.sns) }), [saved, draft]);
  useEffect(() => {
    if (!dirty) return;
    const on = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", on);
    return () => window.removeEventListener("beforeunload", on);
  }, [dirty]);

  // 미리보기로 작성 중 데이터 전달
  const push = useCallback(() => {
    if (!draft) return;
    frame.current?.contentWindow?.postMessage({ type: "draft", profile: { ...draft, sns: cleanSns(draft.sns) }, products }, window.location.origin);
  }, [draft, products]);
  useEffect(push, [push]);
  useEffect(() => {
    const on = (e: MessageEvent) => e.origin === window.location.origin && e.data?.type === "preview-ready" && push();
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, [push]);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setStageSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading, saved]);

  useEffect(() => {
    if (!saved) return;
    QRCode.toDataURL(pageUrl(saved.slug), { margin: 2, width: 1024, errorCorrectionLevel: "M" }).then(setQr);
  }, [saved]);

  const set = <K extends keyof EditableProfile>(k: K, v: EditableProfile[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const flash = (kind: "ok" | "err", text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 3500);
  };

  const save = async () => {
    if (!draft || !saved) return;
    const clean = { ...draft, sns: cleanSns(draft.sns), slug: draft.slug.trim().toLowerCase() };
    const v = validateProfile(clean);
    setErrors(v);
    if (Object.keys(v).length) {
      flash("err", "입력 내용을 확인해 주세요");
      if (Object.keys(v).some((k) => !["design", "sections", "product_ids"].includes(k))) setTab("info");
      return;
    }
    const slugChanged = clean.slug !== saved.slug && saved.status === "approved";
    if (slugChanged && !confirm("주소를 바꾸면 본사 재승인 전까지 페이지가 비공개됩니다. 계속할까요?")) return;
    setSaving(true);
    const { data, error } = await sb
      .from("site_profiles")
      .update({ ...clean, title: clean.title || null, business_name: clean.business_name || null, bio: clean.bio || null, phone: clean.phone || null, email: clean.email || null, address: clean.address || null, seo_description: clean.seo_description || null })
      .eq("id", saved.id)
      .select("*")
      .single();
    setSaving(false);
    if (error) return flash("err", error.code === "23505" ? "이미 사용 중인 주소입니다" : "저장하지 못했습니다. 다시 시도해 주세요.");
    setSaved(data as Profile);
    setDraft(toEditable(data as Profile));
    flash("ok", "저장했어요");
  };

  const upload = async (file: File | undefined) => {
    if (!file || !user || !draft) return;
    const bad = await checkImage(file);
    if (bad) return flash("err", bad);
    setUploading(true);
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/profile-${Date.now()}.${ext}`;
    const { error } = await sb.storage.from(PHOTO_BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
    setUploading(false);
    if (error) return flash("err", "사진을 올리지 못했습니다");
    set("photo_path", path);
    flash("ok", "사진을 올렸어요. 저장을 눌러 반영하세요.");
  };

  const logout = async () => {
    await sb.auth.signOut();
    router.replace("/login");
  };

  if (loading)
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas text-muted" data-testid="studio-loading">
        불러오는 중…
      </main>
    );
  if (user && !saved)
    return (
      <Onboard
        user={user}
        isHq={isHq}
        onCreated={(p) => {
          setSaved(p);
          setDraft(toEditable(p));
        }}
      />
    );
  if (!saved || !draft) return null;

  const st = STATUS[saved.status];
  const deviceW = DEVICES[device];
  const scale = Math.min(1, Math.max(0.2, stageSize.w / deviceW));
  const frameH = Math.max(560, stageSize.h) / scale;
  const enabled = new Set(draft.sections);
  const hidden = SECTIONS.filter((s) => !enabled.has(s));

  return (
    <div className="min-h-screen bg-canvas text-white" data-testid="studio">
      {/* 상단 바 */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur">
        <span className="text-xs font-semibold tracking-[0.3em]">STUDIO</span>
        <span className={`rounded-full px-3 py-1 text-xs ring-1 ${st.cls}`} data-testid="status-badge" data-status={saved.status}>
          {st.label}
        </span>
        <span className="hidden text-xs text-muted lg:inline">{st.desc}</span>
        <div className="ml-auto flex items-center gap-2">
          {isHq && (
            <Link href="/hq" className="rounded-full border border-line px-3 py-1.5 text-xs text-muted hover:text-white" data-testid="nav-hq">
              본사 관리
            </Link>
          )}
          {saved.status === "approved" && (
            <a href={`/@${saved.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-3 py-1.5 text-xs text-muted hover:text-white">
              내 페이지 ↗
            </a>
          )}
          <button onClick={() => setDraft(toEditable(saved))} disabled={!dirty} className="rounded-full border border-line px-3 py-1.5 text-xs text-muted enabled:hover:text-white disabled:opacity-40" data-testid="revert">
            되돌리기
          </button>
          <button onClick={save} disabled={saving || !dirty} className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black disabled:opacity-40" data-testid="save">
            {saving ? "저장 중…" : dirty ? "저장" : "저장됨"}
          </button>
          <button onClick={logout} className="text-xs text-muted hover:text-white" data-testid="logout">
            로그아웃
          </button>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[420px_minmax(0,1fr)]">
        {/* 편집 패널 */}
        <aside className="border-line lg:h-[calc(100vh-57px)] lg:overflow-y-auto lg:border-r">
          <nav className="no-scrollbar sticky top-0 z-10 flex gap-1 overflow-x-auto border-b border-line bg-canvas px-3 py-2">
            {(
              [
                ["info", "정보"],
                ["design", "디자인"],
                ["sections", "섹션"],
                ["products", "제품"],
                ["share", "공유·QR"],
              ] as [Tab, string][]
            ).map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={`shrink-0 rounded-full px-4 py-2 text-sm ${tab === k ? "bg-white text-black" : "text-muted hover:text-white"}`} data-testid={`tab-${k}`}>
                {l}
              </button>
            ))}
          </nav>

          <div className="space-y-5 p-5">
            {tab === "info" && (
              <>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-line bg-panel">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {draft.photo_path && <img src={photoUrl(draft.photo_path)!} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div>
                    <label className="inline-flex cursor-pointer rounded-full border border-line px-4 py-2 text-sm hover:border-accent">
                      {uploading ? "올리는 중…" : "프로필 사진 올리기"}
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} data-testid="photo-input" />
                    </label>
                    <p className="mt-1 text-[11px] text-muted">JPG·PNG·WEBP, 5MB 이하</p>
                  </div>
                </div>
                <Field label="이름 *" error={errors.display_name}>
                  <input value={draft.display_name} onChange={(e) => set("display_name", e.target.value)} className={inputCls} data-testid="f-display_name" />
                </Field>
                <Field label="직함" error={errors.title}>
                  <input value={draft.title ?? ""} onChange={(e) => set("title", e.target.value)} className={inputCls} placeholder="뷰티 컨설턴트" data-testid="f-title" />
                </Field>
                <Field label="사업장명" error={errors.business_name}>
                  <input value={draft.business_name ?? ""} onChange={(e) => set("business_name", e.target.value)} className={inputCls} placeholder="○○ 뷰티 라운지" data-testid="f-business_name" />
                </Field>
                <Field label="한 줄 소개 (첫 화면·검색 결과 설명)" error={errors.seo_description} hint={`${(draft.seo_description ?? "").length}/200`}>
                  <input value={draft.seo_description ?? ""} onChange={(e) => set("seo_description", e.target.value)} className={inputCls} placeholder="당신의 이름으로 시작하는 새로운 뷰티 비즈니스" data-testid="f-seo_description" />
                </Field>
                <Field label="소개글" error={errors.bio} hint={`${(draft.bio ?? "").length}/1500 · 줄바꿈으로 문단이 나뉩니다`}>
                  <textarea value={draft.bio ?? ""} onChange={(e) => set("bio", e.target.value)} rows={5} className={inputCls} data-testid="f-bio" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="전화" error={errors.phone}>
                    <input value={draft.phone ?? ""} onChange={(e) => set("phone", e.target.value)} inputMode="tel" className={inputCls} data-testid="f-phone" />
                  </Field>
                  <Field label="이메일" error={errors.email}>
                    <input value={draft.email ?? ""} onChange={(e) => set("email", e.target.value)} inputMode="email" className={inputCls} data-testid="f-email" />
                  </Field>
                </div>
                <Field label="사업장 주소" error={errors.address}>
                  <input value={draft.address ?? ""} onChange={(e) => set("address", e.target.value)} className={inputCls} data-testid="f-address" />
                </Field>
                <div className="space-y-3 rounded-2xl border border-line p-4">
                  <p className="text-xs font-medium text-muted">SNS · 상담 링크 (https:// 로 시작)</p>
                  {SNS_KEYS.map((k) => (
                    <Field key={k} label={SNS_LABEL[k]} error={errors[`sns.${k}`]}>
                      <input value={draft.sns[k] ?? ""} onChange={(e) => set("sns", { ...draft.sns, [k]: e.target.value })} className={inputCls} placeholder="https://" data-testid={`f-sns-${k}`} />
                    </Field>
                  ))}
                </div>
                <Field label="페이지 주소 아이디" error={errors.slug} hint={saved.status === "approved" ? "바꾸면 본사 재승인 전까지 비공개됩니다" : "영문 소문자·숫자·하이픈 3~30자"}>
                  <div className="flex items-center rounded-xl border border-line bg-canvas pl-3.5 text-sm focus-within:border-accent">
                    <span className="text-muted">/@</span>
                    <input value={draft.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} className="w-full bg-transparent px-1 py-2.5 outline-none" data-testid="f-slug" />
                  </div>
                </Field>
              </>
            )}

            {tab === "design" && (
              <div className="grid gap-3" data-testid="design-list">
                {Object.values(THEMES).map((t) => (
                  <button key={t.id} onClick={() => set("design", t.id)} className={`overflow-hidden rounded-2xl text-left ring-2 transition ${draft.design === t.id ? "ring-accent" : "ring-transparent hover:ring-line"}`} data-testid={`design-${t.id}`} aria-pressed={draft.design === t.id}>
                    <div className={`${t.root} ${t.text} p-6`}>
                      <p className={`text-[10px] uppercase ${t.eyebrow}`}>DESIGN ENGINE</p>
                      <p className={`mt-3 ${t.displayFont} text-3xl font-light`}>{t.label}</p>
                      <p className={`mt-1 text-sm ${t.sub}`}>{t.desc}</p>
                    </div>
                  </button>
                ))}
                <p className="text-[11px] text-muted">추가 디자인 엔진(Futuristic 3D · Beauty Editorial · Corporate Premium)은 다음 단계에서 제공됩니다.</p>
              </div>
            )}

            {tab === "sections" && (
              <div data-testid="section-editor">
                <p className="mb-3 text-xs text-muted">끌어서 순서를 바꾸고, 눈 버튼으로 숨기거나 보이게 하세요.</p>
                <Reorder.Group axis="y" values={draft.sections} onReorder={(v) => set("sections", v)} className="space-y-2">
                  {draft.sections.map((s, i) => (
                    <Reorder.Item key={s} value={s} className="flex cursor-grab items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3 active:cursor-grabbing" data-testid={`sec-${s}`}>
                      <span aria-hidden className="text-muted">⋮⋮</span>
                      <span className="flex-1 text-sm">{SECTION_LABEL[s]}</span>
                      <button type="button" aria-label="위로" disabled={i === 0} onClick={() => { const a = [...draft.sections]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; set("sections", a); }} className="px-1 text-muted disabled:opacity-20" data-testid={`sec-up-${s}`}>
                        ↑
                      </button>
                      <button type="button" aria-label="아래로" disabled={i === draft.sections.length - 1} onClick={() => { const a = [...draft.sections]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; set("sections", a); }} className="px-1 text-muted disabled:opacity-20">
                        ↓
                      </button>
                      <button type="button" aria-label="숨기기" onClick={() => set("sections", draft.sections.filter((x) => x !== s))} className="px-1 text-muted hover:text-white" data-testid={`sec-hide-${s}`}>
                        👁
                      </button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
                {hidden.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-2 text-xs text-muted">숨긴 섹션</p>
                    <div className="flex flex-wrap gap-2">
                      {hidden.map((s) => (
                        <button key={s} onClick={() => set("sections", [...draft.sections, s])} className="rounded-full border border-dashed border-line px-3 py-1.5 text-xs text-muted hover:text-white" data-testid={`sec-show-${s}`}>
                          + {SECTION_LABEL[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "products" && (
              <div data-testid="product-picker">
                <p className="mb-3 text-xs text-muted">본사 공식 제품 중 내 페이지에 보여줄 제품을 고르세요 (최대 12개). 제품 이름·사진·설명은 본사 정보 그대로 표시되며 수정할 수 없습니다.</p>
                {errors.product_ids && <p className="mb-2 text-xs text-rose-300">{errors.product_ids}</p>}
                <div className="grid grid-cols-2 gap-2">
                  {products.map((pr) => {
                    const on = draft.product_ids.includes(pr.id);
                    return (
                      <button key={pr.id} onClick={() => set("product_ids", on ? draft.product_ids.filter((x) => x !== pr.id) : [...draft.product_ids, pr.id])} className={`overflow-hidden rounded-2xl border text-left transition ${on ? "border-accent" : "border-line"}`} aria-pressed={on} data-testid={`pick-${pr.id}`}>
                        <div className="relative aspect-square bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {pr.image_url && <img src={pr.image_url} alt="" className="h-full w-full object-contain p-3" />}
                          {on && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs text-black">✓</span>}
                        </div>
                        <p className="line-clamp-2 p-2.5 text-xs">{pr.name}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "share" && (
              <div className="space-y-4" data-testid="share-panel">
                <div className="rounded-2xl border border-line p-4">
                  <p className="text-xs text-muted">내 페이지 주소</p>
                  <p className="mt-1 break-all font-mono text-sm" data-testid="page-url">{pageUrl(saved.slug)}</p>
                  <button onClick={() => navigator.clipboard?.writeText(pageUrl(saved.slug)).then(() => flash("ok", "주소를 복사했어요"))} className="mt-3 rounded-full border border-line px-4 py-2 text-xs hover:border-accent">
                    주소 복사
                  </button>
                  {saved.status !== "approved" && <p className="mt-2 text-[11px] text-amber-200">본사 승인 후부터 이 주소로 접속할 수 있어요.</p>}
                </div>
                <div className="rounded-2xl border border-line p-4 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {qr && <img src={qr} alt="내 페이지 QR 코드" className="mx-auto w-48 rounded-xl bg-white p-2" data-testid="qr-img" />}
                  {qr && (
                    <a href={qr} download={`unicore-${saved.slug}-qr.png`} className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold text-black" data-testid="qr-download">
                      QR 이미지 저장
                    </a>
                  )}
                  <p className="mt-2 text-[11px] text-muted">명함·매장 POP·SNS 프로필에 넣어 쓰세요.</p>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* 실시간 미리보기 */}
        <section id="preview" className="flex scroll-mt-14 flex-col bg-[#05060a] lg:h-[calc(100vh-57px)]">
          <div className="flex items-center justify-center gap-1 border-b border-line py-2">
            {(Object.keys(DEVICES) as Device[]).map((d) => (
              <button key={d} onClick={() => setDevice(d)} className={`rounded-full px-4 py-1.5 text-xs ${device === d ? "bg-white text-black" : "text-muted hover:text-white"}`} data-testid={`device-${d}`}>
                {d === "mobile" ? "모바일" : d === "tablet" ? "태블릿" : "PC"}
              </button>
            ))}
            {dirty && <span className="ml-3 text-[11px] text-amber-200">저장 안 한 변경이 있어요</span>}
          </div>
          <div className="flex-1 p-4">
            <div ref={stage} className="h-full min-h-[560px] w-full">
              <div className="mx-auto overflow-hidden rounded-2xl border border-line shadow-2xl" style={{ width: deviceW * scale, height: frameH * scale }}>
                <div style={{ width: deviceW, height: frameH, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                  <iframe ref={frame} src="/studio/preview" title="미리보기" className="h-full w-full border-0 bg-onyx" onLoad={push} data-testid="preview-frame" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <a href="#preview" className="fixed bottom-5 right-5 z-40 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-black shadow-xl lg:hidden" data-testid="jump-preview">
        미리보기 ↓
      </a>

      {toast && (
        <div role="status" className={`fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-3 text-sm shadow-xl ${toast.kind === "ok" ? "bg-emerald-500 text-black" : "bg-rose-500 text-white"}`} data-testid="toast">
          {toast.text}
        </div>
      )}
    </div>
  );
}
