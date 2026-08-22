import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CATEGORIES } from '@/lib/site';
import { allCityTradePairs, getCity, getCityTrade, isIndexable } from '@/lib/cities';
import { guidesForCity, guidesForTrade } from '@/lib/guides';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema, faqPageSchema, jsonLdGraph, serviceSchema } from '@/lib/schema';
import { JsonLd } from '@/components/json-ld';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/cta';
import { PageHeader } from '@/components/page-header';
import { CtaCompact } from '@/components/cta-compact';
import { Reveal } from '@/components/reveal';
import { IconArrowRight, IconCheck } from '@/components/icons';

/*
 * City x trade pages.
 *
 * Pages are generated for every city/trade pair that has a content entry, but
 * a pair that does not clear lib/cities.ts `isIndexable()` renders `noindex`
 * and is excluded from the sitemap. Thin templated pages where only the city
 * name changes get filtered out as doorway pages and drag the domain down, so
 * the gate is enforced here rather than trusted to reviewers.
 */

export function generateStaticParams() {
  return allCityTradePairs().map(({ city, content }) => ({
    city: city.slug,
    trade: content.trade,
  }));
}

/** Closed allowlist: /lagos/plumbing and friends 404 rather than render empty. */
export const dynamicParams = false;

const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; trade: string }>;
}): Promise<Metadata> {
  const { city: citySlug, trade: tradeSlug } = await params;
  const city = getCity(citySlug);
  const category = CATEGORIES.find((c) => c.slug === tradeSlug);
  const content = getCityTrade(citySlug, tradeSlug);
  if (!city || !category || !content) return {};

  const indexable = isIndexable(content);

  return buildMetadata({
    path: `/${city.slug}/${category.slug}`,
    title: `${category.label} in ${city.name} — verified artisans, escrow-protected`,
    description: `What ${category.label.toLowerCase()} work costs in ${city.name}, ${city.state} State, the jobs people here actually post, and how to compare itemised quotes with your money held in escrow.`,
    // The gate: no unique local content, no place in the index.
    noindex: !indexable,
  });
}

