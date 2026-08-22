import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/lib/site';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema, jsonLdGraph } from '@/lib/schema';
import { JsonLd } from '@/components/json-ld';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/cta';
import { PageHeader } from '@/components/page-header';
import { CtaCompact } from '@/components/cta-compact';
import { Reveal } from '@/components/reveal';

const PATH = '/contact';

const trail = [
  { name: 'Home', path: '/' },
  { name: 'Contact', path: PATH },
];

export const metadata: Metadata = buildMetadata({
  path: PATH,
  title: 'Contact HandLancer',
  description: `Questions about escrow, joining as an artisan, or launching in your city? Email ${SITE.email} and a person will read it.`,
});

const ROUTES: [string, string][] = [
  [
    'Joining the waitlist',
    'The fastest route in is the waitlist itself — customers and artisans have separate lists, so tell us which one you are.',
  ],
  [
    'Artisan verification',
    'Artisans who join early get profiles reviewed and verified before customers start posting. Email us if you want yours looked at ahead of launch.',
  ],
  [
    'Launching in your city',
    'We open city by city. If you want your town prioritised, tell us where you are and what trade you work in.',
  ],
  [
    'Press and partnerships',
    'Same address. Put the subject in the first line and it will reach the right person.',
  ],
];

export default function Contact() {
  return (
    <>
      <Nav />
      <JsonLd graph={jsonLdGraph(breadcrumbSchema(trail))} />
      <main className="flex-1">
        <PageHeader
          marker="01"
          label="Contact"
          title={
            <>
              Small enough that <em>a person reads it</em>.
            </>
          }
          lede="No ticket numbers, no chatbot. One address, read by the people building this."
          trail={trail}
        />

        <section className="rule-b scroll-mt-20 py-20 md:py-28">
          <div className="shell">
            <Reveal>
              <p className="marker">
                <b>02</b> <span>Email</span>
              </p>
            </Reveal>

            <Reveal delay={80}>
              <div className="mt-12 border border-[var(--rule-strong)] bg-[var(--paper)]">
                <div className="border-b border-[var(--rule)] px-6 py-4">
                  <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.13em] text-[var(--muted)]">
                    Support &amp; general enquiries
                  </p>
                </div>
                <div className="px-6 py-8">
                  <a
                    href={`mailto:${SITE.email}`}
                    className="ulink text-[clamp(1.2rem,3.2vw,1.7rem)] font-semibold"
                  >
                    {SITE.email}
                  </a>
                  <p className="mt-5 max-w-[52ch] text-[14.5px] leading-relaxed text-[var(--muted)]">
                    We are pre-launch and answer in person, usually within a couple of working days.
                    Including your city and whether you are hiring or providing services gets you a
                    more useful reply.
                  </p>
                </div>
              </div>
            </Reveal>

            <dl className="mt-14 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
              {ROUTES.map(([t, d], i) => (
                <Reveal key={t} delay={Math.min(i, 3) * 60}>
                  <div className="grid gap-3 py-7 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-10">
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

            <Reveal>
              <p className="mt-10 max-w-[62ch] text-[14.5px] leading-relaxed text-[var(--muted)]">
                Looking for how escrow works before you write?{' '}
                <Link href="/guides/how-escrow-protects-you" className="ulink">
                  Read the escrow guide
                </Link>{' '}
                or the{' '}
                <Link href="/#faq" className="ulink">
                  frequently asked questions
                </Link>
                .
              </p>
            </Reveal>
          </div>
        </section>

        <CtaCompact
          heading="Or skip the email."
          emphasis="Join the list."
          lede="The waitlist is the fastest way in. We will email you the moment HandLancer opens in your city."
        />
      </main>
      <Footer />
    </>
  );
}
