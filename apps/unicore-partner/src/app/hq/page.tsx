"use client";
/**
 * 본사 관리자: 사업자 페이지 승인·비공개 / 공식 제품 정보 관리.
 * 화면 접근은 site_hq_admins 에 등록된 계정만. 실제 권한은 DB 정책이 다시 확인한다
 * (관리자가 아닌 계정이 요청을 직접 보내도 승인·제품 수정은 거부된다).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { photoUrl } from "@/lib/env";
import type { HqProduct, Profile, Status } from "@/lib/types";

const STATUS_LABEL: Record<Status, string> = { pending: "승인 대기", approved: "공개 중", suspended: "비공개" };
const STATUS_CLS: Record<Status, string> = { pending: "text-amber-200 bg-amber-400/10", approved: "text-emerald-200 bg-emerald-400/10", suspended: "text-rose-200 bg-rose-400/10" };
const input = "w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-accent";

function ProductEditor({ p, onSaved }: { p: HqProduct | null; onSaved: () => void }) {
  const blank: HqProduct = { id: "", name: "", tagline: "", description: "", image_url: "", shop_url: "", certifications: "", clinical_note: "", sort: 99, published: true, updated_at: "" };
  const [f, setF] = useState<HqProduct>(p ?? blank);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => setF(p ?? blank), [p]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = <K extends keyof HqProduct>(k: K, v: HqProduct[K]) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    setErr(null);
    if (!/^[A-Za-z0-9_-]{2,40}$/.test(f.id)) return setErr("제품 ID: 영문·숫자·_- 2~40자");
    if (!f.name.trim()) return setErr("제품명을 입력하세요");
    if (f.shop_url && !/^https:\/\//.test(f.shop_url)) return setErr("공식몰 주소는 https:// 로 시작해야 합니다");
    if (f.image_url && !/^(https:\/\/|\/)/.test(f.image_url)) return setErr("이미지 주소는 https:// 또는 / 로 시작해야 합니다");
    setBusy(true);
    const row = { id: f.id, name: f.name.trim(), tagline: f.tagline || null, description: f.description || null, image_url: f.image_url || null, shop_url: f.shop_url || null, certifications: f.certifications || null, clinical_note: f.clinical_note || null, sort: Number(f.sort) || 0, published: f.published, updated_at: new Date().toISOString() };
    const sb = supabaseBrowser();
    const { error } = p ? await sb.from("site_hq_products").update(row).eq("id", p.id) : await sb.from("site_hq_products").insert(row);
    setBusy(false);
    if (error) return setErr(error.code === "23505" ? "같은 ID 의 제품이 있습니다" : `저장 실패: ${error.message}`);
    onSaved();
  };
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-panel p-5" data-testid="product-editor">
      <p className="text-sm font-semibold">{p ? "제품 정보 수정" : "새 제품 등록"}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-muted">ID<input disabled={!!p} value={f.id} onChange={(e) => set("id", e.target.value)} className={`${input} mt-1 disabled:opacity-50`} data-testid="pe-id" /></label>
        <label className="text-xs text-muted">정렬 순서<input type="number" value={f.sort} onChange={(e) => set("sort", Number(e.target.value))} className={`${input} mt-1`} /></label>
      </div>
      <label className="block text-xs text-muted">공식 제품명<input value={f.name} onChange={(e) => set("name", e.target.value)} className={`${input} mt-1`} data-testid="pe-name" /></label>
      <label className="block text-xs text-muted">한 줄 설명<input value={f.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} className={`${input} mt-1`} data-testid="pe-tagline" /></label>
      <label className="block text-xs text-muted">핵심 설명 (줄바꿈 구분)<textarea rows={3} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} className={`${input} mt-1`} /></label>
      <label className="block text-xs text-muted">이미지 주소<input value={f.image_url ?? ""} onChange={(e) => set("image_url", e.target.value)} className={`${input} mt-1`} /></label>
      <label className="block text-xs text-muted">공식몰 주소<input value={f.shop_url ?? ""} onChange={(e) => set("shop_url", e.target.value)} className={`${input} mt-1`} /></label>
      <label className="block text-xs text-muted">인증·기능성 표기<input value={f.certifications ?? ""} onChange={(e) => set("certifications", e.target.value)} className={`${input} mt-1`} /></label>
      <label className="block text-xs text-muted">임상·시험 안내<input value={f.clinical_note ?? ""} onChange={(e) => set("clinical_note", e.target.value)} className={`${input} mt-1`} /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.published} onChange={(e) => set("published", e.target.checked)} data-testid="pe-published" /> 사업자에게 공개</label>
      {err && <p role="alert" className="text-xs text-rose-300">{err}</p>}
      <button onClick={save} disabled={busy} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-50" data-testid="pe-save">{busy ? "저장 중…" : "저장"}</button>
      <p className="text-[11px] text-muted">저장하면 이 제품을 고른 모든 사업자 페이지에 자동 반영됩니다 (즉시).</p>
    </div>
  );
}

export default function Hq() {
  const router = useRouter();
  const sb = supabaseBrowser();
  const [state, setState] = useState<"loading" | "denied" | "ok">("loading");
  const [tab, setTab] = useState<"partners" | "products">("partners");
  const [rows, setRows] = useState<Profile[]>([]);
  const [products, setProducts] = useState<HqProduct[]>([]);
  const [filter, setFilter] = useState<Status | "all">("pending");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<HqProduct | null | "new">(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [p, pr] = await Promise.all([sb.from("site_profiles").select("*").order("updated_at", { ascending: false }), sb.from("site_hq_products").select("*").order("sort")]);
    setRows((p.data ?? []) as Profile[]);
    setProducts((pr.data ?? []) as HqProduct[]);
  }, [sb]);

  useEffect(() => {
    (async () => {
      const { data } = await sb.auth.getUser();
      if (!data.user) return router.replace("/login");
      const { data: adm } = await sb.from("site_hq_admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
      if (!adm) return setState("denied");
      await load();
      setState("ok");
    })();
  }, [sb, router, load]);

  const counts = useMemo(() => ({ all: rows.length, pending: rows.filter((r) => r.status === "pending").length, approved: rows.filter((r) => r.status === "approved").length, suspended: rows.filter((r) => r.status === "suspended").length }), [rows]);
  const shown = rows.filter((r) => (filter === "all" || r.status === filter) && (!q || `${r.display_name} ${r.business_name ?? ""} ${r.slug}`.toLowerCase().includes(q.toLowerCase())));

  const setStatus = async (id: string, status: Status) => {
    const { error } = await sb.from("site_profiles").update({ status }).eq("id", id);
    setMsg(error ? `변경 실패: ${error.message}` : `${STATUS_LABEL[status]}(으)로 변경했습니다`);
    setTimeout(() => setMsg(null), 3000);
    await load();
  };

  if (state === "loading") return <main className="flex min-h-screen items-center justify-center bg-canvas text-muted">불러오는 중…</main>;
  if (state === "denied")
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas text-white" data-testid="hq-denied">
        <p>본사 관리자 계정만 접근할 수 있습니다.</p>
        <Link href="/studio" className="rounded-full border border-line px-5 py-2 text-sm">스튜디오로</Link>
      </main>
    );

  return (
    <div className="min-h-screen bg-canvas text-white" data-testid="hq">
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <span className="text-xs font-semibold tracking-[0.3em]">UNI&CORE HQ</span>
        <nav className="flex gap-1">
          {(["partners", "products"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm ${tab === t ? "bg-white text-black" : "text-muted"}`} data-testid={`hq-tab-${t}`}>
              {t === "partners" ? "사업자 페이지" : "공식 제품"}
            </button>
          ))}
        </nav>
        <Link href="/studio" className="ml-auto text-xs text-muted hover:text-white">내 스튜디오</Link>
      </header>

      {msg && <p role="status" className="mx-5 mt-4 rounded-xl bg-white/5 p-3 text-sm" data-testid="hq-msg">{msg}</p>}

      {tab === "partners" && (
        <main className="p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["all", "pending", "approved", "suspended"] as const).map((k) => (
              <button key={k} onClick={() => setFilter(k)} className={`rounded-2xl border p-4 text-left ${filter === k ? "border-accent" : "border-line"} bg-panel`} data-testid={`hq-filter-${k}`}>
                <p className="text-xs text-muted">{k === "all" ? "전체" : STATUS_LABEL[k]}</p>
                <p className="mt-1 text-3xl font-light tabular-nums">{counts[k]}</p>
              </button>
            ))}
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름·사업장·주소 검색" className={`${input} mt-5 max-w-sm`} />
          <ul className="mt-4 space-y-2" data-testid="hq-list">
            {shown.length === 0 && <li className="rounded-2xl border border-line p-8 text-center text-sm text-muted">해당하는 사업자가 없습니다.</li>}
            {shown.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-panel p-4" data-testid={`hq-row-${r.slug}`}>
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-canvas">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {r.photo_path && <img src={photoUrl(r.photo_path)!} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1 basis-48">
                  <p className="font-semibold">{r.display_name} <span className="text-xs font-normal text-muted">{r.business_name}</span></p>
                  <p className="text-xs text-muted">/@{r.slug} · {new Date(r.updated_at).toLocaleString("ko-KR")}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs ${STATUS_CLS[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                <div className="flex gap-2">
                  {r.status !== "approved" && <button onClick={() => setStatus(r.id, "approved")} className="rounded-full bg-emerald-400 px-4 py-1.5 text-xs font-semibold text-black" data-testid={`approve-${r.slug}`}>승인·공개</button>}
                  {r.status === "approved" && <button onClick={() => setStatus(r.id, "suspended")} className="rounded-full border border-rose-400/50 px-4 py-1.5 text-xs text-rose-200" data-testid={`suspend-${r.slug}`}>비공개</button>}
                  {r.status === "approved" && <a href={`/@${r.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-4 py-1.5 text-xs">보기 ↗</a>}
                </div>
              </li>
            ))}
          </ul>
        </main>
      )}

      {tab === "products" && (
        <main className="grid gap-5 p-5 lg:grid-cols-[1fr_420px]">
          <div>
            <button onClick={() => setEditing("new")} className="mb-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black" data-testid="pe-new">+ 새 제품</button>
            <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => (
                <li key={p.id}>
                  <button onClick={() => setEditing(p)} className="flex w-full items-center gap-3 rounded-2xl border border-line bg-panel p-3 text-left hover:border-accent" data-testid={`pe-row-${p.id}`}>
                    <div className="h-14 w-14 shrink-0 rounded-xl bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-contain p-1" />}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm">{p.name}</p>
                      {!p.published && <p className="text-[11px] text-rose-300">비공개</p>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {editing && <ProductEditor p={editing === "new" ? null : editing} onSaved={async () => { setEditing(null); await load(); setMsg("제품 정보를 저장했습니다"); setTimeout(() => setMsg(null), 3000); }} />}
        </main>
      )}
    </div>
  );
}
