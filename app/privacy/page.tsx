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
const EFFECTIVE = '2026-10-08';

const trail = [
  { name: 'Home', path: '/' },
  { name: 'Privacy', path: PATH },
];

export const metadata: Metadata = buildMetadata({
  path: PATH,
  title: 'Privacy policy',
  description:
    'What the HandLancer app and website collect, why, who can see it, who we share it with, how long we keep it, and how to delete your account and data.',
});

const supportMail = (
  <a href={`mailto:${SITE.support.email}`} className="ulink">
    {SITE.support.email}
  </a>
);

/*
 * Written against what the app actually does — the Supabase schema, the edge
 * functions and the permissions in app.json of Handlancer-Mobile-Application.
 * If the app starts collecting something new, or adds an SDK that sends data
 * anywhere, this page and the Play Console Data safety form both need updating
 * in the same release: Google rejects listings where the two disagree.
 */
const SECTIONS: LegalSection[] = [
  {
    heading: 'Who we are',
    id: 'who-we-are',
    paragraphs: [
      <>
        HandLancer is a marketplace that connects people who need work done (customers) with artisans
        and service providers (providers) in Nigeria, and holds payment in escrow until the work is
        done. This policy covers the {SITE.app.name} mobile app (Android package{' '}
        <code className="figure text-[13px]">{SITE.app.androidPackage}</code>) and the website at
        www.handlancer.com.
      </>,
      <>
        HandLancer is the controller of the personal data described here. For anything in this
        policy, contact {supportMail} or WhatsApp {SITE.support.whatsappDisplay}.
      </>,
    ],
  },
  {
    heading: 'Information you give us',
    id: 'what-we-collect',
    paragraphs: ['We collect what you enter while using the app:'],
    list: [
      <>
        <strong className="text-[var(--ink)]">Account.</strong> Your name, email address and
        password, and whether you joined as a customer or a provider. Your password is held by our
        authentication provider as a one-way hash, and we never see it.
      </>,
      <>
        <strong className="text-[var(--ink)]">Profile.</strong> Phone number, profile photo, a short
        bio and your area or address. Providers can also add a business name, trades and skills, an
        hourly rate, years of experience, a service radius and their availability.
      </>,
      <>
        <strong className="text-[var(--ink)]">Jobs and quotes.</strong> Job titles, descriptions,
        categories, budgets, locations, dates, and the photos and videos you attach. Providers&apos;
        quotes include itemised materials and labour prices and a message. Providers also upload
        before-and-after photos and videos as proof of work.
      </>,
      <>
        <strong className="text-[var(--ink)]">Messages and reviews.</strong> The chat messages you
        send to the other party on a job, and the star ratings and written reviews customers leave
        for providers.
      </>,
      <>
        <strong className="text-[var(--ink)]">Disputes.</strong> The reason, category and outcome you
        ask for when you open a dispute, plus anything you send us by email or WhatsApp to support
        it, such as screenshots.
      </>,
      <>
        <strong className="text-[var(--ink)]">Wallet and payments.</strong> Your wallet balance,
        top-ups, escrow holds, releases, refunds and withdrawals, with their amounts, references and
        status. To withdraw, you give us a bank, an account number and the account name, which we
        verify. Your transfer PIN is stored only as a one-way (bcrypt) hash. Card details are entered
        on Flutterwave&apos;s secure payment page and never reach our servers.
      </>,
      <>
        <strong className="text-[var(--ink)]">Support.</strong> What you write when you contact us
        by email or WhatsApp.
      </>,
    ],
  },
  {
    heading: 'Information collected automatically',
    id: 'automatic',
    paragraphs: ['A small amount of technical data is collected so the app can work:'],
    list: [
      'A push-notification token for your device, if you allow notifications, so we can tell you about new quotes, messages and payments.',
      'Security and server logs kept by our hosting provider: IP address, timestamps, sign-in events and error records. We use these to keep accounts secure and fix faults.',
    ],
    after: [
      'The app contains no advertising, no third-party analytics and no tracking SDKs. We do not collect your advertising ID, your contacts, your call logs or a list of the apps on your phone, and we do not track you across other apps or websites.',
    ],
  },
  {
    heading: 'Phone permissions',
    id: 'permissions',
    paragraphs: [
      'The app asks for each permission only at the moment a feature needs it. Every one is optional. If you say no, only that feature stops working, and you can change your mind at any time in your phone’s settings.',
    ],
    list: [
      <>
        <strong className="text-[var(--ink)]">Camera.</strong> To take photos or videos for a job
        post, as proof of work, or for your profile picture.
      </>,
      <>
        <strong className="text-[var(--ink)]">Photos and media.</strong> To pick existing photos or
        videos for the same purposes, or screenshots for a dispute. Only the files you choose are
        uploaded.
      </>,
      <>
        <strong className="text-[var(--ink)]">Microphone.</strong> Only to record sound with a video
        you are capturing in the app. We never record audio on its own or in the background.
      </>,
      <>
        <strong className="text-[var(--ink)]">Location (while using the app only).</strong> Only
        when you tap “Use current location” to fill in an address. Your phone’s built-in service
        (Google on Android, Apple on iOS) turns the position into a street address. Providers who
        save their position on their profile let customers see how far away they are. We never
        collect location in the background.
      </>,
      <>
        <strong className="text-[var(--ink)]">Notifications.</strong> To alert you to quotes,
        messages, job updates and payments.
      </>,
    ],
  },
  {
    heading: 'How we use it',
    id: 'how-we-use',
    paragraphs: ['We use your information to:'],
    list: [
      'Create and run your account, and show your profile to the people you deal with.',
      'Match jobs with providers, deliver quotes and messages, and run escrow, the wallet, withdrawals and refunds.',
      'Verify bank accounts before paying anything out, protect withdrawals with your PIN, and detect fraud and abuse.',
      'Investigate and resolve disputes. This can include reading the job’s messages, quotes, photos and payment history.',
      'Send you notifications and service messages about your jobs, payments and account.',
      'Answer you when you contact support, and meet our legal, tax and anti-money-laundering obligations.',
    ],
    after: [
      'Under the Nigeria Data Protection Act 2023 we rely on: performing our contract with you (running the marketplace and payments); legal obligation (keeping financial records); legitimate interests (security, fraud prevention, fixing faults); and your consent (device permissions and notifications, which you can withdraw).',
      'We do not use your data for advertising, we do not sell it, and we do not make automated decisions that have legal or similarly significant effects on you.',
    ],
  },
  {
    heading: 'What other users can see',
    id: 'visibility',
    paragraphs: [
      'HandLancer is a marketplace, so some information is visible to other people using the app:',
    ],
    list: [
      'Providers: your public profile, meaning your name, photo, bio, area, trades, rate, experience, availability, rating, reviews, verified badge and proof-of-work photos. Customers can also see roughly how far away you are.',
      'Customers: your name and photo, and any job you post publicly, including its description, budget, area and photos, are visible to providers. A direct job request is seen only by the provider you send it to.',
      'Messages are visible only to the two people in the conversation, and to HandLancer staff when we are handling a dispute or a support request about that job.',
      'Your email address, phone number, bank details, wallet balance and transaction history are not shown to other users.',
    ],
    after: [
      'Photos and videos you upload are stored at long, unguessable web addresses so they load quickly in the app. Anyone who is given one of those links can open the file, so please do not upload anything you would not want a customer or provider to see.',
    ],
  },
  {
    heading: 'Who we share it with',
    id: 'sharing',
    paragraphs: [
      'We share personal data only with the service providers that run parts of HandLancer for us, and only what each one needs:',
    ],
    list: [
      <>
        <strong className="text-[var(--ink)]">Supabase</strong> hosts our database, sign-in, file
        storage and server functions. All the information above is stored with them.
      </>,
      <>
        <strong className="text-[var(--ink)]">Flutterwave</strong>, a licensed payment processor,
        handles wallet top-ups, bank-account verification and withdrawals. It receives your email
        address, account reference, payment amounts and, for withdrawals, your bank and account
        number.
      </>,
      <>
        <strong className="text-[var(--ink)]">Expo, Google (Firebase Cloud Messaging) and Apple
        (Push Notification service)</strong> deliver push notifications. They receive your device
        token and the text of the notification.
      </>,
      <>
        <strong className="text-[var(--ink)]">Your phone’s mail app or WhatsApp</strong>, when you
        choose to contact support or send a dispute report through them. These messages are covered
        by those services’ own privacy policies.
      </>,
    ],
    after: [
      'We may also disclose information where the law requires it: to a court, a regulator or law enforcement with valid legal authority, or to protect someone’s safety or prevent fraud. If HandLancer is ever merged or sold, your data would move to the new owner under this same policy, and we would tell you first.',
      'We do not sell, rent or trade your personal data, and we do not share it with advertisers or data brokers.',
    ],
  },
  {
    heading: 'Transfers outside Nigeria',
    id: 'transfers',
    paragraphs: [
      'Some of the providers above store or process data on servers outside Nigeria. Where that happens we rely on the safeguards the Nigeria Data Protection Act allows, including those providers’ contractual data-protection commitments, and we transfer only what the service needs.',
    ],
  },
  {
    heading: 'How we protect it',
    id: 'security',
    paragraphs: [
      'All traffic between the app and our servers is encrypted in transit (HTTPS/TLS). Database rules limit each account to its own private records: your wallet, transactions, notifications and conversations. Transfer PINs are stored as one-way hashes and lock after repeated wrong attempts. Bank account numbers are shown masked in the app, and every withdrawal needs your PIN. Only a small number of authorised HandLancer staff can see account data, and only to run the service, resolve disputes or answer support.',
      'No system is perfectly secure. If a breach puts your data at risk, we will tell you and the Nigeria Data Protection Commission as the law requires.',
    ],
  },
  {
    heading: 'How long we keep it',
    id: 'retention',
    paragraphs: ['We keep data only as long as we need it:'],
    list: [
      'Account and profile details: until you delete your account. They are then erased straight away.',
      'Wallet, escrow and payment records: at least five years after the transaction, as Nigerian anti-money-laundering law requires, even after your account is deleted.',
      'Jobs, quotes, messages, reviews, proof-of-work media and disputes: kept as part of the other party’s job history after you leave, shown as “Deleted user”, for as long as the related payment records are kept.',
      'Server logs and backups: removed on our hosting provider’s rolling schedule, normally within 30 days.',
      'Website waitlist entries: until we launch in your city and invite you, or until you ask us to delete them.',
    ],
  },
  {
    heading: 'Deleting your account',
    id: 'delete',
    paragraphs: [
      <>
        You can delete your account at any time in the app under{' '}
        <strong className="text-[var(--ink)]">Profile → Settings → Delete account</strong>. If you no
        longer have the app, email {supportMail} from the address you signed up with. Full steps, and
        exactly what is erased and what is kept, are on the{' '}
        <Link href="/delete-account" className="ulink">
          delete your account
        </Link>{' '}
        page.
      </>,
    ],
  },
  {
    heading: 'Your rights',
    id: 'rights',
    paragraphs: [
      'Under the Nigeria Data Protection Act 2023 you have the right to:',
    ],
    list: [
      'Get a copy of the personal data we hold about you.',
      'Have inaccurate data corrected. You can edit most of it yourself in the app.',
      'Have your data deleted, subject to the records the law requires us to keep.',
      'Object to or restrict how we use your data, and receive it in a portable format.',
      'Withdraw consent, for example by turning off a permission or notifications.',
    ],
    after: [
      <>
        Email {supportMail} to use any of these. We may ask you to confirm the request from the email
        address on your account, and we will respond within 30 days. If you are unhappy with our
        response you can complain to the Nigeria Data Protection Commission (ndpc.gov.ng).
      </>,
    ],
  },
  {
    heading: 'Children',
    id: 'children',
    paragraphs: [
      'HandLancer is for adults. You must be at least 18 to create an account, because using it means entering contracts and making payments. We do not knowingly collect data from anyone under 18. If we learn that we have, we will delete the account.',
    ],
  },
  {
    heading: 'The website',
    id: 'website',
    paragraphs: [
      'Before launch, www.handlancer.com collects only what you type into the waitlist form: your name, email, city, chosen trade and whether you are a customer or an artisan, plus optionally your phone number, years of experience or how you heard about us. We use it to tell you when HandLancer opens in your city and to decide which cities to open next. The form submits to our server, and entries are stored with Supabase.',
      'The website sets no advertising or analytics cookies and does not track you across other sites.',
    ],
  },
  {
    heading: 'Changes to this policy',
    id: 'changes',
    paragraphs: [
      'When we change this policy we update the effective date above. If a change materially affects how we use your data, we will tell you in the app before it takes effect and, where the law requires it, ask for your consent again.',
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
              What we collect, <em>and why we need it</em>.
            </>
          }
          lede="This covers the HandLancer app and this website. No ads, no tracking SDKs, and we never sell your data. We collect what it takes to run jobs, escrow and payouts, and no more."
          trail={trail}
        />

        <LegalBody
          sections={SECTIONS}
          effective={EFFECTIVE}
          note={
            <>
              Questions, or want a copy of your data? Email {supportMail} or WhatsApp{' '}
              <a href={SITE.support.whatsappUrl} className="ulink">
                {SITE.support.whatsappDisplay}
              </a>
              . To close your account, see{' '}
              <Link href="/delete-account" className="ulink">
                delete your account
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
