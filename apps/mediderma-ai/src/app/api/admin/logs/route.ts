import { NextResponse } from "next/server";
import { isAdmin } from "@/server/auth";
import { getStore } from "@/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 분석 로그: 최근 익명 이벤트 (사진·점수 없음) */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const events = await (await getStore()).listEvents(new Date(Date.now() - 7 * 86400_000).toISOString(), 300);
  return NextResponse.json({ events: events.reverse() });
}
