import Link from "next/link";

export const metadata = { title: "Page not found | UNI&CORE", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-ivory px-6 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="mt-4 font-display text-6xl">This page took a skincare break.</h1>
        <p className="mx-auto mt-4 max-w-md text-ink-soft">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">Back to home</Link>
          <Link href="/#shop" className="btn-ghost">Shop the collection</Link>
        </div>
      </div>
    </main>
  );
}
