import type { Metadata } from 'next';

import { BrandLogo } from '@/components/admin/brand-logo';
import { SITE } from '@/lib/site';

/*
 * Where Flutterwave sends mobile app users after checkout (APP_REDIRECT_URL).
 * Live mode refuses a handlancer:// return address, so this https page hands
 * them back. Public on purpose: the app's in-app browser has no website session.
 *
 * Website payers never come here; flutterwave-init returns them to /app/wallet.
 *
 * `status` is whatever is in the URL, so it only picks the wording. Nothing here
 * says money has been credited: the webhook decides that, after checking the
 * charge with Flutterwave.
 */

export const metadata: Metadata = {
  title: 'Payment',
  robots: { index: false, follow: false },
};

/** Opens the app's home, which routes by role. The wallet path differs for customers and artisans. */
const APP_LINK = 'handlancer://';

type Copy = { heading: string; emphasis: string; body: string };

const SUCCESS: Copy = {
  heading: 'Payment',
  emphasis: 'received',
  body: 'Your wallet updates as soon as Flutterwave confirms it, usually within a minute.',
};
const CANCELLED: Copy = {
  heading: 'Payment',
  emphasis: 'cancelled',
  body: 'You weren’t charged. Go back to the app whenever you’d like to try again.',
};
const FAILED: Copy = {
  heading: 'Payment',
  emphasis: 'didn’t go through',
  body: 'Go back to the app to try again. If money left your account, contact us and we’ll sort it out.',
};
const UNKNOWN: Copy = {
  heading: 'Back to',
  emphasis: 'HandLancer',
  body: 'If you’ve just paid, your wallet updates as soon as the payment is confirmed.',
};

function copyFor(status: string | string[] | undefined): Copy {
  switch (status) {
    case 'successful':
    case 'completed':
      return SUCCESS;
    case 'cancelled':
      return CANCELLED;
    case 'failed':
      return FAILED;
    default:
      return UNKNOWN;
  }
}

export default async function PaymentCompletePage({ searchParams }: PageProps<'/payment-complete'>) {
  const { status } = await searchParams;
  const { heading, emphasis, body } = copyFor(status);

  return (
    <main className="flex min-h-dvh flex-col bg-[var(--paper)] px-5 pb-8 pt-[calc(20px+env(safe-area-inset-top))]">
      <div className="flex items-center gap-2.5">
        <BrandLogo height={26} priority />
        <span className="text-[18px] font-bold tracking-[-0.03em] text-[var(--navy)]">HandLancer</span>
      </div>

      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">
        <h1 className="!text-[clamp(1.9rem,4vw,2.4rem)]">
          {heading} <em>{emphasis}</em>
        </h1>
        <p className="lede mt-2 !text-[17px]">{body}</p>

        <a href={APP_LINK} className="btn btn-primary mt-7 w-full justify-center">
          Back to the app
        </a>
        <p className="mt-5 text-[14px] text-[var(--muted)]">
          Button not working? Close this window to return to the app. Need a hand?{' '}
          <a href={`mailto:${SITE.support.email}`} className="ulink">
            {SITE.support.email}
          </a>
        </p>
      </div>
    </main>
  );
}
