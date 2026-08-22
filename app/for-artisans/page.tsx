import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { CATEGORIES } from '@/lib/site';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema, jsonLdGraph } from '@/lib/schema';
import { JsonLd } from '@/components/json-ld';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/cta';
import { PageHeader } from '@/components/page-header';
import { CtaCompact } from '@/components/cta-compact';
import { Reveal } from '@/components/reveal';
import { IconArrowRight } from '@/components/icons';

const PATH = '/for-artisans';

const trail = [
  { name: 'Home', path: '/' },
  { name: 'For artisans', path: PATH },
];

export const metadata: Metadata = buildMetadata({
  path: PATH,
  title: 'For artisans — get paid without chasing',
  description:
    'On HandLancer the money is funded and sitting in escrow before you pick up a tool, and materials land in your wallet before you buy a bag of cement. Free to join, no bidding credits, no commission on quoting.',
});

const STEPS: [string, string][] = [
  [
    'Build a profile that wins work',
    'List your trades, years of experience, hourly rate and service radius. Your rating and completed jobs sit where customers look first.',
  ],
  [
    'Find work that fits',
    'Filter the feed by category, budget, location and how recently a job was posted — or switch on “matches my skills” and only see work you can actually do.',
  ],
  [
    'Quote line by line',
    'Break the price into materials and labour. Customers trust a quote they can read, and it is what sets your escrow split.',
  ],
  [
    'Get paid without chasing',
    'Materials money is released before you buy supplies. Your labour is already funded and waiting — no more knocking on doors for the balance.',
  ],
];

const TERMS: [string, string][] = [
  ['Free to join', 'No subscription, no bidding credits, no commission on quoting.'],
  ['See the budget first', 'Job budget and location are on the card before you write a quote.'],
  ['Filter to your trade', 'Switch on “matches my skills” and the feed only shows work you can do.'],
  ['Withdraw to your bank', 'Payouts to a Nigerian account, confirmed with a transfer PIN.'],
];

export default function ForArtisans() {
  return (
    <>
      <Nav />
      <JsonLd graph={jsonLdGraph(breadcrumbSchema(trail))} />
      <main className="flex-1">
        <PageHeader
          marker="01"
          label="For artisans"
          title={
            <>
              The work was never the hard part. <em>Getting paid</em> was.
            </>
          }
          lede="On HandLancer the money is funded and sitting in escrow before you pick up a tool, and materials land in your wallet before you buy a single bag of cement."
          trail={trail}
        />

        {/* ---- Why ---- */}
        <section className="band rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>02</b> <span>What changes</span>
              </p>
            </Reveal>

            <div className="mt-9 grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
              <Reveal>
                <h2 className="max-w-[18ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                  No deposit standoff. <em>No chasing.</em>
                </h2>
                <p className="lede mt-6 max-w-[46ch]">
                  The customer funds the job before you start. You can see it is funded, and they
                  cannot spend it elsewhere. Neither of you has to go first on trust.
                </p>

                <ul className="mt-8 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
                  {TERMS.map(([t, d]) => (
                    <li key={t} className="flex flex-wrap items-baseline gap-x-3 py-3.5">
                      <span className="text-[15px] font-semibold text-[var(--navy)]">{t}</span>
                      <span className="text-[14.5px] text-[var(--muted)]">{d}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={100}>
                <div className="lg:sticky lg:top-24">
                  <div className="overflow-hidden rounded-sm border border-[var(--rule)]">
                    <Image
                      src="/brand/working-man.webp"
                      alt="Verified Nigerian tradesman earning through the HandLancer app"
                      width={640}
                      height={640}
                      loading="lazy"
                      sizes="(max-width: 1024px) 100vw, 400px"
                      className="h-auto w-full object-cover"
                    />
                  </div>
                  <Link href="/#waitlist" className="btn btn-primary mt-5 w-full">
                    Join the artisan waitlist
                    <IconArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---- How ---- */}
        <section className="rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>03</b> <span>How it works</span>
              </p>
            </Reveal>

            <Reveal>
              <h2 className="mt-9 max-w-[16ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                Four steps, <em>start to paid</em>
              </h2>
            </Reveal>

            <ol className="mt-12 divide-y divide-[var(--rule-strong)] border-y border-[var(--rule-strong)]">
              {STEPS.map(([t, d], i) => (
                <Reveal as="li" key={t} delay={i * 70}>
                  <div className={`flex gap-6 py-7 ${i % 2 === 1 ? 'lg:pl-10' : ''}`}>
                    <span className="figure shrink-0 pt-1 text-[13px] text-[var(--navy)]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="text-[19px]">{t}</h3>
                      <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-[var(--muted)]">
                        {d}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ---- Trades ---- */}
        <section className="band rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>04</b> <span>Your trade</span>
              </p>
            </Reveal>
            <Reveal>
              <h2 className="mt-9 max-w-[18ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                Twelve trades, <em>all hiring</em>
              </h2>
            </Reveal>
            <ul className="mt-12 flex flex-wrap gap-x-3 gap-y-2.5 border-t border-[var(--rule)] pt-6">
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/services/${c.slug}`}
                    className="inline-flex items-center border border-[var(--rule-strong)] px-3.5 py-2 text-[14px] text-[var(--ink)] transition-colors duration-200 hover:border-[var(--ink)] hover:bg-[var(--paper)]"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <CtaCompact
          heading="Get your profile in early,"
          emphasis="before customers arrive."
          lede="Early artisan profiles are reviewed and verified first, so you are ready to quote the day we open your city."
          secondaryHref="/guides/how-escrow-protects-you"
          secondaryLabel="How escrow works"
        />
      </main>
      <Footer />
    </>
  );
}
