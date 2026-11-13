import { NextResponse } from "next/server";
import type { AiInsightRequest } from "@/lib/aiInsight";
import { loadConfig } from "@/server/config";
import { GeminiError, generateInsight, geminiConfigured } from "@/server/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY = 600_000; // base64 JPEG(≤640px) + 지수 요약
const hits = new Map<string, number[]>();

/**
 * Gemini 해설 (선택 기능). 조건: 관리자 설정 enabled + 유료 등급 확인 + 서버 키 + 요청의 명시적 동의.
 * 이미지는 Gemini 로 전달만 하고 저장·로그하지 않는다.
 */
export async function POST(req: Request) {
  const cfg = await loadConfig().catch(() => null);
  if (!cfg?.aiInsight.enabled || !cfg.aiInsight.paidTierConfirmed || !geminiConfigured()) return NextResponse.json({ error: "disabled" }, { status: 503 });
  const text = await req.text();
  if (text.length > MAX_BODY) return NextResponse.json({ error: "too_large" }, { status: 413 });
  let body: AiInsightRequest;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (body?.consent !== true) return NextResponse.json({ error: "consent_required" }, { status: 400 });
  if (typeof body.imageBase64 !== "string" || !/^[A-Za-z0-9+/=]{2000,}$/.test(body.imageBase64) || !body.imageBase64.startsWith("/9j/")) return NextResponse.json({ error: "bad_image" }, { status: 400 });
  if (!body.indices || typeof body.indices !== "object") return NextResponse.json({ error: "bad_request" }, { status: 400 });
  // 세션·IP 당 분당 4회 (프로세스 메모리 기준)
  const who = `${req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local"}:${String(body.sid).slice(0, 40)}`;
  const now = Date.now();
  const recent = (hits.get(who) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= 4) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  hits.set(who, [...recent, now]);
  if (hits.size > 5000) hits.clear();
  try {
    const insight = await generateInsight({
      consent: true,
      locale: String(body.locale).slice(0, 5),
      sid: "",
      imageBase64: body.imageBase64,
      indices: {
        categories: Object.fromEntries(Object.entries(body.indices.categories ?? {}).filter(([, v]) => v === null || typeof v === "number").slice(0, 12)),
        topConcerns: (Array.isArray(body.indices.topConcerns) ? body.indices.topConcerns : []).slice(0, 5).map((c) => ({ metric: String(c.metric).slice(0, 30), zone: String(c.zone).slice(0, 30), severity: Number(c.severity) || 0 })),
        zones: (Array.isArray(body.indices.zones) ? body.indices.zones : []).slice(0, 14).map((z) => ({ zone: String(z.zone).slice(0, 30), conditionIndex: typeof z.conditionIndex === "number" ? z.conditionIndex : null })),
      },
      routines: (Array.isArray(body.routines) ? body.routines : []).slice(0, 3).map((r) => String(r).slice(0, 30)),
    });
    return NextResponse.json({ insight }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const err = e instanceof GeminiError ? e : new GeminiError("upstream");
    return NextResponse.json({ error: err.code }, { status: err.status });
  }
}
