import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { settingsSchema } from "@/lib/schemas";
import { saveSettings } from "@/lib/cms";
import { StorageNotConfiguredError } from "@/lib/storage";

export const runtime = "nodejs";

export async function PUT(req: NextRequest) {
  const auth = await requireAdminApi("admin");
  if ("error" in auth) return auth.error;
  const parsed = settingsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 422 });
  }
  try {
    await saveSettings(parsed.data, auth.session.u);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof StorageNotConfiguredError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Save failed." }, { status: 500 });
  }
}
