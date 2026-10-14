import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { CATEGORIES } from '@/lib/site';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema, faqPageSchema, jsonLdGraph } from '@/lib/schema';
import { ARTISAN_FAQS, ARTISAN_RULES, ARTISAN_SIGNUP_HREF, JOIN_STEPS, REVIEW_CRITERIA } from '@/lib/artisan-program';
import { JsonLd } from '@/components/json-ld';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/cta';
import { PageHeader } from '@/components/page-header';
import { CtaCompact } from '@/components/cta-compact';
import { Reveal } from '@/components/reveal';
import { IconArrowRight, IconCheck } from '@/components/icons';

/*
 * The page shared with artisans: everything about joining — why, how, what we
 * review, the rules, how the money works — and the way in. The rules, review
 * criteria, steps and FAQs come from lib/artisan-program.ts, which the in-app
 * application (/app/apply) reads too, so what an artisan reads here is word
 * for word what they accept there.
 */

const PATH = '/for-artisans';

const trail = [
  { name: 'Home', path: '/' },
  { name: 'For artisans', path: PATH },
];

export const metadata: Metadata = buildMetadata({
  path: PATH,
  title: 'Join HandLancer as an artisan — get paid without chasing',
  description:
    'Plumbers, electricians, carpenters and every trade: join HandLancer free, get reviewed, and quote on jobs where the money is already in escrow before you start. No commission, no bidding credits, nothing to download.',
});

const PAY_STEPS: [string, string][] = [
  [
    'Find work that fits',
    'Filter the feed by trade, budget, location and how recently a job was posted — or switch on “only my trades” and see just the work you do.',
  ],
  [
    'Quote line by line',
    'Break the price into materials and labour. Customers trust a quote they can read, and it is what sets your escrow split.',
  ],
  [
    'Start when it is funded',
    'The customer pays the full amount into escrow before you start. You can see it is there, and they cannot spend it elsewhere.',
  ],
  [
    'Materials first, the rest on approval',
    'Ask for the materials money when you need to buy supplies. Add your after photos; the rest lands in your wallet when the customer approves.',
  ],
];

const TERMS: [string, string][] = [
  ['Free to join', 'No subscription, no bidding credits, no commission on your jobs.'],
  ['See the budget first', 'Job budget and location are on the card before you write a quote.'],
  ['Nothing to download', 'Runs in your phone’s browser. Add it to your home screen if you like.'],
  ['Withdraw to your bank', 'Payouts to your own Nigerian account, confirmed with a transfer PIN.'],
];

function JoinButtons({ className = '' }: { className?: string }) {
  return (
    <div className={`flex shrink-0 flex-col gap-3 sm:flex-row ${className}`}>
      <Link href={ARTISAN_SIGNUP_HREF} className="btn btn-primary whitespace-nowrap">
        Join as an artisan
        <IconArrowRight className="h-4 w-4" />
      </Link>
      <Link href="/app" className="btn btn-ghost whitespace-nowrap">
        Already joined? Sign in
      </Link>
    </div>
  );
}

