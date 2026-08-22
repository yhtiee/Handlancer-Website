import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CATEGORIES } from '@/lib/site';
import { CITY_PAGES, isIndexable } from '@/lib/cities';
import { allPagedServices, getService, hasOwnPage, servicesForCategory } from '@/lib/services';
import { guidesForTrade } from '@/lib/guides';
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
 * Individual service pages.
 *
 * Only services that clear lib/services.ts `hasOwnPage()` are generated at all.
 * Everything else is listed on its category page without a URL of its own —
 * a hundred-odd two-sentence pages would be a thin-content farm, and the whole
 * domain pays for that, not just the thin pages.
 */

export function generateStaticParams() {
  return allPagedServices().map((s) => {
    const category = CATEGORIES.find((c) => c.id === s.category);
    return { trade: category?.slug ?? '', service: s.slug };
  });
}

export const dynamicParams = false;

function resolve(tradeSlug: string, serviceSlug: string) {
  const category = CATEGORIES.find((c) => c.slug === tradeSlug);
  if (!category) return null;
  const service = getService(category.id, serviceSlug);
  if (!service || !hasOwnPage(service)) return null;
  return { category, service };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ trade: string; service: string }>;
}): Promise<Metadata> {
  const { trade, service: serviceSlug } = await params;
  const found = resolve(trade, serviceSlug);
  if (!found) return {};
  const { category, service } = found;

  return buildMetadata({
    path: `/services/${category.slug}/${service.slug}`,
    title: `${service.label} in Nigeria — what it involves and what it costs`,
    description: `${service.blurb} Compare itemised quotes from verified artisans and keep the workmanship in escrow until the job is signed off.`,
  });
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ trade: string; service: string }>;
}) {
  const { trade, service: serviceSlug } = await params;
  const found = resolve(trade, serviceSlug);
  if (!found) notFound();
  const { category, service } = found;
  const detail = service.detail!;

  const path = `/services/${category.slug}/${service.slug}`;
  const guides = guidesForTrade(category.slug);

  const siblings = servicesForCategory(category.id)
    .filter((s) => s.slug !== service.slug && hasOwnPage(s))
    .slice(0, 5);

  const cities = CITY_PAGES.filter((city) =>
    isIndexable(city.trades.find((t) => t.trade === category.slug)),
  );

  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: category.label, path: `/services/${category.slug}` },
    { name: service.label, path },
  ];

  return (
    <>
      <Nav />
      <JsonLd
        graph={jsonLdGraph(
          serviceSchema({
            category: { ...category, label: service.label, blurb: service.blurb },
            path,
            cities: cities.map((c) => c.name),
          }),
          faqPageSchema(detail.faqs, path),
          breadcrumbSchema(trail),
        )}
      />
      <main className="flex-1">
        <PageHeader
          marker="01"
          label={`${category.label} · ${service.label}`}
          title={
            <>
              {service.label}, <em>paid on approval</em>.
            </>
          }
          lede={detail.demand}
          trail={trail}
        />

        {/* ---- What it involves ---- */}
        <section className="rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>02</b> <span>What the job involves</span>
              </p>
            </Reveal>

            <div className="mt-9 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
              <Reveal>
                <h2 className="max-w-[19ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                  What you are <em>actually</em> paying for
                </h2>
              </Reveal>
              <Reveal delay={80}>
                <div className="lg:pt-2">
                  <p className="lede max-w-[42ch]">{service.blurb}</p>
                  {service.aliases && service.aliases.length > 0 && (
                    <p className="mt-4 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.13em] text-[var(--muted)]">
                      Also asked for as: {service.aliases.join(' · ')}
                    </p>
                  )}
                </div>
              </Reveal>
            </div>

            <ul className="mt-12 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
              {detail.involves.map((step, i) => (
                <Reveal as="li" key={step} delay={Math.min(i, 3) * 60}>
                  <div className="flex items-start gap-4 py-5">
                    <IconCheck className="mt-1 h-4 w-4 shrink-0 text-[var(--navy)]" />
                    <span className="max-w-[62ch] text-[16px] leading-relaxed text-[var(--ink)]">
                      {step}
                    </span>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ---- What moves the price ---- */}
        <section className="band rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>03</b> <span>What moves the price</span>
              </p>
            </Reveal>

            <div className="mt-9 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
              <Reveal>
                <h2 className="max-w-[19ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                  Why two quotes <em>differ</em>
                </h2>
              </Reveal>
              <Reveal delay={80}>
                <p className="lede max-w-[42ch] lg:pt-2">
                  Quotes arrive sorted by total, which makes comparison easy and misleading in equal
                  measure. These are the variables worth checking before you decide one is cheaper.
                </p>
              </Reveal>
            </div>

            <ol className="mt-12 divide-y divide-[var(--rule-strong)] border-y border-[var(--rule-strong)]">
              {detail.priceFactors.map((factor, i) => (
                <Reveal as="li" key={factor} delay={Math.min(i, 3) * 60}>
                  <div className="flex gap-6 py-6">
                    <span className="figure shrink-0 pt-1 text-[13px] text-[var(--navy)]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="max-w-[62ch] text-[16px] leading-relaxed text-[var(--ink)]">
                      {factor}
                    </p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ---- FAQ ---- */}
        <section className="rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>04</b> <span>Questions</span>
              </p>
            </Reveal>

            <div className="mt-9 grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
              <Reveal>
                <h2 className="max-w-[15ch] text-[clamp(2rem,4.4vw,3.05rem)] lg:sticky lg:top-24">
                  Worth asking <em>first</em>
                </h2>
              </Reveal>

              <Reveal delay={80}>
                <dl className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
                  {detail.faqs.map((f, i) => (
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
                <b>05</b> <span>Related</span>
              </p>
            </Reveal>

            <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-16">
              <Reveal>
                <h3 className="text-[16.5px]">More {category.label.toLowerCase()} work</h3>
                <ul className="mt-4 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
                  {siblings.map((s) => (
                    <li key={s.slug}>
                      <Link
                        href={`/services/${category.slug}/${s.slug}`}
                        className="flex items-center justify-between gap-4 py-3.5 text-[15px] text-[var(--muted)] transition-colors duration-200 hover:text-[var(--navy)]"
                      >
                        {s.label}
                        <IconArrowRight className="h-4 w-4 shrink-0" />
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href={`/services/${category.slug}`}
                      className="flex items-center justify-between gap-4 py-3.5 text-[15px] font-semibold text-[var(--navy)]"
                    >
                      All {category.label.toLowerCase()} services
                      <IconArrowRight className="h-4 w-4 shrink-0" />
                    </Link>
                  </li>
                </ul>
              </Reveal>

              <Reveal delay={80}>
                {cities.length > 0 && (
                  <>
                    <h3 className="text-[16.5px]">Local rates</h3>
                    <ul className="mt-4 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
                      {cities.map((city) => (
                        <li key={city.slug}>
                          <Link
                            href={`/${city.slug}/${category.slug}`}
                            className="flex items-center justify-between gap-4 py-3.5 text-[15px] font-semibold text-[var(--navy)]"
                          >
                            {category.label} in {city.name}
                            <IconArrowRight className="h-4 w-4 shrink-0" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {guides.length > 0 && (
                  <>
                    <h3 className={`text-[16.5px] ${cities.length > 0 ? 'mt-10' : ''}`}>Guides</h3>
                    <ul className="mt-4 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
                      {guides.map((g) => (
                        <li key={g.meta.slug}>
                          <Link
                            href={`/guides/${g.meta.slug}`}
                            className="flex items-center justify-between gap-4 py-3.5 text-[15px] text-[var(--muted)] transition-colors duration-200 hover:text-[var(--navy)]"
                          >
                            {g.meta.title}
                            <IconArrowRight className="h-4 w-4 shrink-0" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Reveal>
            </div>
          </div>
        </section>

        <CtaCompact
          heading={`Need ${service.label.toLowerCase()}?`}
          emphasis="Get in first."
          lede="We are still building. Put your name down and you will be among the first in when HandLancer opens in your city."
          secondaryHref={`/services/${category.slug}`}
          secondaryLabel={`All ${category.label.toLowerCase()}`}
        />
      </main>
      <Footer />
    </>
  );
}
