import { NextResponse } from "next/server";
import { adminEnabled, isAdmin } from "@/server/auth";
import { aggregate } from "@/server/stats";
import { getStore } from "@/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!adminEnabled()) return NextResponse.json({ error: "admin_disabled" }, { status: 503 });
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const days = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get("days")) || 30));
  const store = await getStore();
  const events = await store.listEvents(new Date(Date.now() - days * 86400_000).toISOString());
  return NextResponse.json({ days, storage: { kind: store.kind, persistent: store.persistent }, stats: aggregate(events) });
}