export default function ForArtisans() {
  return (
    <>
      <Nav />
      <JsonLd graph={jsonLdGraph(breadcrumbSchema(trail), faqPageSchema(ARTISAN_FAQS, PATH))} />
      <main className="flex-1">
        <PageHeader
          marker="01"
          label="For artisans"
          title={
            <>
              The work was never the hard part. <em>Getting paid</em> was.
            </>
          }
          lede={
            <>
              On HandLancer the money is in escrow before you pick up a tool, and materials money lands in your wallet before you buy a single bag of cement.{' '}
              <b className="font-semibold text-[var(--navy)]">We are onboarding artisans now — join free today.</b>
            </>
          }
          trail={trail}
        />

        {/* ---- Join strip ---- */}
        <section className="band rule-b py-8">
          <div className="shell flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-[var(--muted)]">
              {['Free, no commission', 'Reviewed by a person', 'Paid through escrow', 'Nothing to download'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <IconCheck className="h-3.5 w-3.5 shrink-0 text-[var(--navy)]" />
                  {t}
                </li>
              ))}
            </ul>
            <JoinButtons />
          </div>
        </section>

        {/* ---- Why ---- */}
        <section className="rule-b scroll-mt-20 py-20 md:py-28">
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
                      alt="Verified Nigerian tradesman earning through HandLancer"
                      width={640}
                      height={640}
                      loading="lazy"
                      sizes="(max-width: 1024px) 100vw, 400px"
                      className="h-auto w-full object-cover"
                    />
                  </div>
                  <Link href={ARTISAN_SIGNUP_HREF} className="btn btn-primary mt-5 w-full">
                    Join as an artisan
                    <IconArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---- How joining works ---- */}
        <section id="join" className="band rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>03</b> <span>How joining works</span>
              </p>
            </Reveal>
            <div className="mt-9 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
              <Reveal>
                <h2 className="max-w-[16ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                  Five steps, <em>saved as you go</em>
                </h2>
              </Reveal>
              <Reveal delay={80}>
                <p className="lede max-w-[44ch] lg:pt-2">
                  Stop whenever you like and pick up where you left off. Have your phone
                  ready for a photo of yourself and a few of your work.
                </p>
              </Reveal>
            </div>
            <ol className="mt-12 divide-y divide-[var(--rule-strong)] border-y border-[var(--rule-strong)]">
              {JOIN_STEPS.map(([t, d], i) => (
                <Reveal as="li" key={t} delay={i * 60}>
                  <div className="flex gap-6 py-6">
                    <span className="figure shrink-0 pt-1 text-[13px] text-[var(--navy)]">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3 className="text-[19px]">{t}</h3>
                      <p className="mt-1.5 max-w-[56ch] text-[15px] leading-relaxed text-[var(--muted)]">{d}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ol>
            <JoinButtons className="mt-10" />
          </div>
        </section>

        {/* ---- What we review ---- */}
        <section className="rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>04</b> <span>What we review</span>
              </p>
            </Reveal>
            <div className="mt-9 grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
              <Reveal>
                <h2 className="max-w-[17ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                  A person checks <em>every profile</em>
                </h2>
                <p className="lede mt-6 max-w-[46ch]">
                  Customers let you into their homes on the strength of your profile, so we look at
                  each one before it goes live. It is not a test of how good you are — your ratings
                  do that — it is a check that you are real and honest about what you do.
                </p>
              </Reveal>
              <Reveal delay={100}>
                <ul className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
                  {REVIEW_CRITERIA.map((c) => (
                    <li key={c} className="flex items-start gap-3 py-4">
                      <IconCheck className="mt-1 h-4 w-4 shrink-0 text-[var(--ok-ink)]" />
                      <span className="text-[15.5px] text-[var(--ink)]">{c}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[14px] text-[var(--muted)]">
                  We may call you to confirm. If something needs changing we tell you exactly what,
                  and you can resubmit straight away.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---- Rules ---- */}
        <section id="rules" className="band rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>05</b> <span>The rules</span>
              </p>
            </Reveal>
            <div className="mt-9 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
              <Reveal>
                <h2 className="max-w-[16ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                  What every artisan <em>agrees to</em>
                </h2>
              </Reveal>
              <Reveal delay={80}>
                <p className="lede max-w-[44ch] lg:pt-2">
                  The same rules you accept when you join, in plain words. Each one summarises a part
                  of our{' '}
                  <Link href="/terms" className="ulink">
                    Terms of Service
                  </Link>
                  , which is what actually applies.
                </p>
              </Reveal>
            </div>
            <ol className="mt-12 grid gap-px border border-[var(--rule)] bg-[var(--rule)] md:grid-cols-2 lg:grid-cols-3">
              {ARTISAN_RULES.map((r, i) => (
                <Reveal as="li" key={r.title} delay={(i % 3) * 60} className="bg-[var(--paper)] p-6">
                  <span className="figure text-[13px] text-[var(--navy)]">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-3 text-[17px]">{r.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--muted)]">{r.body}</p>
                  <Link href={`/terms#${r.terms}`} className="mt-3 inline-block text-[13px] font-semibold text-[var(--navy)] hover:underline">
                    Read the terms →
                  </Link>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ---- Getting paid ---- */}
        <section className="rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>06</b> <span>Getting paid</span>
              </p>
            </Reveal>
            <Reveal>
              <h2 className="mt-9 max-w-[16ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                Four steps, <em>quote to paid</em>
              </h2>
            </Reveal>
            <ol className="mt-12 divide-y divide-[var(--rule-strong)] border-y border-[var(--rule-strong)]">
              {PAY_STEPS.map(([t, d], i) => (
                <Reveal as="li" key={t} delay={i * 70}>
                  <div className={`flex gap-6 py-7 ${i % 2 === 1 ? 'lg:pl-10' : ''}`}>
                    <span className="figure shrink-0 pt-1 text-[13px] text-[var(--navy)]">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3 className="text-[19px]">{t}</h3>
                      <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-[var(--muted)]">{d}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ol>
            <p className="mt-8 text-[14.5px] text-[var(--muted)]">
              Want the detail?{' '}
              <Link href="/guides/how-escrow-protects-you" className="ulink">
                How escrow protects you
              </Link>
            </p>
          </div>
        </section>

        {/* ---- Trades ---- */}
        <section className="band rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>07</b> <span>Your trade</span>
              </p>
            </Reveal>
            <Reveal>
              <h2 className="mt-9 max-w-[18ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                Twelve trades, <em>all welcome</em>
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

        {/* ---- Questions ---- */}
        <section id="faq" className="rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>08</b> <span>Questions</span>
              </p>
            </Reveal>
            <Reveal>
              <h2 className="mt-9 max-w-[18ch] text-[clamp(2rem,4.4vw,3.05rem)]">
                Asked before <em>joining</em>
              </h2>
            </Reveal>
            <div className="mt-12 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
              {ARTISAN_FAQS.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[17px] font-semibold leading-snug tracking-[-0.02em] text-[var(--ink)] group-open:text-[var(--navy)]">
                    {f.q}
                    <span aria-hidden="true" className="figure shrink-0 text-[20px] text-[var(--muted)] transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-[64ch] text-[15.5px] leading-relaxed text-[var(--muted)]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <CtaCompact
          heading="Customers are coming."
          emphasis="Be reviewed before they arrive."
          lede="Join free in your browser. Your profile is checked by a person, and once you are approved you can quote on every open job in your trades."
          primaryHref={ARTISAN_SIGNUP_HREF}
          primaryLabel="Join as an artisan"
          secondaryHref="/app"
          secondaryLabel="Sign in"
        />
      </main>
      <Footer />
    </>
  );
}
