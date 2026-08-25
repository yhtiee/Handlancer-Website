import Link from 'next/link';
import { SITE, SOCIALS, CATEGORIES } from '@/lib/site';
import { CITY_PAGES, isIndexable } from '@/lib/cities';
import { Reveal } from './reveal';
import { LogoMark, IconArrowRight, SOCIAL_ICONS } from './icons';

export function Cta() {
  const launchCity = CITY_PAGES[0];

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
              <Link href="/#waitlist" className="btn btn-primary">
                Join the waitlist
                <IconArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/#escrow" className="btn btn-ghost">
                How escrow works
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Closing line — real trades, linked, and honest about where we have
            actually launched. It used to claim eight cities plus "every other
            city in Nigeria" for a product that is live in none of them. */}
        <p className="mt-16 border-t border-[var(--rule)] pt-6 text-[13.5px] leading-relaxed text-[var(--muted)]">
          Hire verified{' '}
          {CATEGORIES.slice(0, 8).map((c, i, arr) => (
            <span key={c.slug}>
              <Link href={`/services/${c.slug}`} className="hover:text-[var(--navy)]">
                {c.label.toLowerCase()}
              </Link>
              {i < arr.length - 1 ? ', ' : ''}
            </span>
          ))}{' '}
          professionals and more.{' '}
          {launchCity ? (
            <>
              We open city by city, starting with{' '}
              <Link href={`/${launchCity.slug}`} className="hover:text-[var(--navy)]">
                {launchCity.name}, {launchCity.state} State
              </Link>
              .
            </>
          ) : (
            <>We open city by city.</>
          )}{' '}
          Every job escrow-protected, every amount in naira.
        </p>
      </div>
    </section>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  /*
   * Every href below resolves to a real, individually indexable page or to a
   * rooted homepage anchor that works from any route.
   *
   * The old "Cities" column listed six cities that all pointed at `#services`.
   * Links that pretend to be city pages are worse than no links: they promise a
   * destination that does not exist. It is now cut down to the cities that have
   * genuine local content — see lib/cities.ts for the gate that decides that.
   */
  const cityLinks: [string, string][] = CITY_PAGES.flatMap((city) => {
    const trades = city.trades
      .filter(isIndexable)
      .map((t) => CATEGORIES.find((c) => c.slug === t.trade))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .slice(0, 5);

    return [
      [`${city.name} overview`, `/${city.slug}`] as [string, string],
      ...trades.map(
        (c) => [`${c.label} in ${city.name}`, `/${city.slug}/${c.slug}`] as [string, string],
      ),
    ];
  });

  const COLUMNS = [
    {
      h: 'Product',
      links: [
        ['Escrow', '/#escrow'],
        ['Services', '/services'],
        ['How it works', '/#how'],
        ['Trust & safety', '/#trust'],
        ['For artisans', '/for-artisans'],
        ['Guides', '/guides'],
        ['FAQ', '/#faq'],
      ] as [string, string][],
    },
    {
      h: 'Popular trades',
      links: CATEGORIES.slice(0, 6).map(
        (c) => [c.label, `/services/${c.slug}`] as [string, string],
      ),
    },
    {
      h: CITY_PAGES.length === 1 ? `In ${CITY_PAGES[0].name}` : 'Cities',
      links: cityLinks,
    },
    {
      h: 'Company',
      links: [
        ['About', '/about'],
        ['Contact', '/contact'],
        ['Privacy', '/privacy'],
        ['Terms', '/terms'],
      ] as [string, string][],
    },
  ];

  return (
    <footer className="band border-t border-[var(--rule)] py-14">
      <div className="shell">
        {/* Four link columns now, so the brand block gets its own row below md
            rather than being squeezed. */}
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div className="sm:col-span-2 md:col-span-4 lg:col-span-1">
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

            {/* Same list the Organization `sameAs` is built from — see
                lib/site.ts. Plain <a>, not next/link: these leave the app, so
                there is nothing for the router to prefetch. */}
            {SOCIALS.length > 0 && (
              <ul aria-label="HandLancer on social media" className="mt-5 flex items-center gap-3">
                {SOCIALS.map((s) => {
                  const Icon = SOCIAL_ICONS[s.icon];
                  return (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="me noopener noreferrer"
                        aria-label={`${SITE.name} on ${s.label}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--rule)] text-[var(--muted)] transition-colors duration-200 hover:border-[var(--navy)] hover:text-[var(--navy)]"
                      >
                        <Icon className="h-[17px] w-[17px]" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {COLUMNS.map((col) => (
            /* A <p>, not a heading: these are 11px column labels, and the
               surrounding <nav aria-label> already names the region. As <h2>
               they injected four extra top-level headings into the outline of
               every page. */
            <nav key={col.h} aria-label={col.h}>
              <p className="font-[family-name:var(--font-plex-mono)] text-[11px] font-medium uppercase tracking-[0.13em] text-[var(--muted)]">
                {col.h}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, href]) => {
                  const className =
                    'cursor-pointer text-[14px] text-[var(--muted)] transition-colors duration-200 hover:text-[var(--navy)]';
                  return (
                    <li key={label}>
                      <Link href={href} className={className}>
                        {label}
                      </Link>
                    </li>
                  );
                })}
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
