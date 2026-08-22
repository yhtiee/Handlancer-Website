import type { Metadata } from 'next';
import Link from 'next/link';
import { GUIDES } from '@/lib/guides';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema, jsonLdGraph } from '@/lib/schema';
import { JsonLd } from '@/components/json-ld';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/cta';
import { PageHeader } from '@/components/page-header';
import { CtaCompact } from '@/components/cta-compact';
import { Reveal } from '@/components/reveal';
import { IconArrowRight } from '@/components/icons';

const PATH = '/guides';

const trail = [
  { name: 'Home', path: '/' },
  { name: 'Guides', path: PATH },
];

export const metadata: Metadata = buildMetadata({
  path: PATH,
  title: 'Guides to hiring artisans in Nigeria',
  description:
    'Plain explanations of what jobs cost, how escrow protects both sides, and how to read an itemised quote before you fund it.',
});

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

export default function GuidesIndex() {
  return (
    <>
      <Nav />
      <JsonLd graph={jsonLdGraph(breadcrumbSchema(trail))} />
      <main className="flex-1">
        <PageHeader
          marker="01"
          label="Guides"
          title={
            <>
              What things cost, and <em>what to ask</em>.
            </>
          }
          lede="Short, specific pieces on hiring artisans in Nigeria — written to be useful before you spend money, not after."
          trail={trail}
        />

        <section className="rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>02</b> <span>All guides</span>
              </p>
            </Reveal>

            <ul className="mt-12 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
              {GUIDES.map((g, i) => (
                <Reveal as="li" key={g.meta.slug} delay={Math.min(i, 3) * 70}>
                  <Link href={`/guides/${g.meta.slug}`} className="group block py-7">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                      <h2 className="max-w-[24ch] text-[21px]">{g.meta.title}</h2>
                      <span className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.13em] text-[var(--muted)]">
                        <time dateTime={g.meta.updated}>{longDate(g.meta.updated)}</time>
                      </span>
                    </div>
                    <p className="mt-3 max-w-[64ch] text-[15px] leading-relaxed text-[var(--muted)]">
                      {g.meta.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--navy)]">
                      Read the guide
                      <IconArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        <CtaCompact
          heading="Ready when you are."
          emphasis="Join the list."
          lede="HandLancer is still in build. Put your name down and we will email you the moment we open in your city."
        />
      </main>
      <Footer />
    </>
  );
}
