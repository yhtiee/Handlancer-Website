import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CATEGORIES } from '@/lib/site';
import { CITY_PAGES, getCity, isIndexable } from '@/lib/cities';
import { guidesForCity } from '@/lib/guides';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema, jsonLdGraph } from '@/lib/schema';
import { JsonLd } from '@/components/json-ld';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/cta';
import { PageHeader } from '@/components/page-header';
import { CtaCompact } from '@/components/cta-compact';
import { Reveal } from '@/components/reveal';
import { CATEGORY_ICONS, IconGrid, IconArrowRight } from '@/components/icons';

/*
 * City hub. Parent for /[city]/[trade], and the target the footer's city link
 * points at. Only lists trades that cleared the content gate.
 */

export function generateStaticParams() {
  return CITY_PAGES.map((c) => ({ city: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCity(citySlug);
  if (!city) return {};

  return buildMetadata({
    path: `/${city.slug}`,
    title: `Hire verified artisans in ${city.name}, ${city.state} State`,
    description: `${city.name} is HandLancer's first launch city. Local rates, the job types this town actually posts, and every naira held in escrow until the work is done.`,
  });
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: citySlug } = await params;
  const city = getCity(citySlug);
  if (!city) notFound();

  const trades = city.trades
    .filter(isIndexable)
    .map((t) => ({ content: t, category: CATEGORIES.find((c) => c.slug === t.trade) }))
    .filter((x): x is { content: typeof x.content; category: NonNullable<typeof x.category> } =>
      Boolean(x.category),
    );

  const guides = guidesForCity(city.slug);

  const trail = [
    { name: 'Home', path: '/' },
    { name: city.name, path: `/${city.slug}` },
  ];

  return (
    <>
      <Nav />
      <JsonLd graph={jsonLdGraph(breadcrumbSchema(trail))} />
      <main className="flex-1">
        <PageHeader
          marker="01"
          label={`${city.name} · ${city.state} State`}
          title={
            <>
              Artisans in {city.name}, <em>paid on approval</em>.
            </>
          }
          lede={city.blurb}
          trail={trail}
        />

        <section className="rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>02</b> <span>Trades in {city.name}</span>
              </p>
            </Reveal>

            <div className="mt-9 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
              <Reveal>
                <h2 className="max-w-[18ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                  Local rates, <em>local problems</em>
                </h2>
              </Reveal>
              <Reveal delay={80}>
                <p className="lede max-w-[42ch] lg:pt-2">
                  Each of these has its own {city.name} page with real local pricing, the job types
                  this town posts, and questions people here actually ask.
                </p>
              </Reveal>
            </div>

            <div
              className="mt-12 grid gap-px border border-[var(--rule)] sm:grid-cols-2 lg:grid-cols-3"
              style={{ background: 'var(--rule)' }}
            >
              {trades.map(({ category }, i) => {
                const Icon = CATEGORY_ICONS[category.id] ?? IconGrid;
                return (
                  <Reveal key={category.slug} delay={(i % 3) * 60}>
                    <Link
                      href={`/${city.slug}/${category.slug}`}
                      className="group flex h-full flex-col bg-[var(--paper)] p-6 transition-colors duration-200 hover:bg-[var(--band)]"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-[18px] w-[18px] shrink-0 text-[var(--navy)]" />
                        <h3 className="text-[17px]">
                          {category.label} in {city.name}
                        </h3>
                      </div>
                      <p className="mt-2.5 max-w-[34ch] text-[14.5px] leading-relaxed text-[var(--muted)]">
                        {category.blurb}
                      </p>
                    </Link>
                  </Reveal>
                );
              })}
            </div>

            <Reveal>
              <div className="mt-12 border-t border-[var(--rule)] pt-6">
                <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.13em] text-[var(--muted)]">
                  Areas covered
                </p>
                <p className="mt-3 max-w-[62ch] text-[19px] leading-relaxed text-[var(--ink)]">
                  {city.areas.map((area, n) => (
                    <span key={area}>
                      <span className="font-semibold text-[var(--navy)]">{area}</span>
                      {n < city.areas.length - 1 && (
                        <span className="text-[var(--rule-strong)]"> · </span>
                      )}
                    </span>
                  ))}
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {guides.length > 0 && (
          <section className="band rule-b scroll-mt-20 py-20 md:py-28">
            <div className="shell">
              <Reveal>
                <p className="marker">
                  <b>03</b> <span>Reading</span>
                </p>
              </Reveal>
              <Reveal>
                <h2 className="mt-9 max-w-[18ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                  Written for <em>{city.name}</em>
                </h2>
              </Reveal>
              <ul className="mt-12 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
                {guides.map((g, i) => (
                  <Reveal as="li" key={g.meta.slug} delay={i * 70}>
                    <Link
                      href={`/guides/${g.meta.slug}`}
                      className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-6"
                    >
                      <h3 className="text-[19px]">{g.meta.title}</h3>
                      <span className="flex items-center gap-2 text-[14px] text-[var(--muted)]">
                        Read
                        <IconArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </ul>
            </div>
          </section>
        )}

        <CtaCompact
          heading={`${city.name} goes first.`}
          emphasis="Be on the list."
          lede={`We open city by city, and ${city.name} is first. Join the waitlist and we will let you in as soon as we go live.`}
        />
      </main>
      <Footer />
    </>
  );
}
