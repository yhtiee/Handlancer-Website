import type { Metadata } from 'next';

import { Icon } from '@/components/app/icon';
import { PageHeader, Section } from '@/components/app/ui';
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP_DISPLAY, whatsappUrl } from '@/lib/app/constants/support';

export const metadata: Metadata = { title: 'Help & support' };

/** Ported from mobile components/support/support-screen.tsx — same FAQ, same two channels. */
const FAQ = [
  {
    q: 'How does escrow work?',
    a: 'You fund the agreed amount into escrow. Funds are only released to the artisan when you approve — materials first if needed, then the final payment on completion.',
  },
  {
    q: 'When do artisans get paid?',
    a: 'After you review the completed work and release the final payment, it lands in the artisan’s wallet instantly.',
  },
  {
    q: 'What if I’m not happy with the work?',
    a: 'Open “Report a problem” on the job instead of approving it. That freezes everything still in escrow, notifies the artisan, and gives you a reference plus a ready-written report to send us. Nothing is released while a dispute is open.',
  },
  {
    q: 'Can I get my money back once I’ve approved?',
    a: 'Not from inside the app — approving releases the payment for good. If you are unsure about the work, dispute it first; that is what the escrow is for.',
  },
];

// Asking for these up front saves the first reply being a request for them.
const EMAIL_BODY = '\n\n—\nSo we can help faster, please include:\n• What you were trying to do\n• The job title, if it is about a job\n• Screenshots, if you have them\n';

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeader title="Help & support" description="Answers to what people ask most, and a person when you need one." />
      <div className="space-y-6">
        <Section title="Common questions" flush>
          <div className="divide-y divide-[var(--rule)]">
            {FAQ.map((item) => (
              <details key={item.q} className="group px-4 py-3.5 md:px-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-[var(--ink)]">
                  {item.q}
                  <Icon name="chevron-down" size={18} className="shrink-0 text-[var(--muted)] transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-[15px] text-[var(--muted)]">{item.a}</p>
              </details>
            ))}
          </div>
        </Section>

        <Section title="Talk to us">
          <div className="flex flex-col gap-2 sm:flex-row">
            <a className="btn btn-primary !h-11" href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('HandLancer support request')}&body=${encodeURIComponent(EMAIL_BODY)}`}>
              <Icon name="mail" size={18} />
              Email support
            </a>
            <a className="btn btn-ghost !h-11" href={whatsappUrl('Hello HandLancer support, I need help with ')} target="_blank" rel="noopener noreferrer">
              <Icon name="logo-whatsapp" size={18} />
              Chat on WhatsApp
            </a>
          </div>
          <p className="mt-3 text-[13.5px] text-[var(--muted)]">
            {SUPPORT_EMAIL} · {SUPPORT_WHATSAPP_DISPLAY}
          </p>
        </Section>
      </div>
    </div>
  );
}
