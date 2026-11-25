export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="container-site max-w-3xl py-16 sm:py-24">
      <p className="eyebrow">UNI&amp;CORE USA</p>
      <h1 className="mt-4 font-display text-5xl sm:text-6xl">{title}</h1>
      <p className="mt-3 text-sm text-ink-mute">Last updated: {updated}</p>
      <div className="mt-10 space-y-5 leading-relaxed text-ink-soft [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:text-ink [&_a]:underline [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
        {children}
      </div>
    </article>
  );
}
