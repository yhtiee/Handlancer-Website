import { SITE, CATEGORIES, CITIES } from '@/lib/site';
import { Reveal } from './reveal';
import { LogoMark, IconArrowRight } from './icons';

export function Cta() {
  return (
    <section id="download" className="scroll-mt-20 py-24 md:py-32">
      <div className="shell">
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-end lg:gap-16">
            <div>
              <h2 className="max-w-[16ch] text-[clamp(2.2rem,5.4vw,3.6rem)]">
                Your next repair deserves a receipt, not <em>a leap of faith</em>
              </h2>
              <p className="lede mt-6 max-w-[44ch]">
                We are still building. Put your name down and you will be among the first in when
                HandLancer opens in your city.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <a href="#waitlist" className="btn btn-primary">
                Join the waitlist
                <IconArrowRight className="h-4 w-4" />
              </a>
              <a href="#escrow" className="btn btn-ghost">
                How escrow works
              </a>
            </div>
          </div>
        </Reveal>

        {/* Closing keyword line — genuine coverage detail, set as fine print. */}
        <p className="mt-16 border-t border-[var(--rule)] pt-6 text-[13.5px] leading-relaxed text-[var(--muted)]">
          Find and hire verified{' '}
          {CATEGORIES.slice(0, 8)
            .map((c) => c.label.toLowerCase())
            .join(', ')}{' '}
          professionals and more across {CITIES.slice(0, 8).join(', ')} and every other city in{' '}
          {SITE.country}. Every job escrow-protected, every amount in naira.
        </p>
      </div>
    </section>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  const COLUMNS = [
    {
      h: 'Product',
      links: [
        ['Escrow', '#escrow'],
        ['Services', '#services'],
        ['How it works', '#how'],
        ['Trust & safety', '#trust'],
        ['For artisans', '#earn'],
        ['FAQ', '#faq'],
      ] as [string, string][],
    },
    {
      h: 'Popular trades',
      links: CATEGORIES.slice(0, 6).map((c) => [c.label, '#services'] as [string, string]),
    },
    {
      h: 'Cities',
      links: CITIES.slice(0, 6).map((c) => [c, '#services'] as [string, string]),
    },
  ];

  return (
    <footer className="band border-t border-[var(--rule)] py-14">
      <div className="shell">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-8 w-8" />
              <span className="text-[18px] font-bold tracking-[-0.03em] text-[var(--navy)]">
                HandLancer
              </span>
            </div>
            <p className="mt-4 max-w-[34ch] text-[14px] leading-relaxed text-[var(--muted)]">
              {SITE.shortDescription} Post a job, compare quotes, and pay only for work done.
            </p>
            <a href={`mailto:${SITE.email}`} className="ulink mt-4 inline-block text-[14px]">
              {SITE.email}
            </a>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.h} aria-label={col.h}>
              <h2 className="font-[family-name:var(--font-plex-mono)] text-[11px] font-medium uppercase tracking-[0.13em] text-[var(--muted)]">
                {col.h}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="cursor-pointer text-[14px] text-[var(--muted)] transition-colors duration-200 hover:text-[var(--navy)]"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-[var(--rule)] pt-6 font-[family-name:var(--font-plex-mono)] text-[11.5px] uppercase tracking-[0.1em] text-[var(--muted)] sm:flex-row">
          <p>
            © {year} {SITE.legalName} · Built for {SITE.country}
          </p>
          <p>Payments by Flutterwave · Amounts in naira</p>
        </div>
      </div>
    </footer>
  );
}
