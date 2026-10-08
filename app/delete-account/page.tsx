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

const PATH = '/delete-account';
const EFFECTIVE = '2026-10-08';

const trail = [
  { name: 'Home', path: '/' },
  { name: 'Delete your account', path: PATH },
];

export const metadata: Metadata = buildMetadata({
  path: PATH,
  title: `Delete your ${SITE.app.name} account`,
  description: `How to delete your ${SITE.app.name} account and data, in the app or by email without the app, what is erased, and what is kept and for how long.`,
});

const SUBJECT = 'Delete my Handlancer account';
const mailtoDelete = `mailto:${SITE.support.email}?subject=${encodeURIComponent(SUBJECT)}`;

const supportMail = (
  <a href={`mailto:${SITE.support.email}`} className="ulink">
    {SITE.support.email}
  </a>
);

/*
 * This is the URL entered in Play Console → Data safety → "Delete account URL".
 * Google requires it to name the app as listed, show the steps prominently,
 * work without the app installed, and say what is deleted and what is kept.
 *
 * What it says is erased and kept must match delete_my_account() in
 * Handlancer-Mobile-Application/supabase/migrations/0022_delete_account.sql
 * and the copy in src/components/settings/delete-account-sheet.tsx.
 */
const SECTIONS: LegalSection[] = [
  {
    heading: 'Delete in the app',
    id: 'in-app',
    paragraphs: [`The quickest way. In the ${SITE.app.name} app:`],
    ordered: true,
    list: [
      'Sign in to the account you want to delete.',
      <>
        Open the <strong className="text-[var(--ink)]">Profile</strong> tab and tap{' '}
        <strong className="text-[var(--ink)]">Settings</strong>.
      </>,
      <>
        Tap <strong className="text-[var(--ink)]">Delete account</strong>.
      </>,
      <>
        Read what will be erased, type <strong className="text-[var(--ink)]">DELETE</strong>, and
        tap <strong className="text-[var(--ink)]">Delete my account</strong>.
      </>,
    ],
    after: [
      'Your account is deleted straight away and you are signed out on that device.',
    ],
  },
  {
    heading: 'Delete without the app',
    id: 'by-email',
    paragraphs: [
      'If you have uninstalled the app, lost your phone, or cannot sign in, you do not need to reinstall anything:',
    ],
    ordered: true,
    list: [
      <>
        Email{' '}
        <a href={mailtoDelete} className="ulink">
          {SITE.support.email}
        </a>{' '}
        from the email address you signed up with, with the subject “{SUBJECT}”.
      </>,
      'Tell us whether you used HandLancer as a customer or a provider.',
      'We may reply to confirm the request is really from you. We never ask for your password or PIN.',
      'We delete the account within 30 days, usually much sooner, and email you when it is done.',
    ],
    after: [
      <>
        If you no longer have access to that email address, message us on WhatsApp{' '}
        <a href={SITE.support.whatsappUrl} className="ulink">
          {SITE.support.whatsappDisplay}
        </a>{' '}
        from the phone number on your profile, and we will verify you another way.
      </>,
    ],
  },
  {
    heading: 'Settle these first',
    id: 'before',
    paragraphs: [
      'Deletion is permanent, so it cannot leave money or work stranded. The app and our team will ask you to sort these out first:',
    ],
    list: [
      'Money in your wallet. Withdraw it to your bank account first.',
      'A job that is under way, disputed, or still has money held in escrow. Finish it, release or settle the escrow, or let the dispute be resolved first.',
    ],
    after: [
      'Jobs you posted that nobody has started yet are closed automatically, and quotes you sent that are still waiting are withdrawn. You do not need to cancel them yourself.',
    ],
  },
  {
    heading: 'What is deleted',
    id: 'deleted',
    paragraphs: ['As soon as your account is deleted, we erase:'],
    list: [
      'Your sign-in: email address and password. You can no longer log in.',
      'Your name, profile photo, phone number, email, bio, address and saved location.',
      'Provider details: business name, trades and skills, hourly rate, years of experience, availability and verified badge. Your profile disappears from search.',
      'Your saved bank account and transfer PIN.',
      'Your notifications and your device’s push-notification token.',
    ],
  },
  {
    heading: 'What we keep, and for how long',
    id: 'kept',
    paragraphs: [
      'Some records belong to two people, and some the law requires us to keep. These stay, but no longer carry your name. They are shown as “Deleted user”:',
    ],
    list: [
      <>
        <strong className="text-[var(--ink)]">Payment records</strong>: wallet transactions, escrow
        holds, releases, refunds and withdrawals. Kept for at least{' '}
        <strong className="text-[var(--ink)]">five years</strong> after the transaction, as Nigerian
        anti-money-laundering law requires, and then deleted.
      </>,
      <>
        <strong className="text-[var(--ink)]">Job history the other party relies on</strong>: past
        jobs, accepted quotes, chat messages, reviews, before-and-after photos and videos, and dispute
        records. Kept on the other person’s side for as long as the related payment records, so their
        history and any dispute evidence stay intact.
      </>,
      <>
        <strong className="text-[var(--ink)]">Backups and server logs</strong>: removed on our hosting
        provider’s rolling schedule, normally within{' '}
        <strong className="text-[var(--ink)]">30 days</strong>.
      </>,
    ],
    after: [
      'We use what we keep only to meet legal obligations, resolve disputes and prevent fraud, never to contact you or for marketing.',
    ],
  },
  {
    heading: 'Delete some data, keep your account',
    id: 'partial',
    paragraphs: [
      <>
        You do not have to close your account to remove information. You can edit or clear your
        photo, bio, phone number, location and provider details at any time in{' '}
        <strong className="text-[var(--ink)]">Profile → Edit profile</strong>, and turn off
        notifications or location access in your phone’s settings. To have something else removed,
        such as a specific photo or message, email {supportMail} and tell us what it is.
      </>,
    ],
  },
  {
    heading: 'Website waitlist',
    id: 'waitlist',
    paragraphs: [
      <>
        Signed up on the website waitlist but never created an app account? Email {supportMail} from
        the address you used and we will remove your entry.
      </>,
    ],
  },
];

export default function DeleteAccount() {
  return (
    <>
      <Nav />
      <JsonLd graph={jsonLdGraph(breadcrumbSchema(trail))} />
      <main className="flex-1">
        <PageHeader
          marker="01"
          label="Account deletion"
          title={
            <>
              Delete your {SITE.app.name} account, <em>with or without the app</em>.
            </>
          }
          lede={`How to delete your ${SITE.app.name} account and the personal data that goes with it, and the few records the law or the other party to a job needs us to keep.`}
          trail={trail}
        />

        <LegalBody
          sections={SECTIONS}
          effective={EFFECTIVE}
          note={
            <>
              This page is for the <strong>{SITE.app.name}</strong> app by HandLancer on Google Play
              and the App Store. In the app, go to <strong>Profile → Settings → Delete account</strong>.
              Without the app, email{' '}
              <a href={mailtoDelete} className="ulink">
                {SITE.support.email}
              </a>{' '}
              from your account’s email address. Read the{' '}
              <Link href="/privacy" className="ulink">
                privacy policy
              </Link>{' '}
              for everything else we do with your data.
            </>
          }
        />
      </main>
      <Footer />
    </>
  );
}
