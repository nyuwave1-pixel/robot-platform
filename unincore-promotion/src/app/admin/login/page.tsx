import { LoginForm } from "@/components/admin/LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
        <p className="font-display text-2xl font-semibold">UNI&amp;CORE</p>
        <p className="mt-1 text-sm text-ink-mute">Promotion CMS sign in</p>
        <LoginForm next={safeNext} />
      </div>
    </main>
  );
}
