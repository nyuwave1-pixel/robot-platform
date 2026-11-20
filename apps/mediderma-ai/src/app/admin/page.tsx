import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";
import { adminEnabled, isAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "MEDIDERMA AI · ADMIN", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Page() {
  return <AdminApp enabled={adminEnabled()} authed={await isAdmin()} />;
}
