import type { ReactNode } from 'react';
import { Reveal } from './reveal';

export type LegalSection = {
  heading: string;
  paragraphs: ReactNode[];
  list?: ReactNode[];
};

/**
 * Body renderer shared by /privacy and /terms.
 *
 * Numbered sections in the same mono-figure idiom as the escrow steps and the
 * FAQ index, so the legal pages read as part of the same document set rather
 * than a pasted template.
 */
export function LegalBody({
  sections,
  effective,
  note,
}: {
  sections: LegalSection[];
  /** ISO date the version takes effect. */
  effective: string;
  /** Shown above the sections — use it for scope caveats. */
  note?: ReactNode;
}) {
  const effectiveLabel = new Date(effective).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <section className="rule-b scroll-mt-20 py-16 md:py-24">
      <div className="shell">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-[var(--rule)] pb-6 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.13em] text-[var(--muted)]">
          <span>
            Effective <time dateTime={effective}>{effectiveLabel}</time>
          </span>
          <span>Nigeria</span>
        </div>

        {note && (
          <Reveal>
            <aside className="mt-8 max-w-[68ch] border border-[var(--rule-strong)] bg-[var(--band)] px-6 py-5">
              <p className="text-[15px] leading-relaxed text-[var(--ink)]">{note}</p>
            </aside>
          </Reveal>
        )}

        <ol className="mt-12 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
          {sections.map((s, i) => (
            <Reveal as="li" key={s.heading} delay={Math.min(i, 3) * 60}>
              <div className="grid gap-4 py-8 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] md:gap-10">
                <h2 className="flex items-baseline gap-3.5 text-[18px] font-bold leading-snug tracking-[-0.02em] text-[var(--navy)]">
                  <span className="figure shrink-0 text-[12px] text-[var(--muted)]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {s.heading}
                </h2>
                <div>
                  {s.paragraphs.map((p, n) => (
                    <p
                      key={n}
                      className={`max-w-[64ch] text-[15px] leading-relaxed text-[var(--muted)] ${n > 0 ? 'mt-4' : ''}`}
                    >
                      {p}
                    </p>
                  ))}
                  {s.list && (
                    <ul className="mt-5 max-w-[64ch] divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
                      {s.list.map((item, n) => (
                        <li
                          key={n}
                          className="py-3 text-[14.5px] leading-relaxed text-[var(--muted)]"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
