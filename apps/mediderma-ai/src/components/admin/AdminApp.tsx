"use client";
/** 관리자 화면 (내부용 · 한국어). 얼굴 사진은 서버에 없으므로 어떤 화면에도 표시되지 않는다. */
import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AppConfig } from "@/lib/appConfig";
import { LOCALES, LOCALE_NAMES } from "@/lib/appConfig";
import type { MetricKey } from "@/lib/analysis/types";
import ko from "@/lib/i18n/locales/ko";
import { ENGINE_VERSION } from "@/lib/analysis/engine";
import type { Stats } from "@/server/stats";
import type { StoredEvent, StoredReport } from "@/server/store";

const TABS = ["대시보드", "AI 모델·점수 기준", "케어·상품·추천", "언어·개인정보", "신고·오류", "분석 로그"] as const;
type Tab = (typeof TABS)[number];
const card = "rounded-xl border border-line bg-panel p-4";
const input = "w-full rounded border border-line bg-black px-2 py-1 text-sm text-white";

function Login({ enabled }: { enabled: boolean }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  if (!enabled)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-sm text-silver" data-testid="admin-disabled">
        <h1 className="text-xl text-white">관리자 기능이 비활성화되어 있습니다</h1>
        <p className="mt-2">서버 환경변수 <code>ADMIN_PASSWORD</code>(8자 이상)를 설정하면 활성화됩니다.</p>
      </div>
    );
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (r.ok) location.reload();
    else setErr(r.status === 429 ? "시도 횟수를 초과했습니다. 1분 뒤 다시 시도하세요." : "비밀번호가 올바르지 않습니다.");
  };
  return (
    <form onSubmit={submit} className="mx-auto max-w-sm px-4 py-20" data-testid="admin-login">
      <h1 className="font-display text-xl tracking-[0.2em]">MEDIDERMA AI · ADMIN</h1>
      <input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="관리자 비밀번호" className={`${input} mt-6 py-2`} data-testid="admin-password" />
      {err && <p role="alert" className="mt-2 text-sm text-rose-300">{err}</p>}
      <button className="mt-4 w-full rounded-full bg-white py-2.5 text-sm font-semibold text-black" data-testid="admin-submit">로그인</button>
    </form>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className={card}>
      <p className="text-[11px] text-silver">{label}</p>
      <p className="mt-1 font-display text-2xl font-light">{value}</p>
      {sub && <p className="text-[10px] text-silver/60">{sub}</p>}
    </div>
  );
}
function TopList({ title, rows, label }: { title: string; rows: { key: string; count: number }[]; label?: (k: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className={card}>
      <h3 className="text-sm font-semibold">{title}</h3>
      {rows.length === 0 && <p className="mt-2 text-xs text-silver">데이터 없음</p>}
      <ul className="mt-2 space-y-1.5">
        {rows.map((r) => (
          <li key={r.key} className="text-xs">
            <div className="flex justify-between"><span>{label ? label(r.key) : r.key}</span><span className="tabular-nums text-silver">{r.count}</span></div>
            <div className="mt-0.5 h-1 rounded bg-line"><div className="h-full rounded bg-scan" style={{ width: `${(r.count / max) * 100}%` }} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Dashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<{ stats: Stats; storage: { kind: string; persistent: boolean } } | null>(null);
  useEffect(() => {
    fetch(`/api/admin/stats?days=${days}`).then((r) => r.json()).then(setData).catch(() => {});
  }, [days]);
  if (!data) return <p className="text-sm text-silver">불러오는 중…</p>;
  const s = data.stats;
  const pct = (v: number | null) => (v === null ? "—" : `${v}%`);
  const metricName = (k: string) => ko.metrics[k as MetricKey]?.name ?? k;
  const issueName = (k: string) => (ko.quality.issues as Record<string, string>)[k]?.split(".")[0] ?? k;
  return (
    <div className="space-y-4" data-testid="admin-dashboard">
      {!data.storage.persistent && (
        <p role="alert" className="rounded-lg border border-amber-400/50 bg-amber-400/10 p-3 text-xs text-amber-100">
          저장소가 영속적이지 않습니다 ({data.storage.kind}). 서버 재시작 시 통계가 사라집니다. 운영 환경에서는 DATABASE_URL(PostgreSQL)을 설정하세요.
        </p>
      )}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-silver">기간</span>
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setDays(d)} className={`rounded-full border px-3 py-1 ${days === d ? "border-scan text-scan2" : "border-line text-silver"}`}>{d}일</button>
        ))}
        <span className="ml-auto text-silver/60">저장소: {data.storage.kind}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="전체 분석 횟수" value={s.totals.started} sub={`방문 세션 ${s.totals.visits}`} />
        <Kpi label="이미지 업로드 성공률" value={pct(s.rates.uploadSuccess)} sub={`품질 미달 ${s.totals.rejected}`} />
        <Kpi label="AI 분석 성공률" value={pct(s.rates.analysisSuccess)} sub={`오류 ${s.totals.failed} · 재촬영 권고 ${s.totals.needsRetake}`} />
        <Kpi label="무료 체험 전환율" value={pct(s.rates.trialConversion)} sub={`체험 클릭 ${s.totals.trialClicks}`} />
        <Kpi label="더마홈 상품 클릭" value={s.totals.productClicks} />
        <Kpi label="리포트 저장" value={s.totals.reportSaved} sub={s.formats.map((f) => `${f.key} ${f.count}`).join(" · ")} />
        <Kpi label="전후 비교 실행" value={s.totals.compares} />
        <Kpi label="파트너 문의 클릭" value={s.totals.partnerClicks} />
      </div>
      <div className={card}>
        <h3 className="text-sm font-semibold">일별 분석 이용자</h3>
        <div className="mt-2 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={s.daily}>
              <CartesianGrid stroke="#1c232d" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#8b96a3" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#8b96a3" }} />
              <Tooltip contentStyle={{ background: "#0c1016", border: "1px solid #1c232d", fontSize: 12 }} />
              <Line type="monotone" dataKey="users" name="이용자" stroke="#4fb6ff" dot={false} />
              <Line type="monotone" dataKey="started" name="분석 시작" stroke="#c9d1d9" dot={false} />
              <Line type="monotone" dataKey="succeeded" name="분석 성공" stroke="#34d399" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <TopList title="분석 실패 현황 (사유)" rows={s.failReasons} label={issueName} />
        <TopList title="피부 고민 통계 (상위 고민 지표)" rows={s.concerns} label={metricName} />
        <TopList title="가장 많이 선택된 케어 기능" rows={s.techs} label={(k) => (ko.care.tech as Record<string, { name: string }>)[k]?.name ?? k} />
        <TopList title="선택된 루틴" rows={s.routines} label={(k) => (ko.kb.routines as Record<string, { name: string }>)[k]?.name ?? k} />
        <TopList title="상품 클릭" rows={s.products} label={(k) => (ko.kb.products as Record<string, { name: string }>)[k]?.name ?? k} />
        <div className={card}>
          <h3 className="text-sm font-semibold">국가별 접속 (세션)</h3>
          <div className="mt-2 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.countries.slice(0, 10)}>
                <XAxis dataKey="key" tick={{ fontSize: 10, fill: "#8b96a3" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#8b96a3" }} />
                <Tooltip contentStyle={{ background: "#0c1016", border: "1px solid #1c232d", fontSize: 12 }} />
                <Bar dataKey="count" name="세션" fill="#4fb6ff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-silver/60">ZZ = 국가 정보 없음(로컬·CDN 헤더 없음). 언어: {s.locales.map((l) => `${l.key} ${l.count}`).join(" · ")}</p>
        </div>
      </div>
    </div>
  );
}

function Settings({ tab }: { tab: Tab }) {
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  const [defaults, setDefaults] = useState<AppConfig | null>(null);
  const [history, setHistory] = useState<{ ts: string; calibration: string; provider: string }[]>([]);
  const [msg, setMsg] = useState("");
  const [gemini, setGemini] = useState<{ key: boolean; model: string }>({ key: false, model: "" });
  const load = useCallback(() => fetch("/api/admin/config").then((r) => r.json()).then((d) => { setCfg(d.config); setDefaults(d.defaults); setHistory(d.history); setGemini({ key: d.geminiKeyPresent, model: d.geminiModel }); }), []);
  useEffect(() => { load(); }, [load]);
  if (!cfg || !defaults) return <p className="text-sm text-silver">불러오는 중…</p>;
  const save = async (next: AppConfig = cfg) => {
    const r = await fetch("/api/admin/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
    setMsg(r.ok ? "저장했습니다. 이용자 화면에는 최대 30초 뒤 반영됩니다." : "저장에 실패했습니다.");
    if (r.ok) load();
  };
  const num = (v: number, on: (n: number) => void, step = "any") => <input type="number" step={step} value={v} onChange={(e) => on(Number(e.target.value))} className={input} />;
  const SaveBar = () => (
    <div className="flex items-center gap-3">
      <button onClick={() => save()} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black" data-testid="admin-save">저장</button>
      <button onClick={() => { setCfg(defaults); save(defaults); }} className="rounded-full border border-line px-4 py-2 text-xs text-silver">기본값으로 복원</button>
      {msg && <span className="text-xs text-scan2" data-testid="admin-msg">{msg}</span>}
    </div>
  );
  const cal = cfg.calibration;
  const setCal = (c: Partial<AppConfig["calibration"]>) => setCfg({ ...cfg, calibration: { ...cal, ...c } });

  if (tab === "AI 모델·점수 기준")
    return (
      <div className="space-y-4">
        <div className={card}>
          <h3 className="text-sm font-semibold">AI 모델 API 설정 · 버전 관리</h3>
          <dl className="mt-2 grid grid-cols-[140px_1fr] gap-y-1 text-xs text-silver">
            <dt>활성 Provider</dt><dd className="text-white">{cfg.provider.id} (on-device, 이미지 전송 없음)</dd>
            <dt>엔진 버전</dt><dd className="text-white">{ENGINE_VERSION}</dd>
            <dt>외부 API 키</dt><dd>필요 없음 — 현재 Provider 는 외부 AI API 를 호출하지 않습니다.</dd>
          </dl>
          <label className="mt-3 block text-xs text-silver">Provider 메모<input value={cfg.provider.note} onChange={(e) => setCfg({ ...cfg, provider: { ...cfg.provider, note: e.target.value } })} className={input} /></label>
          <label className="mt-3 block text-xs text-silver">보정(캘리브레이션) 버전 — 점수 기준을 바꾸면 버전도 올리세요. 리포트의 '분석 모델 버전'에 표시됩니다.
            <input value={cal.version} onChange={(e) => setCal({ version: e.target.value })} className={input} data-testid="cal-version" />
          </label>
          <p className="mt-2 text-[11px] text-silver/70">변경 이력: {history.slice(-5).map((h) => `${h.ts.slice(0, 16)} ${h.calibration}`).join(" → ") || "없음"}</p>
        </div>
        <div className={card} data-testid="admin-gemini">
          <h3 className="text-sm font-semibold">Gemini AI 해설 (외부 Vision AI · 선택 기능)</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-silver">켜면 리포트에 'Gemini AI 해설' 영역이 생기고, 이용자가 그 자리에서 따로 동의한 경우에만 축소된 얼굴 사진이 Google Gemini API로 전송됩니다. 점수는 바뀌지 않습니다.</p>
          <dl className="mt-2 grid grid-cols-[140px_1fr] gap-y-1 text-xs text-silver">
            <dt>서버 API 키</dt><dd className={gemini.key ? "text-emerald-300" : "text-amber-200"}>{gemini.key ? "설정됨 (GEMINI_API_KEY)" : "없음 — 서버 환경변수 GEMINI_API_KEY 를 설정하세요"}</dd>
            <dt>모델</dt><dd className="text-white">{gemini.model} (GEMINI_MODEL 로 변경)</dd>
          </dl>
          <p role="note" className="mt-2 rounded-lg border border-amber-400/40 bg-amber-400/10 p-2 text-[11px] leading-relaxed text-amber-100">
            Google 약관상 <b>무료 등급 키</b>로 보낸 내용은 Google이 제품 개선에 사용하고 사람이 검토할 수 있으며, 개인정보를 보내지 말라고 명시되어 있습니다. 얼굴 사진을 보내려면 반드시 <b>결제가 연결된 유료 등급 키</b>를 사용하세요. 국외 이전 고지·처리위탁 등 법무 검토도 필요합니다.
          </p>
          <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" data-testid="gemini-paid" checked={cfg.aiInsight.paidTierConfirmed} onChange={(e) => setCfg({ ...cfg, aiInsight: { ...cfg.aiInsight, paidTierConfirmed: e.target.checked } })} /> 사용 중인 키가 유료 등급(결제 연결)임을 확인했습니다</label>
          <label className="mt-1 flex items-center gap-2 text-xs"><input type="checkbox" data-testid="gemini-enabled" checked={cfg.aiInsight.enabled} onChange={(e) => setCfg({ ...cfg, aiInsight: { ...cfg.aiInsight, enabled: e.target.checked } })} /> Gemini AI 해설 사용</label>
        </div>
        <div className={card}>
          <h3 className="text-sm font-semibold">분석 항목 관리</h3>
          <p className="text-[11px] text-silver">끄면 리포트에서 해당 지표가 표시되지 않습니다.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {defaults.enabledMetrics.map((m) => (
              <label key={m} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs">
                <input type="checkbox" checked={cfg.enabledMetrics.includes(m)} onChange={(e) => setCfg({ ...cfg, enabledMetrics: e.target.checked ? [...cfg.enabledMetrics, m] : cfg.enabledMetrics.filter((x) => x !== m) })} />
                {ko.metrics[m].name}
              </label>
            ))}
          </div>
        </div>
        <div className={card}>
          <h3 className="text-sm font-semibold">피부 분석 점수 기준 (원시값 → 0~100 지수)</h3>
          <p className="text-[11px] text-amber-200/80">엔지니어링 보정값입니다. 임상 검증된 기준이 아닙니다. lo 이하 = 0, hi 이상 = 100.</p>
          <table className="mt-2 w-full text-xs">
            <thead><tr className="text-left text-silver"><th className="py-1">지표</th><th>lo</th><th>hi</th><th className="text-silver/50">기본값</th></tr></thead>
            <tbody>
              {(Object.keys(cal.ranges) as MetricKey[]).map((m) => (
                <tr key={m}>
                  <td className="py-1 pr-2">{ko.metrics[m].name}</td>
                  <td className="pr-2">{num(cal.ranges[m].lo, (n) => setCal({ ranges: { ...cal.ranges, [m]: { ...cal.ranges[m], lo: n } } }))}</td>
                  <td className="pr-2">{num(cal.ranges[m].hi, (n) => setCal({ ranges: { ...cal.ranges, [m]: { ...cal.ranges[m], hi: n } } }))}</td>
                  <td className="text-silver/50">{defaults.calibration.ranges[m].lo} ~ {defaults.calibration.ranges[m].hi}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-silver md:grid-cols-4">
            <label>영역 최소 신뢰도{num(cal.minZoneConfidence, (n) => setCal({ minZoneConfidence: n }))}</label>
            <label>종합 최소 신뢰도{num(cal.minOverallConfidence, (n) => setCal({ minOverallConfidence: n }))}</label>
            <label>최소 유효 영역 수{num(cal.minValidZones, (n) => setCal({ minValidZones: n }), "1")}</label>
            <label>전후 비교 잡음 범위(±){num(cal.compareNoiseBand, (n) => setCal({ compareNoiseBand: n }))}</label>
          </div>
        </div>
        <div className={card}>
          <h3 className="text-sm font-semibold">촬영 품질 기준</h3>
          <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-silver md:grid-cols-4">
            {(Object.keys(cal.quality) as (keyof typeof cal.quality)[]).map((k) => (
              <label key={k}>{k}{num(cal.quality[k], (n) => setCal({ quality: { ...cal.quality, [k]: n } }))}</label>
            ))}
          </div>
        </div>
        <SaveBar />
      </div>
    );

  if (tab === "케어·상품·추천")
    return (
      <div className="space-y-4">
        <div className={card}>
          <h3 className="text-sm font-semibold">더마홈 케어 가이드 관리</h3>
          <p className="text-[11px] text-silver">루틴 내용(시간·순서·제품)은 공식 CARE GUIDE 를 따르며 코드(지식베이스)에서 관리합니다. 여기서는 추천 대상 여부만 켜고 끕니다.</p>
          <div className="mt-2 space-y-1.5">
            {(Object.keys(cfg.routinesEnabled) as (keyof typeof cfg.routinesEnabled)[]).map((r) => (
              <label key={r} className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={cfg.routinesEnabled[r]} onChange={(e) => setCfg({ ...cfg, routinesEnabled: { ...cfg.routinesEnabled, [r]: e.target.checked } })} />
                {ko.kb.routines[r].name}
              </label>
            ))}
          </div>
        </div>
        <div className={card}>
          <h3 className="text-sm font-semibold">추천 상품 관리</h3>
          <p className="text-[11px] text-silver">URL 은 unincore.com 도메인만 허용됩니다.</p>
          <div className="mt-2 space-y-2">
            {(Object.keys(cfg.products) as (keyof typeof cfg.products)[]).map((p) => (
              <div key={p} className="grid grid-cols-[auto_180px_1fr] items-center gap-2 text-xs">
                <input type="checkbox" checked={cfg.products[p].enabled} onChange={(e) => setCfg({ ...cfg, products: { ...cfg.products, [p]: { ...cfg.products[p], enabled: e.target.checked } } })} />
                <span>{ko.kb.products[p].name}</span>
                <input value={cfg.products[p].url} onChange={(e) => setCfg({ ...cfg, products: { ...cfg.products, [p]: { ...cfg.products[p], url: e.target.value } } })} className={input} />
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 text-xs text-silver md:grid-cols-2">
            <label>무료 체험 URL<input value={cfg.links.freeTrial} onChange={(e) => setCfg({ ...cfg, links: { ...cfg.links, freeTrial: e.target.value } })} className={input} /></label>
            <label>파트너 문의 URL<input value={cfg.links.partners} onChange={(e) => setCfg({ ...cfg, links: { ...cfg.links, partners: e.target.value } })} className={input} /></label>
          </div>
        </div>
        <div className={card}>
          <h3 className="text-sm font-semibold">추천 알고리즘 관리</h3>
          <label className="mt-2 block max-w-xs text-xs text-silver">관찰값을 '고민'으로 보는 기준 지수 (10~90){num(cfg.recommendation.noticeThreshold, (n) => setCfg({ ...cfg, recommendation: { noticeThreshold: n } }), "1")}</label>
          <p className="mt-1 text-[11px] text-silver/70">낮출수록 더 많은 기능·부위가 추천 근거로 잡힙니다. 민감·붉은 기 우선(진정 버전) 규칙은 안전 규칙이라 변경할 수 없습니다.</p>
        </div>
        <SaveBar />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className={card}>
        <h3 className="text-sm font-semibold">다국어 관리</h3>
        <p className="text-[11px] text-silver">번역 문구는 리소스 파일(src/lib/i18n/locales)에서 관리합니다. 여기서는 노출 언어를 선택합니다. 한국어는 항상 켜져 있습니다.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {LOCALES.map((l) => (
            <label key={l} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs">
              <input type="checkbox" disabled={l === "ko"} checked={cfg.locales.includes(l)} onChange={(e) => setCfg({ ...cfg, locales: e.target.checked ? [...cfg.locales, l] : cfg.locales.filter((x) => x !== l) })} />
              {LOCALE_NAMES[l]}
            </label>
          ))}
        </div>
      </div>
      <div className={card}>
        <h3 className="text-sm font-semibold">개인정보 보관 정책 관리</h3>
        <div className="mt-2 grid max-w-md grid-cols-2 gap-3 text-xs text-silver">
          <label>비회원 세션 만료(분){num(cfg.retention.sessionMinutes, (n) => setCfg({ ...cfg, retention: { ...cfg.retention, sessionMinutes: n } }), "1")}</label>
          <label>기기 내 기록 보관(일){num(cfg.retention.historyDays, (n) => setCfg({ ...cfg, retention: { ...cfg.retention, historyDays: n } }), "1")}</label>
        </div>
        <p className="mt-2 text-[11px] text-silver/70">얼굴 사진은 서버에 저장되지 않습니다(기기 내 처리). 서버에는 익명 이벤트와 텍스트 신고만 있습니다.</p>
        <button
          onClick={async () => { const d = prompt("며칠보다 오래된 익명 이벤트·신고를 삭제할까요?", "365"); if (!d) return; const r = await fetch(`/api/admin/config?olderThanDays=${Number(d)}`, { method: "DELETE" }); setMsg(`삭제된 항목: ${(await r.json()).removed}`); }}
          className="mt-3 rounded-full border border-rose-400/50 px-4 py-1.5 text-xs text-rose-200"
        >
          오래된 서버 로그 삭제
        </button>
      </div>
      <SaveBar />
    </div>
  );
}

function Reports() {
  const [rows, setRows] = useState<StoredReport[] | null>(null);
  const load = useCallback(() => fetch("/api/admin/reports").then((r) => r.json()).then((d) => setRows(d.reports)), []);
  useEffect(() => { load(); }, [load]);
  if (!rows) return <p className="text-sm text-silver">불러오는 중…</p>;
  return (
    <div className={card} data-testid="admin-reports">
      <h3 className="text-sm font-semibold">사용자 신고 및 오류 관리</h3>
      {rows.length === 0 && <p className="mt-2 text-xs text-silver">접수된 신고가 없습니다.</p>}
      <ul className="mt-2 divide-y divide-line">
        {rows.map((r) => (
          <li key={r.id} className="py-2 text-xs">
            <div className="flex items-center justify-between gap-2 text-silver"><span>{r.ts.slice(0, 16).replace("T", " ")} · {r.locale} · {r.context}</span>
              <button onClick={() => fetch("/api/admin/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, status: r.status === "open" ? "resolved" : "open" }) }).then(load)} className={`rounded-full border px-2 py-0.5 ${r.status === "open" ? "border-amber-400/50 text-amber-200" : "border-emerald-400/40 text-emerald-300"}`}>{r.status === "open" ? "미처리" : "처리 완료"}</button>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-white">{r.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Logs() {
  const [rows, setRows] = useState<StoredEvent[] | null>(null);
  useEffect(() => { fetch("/api/admin/logs").then((r) => r.json()).then((d) => setRows(d.events)); }, []);
  if (!rows) return <p className="text-sm text-silver">불러오는 중…</p>;
  return (
    <div className={card} data-testid="admin-logs">
      <h3 className="text-sm font-semibold">분석 로그 (최근 7일 · 최대 300건 · 익명)</h3>
      <div className="mt-2 max-h-[60vh] overflow-auto">
        <table className="w-full text-[11px]">
          <thead className="text-left text-silver"><tr><th className="py-1">시각(UTC)</th><th>이벤트</th><th>세션</th><th>국가</th><th>언어</th><th>속성</th></tr></thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="border-t border-line/60">
                <td className="py-1 pr-2 text-silver">{e.ts.slice(5, 19).replace("T", " ")}</td><td className="pr-2">{e.type}</td><td className="pr-2 text-silver">{e.sid.slice(0, 8)}</td><td>{e.country}</td><td>{e.locale}</td>
                <td className="text-silver">{JSON.stringify(e.props ?? {})}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminApp({ enabled, authed }: { enabled: boolean; authed: boolean }) {
  const [tab, setTab] = useState<Tab>("대시보드");
  if (!authed) return <Login enabled={enabled} />;
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-4 font-display text-sm tracking-[0.25em]">ADMIN</h1>
        {TABS.map((tb) => (
          <button key={tb} onClick={() => setTab(tb)} className={`rounded-full border px-3 py-1.5 text-xs ${tab === tb ? "border-scan bg-scan/15 text-scan2" : "border-line text-silver"}`}>{tb}</button>
        ))}
        <button onClick={() => fetch("/api/admin/logout", { method: "POST" }).then(() => location.reload())} className="ml-auto text-xs text-silver underline">로그아웃</button>
      </div>
      <div className="mt-5">
        {tab === "대시보드" ? <Dashboard /> : tab === "신고·오류" ? <Reports /> : tab === "분석 로그" ? <Logs /> : <Settings tab={tab} />}
      </div>
    </div>
  );
}
