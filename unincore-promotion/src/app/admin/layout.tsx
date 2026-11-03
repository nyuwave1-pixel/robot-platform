import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/lib/admin-auth";
import { DEFAULT_PRODUCTS } from "@/content/products";
import { LogoutButton } from "@/components/admin/LogoutButton";

export const metadata: Metadata = { title: "UNI&CORE Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) return <div className="min-h-screen bg-cream">{children}</div>;
  return (
    <div className="min-h-screen bg-[#F6F3EE] font-sans text-ink">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-3">
          <Link href="/admin" className="font-display text-xl font-semibold">UNI&amp;CORE <span className="text-sm font-sans font-normal text-ink-mute">Promotion CMS</span></Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/admin" className="hover:underline">Dashboard</Link>
            {DEFAULT_PRODUCTS.map((p) => (
              <Link key={p.key} href={`/admin/products/${p.key}`} className="hover:underline">{p.shortName.replace("Vita C ", "")}</Link>
            ))}
            <Link href="/admin/links" className="hover:underline">UTM Links</Link>
            {session.role === "admin" && <Link href="/admin/settings" className="hover:underline">Settings</Link>}
            <span className="rounded-full bg-cream px-2 py-0.5 text-xs">{session.u} · {session.role}</span>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8">{children}</div>
    </div>
  );
}
