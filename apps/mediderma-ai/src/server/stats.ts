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
  let started = 0, rejected = 0, succeeded = 0, failed = 0, retake = 0, trial = 0, partner = 0, saved = 0, compares = 0, sims = 0, visits = 0, aiInsights = 0, videoPlays = 0;
  for (const e of events) {
    const day = e.ts.slice(0, 10);
    (countries[e.country] ??= new Set()).add(e.sid);
    (locales[e.locale] ??= new Set()).add(e.sid);
    const d = (daily[day] ??= { started: 0, users: new Set(), succeeded: 0 });
    switch (e.type) {
      case "visit": visits++; break;
      case "analysis_started": started++; d.started++; d.users.add(e.sid); break;
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
    countries: top(Object.fromEntries(Object.entries(countries).map(([k, v]) => [k, v.size])), 30),
    locales: top(Object.fromEntries(Object.entries(locales).map(([k, v]) => [k, v.size]))),
  };
}
export type Stats = ReturnType<typeof aggregate>;
