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

const PATH = '/terms';
const EFFECTIVE = '2026-08-22';

const trail = [
  { name: 'Home', path: '/' },
  { name: 'Terms', path: PATH },
];

export const metadata: Metadata = buildMetadata({
  path: PATH,
  title: 'Terms of use',
  description:
    'The terms covering use of the HandLancer website and waitlist while the product is pre-launch, including how price guidance on these pages should be treated.',
});

const SECTIONS: LegalSection[] = [
  {
    heading: 'What these terms cover',
    paragraphs: [
      'These terms govern your use of www.handlancer.com. The site is pre-launch: it publishes information about a product being built and accepts waitlist sign-ups.',
      'They do not govern use of the HandLancer mobile application, escrow, wallets or payouts. Those will be covered by separate terms you will be asked to accept in the app.',
    ],
  },
  {
    heading: 'The service is not live',
    paragraphs: [
      'HandLancer is in build. Nothing on this site is an offer to provide services, and joining the waitlist does not create an account, reserve a place, or guarantee that we will launch in your city or at all.',
      'Every call to action on this site leads to a waitlist, not a transaction. No payment is taken anywhere on this website.',
    ],
  },
  {
    heading: 'Price guidance is indicative',
    paragraphs: [
      'Some pages publish typical price ranges for particular trades in particular cities. These are indicative figures intended to help you judge whether a quote is reasonable. They are not quotes, estimates, or offers, and they carry no guarantee.',
      'Actual prices depend on access, condition, materials and scope. Always obtain and compare itemised quotes before committing to any work.',
    ],
  },
  {
    heading: 'Accuracy of content',
    paragraphs: [
      'We write these pages carefully and correct them when we find them wrong, but we do not warrant that everything is complete or current. Guides describe general good practice, not advice tailored to your property or situation.',
      'Nothing here is professional, legal, structural or financial advice.',
    ],
  },
  {
    heading: 'Using the waitlist honestly',
    paragraphs: ['When you submit the waitlist form you agree to:'],
    list: [
      'Give accurate details, including a real email address you control.',
      'Sign up for yourself, not on someone else’s behalf without their knowledge.',
      'Not submit the form automatically, in bulk, or to disrupt the service.',
    ],
  },
  {
    heading: 'Intellectual property',
    paragraphs: [
      'The HandLancer name, logo, written content and page designs on this site belong to HandLancer. You are welcome to link to any page here and to quote short passages with attribution. Republishing whole pages or guides is not permitted.',
    ],
  },
  {
    heading: 'Availability',
    paragraphs: [
      'We make no promise that this site will be available uninterrupted. It is a pre-launch marketing site and may be taken down, changed or replaced without notice as the product develops.',
    ],
  },
  {
    heading: 'Governing law',
    paragraphs: [
      'These terms are governed by the laws of the Federal Republic of Nigeria, and any dispute arising from your use of this website is subject to the jurisdiction of the Nigerian courts.',
    ],
  },
  {
    heading: 'Changes',
    paragraphs: [
      'We may update these terms as the product moves toward launch. The effective date at the top of this page tells you which version is current. Continuing to use the site after a change means you accept the updated terms.',
    ],
  },
];

export default function Terms() {
  return (
    <>
      <Nav />
      <JsonLd graph={jsonLdGraph(breadcrumbSchema(trail))} />
      <main className="flex-1">
        <PageHeader
          marker="01"
          label="Terms"
          title={
            <>
              A waitlist and some pages, <em>nothing more yet</em>.
            </>
          }
          lede="HandLancer is still in build. These terms cover the website and the waitlist — the app, escrow and payouts will have their own."
          trail={trail}
        />

        <LegalBody
          sections={SECTIONS}
          effective={EFFECTIVE}
          note={
            <>
              Something here unclear? Email{' '}
              <a href={`mailto:${SITE.email}`} className="ulink">
                {SITE.email}
              </a>
              , or read the{' '}
              <Link href="/privacy" className="ulink">
                privacy policy
              </Link>{' '}
              for what we do with your details.
            </>
          }
        />
      </main>
      <Footer />
    </>
  );
}
