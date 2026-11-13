import { NextResponse } from "next/server";
import { isAdmin } from "@/server/auth";
import { getStore } from "@/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ reports: await (await getStore()).listReports() });
}
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { id?: number; status?: string };
  if (typeof b.id !== "number" || (b.status !== "open" && b.status !== "resolved")) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  await (await getStore()).setReportStatus(b.id, b.status);
  return NextResponse.json({ ok: true });
}
