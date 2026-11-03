import { redirect } from "next/navigation";
import { getCmsFresh } from "@/lib/cms";
import { getSession } from "@/lib/admin-auth";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  const session = await getSession();
  if (session?.role !== "admin") redirect("/admin");
  const { settings } = await getCmsFresh();
  return <SettingsForm settings={settings} capiEnabled={Boolean(process.env.META_CAPI_ACCESS_TOKEN)} />;
}
