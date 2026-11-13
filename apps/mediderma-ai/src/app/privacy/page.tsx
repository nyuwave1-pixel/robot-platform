"use client";
import { useI18n } from "@/lib/i18n";

export default function Privacy() {
  const { t } = useI18n();
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-light">{t.privacy.title}</h1>
      <p className="mt-1 text-xs text-silver">{t.privacy.updated}</p>
      <div className="mt-6 space-y-6">
        {t.privacy.sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-base font-semibold">{s.h}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-silver">{s.p}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
