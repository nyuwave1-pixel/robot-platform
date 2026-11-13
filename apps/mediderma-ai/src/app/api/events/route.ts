import { NextResponse } from "next/server";
import { sanitizeEvent } from "@/lib/events";
import { getStore } from "@/server/store";

export const runtime = "nodejs";

/** 익명 이용 통계 수집. IP 는 저장하지 않고 CDN 이 붙여 준 국가 코드만 기록한다. */
export async function POST(req: Request) {
  const text = await req.text();
  if (text.length > 2000) return NextResponse.json({ ok: false }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const ev = sanitizeEvent(body);
  if (!ev) return NextResponse.json({ ok: false }, { status: 400 });
  const country = (req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || "ZZ").slice(0, 2).toUpperCase();
  try {
    await (await getStore()).addEvent(ev, country);
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
