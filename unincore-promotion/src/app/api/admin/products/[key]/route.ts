import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { productOverrideSchema } from "@/lib/schemas";
import { resetProduct, saveProductOverride } from "@/lib/cms";
import { StorageNotConfiguredError } from "@/lib/storage";
import type { ProductKey } from "@/content/types";

export const runtime = "nodejs";
const KEYS: ProductKey[] = ["ampoule", "mask", "wash"];

type Ctx = { params: Promise<{ key: string }> };

function storageError(err: unknown) {
  if (err instanceof StorageNotConfiguredError) return NextResponse.json({ error: err.message }, { status: 503 });
  console.error(err);
  return NextResponse.json({ error: "Save failed." }, { status: 500 });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminApi("editor");
  if ("error" in auth) return auth.error;
  const { key } = await params;
  if (!KEYS.includes(key as ProductKey)) return NextResponse.json({ error: "Unknown product." }, { status: 404 });

  const parsed = productOverrideSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 422 });
  }
  // Only admins may mark an ASIN as verified or change it.
  if (auth.session.role !== "admin" && (parsed.data.asin !== undefined || parsed.data.asinVerified !== undefined)) {
    delete parsed.data.asin;
    delete parsed.data.asinVerified;
  }
  try {
    await saveProductOverride(key as ProductKey, parsed.data, auth.session.u);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return storageError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminApi("admin");
  if ("error" in auth) return auth.error;
  const { key } = await params;
  if (!KEYS.includes(key as ProductKey)) return NextResponse.json({ error: "Unknown product." }, { status: 404 });
  try {
    await resetProduct(key as ProductKey, auth.session.u);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return storageError(err);
  }
}
