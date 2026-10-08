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
const EFFECTIVE = '2026-10-08';

const trail = [
  { name: 'Home', path: '/' },
  { name: 'Terms', path: PATH },
];

export const metadata: Metadata = buildMetadata({
  path: PATH,
  title: 'Terms of service',
  description:
    'The terms for using the HandLancer app and website: accounts, jobs and quotes, escrow, the wallet and withdrawals, disputes, acceptable use, and closing your account.',
});

const supportMail = (
  <a href={`mailto:${SITE.support.email}`} className="ulink">
    {SITE.support.email}
  </a>
);

/*
 * Mirrors the money rules the app enforces server-side (Handlancer-Mobile-
 * Application/supabase/migrations): escrow split into materials and
 * workmanship, PIN-gated withdrawals to a verified bank account, disputes that
 * freeze escrow, and deletion refused while money or work is in flight. If one
 * of those rules changes, change the matching section here.
 */
const SECTIONS: LegalSection[] = [
  {
    heading: 'About these terms',
    id: 'about',
    paragraphs: [
      <>
        These terms are an agreement between you and HandLancer. They cover the {SITE.app.name}{' '}
        mobile app and the website at www.handlancer.com, which together make up the “service”. By
        creating an account or using the service you accept these terms and our{' '}
        <Link href="/privacy" className="ulink">
          privacy policy
        </Link>
        . If you do not agree, do not use the service.
      </>,
    ],
  },
  {
    heading: 'Who can use HandLancer',
    id: 'eligibility',
    paragraphs: ['To create an account you must:'],
    list: [
      'Be at least 18 years old and able to enter a binding contract.',
      'Give accurate, current information, and keep it up to date.',
      'Have only one account, used by you alone, unless we agree otherwise.',
      'Keep your password and transfer PIN secret. You are responsible for activity on your account until you tell us it has been compromised.',
    ],
    after: [
      'You join either as a customer, who posts jobs and pays for work, or as a provider, who quotes for and carries out work.',
    ],
  },
  {
    heading: 'What HandLancer does, and does not do',
    id: 'role',
    paragraphs: [
      'HandLancer is a platform. We help customers and providers find each other, agree a price, and hold payment in escrow until the work is done. The contract for the work itself is between the customer and the provider. HandLancer is not a party to it, does not carry out the work, and does not employ providers. Providers are independent and are responsible for their own work, tools, licences, insurance and taxes.',
      'A “verified” badge means we have checked a provider’s identity. It does not guarantee the quality of their work. Ratings and reviews are the opinions of other customers. Use your own judgement before you hire anyone and before you let anyone into your home.',
    ],
  },
  {
    heading: 'Jobs, quotes and hiring',
    id: 'jobs',
    paragraphs: [
      'Customers can post a job publicly for any provider to quote on, or send it directly to a single provider. A quote is split into materials and labour line items. When a customer approves a quote, the provider is hired and the full quoted amount moves from the customer’s wallet into escrow. The customer must have enough in their wallet to approve.',
      'Describe jobs and quotes honestly and completely. A provider who finds the scope has genuinely changed once on site should agree a revised quote with the customer in the app before doing more work.',
    ],
  },
  {
    heading: 'Wallet and payments',
    id: 'wallet',
    paragraphs: [
      'Your HandLancer wallet holds Naira for paying for and receiving payment for jobs on the platform. You top it up through Flutterwave, our payment processor, and Flutterwave’s own terms also apply to those payments. The wallet is not a bank account and earns no interest.',
      'Withdrawals go only to a Nigerian bank account in your name that we have verified, and each one needs your transfer PIN. The PIN locks after repeated wrong attempts. We may delay, hold or reverse a payment, or ask you for more information, where we reasonably suspect fraud, an error, or a breach of these terms, or where the law requires it.',
      'If money reaches your wallet by mistake, it is not yours, and we may reverse it.',
    ],
  },
  {
    heading: 'Escrow and releasing payment',
    id: 'escrow',
    paragraphs: [
      'Escrow is held in two parts: the materials portion and the workmanship portion. A provider can request the materials portion so they can buy supplies. The customer releases it from the job screen. The workmanship portion is released when the customer confirms the work is done and rates the provider, and that confirmation needs the customer’s PIN.',
      'Released money goes straight to the provider’s wallet. A release is the customer’s instruction to pay and cannot be undone, so release only when you are satisfied. If you are not, open a dispute instead.',
    ],
  },
  {
    heading: 'Disputes',
    id: 'disputes',
    paragraphs: [
      <>
        A customer who is unhappy with a job can open a dispute from the job screen. The provider is
        notified and can respond. A provider with a problem on a job should contact {supportMail}.
        While a dispute is open, any money still in escrow is frozen. We review the job’s quotes,
        messages, photos, videos and payment history, plus anything either side sends us, and then
        decide how the money still held is split. It may all be released to the provider, all
        refunded to the customer, or divided between them.
      </>,
      'We aim to decide fairly and quickly, but our decision covers only the money held on HandLancer. It does not take away any right either of you has under Nigerian law, including under the Federal Competition and Consumer Protection Act.',
    ],
  },
  {
    heading: 'Fees',
    id: 'fees',
    paragraphs: [
      'Creating an account, posting jobs, quoting and receiving quotes is currently free, and HandLancer takes no commission. Your bank or Flutterwave may charge their own fees. If we introduce a fee we will tell you in the app at least 30 days beforehand, and it will never apply to a job already in escrow.',
    ],
  },
  {
    heading: 'Paying outside HandLancer',
    id: 'off-platform',
    paragraphs: [
      'Escrow, dispute review and verified payouts only protect money paid through the app. If you pay, or accept payment, any other way, HandLancer cannot help you recover it.',
    ],
  },
  {
    heading: 'Your content',
    id: 'content',
    paragraphs: [
      'You keep ownership of what you post: profile details, job descriptions, quotes, messages, reviews, photos and videos. You give HandLancer a non-exclusive, royalty-free licence to store, display and process that content to run the service, resolve disputes and keep the platform safe. Proof-of-work photos and reviews stay visible on the other party’s job history after you leave.',
      'Only post content you have the right to share. Reviews must reflect a real experience of the job they are attached to.',
    ],
  },
  {
    heading: 'What is not allowed',
    id: 'acceptable-use',
    paragraphs: ['You must not use HandLancer to:'],
    list: [
      'Harass, threaten, abuse or discriminate against anyone, or post hateful, violent, sexually explicit or otherwise objectionable content.',
      'Offer, request or pay for anything illegal, unsafe or unlicensed.',
      'Deceive anyone: fake profiles, impersonation, fake or paid reviews, misleading quotes, or taking payment for work you do not intend to do.',
      'Commit fraud, launder money, test stolen cards, or move money through the wallet that is not connected to a genuine job.',
      'Collect other users’ personal data, or contact them for anything other than the job.',
      'Spam, scrape, reverse-engineer, overload or interfere with the app, or get around its security or the PIN and escrow rules.',
    ],
  },
  {
    heading: 'Reporting and enforcement',
    id: 'reporting',
    paragraphs: [
      <>
        If someone breaks these terms, or you see content that should not be on HandLancer, report it
        to {supportMail} or on WhatsApp {SITE.support.whatsappDisplay}, with the job or profile
        involved. We review every report.
      </>,
      'We may remove content, restrict features, hold payments under review, suspend or close accounts, and report matters to the authorities when someone breaks these terms or the law. Where it is safe and lawful to do so, we will tell you why and give you a chance to respond.',
    ],
  },
  {
    heading: 'Closing your account',
    id: 'closing',
    paragraphs: [
      <>
        You can delete your account at any time from the app, or by asking us. Because deletion is
        permanent, you must first withdraw your wallet balance and finish or settle any job that is
        under way, disputed, or holding money in escrow. See{' '}
        <Link href="/delete-account" className="ulink">
          delete your account
        </Link>{' '}
        for the steps and what happens to your data.
      </>,
      'If we close your account for a breach of these terms, we will pay any lawfully owed balance to your verified bank account once any related dispute or investigation is resolved.',
    ],
  },
  {
    heading: 'Availability and changes to the service',
    id: 'availability',
    paragraphs: [
      'We work to keep HandLancer running, but we cannot promise it will always be available or free of errors. We may change, suspend or stop features. If we stop the service altogether we will give you reasonable notice and time to withdraw your balance.',
    ],
  },
  {
    heading: 'Liability',
    id: 'liability',
    paragraphs: [
      'Because HandLancer is not a party to the work, we are not responsible for how a job is carried out, for damage or injury caused by a customer or provider, or for what users say or do. To the extent the law allows, HandLancer is not liable for indirect or consequential loss, and our total liability to you for any job is limited to the amount paid into escrow for that job.',
      'Nothing in these terms limits liability that cannot be limited under Nigerian law, including for fraud or for death or personal injury caused by negligence, or your rights as a consumer.',
    ],
  },
  {
    heading: 'Price guidance and other content',
    id: 'guidance',
    paragraphs: [
      'Price ranges, guides and other content on the website and in the app are general guidance, not quotes or professional, legal, structural or financial advice. Actual prices depend on access, condition, materials and scope. Always compare itemised quotes before committing.',
    ],
  },
  {
    heading: 'The waitlist',
    id: 'waitlist',
    paragraphs: [
      'Joining the website waitlist does not create an account or guarantee that HandLancer will launch in your city by any date. When you submit the form, give accurate details for yourself, and do not submit it automatically or in bulk.',
    ],
  },
  {
    heading: 'App stores',
    id: 'app-stores',
    paragraphs: [
      'If you downloaded the app from Google Play or the Apple App Store, these terms are between you and HandLancer, not the store. The store is not responsible for the app or its content, and its own terms of use also apply to you.',
    ],
  },
  {
    heading: 'Intellectual property',
    id: 'ip',
    paragraphs: [
      'The HandLancer name, logo, app, website, written content and designs belong to HandLancer. You may use the service for its intended purpose, link to any page, and quote short passages with attribution. You may not copy, republish or build on them otherwise without our permission.',
    ],
  },
  {
    heading: 'Changes to these terms',
    id: 'changes',
    paragraphs: [
      'We may update these terms as HandLancer develops. The effective date above shows which version applies. For material changes we will tell you in the app at least 14 days before they take effect. If you keep using HandLancer after that, you accept the new terms. If you do not accept them, you can close your account.',
    ],
  },
  {
    heading: 'Governing law',
    id: 'law',
    paragraphs: [
      'These terms are governed by the laws of the Federal Republic of Nigeria. Before going to court, please contact us so we can try to resolve the problem. Any dispute that cannot be settled that way is subject to the jurisdiction of the Nigerian courts.',
    ],
  },
  {
    heading: 'Contact',
    id: 'contact',
    paragraphs: [
      <>
        HandLancer, Nigeria. Email {supportMail} or WhatsApp {SITE.support.whatsappDisplay}.
      </>,
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
              The rules of the job, <em>in plain words</em>.
            </>
          }
          lede="How accounts, quotes, escrow, the wallet and disputes work on HandLancer, and what we expect from customers and providers."
          trail={trail}
        />

        <LegalBody
          sections={SECTIONS}
          effective={EFFECTIVE}
          note={
            <>
              The short version: the work is agreed between you and the other party, the money waits in
              escrow until you release it, and if something goes wrong you open a dispute rather than
              releasing. Questions? Email {supportMail}, or read the{' '}
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
