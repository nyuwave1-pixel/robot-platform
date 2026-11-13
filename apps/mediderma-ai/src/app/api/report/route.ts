import { NextResponse } from "next/server";
import { getStore } from "@/server/store";

export const runtime = "nodejs";

/** 사용자 오류 신고 (텍스트만. 이미지는 받지 않는다) */
export async function POST(req: Request) {
  const text = await req.text();
  if (text.length > 4000) return NextResponse.json({ ok: false }, { status: 413 });
  try {
    const b = JSON.parse(text) as Record<string, unknown>;
    const message = typeof b.message === "string" ? b.message.trim().slice(0, 1000) : "";
    if (message.length < 3) return NextResponse.json({ ok: false }, { status: 400 });
    await (await getStore()).addReport({
      sid: typeof b.sid === "string" ? b.sid.replace(/[^\w-]/g, "").slice(0, 40) : "",
      locale: typeof b.locale === "string" ? b.locale.slice(0, 5) : "ko",
      message,
      context: typeof b.context === "string" ? b.context.slice(0, 500) : "",
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
