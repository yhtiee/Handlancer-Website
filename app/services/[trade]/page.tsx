import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CATEGORIES, SITE } from '@/lib/site';
import { CITY_PAGES, isIndexable } from '@/lib/cities';
import { hasOwnPage, servicesForCategory } from '@/lib/services';
import { guidesForTrade } from '@/lib/guides';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema, jsonLdGraph, serviceSchema } from '@/lib/schema';
import { JsonLd } from '@/components/json-ld';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/cta';
import { PageHeader } from '@/components/page-header';
import { CtaCompact } from '@/components/cta-compact';
import { Reveal } from '@/components/reveal';
import { CATEGORY_ICONS, IconGrid, IconArrowRight } from '@/components/icons';

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ trade: c.slug }));
}

/** Only the twelve slugs above render; anything else 404s. */
export const dynamicParams = false;

function find(trade: string) {
  return CATEGORIES.find((c) => c.slug === trade);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ trade: string }>;
}): Promise<Metadata> {
  const { trade } = await params;
  const category = find(trade);
  if (!category) return {};

  return buildMetadata({
    path: `/services/${category.slug}`,
    title: `Hire a verified ${category.label.toLowerCase()} professional in Nigeria`,
    description: `${category.blurb} Compare itemised quotes from verified ${category.label.toLowerCase()} artisans near you and keep your money in escrow until the work is done.`,
  });
}