export default async function CityTradePage({
  params,
}: {
  params: Promise<{ city: string; trade: string }>;
}) {
  const { city: citySlug, trade: tradeSlug } = await params;
  const city = getCity(citySlug);
  const category = CATEGORIES.find((c) => c.slug === tradeSlug);
  const content = getCityTrade(citySlug, tradeSlug);
  if (!city || !category || !content) notFound();

  const path = `/${city.slug}/${category.slug}`;
  const indexable = isIndexable(content);
  const guides = [...guidesForTrade(category.slug), ...guidesForCity(city.slug)].filter(
    (g, i, arr) => arr.findIndex((x) => x.meta.slug === g.meta.slug) === i,
  );

  const siblingTrades = city.trades
    .filter((t) => t.trade !== category.slug && isIndexable(t))
    .map((t) => CATEGORIES.find((c) => c.slug === t.trade))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .slice(0, 6);

  const trail = [
    { name: 'Home', path: '/' },
    { name: city.name, path: `/${city.slug}` },
    { name: category.label, path },
  ];

  return (
    <>
      <Nav />
      {/* Schema is only emitted for pages that cleared the gate — describing a
          thin page in rich structured data is exactly the wrong move. */}
      {indexable && (
        <JsonLd
          graph={jsonLdGraph(
            serviceSchema({ category, path, cities: [city.name] }),
            faqPageSchema(content.faqs, path),
            breadcrumbSchema(trail),
          )}
        />
      )}
      <main className="flex-1">
        <PageHeader
          marker="01"
          label={`${category.label} · ${city.name}`}
          title={
            <>
              {category.label} in {city.name}, <em>done properly</em>.
            </>
          }
          lede={content.localNote}
          trail={trail}
        />

        {/* ---- Local price band ---- */}
        <section className="band rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>02</b> <span>What it costs here</span>
              </p>
            </Reveal>

            <div className="mt-9 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
              <Reveal>
                <h2 className="max-w-[18ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                  {city.name} rates, <em>not national averages</em>
                </h2>
              </Reveal>
              <Reveal delay={80}>
                <p className="lede max-w-[42ch] lg:pt-2">{city.blurb}</p>
              </Reveal>
            </div>

            <Reveal delay={120}>
              <div className="mt-12 border border-[var(--rule-strong)] bg-[var(--paper)]">
                <div className="border-b border-[var(--rule)] px-6 py-4">
                  <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.13em] text-[var(--muted)]">
                    Typical {category.label.toLowerCase()} job · {city.name}
                  </p>
                </div>
                <div className="px-6 py-7">
                  <p className="figure text-[clamp(1.9rem,5vw,2.6rem)] font-semibold leading-none text-[var(--navy)]">
                    {naira(content.priceBand.low)} &ndash; {naira(content.priceBand.high)}
                  </p>
                  <p className="mt-3 font-[family-name:var(--font-plex-mono)] text-[11.5px] uppercase tracking-[0.12em] text-[var(--muted)]">
                    {content.priceBand.unit}
                  </p>
                  <p className="mt-5 max-w-[58ch] text-[14px] leading-relaxed text-[var(--muted)]">
                    Indicative only. Materials are quoted as separate line items, which is what lets
                    you release the materials money early and keep the workmanship in escrow until
                    the job is signed off. Always compare several itemised quotes rather than
                    treating any single figure as the price.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---- Local job types ---- */}
        <section className="rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>03</b> <span>What {city.name} posts</span>
              </p>
            </Reveal>

            <div className="mt-9 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
              <Reveal>
                <h2 className="max-w-[19ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                  The jobs that come up <em>here</em>
                </h2>
              </Reveal>
              <Reveal delay={80}>
                <p className="lede max-w-[42ch] lg:pt-2">
                  Not a generic list. These are the {category.label.toLowerCase()} jobs {city.name}{' '}
                  households actually post, shaped by how this town is built and what the weather
                  does to it.
                </p>
              </Reveal>
            </div>

            <ul className="mt-12 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
              {content.jobTypes.map((job, i) => (
                <Reveal as="li" key={job} delay={Math.min(i, 3) * 60}>
                  <div className="flex items-start gap-4 py-5">
                    <IconCheck className="mt-1 h-4 w-4 shrink-0 text-[var(--navy)]" />
                    <span className="max-w-[62ch] text-[16px] leading-relaxed text-[var(--ink)]">
                      {job}
                    </span>
                  </div>
                </Reveal>
              ))}
            </ul>

            <Reveal>
              <div className="mt-10 border-t border-[var(--rule)] pt-6">
                <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.13em] text-[var(--muted)]">
                  Areas covered
                </p>
                <p className="mt-3 max-w-[62ch] text-[17px] leading-relaxed text-[var(--ink)]">
                  {city.areas.map((area, n) => (
                    <span key={area}>
                      <span className="font-semibold text-[var(--navy)]">{area}</span>
                      {n < city.areas.length - 1 && (
                        <span className="text-[var(--rule-strong)]"> · </span>
                      )}
                    </span>
                  ))}
                </p>
                <p className="mt-3 max-w-[52ch] text-[14.5px] text-[var(--muted)]">
                  Providers set their own service radius, so you only ever see artisans who actually
                  cover your street.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---- Local FAQ ---- */}
        <section className="band rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>04</b> <span>Questions</span>
              </p>
            </Reveal>

            <div className="mt-9 grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
              <Reveal>
                <h2 className="max-w-[15ch] text-[clamp(2rem,4.4vw,3.05rem)] lg:sticky lg:top-24">
                  Asked in <em>{city.name}</em>
                </h2>
              </Reveal>

              <Reveal delay={80}>
                <dl className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
                  {content.faqs.map((f, i) => (
                    <div key={f.q} className="py-6">
                      <dt className="flex items-start gap-5">
                        <span className="figure shrink-0 pt-1 text-[12px] text-[var(--muted)]">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <h3 className="text-[17px] font-semibold leading-snug tracking-[-0.02em]">
                          {f.q}
                        </h3>
                      </dt>
                      <dd className="mt-3 max-w-[64ch] pl-10 text-[15px] leading-relaxed text-[var(--muted)]">
                        {f.a}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---- Internal links ---- */}
        <section className="rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>05</b> <span>Keep reading</span>
              </p>
            </Reveal>

            <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-16">
              <Reveal>
                <h3 className="text-[16.5px]">Other trades in {city.name}</h3>
                <ul className="mt-4 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
                  {siblingTrades.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/${city.slug}/${c.slug}`}
                        className="flex items-center justify-between gap-4 py-3.5 text-[15px] text-[var(--muted)] transition-colors duration-200 hover:text-[var(--navy)]"
                      >
                        {c.label} in {city.name}
                        <IconArrowRight className="h-4 w-4 shrink-0" />
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href={`/services/${category.slug}`}
                      className="flex items-center justify-between gap-4 py-3.5 text-[15px] font-semibold text-[var(--navy)]"
                    >
                      {category.label} across {'Nigeria'}
                      <IconArrowRight className="h-4 w-4 shrink-0" />
                    </Link>
                  </li>
                </ul>
              </Reveal>

              {guides.length > 0 && (
                <Reveal delay={80}>
                  <h3 className="text-[16.5px]">Guides</h3>
                  <ul className="mt-4 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
                    {guides.map((g) => (
                      <li key={g.meta.slug}>
                        <Link href={`/guides/${g.meta.slug}`} className="block py-3.5">
                          <span className="text-[15px] font-semibold text-[var(--navy)]">
                            {g.meta.title}
                          </span>
                          <span className="mt-1 block max-w-[46ch] text-[13.5px] leading-relaxed text-[var(--muted)]">
                            {g.meta.description}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}
            </div>
          </div>
        </section>

        <CtaCompact
          heading={`Need a ${category.label.toLowerCase()} job done in ${city.name}?`}
          emphasis="Get in first."
          lede={`${city.name} is our first launch city. Join the waitlist and you will be among the first to post a job when we open.`}
        />
      </main>
      <Footer />
    </>
  );
}
