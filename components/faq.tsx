'use client';

import { useState } from 'react';
import { FAQS } from '@/lib/site';
import { Reveal } from './reveal';

/**
 * Answers are collapsed with a grid-row transition, never unmounted, so crawlers
 * read the same text that backs the FAQPage structured data in the layout.
 */
export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="rule-b scroll-mt-20 py-20 md:py-28">
      <div className="shell">
        <Reveal>
          <p className="marker">
            <b>06</b> <span>Questions</span>
          </p>
        </Reveal>

        <div className="mt-9 grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
          <Reveal>
            <h2 className="max-w-[14ch] text-[clamp(2rem,4.4vw,3.05rem)] lg:sticky lg:top-24">
              Asked before <em>every</em> first job
            </h2>
          </Reveal>

          <Reveal delay={80}>
            <dl className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
              {FAQS.map((f, i) => {
                const isOpen = open === i;
                return (
                  <div key={f.q}>
                    <dt>
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? null : i)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${i}`}
                        id={`faq-q-${i}`}
                        className="flex w-full cursor-pointer items-start gap-5 py-5 text-left"
                      >
                        <span className="figure shrink-0 pt-1 text-[12px] text-[var(--muted)]">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span
                          className="flex-1 text-[17px] font-semibold leading-snug tracking-[-0.02em] transition-colors duration-200"
                          style={{ color: isOpen ? 'var(--navy)' : 'var(--ink)' }}
                        >
                          {f.q}
                        </span>
                        {/* Plus/minus reads more like a printed index than a chevron. */}
                        <span
                          aria-hidden
                          className="relative mt-2 h-3 w-3 shrink-0"
                          style={{ color: isOpen ? 'var(--navy)' : 'var(--muted)' }}
                        >
                          <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-current" />
                          <span
                            className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-current transition-transform duration-300"
                            style={{ transform: isOpen ? 'scaleY(0)' : 'scaleY(1)' }}
                          />
                        </span>
                      </button>
                    </dt>
                    <dd
                      id={`faq-panel-${i}`}
                      aria-labelledby={`faq-q-${i}`}
                      className="grid transition-[grid-template-rows] duration-300 ease-out"
                      style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                    >
                      <div className="overflow-hidden">
                        <p className="max-w-[64ch] pb-6 pl-10 text-[15px] leading-relaxed text-[var(--muted)]">
                          {f.a}
                        </p>
                      </div>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