export default async function TradePage({ params }: { params: Promise<{ trade: string }> }) {
  const { trade } = await params;
  const category = find(trade);
  if (!category) notFound();

  const path = `/services/${category.slug}`;
  const Icon = CATEGORY_ICONS[category.id] ?? IconGrid;
  const guides = guidesForTrade(category.slug);
  const services = servicesForCategory(category.id);

  // Only cities whose content for this trade clears the gate get linked.
  const cities = CITY_PAGES.filter((city) =>
    isIndexable(city.trades.find((t) => t.trade === category.slug)),
  );

  const otherTrades = CATEGORIES.filter((c) => c.slug !== category.slug).slice(0, 6);

  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: category.label, path },
  ];

  return (
    <>
      <Nav />
      <JsonLd
        graph={jsonLdGraph(
          serviceSchema({ category, path, cities: cities.map((c) => c.name) }),
          breadcrumbSchema(trail),
        )}
      />
      <main className="flex-1">
        <PageHeader
          marker="01"
          label={category.label}
          title={
            <>
              Hire a {category.label.toLowerCase()} professional. Hold the money{' '}
              <em>until it is done</em>.
            </>
          }
          lede={category.demand}
          trail={trail}
        />

        {/* ---- What the trade covers ---- */}
        <section className="rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>02</b> <span>What this covers</span>
              </p>
            </Reveal>

            <div className="mt-9 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
              <Reveal>
                <h2 className="max-w-[18ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                  One job post, <em>several</em> itemised quotes
                </h2>
              </Reveal>
              <Reveal delay={80}>
                <p className="lede max-w-[42ch] lg:pt-2">{category.blurb}</p>
              </Reveal>
            </div>

            <Reveal delay={120}>
              <div className="mt-12 flex items-center gap-3 border-t border-[var(--rule)] pt-6">
                <Icon className="h-[18px] w-[18px] shrink-0 text-[var(--navy)]" />
                <p className="max-w-[62ch] text-[19px] leading-relaxed text-[var(--ink)]">
                  {category.demand}
                </p>
              </div>
            </Reveal>

            {/* The full catalogue for this trade. Services with their own page
                link to it; the rest are listed as plain text. Listing them all
                is the point — it is what stops the category page from being a
                stub, and it is honest about everything we connect people to. */}
            {services.length > 0 && (
              <div className="mt-14 border-t border-[var(--rule)] pt-8">
                <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.13em] text-[var(--muted)]">
                  {services.length} {category.label.toLowerCase()} services
                </p>
                <ul className="mt-6 grid gap-px border border-[var(--rule)] sm:grid-cols-2 lg:grid-cols-3"
                    style={{ background: 'var(--rule)' }}>
                  {services.map((s, i) => {
                    const paged = hasOwnPage(s);
                    const inner = (
                      <>
                        <span className="flex items-baseline justify-between gap-3">
                          <span
                            className={`text-[15px] font-semibold ${paged ? 'text-[var(--navy)]' : 'text-[var(--ink)]'}`}
                          >
                            {s.label}
                          </span>
                          {paged && (
                            <IconArrowRight className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                          )}
                        </span>
                        <span className="mt-1.5 block max-w-[38ch] text-[13.5px] leading-relaxed text-[var(--muted)]">
                          {s.blurb}
                        </span>
                      </>
                    );
                    return (
                      <Reveal key={s.slug} delay={(i % 3) * 40}>
                        <li className="h-full list-none">
                          {paged ? (
                            <Link
                              href={`/services/${category.slug}/${s.slug}`}
                              className="flex h-full flex-col bg-[var(--paper)] p-5 transition-colors duration-200 hover:bg-[var(--band)]"
                            >
                              {inner}
                            </Link>
                          ) : (
                            <div className="flex h-full flex-col bg-[var(--paper)] p-5">{inner}</div>
                          )}
                        </li>
                      </Reveal>
                    );
                  })}
                </ul>
                <p className="mt-5 max-w-[58ch] text-[14px] leading-relaxed text-[var(--muted)]">
                  Not seeing yours? Post the job anyway — {SITE.name} matches on what you describe,
                  not on a fixed menu, and artisans list their own skills.
                </p>
              </div>
            )}

            <div className="mt-14 grid gap-x-10 gap-y-8 border-t border-[var(--rule)] sm:grid-cols-3">
              {[
                [
                  'Itemised quotes',
                  'Every line is labelled material or labour, so you see what you are paying for before you fund anything.',
                ],
                [
                  'Money held in escrow',
                  'Materials are released so work can start. The workmanship stays locked until you have signed the job off.',
                ],
                [
                  'Verified artisans',
                  'Public profiles with ratings that can only be left by a customer who actually hired and paid through the platform.',
                ],
              ].map(([t, d], n) => (
                <Reveal key={t} delay={n * 70}>
                  <div className="pt-6">
                    <h3 className="text-[16.5px]">{t}</h3>
                    <p className="mt-2 max-w-[38ch] text-[14.5px] leading-relaxed text-[var(--muted)]">
                      {d}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---- Cities with real local content ---- */}
        {cities.length > 0 && (
          <section className="band rule-b scroll-mt-20 py-20 md:py-28">
            <div className="shell">
              <Reveal>
                <p className="marker">
                  <b>03</b> <span>Where we have launched</span>
                </p>
              </Reveal>

              <div className="mt-9 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
                <Reveal>
                  <h2 className="max-w-[17ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                    Local rates, <em>local problems</em>
                  </h2>
                </Reveal>
                <Reveal delay={80}>
                  <p className="lede max-w-[42ch] lg:pt-2">
                    We only publish a city page once we have real local pricing and the job types
                    that city actually posts. Right now that means {SITE.country}&rsquo;s first
                    HandLancer city.
                  </p>
                </Reveal>
              </div>

              <ul className="mt-12 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
                {cities.map((city, i) => (
                  <Reveal as="li" key={city.slug} delay={i * 70}>
                    <Link
                      href={`/${city.slug}/${category.slug}`}
                      className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-6"
                    >
                      <span className="text-[19px] font-bold tracking-[-0.02em] text-[var(--navy)]">
                        {category.label} in {city.name}
                      </span>
                      <span className="flex items-center gap-2 text-[14px] text-[var(--muted)] transition-colors duration-200 group-hover:text-[var(--ink)]">
                        {city.state} State
                        <IconArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ---- Related guides ---- */}
        {guides.length > 0 && (
          <section className="rule-b scroll-mt-20 py-20 md:py-28">
            <div className="shell">
              <Reveal>
                <p className="marker">
                  <b>04</b> <span>Reading</span>
                </p>
              </Reveal>

              <Reveal>
                <h2 className="mt-9 max-w-[18ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                  Before you hire <em>anyone</em>
                </h2>
              </Reveal>

              <ul className="mt-12 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
                {guides.map((g, i) => (
                  <Reveal as="li" key={g.meta.slug} delay={i * 70}>
                    <Link href={`/guides/${g.meta.slug}`} className="group block py-6">
                      <h3 className="text-[19px] transition-colors duration-200">{g.meta.title}</h3>
                      <p className="mt-2 max-w-[62ch] text-[14.5px] leading-relaxed text-[var(--muted)]">
                        {g.meta.description}
                      </p>
                    </Link>
                  </Reveal>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ---- Other trades ---- */}
        <section className="rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>{guides.length > 0 ? '05' : '04'}</b> <span>Other trades</span>
              </p>
            </Reveal>
            <Reveal>
              <h2 className="mt-9 max-w-[18ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                Twelve trades, <em>one</em> job post
              </h2>
            </Reveal>
            <div
              className="mt-12 grid gap-px border border-[var(--rule)] sm:grid-cols-2 lg:grid-cols-3"
              style={{ background: 'var(--rule)' }}
            >
              {otherTrades.map((c, i) => {
                const OtherIcon = CATEGORY_ICONS[c.id] ?? IconGrid;
                return (
                  <Reveal key={c.id} delay={(i % 3) * 60}>
                    <Link
                      href={`/services/${c.slug}`}
                      className="group flex h-full flex-col bg-[var(--paper)] p-6 transition-colors duration-200 hover:bg-[var(--band)]"
                    >
                      <div className="flex items-center gap-2.5">
                        <OtherIcon className="h-[18px] w-[18px] shrink-0 text-[var(--navy)]" />
                        <h3 className="text-[17px]">{c.label}</h3>
                      </div>
                      <p className="mt-2.5 max-w-[34ch] text-[14.5px] leading-relaxed text-[var(--muted)]">
                        {c.blurb}
                      </p>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <CtaCompact
          heading={`Need ${category.label.toLowerCase()} work done?`}
          emphasis="Get in first."
          lede="We are still building. Put your name down and you will be among the first in when HandLancer opens in your city."
        />
      </main>
      <Footer />
    </>
  );
}
