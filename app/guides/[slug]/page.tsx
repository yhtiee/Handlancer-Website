import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CATEGORIES } from '@/lib/site';
import { getCity } from '@/lib/cities';
import { GUIDES, getGuide, type GuideBlock } from '@/lib/guides';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema, jsonLdGraph } from '@/lib/schema';
import { JsonLd } from '@/components/json-ld';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/cta';
import { PageHeader } from '@/components/page-header';
import { CtaCompact } from '@/components/cta-compact';
import { Reveal } from '@/components/reveal';
import { IconArrowRight } from '@/components/icons';

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.meta.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};

  return buildMetadata({
    path: `/guides/${guide.meta.slug}`,
    title: guide.meta.title,
    description: guide.meta.description,
  });
}

/* ------------------------------------------------------------------ */
/* Block renderer                                                      */
/* ------------------------------------------------------------------ */

function Block({ block }: { block: GuideBlock }) {
  switch (block.kind) {
    case 'heading':
      return <h2 className="mt-12 max-w-[22ch] text-[clamp(1.5rem,3vw,1.95rem)]">{block.text}</h2>;

    case 'paragraph':
      return (
        <p className="mt-5 max-w-[68ch] text-[16.5px] leading-relaxed text-[var(--ink)]">
          {block.text}
        </p>
      );

    case 'list':
      return (
        <ul className="mt-6 max-w-[68ch] divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-4 py-3.5">
              <span className="figure shrink-0 pt-1 text-[12px] text-[var(--muted)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-[15.5px] leading-relaxed text-[var(--muted)]">{item}</span>
            </li>
          ))}
        </ul>
      );

    case 'callout':
      return (
        <aside className="mt-8 max-w-[68ch] border border-[var(--rule-strong)] bg-[var(--band)] px-6 py-5">
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.13em] text-[var(--muted)]">
            {block.title}
          </p>
          <p className="mt-2.5 text-[15.5px] leading-relaxed text-[var(--ink)]">{block.text}</p>
        </aside>
      );

    case 'costTable':
      return (
        <figure className="mt-10">
          <figcaption className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.13em] text-[var(--muted)]">
            {block.table.caption}
          </figcaption>
          {/* Wide tables scroll inside their own box rather than the page. */}
          <div className="mt-3 overflow-x-auto border border-[var(--rule-strong)]">
            <table className="w-full min-w-[34rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--rule-strong)] bg-[var(--band)]">
                  {block.table.columns.map((col) => (
                    <th
                      key={col}
                      scope="col"
                      className="px-5 py-3.5 font-[family-name:var(--font-plex-mono)] text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule)]">
                {block.table.rows.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={
                          ci === 0
                            ? 'px-5 py-3.5 text-[14.5px] font-semibold text-[var(--navy)]'
                            : ci === 1
                              ? 'figure px-5 py-3.5 text-[14.5px] text-[var(--ink)]'
                              : 'px-5 py-3.5 text-[14px] text-[var(--muted)]'
                        }
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.table.note && (
            <p className="mt-3 max-w-[62ch] text-[13.5px] leading-relaxed text-[var(--muted)]">
              {block.table.note}
            </p>
          )}
        </figure>
      );
  }
}

/* ------------------------------------------------------------------ */

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const path = `/guides/${guide.meta.slug}`;
  const trade = guide.meta.trade
    ? CATEGORIES.find((c) => c.slug === guide.meta.trade)
    : undefined;
  const city = guide.meta.city ? getCity(guide.meta.city) : undefined;
  const others = GUIDES.filter((g) => g.meta.slug !== guide.meta.slug).slice(0, 3);

  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Guides', path: '/guides' },
    { name: guide.meta.title, path },
  ];

  return (
    <>
      <Nav />
      <JsonLd graph={jsonLdGraph(breadcrumbSchema(trail))} />
      <main className="flex-1">
        <PageHeader
          marker="01"
          label="Guide"
          title={guide.meta.title}
          lede={guide.lede}
          trail={trail}
        />

        <article className="rule-b scroll-mt-20 py-16 md:py-24">
          <div className="shell">
            {/* Byline */}
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-[var(--rule)] pb-6 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.13em] text-[var(--muted)]">
              <span>By {guide.meta.author}</span>
              <span>
                Published <time dateTime={guide.meta.published}>{longDate(guide.meta.published)}</time>
              </span>
              {guide.meta.updated !== guide.meta.published && (
                <span>
                  Updated <time dateTime={guide.meta.updated}>{longDate(guide.meta.updated)}</time>
                </span>
              )}
            </div>

            <Reveal>
              <div className="mt-4">
                {guide.body.map((block, i) => (
                  <Block key={i} block={block} />
                ))}
              </div>
            </Reveal>

            {/* Link back to what this guide is about */}
            {(trade || city) && (
              <Reveal>
                <div className="mt-14 border-t border-[var(--rule)] pt-6">
                  <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.13em] text-[var(--muted)]">
                    Hire for this
                  </p>
                  <ul className="mt-4 max-w-[68ch] divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
                    {trade && (
                      <li>
                        <Link
                          href={`/services/${trade.slug}`}
                          className="flex items-center justify-between gap-4 py-3.5 text-[15px] font-semibold text-[var(--navy)]"
                        >
                          {trade.label} on HandLancer
                          <IconArrowRight className="h-4 w-4 shrink-0" />
                        </Link>
                      </li>
                    )}
                    {trade && city && (
                      <li>
                        <Link
                          href={`/${city.slug}/${trade.slug}`}
                          className="flex items-center justify-between gap-4 py-3.5 text-[15px] font-semibold text-[var(--navy)]"
                        >
                          {trade.label} in {city.name}
                          <IconArrowRight className="h-4 w-4 shrink-0" />
                        </Link>
                      </li>
                    )}
                    {city && !trade && (
                      <li>
                        <Link
                          href={`/${city.slug}`}
                          className="flex items-center justify-between gap-4 py-3.5 text-[15px] font-semibold text-[var(--navy)]"
                        >
                          Artisans in {city.name}
                          <IconArrowRight className="h-4 w-4 shrink-0" />
                        </Link>
                      </li>
                    )}
                  </ul>
                </div>
              </Reveal>
            )}
          </div>
        </article>

        {others.length > 0 && (
          <section className="rule-b scroll-mt-20 py-20 md:py-28">
            <div className="shell">
              <Reveal>
                <p className="marker">
                  <b>02</b> <span>More guides</span>
                </p>
              </Reveal>
              <ul className="mt-12 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
                {others.map((g, i) => (
                  <Reveal as="li" key={g.meta.slug} delay={i * 70}>
                    <Link href={`/guides/${g.meta.slug}`} className="block py-6">
                      <h2 className="text-[19px]">{g.meta.title}</h2>
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

        <CtaCompact
          heading="Know what to ask?"
          emphasis="Now get quotes."
          lede="HandLancer is still in build. Join the waitlist and we will email you the moment we open in your city."
        />
      </main>
      <Footer />
    </>
  );
}
