import "server-only";
import type { StoredEvent } from "./store";

const inc = (m: Record<string, number>, k: string | undefined, n = 1) => {
  if (!k) return;
  m[k] = (m[k] ?? 0) + n;
};
const top = (m: Record<string, number>, n = 12) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n).map(([key, count]) => ({ key, count }));

export function aggregate(events: StoredEvent[]) {
  const daily: Record<string, { started: number; users: Set<string>; succeeded: number }> = {};
  const failReasons: Record<string, number> = {};
  const concerns: Record<string, number> = {};
  const routines: Record<string, number> = {};
  const techs: Record<string, number> = {};
  const products: Record<string, number> = {};
  const formats: Record<string, number> = {};
  const countries: Record<string, Set<string>> = {};
  const locales: Record<string, Set<string>> = {};
  const sidSucceeded = new Set<string>();
  const sidTrial = new Set<string>();
  // 확장 측정: 이용 흐름(세션 단위), 기기·유입 경로, 자기 응답 프로필, 기술 관심도, 시간대
  const FUNNEL = ["visit", "consent_given", "profile_done", "photo_selected", "analysis_started", "analysis_succeeded", "report_viewed", "action"] as const;
  const funnel: Record<(typeof FUNNEL)[number], Set<string>> = Object.fromEntries(FUNNEL.map((k) => [k, new Set<string>()])) as never;
  const ACTIONS = new Set(["trial_click", "product_click", "partner_click", "share_click", "report_saved", "history_saved"]);
  const devices: Record<string, number> = {};
  const sources: Record<string, number> = {};
  const ages: Record<string, number> = {};
  const skins: Record<string, number> = {};
  const who: Record<string, number> = {};
  const captures: Record<string, number> = {};
  const techViews: Record<string, number> = {};
  const ctas: Record<string, number> = {};
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
  let consents = 0, historyOptIn = 0, shares = 0;
  let started = 0, rejected = 0, succeeded = 0, failed = 0, retake = 0, trial = 0, partner = 0, saved = 0, compares = 0, sims = 0, visits = 0, aiInsights = 0, videoPlays = 0;
  for (const e of events) {
    const day = e.ts.slice(0, 10);
    (countries[e.country] ??= new Set()).add(e.sid);
    (locales[e.locale] ??= new Set()).add(e.sid);
    const d = (daily[day] ??= { started: 0, users: new Set(), succeeded: 0 });
    if ((FUNNEL as readonly string[]).includes(e.type)) funnel[e.type as (typeof FUNNEL)[number]].add(e.sid);
    if (ACTIONS.has(e.type)) funnel.action.add(e.sid);
    const pr = e.props ?? {};
    switch (e.type) {
      case "visit": visits++; inc(devices, pr.device ?? "unknown"); inc(sources, pr.source ?? "direct"); break;
      case "consent_given": consents++; if (pr.history) historyOptIn++; break;
      case "profile_done": inc(ages, pr.age); inc(skins, pr.skin); inc(who, pr.who); break;
      case "photo_selected": inc(captures, pr.source); break;
      case "tech_view": for (const t of pr.tech ?? []) inc(techViews, t); break;
      case "cta_click": inc(ctas, pr.place); break;
      case "share_click": shares++; break;
      case "analysis_started": {
        started++; d.started++; d.users.add(e.sid);
        // 한국 시간 기준 시간대 (UTC+9)
        hours[(new Date(e.ts).getUTCHours() + 9) % 24].count++;
        break;
      }
      case "upload_rejected": rejected++; inc(failReasons, e.props?.reason); break;
      case "analysis_failed": failed++; inc(failReasons, `error:${e.props?.reason ?? "unknown"}`); break;
      case "analysis_succeeded":
        succeeded++; d.succeeded++; sidSucceeded.add(e.sid);
        if (e.props?.needsRetake) retake++;
        for (const c of e.props?.concerns ?? []) inc(concerns, c);
        break;
      case "care_selected": inc(routines, e.props?.routine); for (const t of e.props?.tech ?? []) inc(techs, t); break;
      case "product_click": inc(products, e.props?.product); break;
      case "trial_click": trial++; sidTrial.add(e.sid); break;
      case "partner_click": partner++; break;
      case "report_saved": saved++; inc(formats, e.props?.format); break;
      case "compare_run": compares++; break;
      case "simulation_viewed": sims++; break;
      case "ai_insight": aiInsights++; break;
      case "video_play": videoPlays++; break;
    }
  }
  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null);
  const trialConverted = [...sidTrial].filter((s) => sidSucceeded.has(s)).length;
  return {
    totals: { visits, started, rejected, succeeded, failed, needsRetake: retake, trialClicks: trial, partnerClicks: partner, reportSaved: saved, compares, simulations: sims, aiInsights, videoPlays, productClicks: Object.values(products).reduce((a, b) => a + b, 0) },
    rates: {
      /** 업로드 성공률 = 품질 검사를 통과한 비율 */
      uploadSuccess: pct(started - rejected - failed, started),
      analysisSuccess: pct(succeeded, started),
      /** 무료 체험 전환율 = 분석 성공 세션 중 체험 링크를 누른 세션 비율 */
      trialConversion: pct(trialConverted, sidSucceeded.size),
    },
    daily: Object.entries(daily).sort((a, b) => a[0].localeCompare(b[0])).map(([day, v]) => ({ day, started: v.started, users: v.users.size, succeeded: v.succeeded })),
    failReasons: top(failReasons),
    concerns: top(concerns),
    routines: top(routines),
    techs: top(techs),
    products: top(products),
    formats: top(formats),
    funnel: (() => {
      // 단계는 순서대로만 지나갈 수 있으므로, 뒤 단계에 도달한 세션은 앞 단계도 지난 것으로 센다
      // (확장 측정 이전에 쌓인 세션이 비율을 왜곡하지 않도록). 후속 행동은 분석에 성공한 세션만 센다.
      const reach = new Map<string, number>();
      FUNNEL.slice(0, -1).forEach((step, i) => funnel[step].forEach((sid) => reach.set(sid, Math.max(reach.get(sid) ?? -1, i))));
      const succIdx = FUNNEL.indexOf("analysis_succeeded");
      funnel.action.forEach((sid) => { if ((reach.get(sid) ?? -1) >= succIdx) reach.set(sid, FUNNEL.length - 1); });
      const counts = FUNNEL.map((_, i) => [...reach.values()].filter((r) => r >= i).length);
      return FUNNEL.map((step, i) => ({ step, sessions: counts[i], fromPrev: i === 0 ? null : pct(counts[i], counts[i - 1]), fromVisit: pct(counts[i], counts[0]) }));
    })(),
    consent: { total: consents, historyOptInRate: pct(historyOptIn, consents) },
    shares,
    devices: top(devices),
    sources: top(sources, 15),
    ages: top(ages),
    skins: top(skins),
    who: top(who),
    captures: top(captures),
    techViews: top(techViews),
    ctas: top(ctas),
    hours,
    countries: top(Object.fromEntries(Object.entries(countries).map(([k, v]) => [k, v.size])), 30),
    locales: top(Object.fromEntries(Object.entries(locales).map(([k, v]) => [k, v.size]))),
  };
}
export type Stats = ReturnType<typeof aggregate>;
