import type { Metadata } from 'next';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/site';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema, jsonLdGraph, serviceListSchema } from '@/lib/schema';
import { JsonLd } from '@/components/json-ld';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/cta';
import { PageHeader } from '@/components/page-header';
import { CtaCompact } from '@/components/cta-compact';
import { Reveal } from '@/components/reveal';
import { CATEGORY_ICONS, IconGrid } from '@/components/icons';

/*
 * Hub for the twelve trade pages. It exists because /services/[trade] needs a
 * parent for its breadcrumb trail to point at, and because twelve orphaned
 * pages with no index between them and the homepage is a weak internal link
 * graph.
 */

const PATH = '/services';

const trail = [
  { name: 'Home', path: '/' },
  { name: 'Services', path: PATH },
];

export const metadata: Metadata = buildMetadata({
  path: PATH,
  title: 'Every trade you can hire on HandLancer',
  description:
    'Twelve trades, one job post. Compare itemised quotes from verified plumbers, electricians, carpenters, painters and more across Nigeria, with every naira held in escrow until the work is done.',
});

export default function ServicesIndex() {
  return (
    <>
      <Nav />
      <JsonLd graph={jsonLdGraph(serviceListSchema(PATH), breadcrumbSchema(trail))} />
      <main className="flex-1">
        <PageHeader
          marker="01"
          label="Services"
          title={
            <>
              Twelve trades. <em>One job post.</em>
            </>
          }
          lede="From a burst pipe at midnight to a full kitchen refit. Post once and let verified artisans near you compete with itemised quotes."
          trail={trail}
        />

        <section className="rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>02</b> <span>What you can hire for</span>
              </p>
            </Reveal>

            <div
              className="mt-12 grid gap-px border border-[var(--rule)] sm:grid-cols-2 lg:grid-cols-3"
              style={{ background: 'var(--rule)' }}
            >
              {CATEGORIES.map((c, i) => {
                const Icon = CATEGORY_ICONS[c.id] ?? IconGrid;
                return (
                  <Reveal key={c.id} delay={(i % 3) * 60}>
                    <Link
                      href={`/services/${c.slug}`}
                      className="group flex h-full flex-col bg-[var(--paper)] p-6 transition-colors duration-200 hover:bg-[var(--band)]"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-[18px] w-[18px] shrink-0 text-[var(--navy)]" />
                        <h2 className="text-[17px]">{c.label}</h2>
                      </div>
                      <p className="mt-2.5 max-w-[34ch] text-[14.5px] leading-relaxed text-[var(--muted)]">
                        {c.blurb}
                      </p>
                      <p className="mt-4 max-w-[36ch] border-t border-[var(--rule)] pt-3.5 text-[13.5px] leading-relaxed text-[var(--muted)]">
                        {c.demand}
                      </p>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <CtaCompact
          heading="Whatever the job,"
          emphasis="the money waits."
          lede="We are still building. Put your name down and you will be among the first in when HandLancer opens in your city."
        />
      </main>
      <Footer />
    </>
  );
}
