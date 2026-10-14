/**
 * The artisan programme, in one place: how joining works, what an application
 * is reviewed on, and the rules an artisan agrees to.
 *
 * Read by the public page (/for-artisans) and by the application's last step
 * in the app (/app/apply), so what an artisan is shown before they sign up is
 * word for word what they accept. Every rule restates a section of /terms and
 * links to it — change the terms first, then this, never the other way round.
 */

export type ArtisanRule = {
  title: string;
  body: string;
  /** Anchor on /terms that this rule summarises. */
  terms: string;
};

export const ARTISAN_RULES: ArtisanRule[] = [
  {
    title: 'One real account, in your own name',
    body: 'You are 18 or over, your details are accurate and kept up to date, and the account is used by you alone. Your transfer PIN stays secret.',
    terms: 'eligibility',
  },
  {
    title: 'You run your own business',
    body: 'HandLancer connects you with customers and holds the money; it does not employ you. Your work, tools, licences, insurance and taxes are your responsibility.',
    terms: 'role',
  },
  {
    title: 'Quote honestly, line by line',
    body: 'Split every quote into materials and labour. If the scope genuinely changes on site, agree a revised quote in the app before doing more work.',
    terms: 'jobs',
  },
  {
    title: 'Start when the money is in escrow',
    body: 'A customer is only committed once they have paid into escrow. You will get a notification — don’t start before it.',
    terms: 'escrow',
  },
  {
    title: 'Keep payment on HandLancer',
    body: 'Escrow, dispute review and verified payouts only protect money paid through the app. Payment taken any other way cannot be recovered for you.',
    terms: 'off-platform',
  },
  {
    title: 'Show your work',
    body: 'Add before and after photos to every job. Customers check them before releasing your final payment, and they become the portfolio on your profile.',
    terms: 'content',
  },
  {
    title: 'Answer disputes with your side',
    body: 'If a customer disputes a job, anything still in escrow is frozen while support reviews the quotes, messages and photos from both of you and decides how it is split.',
    terms: 'disputes',
  },
  {
    title: 'Treat people and their homes with respect',
    body: 'No harassment, discrimination, fake reviews, misleading quotes or taking payment for work you do not intend to do — and contact customers only about their job.',
    terms: 'acceptable-use',
  },
  {
    title: 'Rules are enforced',
    body: 'Breaking these rules or the law can mean removed content, payments held for review, or a suspended or closed account. Where it is safe to, we tell you why and let you respond.',
    terms: 'reporting',
  },
];

/** What a reviewer checks before approving an application. */
export const REVIEW_CRITERIA: string[] = [
  'A clear photo of you — your face, not a logo.',
  'A phone number we can reach you on.',
  'The area you work in, and the trades you actually do.',
  'Photos of real work you have done.',
  'A short description of your experience, in your own words.',
];

/** Joining, start to first job. Mirrors the steps of the in-app application. */
export const JOIN_STEPS: [string, string][] = [
  ['Create your account', 'Email and a password. Choose “I do the work”.'],
  ['Build your profile', 'Your photo, phone, area, trades, experience and a few photos of past work. Saved as you go.'],
  ['Accept the artisan rules', 'The rules below — the same ones you see here.'],
  ['Get reviewed', 'A person at HandLancer checks your application and may call you. You are notified in the app either way.'],
  ['Start quoting', 'Once approved, customers can find you and you can quote on open jobs near you.'],
];

/** Where the account flow starts for an artisan: sign-up with the role preselected. */
export const ARTISAN_SIGNUP_HREF = '/app/sign-in?role=provider';


/** Questions artisans ask before joining. Rendered on /for-artisans and emitted as FAQPage data. */
export const ARTISAN_FAQS: { q: string; a: string }[] = [
  {
    q: 'Does it cost anything to join or to quote?',
    a: 'No. Creating an account, being reviewed and quoting are free, and HandLancer takes no commission on your jobs. Your bank or Flutterwave may charge their own transfer fees. If that ever changes we will tell you in the app at least 30 days beforehand, and it will never apply to a job already in escrow.',
  },
  {
    q: 'Do I need to download an app?',
    a: 'No. HandLancer runs in your phone’s browser at handlancer.com/app, and you can add it to your home screen so it opens like any other app.',
  },
  {
    q: 'How long does the review take, and what do you check?',
    a: 'Applications are reviewed by a person, in the order they arrive. We look for a clear photo of you, a phone number we can reach, your area and trades, photos of real work you have done, and an honest description of your experience. We may call you, and you are notified in the app either way.',
  },
  {
    q: 'What if my application is sent back?',
    a: 'You will see a note saying what to change. Update your profile and submit it again — there is no limit and no waiting period.',
  },
  {
    q: 'When do I get paid?',
    a: 'The customer pays the full agreed amount into escrow before you start. You can ask for the materials portion as soon as you need to buy supplies, and the rest is released to your wallet when the customer approves the finished work. You withdraw to your own Nigerian bank account with your transfer PIN.',
  },
  {
    q: 'What happens if a customer is unhappy?',
    a: 'They can open a dispute instead of approving. Whatever is still in escrow is frozen — not refunded — while our support team reviews the quotes, messages and photos from both sides, hears your account, and decides how it is split.',
  },
];
