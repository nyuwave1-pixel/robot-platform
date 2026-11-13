import { NextResponse } from "next/server";
import { DEFAULT_CONFIG } from "@/lib/appConfig";
import { isAdmin } from "@/server/auth";
import { loadConfig, saveConfig } from "@/server/config";
import { getStore } from "@/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const store = await getStore();
  return NextResponse.json({ config: await loadConfig(true), defaults: DEFAULT_CONFIG, history: (await store.getKV("config_history")) ?? [] });
}
export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  return NextResponse.json({ config: await saveConfig(body) });
}
/** 보관 정책 실행: 지정 일수보다 오래된 이벤트·신고 삭제 */
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const days = Math.min(3650, Math.max(1, Number(new URL(req.url).searchParams.get("olderThanDays")) || 365));
  const removed = await (await getStore()).purge(new Date(Date.now() - days * 86400_000).toISOString());
  return NextResponse.json({ removed });
}
