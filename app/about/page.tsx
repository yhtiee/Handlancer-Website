import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/lib/site';
import { CITY_PAGES } from '@/lib/cities';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema, jsonLdGraph } from '@/lib/schema';
import { JsonLd } from '@/components/json-ld';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/cta';
import { PageHeader } from '@/components/page-header';
import { CtaCompact } from '@/components/cta-compact';
import { Reveal } from '@/components/reveal';

const PATH = '/about';

const trail = [
  { name: 'Home', path: '/' },
  { name: 'About', path: PATH },
];

export const metadata: Metadata = buildMetadata({
  path: PATH,
  title: 'About HandLancer',
  description:
    'HandLancer is an escrow-protected marketplace for hiring verified artisans in Nigeria. Why we are building it, how it works, and where we are launching first.',
});

const PRINCIPLES: [string, string][] = [
  [
    'Nobody should have to go first on trust',
    'The deposit standoff is the oldest problem in this trade. Escrow ends it by making the money visible to the artisan and untouchable until the customer signs off.',
  ],
  [
    'A price you cannot read is not a price',
    'Every quote is itemised into materials and labour. That is not presentation — those two totals become the two halves of escrow, so itemisation decides how your money is held.',
  ],
  [
    'Reviews should cost something to earn',
    'Rating and payout are written in one atomic transaction. If the review fails, the payout fails with it, so every star belongs to a real, funded, completed job.',
  ],
  [
    'Launch narrow, properly',
    'We open city by city rather than claiming national coverage on day one. A city gets a page here only once we have real local pricing and the job types that town actually posts.',
  ],
];

export default function About() {
  const firstCity = CITY_PAGES[0];

  return (
    <>
      <Nav />
      <JsonLd graph={jsonLdGraph(breadcrumbSchema(trail))} />
      <main className="flex-1">
        <PageHeader
          marker="01"
          label="About"
          title={
            <>
              Built so neither side has to <em>trust a stranger</em>.
            </>
          }
          lede={SITE.description}
          trail={trail}
        />

        <section className="rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>02</b> <span>Why</span>
              </p>
            </Reveal>

            <div className="mt-9 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
              <Reveal>
                <h2 className="max-w-[20ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                  Everyone has heard both <em>horror stories</em>
                </h2>
              </Reveal>
              <Reveal delay={80}>
                <div className="lg:pt-2">
                  <p className="lede max-w-[46ch]">
                    The artisan who collects a deposit and stops answering. The customer who goes
                    quiet the day the work finishes.
                  </p>
                  <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-[var(--muted)]">
                    They are the same problem wearing different clothes, and both come down to
                    somebody having to move first. HandLancer is built so neither one is possible.
                    Not discouraged — not possible.
                  </p>
                </div>
              </Reveal>
            </div>

            <dl className="mt-14 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
              {PRINCIPLES.map(([t, d], i) => (
                <Reveal key={t} delay={Math.min(i, 3) * 60}>
                  <div className="grid gap-3 py-7 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] md:gap-10">
                    <dt className="text-[18px] font-bold leading-snug tracking-[-0.02em] text-[var(--navy)]">
                      {t}
                    </dt>
                    <dd className="max-w-[62ch] text-[15px] leading-relaxed text-[var(--muted)]">
                      {d}
                    </dd>
                  </div>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>

        <section className="band rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>03</b> <span>Where we are</span>
              </p>
            </Reveal>

            <div className="mt-9 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
              <Reveal>
                <h2 className="max-w-[18ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                  Pre-launch, and <em>honest about it</em>
                </h2>
              </Reveal>
              <Reveal delay={80}>
                <div className="lg:pt-2">
                  <p className="lede max-w-[44ch]">
                    HandLancer is in build. There is no app to download yet and we are not
                    pretending otherwise.
                  </p>
                  {firstCity && (
                    <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-[var(--muted)]">
                      {firstCity.name}, {firstCity.state} State is our first launch city — the only
                      one with real local pages today. Customers and artisans have separate
                      waitlists, and artisans who join early get their profiles reviewed and
                      verified before customers start posting.{' '}
                      <Link href={`/${firstCity.slug}`} className="ulink">
                        See {firstCity.name}
                      </Link>
                      .
                    </p>
                  )}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>04</b> <span>Contact</span>
              </p>
            </Reveal>
            <Reveal>
              <h2 className="mt-9 max-w-[18ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                Questions get <em>real answers</em>
              </h2>
              <p className="lede mt-6 max-w-[44ch]">
                We are small enough that a person reads every message.{' '}
                <Link href="/contact" className="ulink">
                  Get in touch
                </Link>
                .
              </p>
            </Reveal>
          </div>
        </section>

        <CtaCompact
          heading="We are still building."
          emphasis="Get in first."
          lede="Put your name down and you will be among the first in when HandLancer opens in your city."
        />
      </main>
      <Footer />
    </>
  );
}
