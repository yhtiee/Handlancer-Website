import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/lib/site';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema, jsonLdGraph } from '@/lib/schema';
import { JsonLd } from '@/components/json-ld';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/cta';
import { PageHeader } from '@/components/page-header';
import { LegalBody, type LegalSection } from '@/components/legal';

const PATH = '/privacy';
const EFFECTIVE = '2026-08-22';

const trail = [
  { name: 'Home', path: '/' },
  { name: 'Privacy', path: PATH },
];

export const metadata: Metadata = buildMetadata({
  path: PATH,
  title: 'Privacy policy',
  description:
    'What HandLancer collects from the waitlist form, where it is stored, how long it is kept, and how to have it deleted.',
});

/*
 * Scoped deliberately to what this website actually does today: it renders
 * static pages and accepts one waitlist form. It does not describe the mobile
 * app, which handles payments and will need its own policy.
 */
const SECTIONS: LegalSection[] = [
  {
    heading: 'What this policy covers',
    paragraphs: [
      'This policy covers www.handlancer.com, the HandLancer marketing website. The site is pre-launch: it publishes information and accepts waitlist sign-ups. It does not process payments, hold funds or operate escrow.',
      'The HandLancer mobile application is a separate product and will carry its own privacy policy covering wallets, payouts and job data when it launches.',
    ],
  },
  {
    heading: 'What we collect',
    paragraphs: [
      'Only what you type into the waitlist form. Nothing on this site is collected silently, and there is no third-party advertising or analytics tracking on these pages.',
    ],
    list: [
      'Your name and email address — required, so we can tell you when we launch.',
      'Your phone number — optional, used only for launch calls.',
      'Your city — required, because we open city by city.',
      'The trade you selected, and whether you joined as a customer or an artisan.',
      'For artisans, years of experience — optional. For customers, how you heard about us — optional.',
    ],
  },
  {
    heading: 'What we do with it',
    paragraphs: [
      'We use it to email you when HandLancer opens in your city, and to decide which cities to open next. Artisan sign-ups are additionally used to review and verify profiles ahead of launch.',
      'We do not sell your details, share them with advertisers, or add you to a newsletter. The waitlist is a launch list, not a marketing list.',
    ],
  },
  {
    heading: 'Where it is stored',
    paragraphs: [
      'Waitlist entries are stored in a hosted Postgres database provided by Supabase. The form submits to our server, which writes the row — your details are not sent to the database directly from your browser, and the database credentials are never exposed to the browser.',
    ],
  },
  {
    heading: 'How long we keep it',
    paragraphs: [
      'Until HandLancer launches in your city and you have been invited, or until you ask us to delete it — whichever comes first. If we decide not to launch in your city, we will delete the entries for that city rather than keep them indefinitely.',
    ],
  },
  {
    heading: 'Your rights',
    paragraphs: [
      'Under the Nigeria Data Protection Act you can ask us for a copy of what we hold about you, ask us to correct it, or ask us to delete it. Email us and we will action it — there is no form to fill in and no account to close.',
    ],
  },
  {
    heading: 'Cookies',
    paragraphs: [
      'This site sets no advertising or analytics cookies. Your browser may store ordinary technical data required to load the page, but we do not track you across sites and there is nothing here to opt out of.',
    ],
  },
  {
    heading: 'Changes',
    paragraphs: [
      'If this policy changes materially before launch we will update the effective date at the top of this page. Because the site is pre-launch, expect this policy to be replaced by a fuller one covering the app when it ships.',
    ],
  },
];

export default function Privacy() {
  return (
    <>
      <Nav />
      <JsonLd graph={jsonLdGraph(breadcrumbSchema(trail))} />
      <main className="flex-1">
        <PageHeader
          marker="01"
          label="Privacy"
          title={
            <>
              We collect a waitlist, <em>and not much else</em>.
            </>
          }
          lede="This site publishes pages and accepts one form. No advertising trackers, no analytics cookies, no selling your details on."
          trail={trail}
        />

        <LegalBody
          sections={SECTIONS}
          effective={EFFECTIVE}
          note={
            <>
              Questions about anything here, or want your details removed? Email{' '}
              <a href={`mailto:${SITE.email}`} className="ulink">
                {SITE.email}
              </a>{' '}
              or use the{' '}
              <Link href="/contact" className="ulink">
                contact page
              </Link>
              .
            </>
          }
        />
      </main>
      <Footer />
    </>
  );
}
