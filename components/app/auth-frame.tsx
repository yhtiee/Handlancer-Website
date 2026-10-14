import Link from 'next/link';

import { BrandLogo } from '@/components/admin/brand-logo';
import { Icon } from '@/components/app/icon';

/**
 * Sign-in and onboarding: the form on paper, and on desktop a band panel that
 * says what HandLancer does in three lines — the escrow promise, nothing else.
 */
export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-[minmax(0,1fr)] bg-[var(--paper)] lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
      <div className="flex flex-col px-5 pb-8 pt-[calc(20px+env(safe-area-inset-top))] sm:px-10">
        <Link href="/" className="flex items-center gap-2.5 self-start" aria-label="HandLancer home">
          <BrandLogo height={26} priority />
          <span className="text-[18px] font-bold tracking-[-0.03em] text-[var(--navy)]">HandLancer</span>
        </Link>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">{children}</div>
      </div>

      <aside className="hidden border-l border-[var(--rule)] bg-[var(--band)] px-12 py-16 lg:flex lg:flex-col lg:justify-center">
        <p className="marker">
          <b>HL</b> <span>How it works</span>
        </p>
        <h2 className="mt-8 max-w-[16ch] !text-[34px] !leading-[1.1]">
          Nobody pays first. Nobody works <em>for free</em>.
        </h2>
        <ul className="mt-8 space-y-5 text-[15px] text-[var(--muted)]">
          {[
            ['document-text', 'Compare itemised quotes from verified artisans near you.'],
            ['lock-closed', 'Your money waits in escrow — the artisan can see it’s there.'],
            ['checkmark-circle', 'You release each payment only when the work is done.'],
          ].map(([icon, text]) => (
            <li key={text} className="flex gap-3">
              <Icon name={icon as 'lock-closed'} size={20} className="mt-0.5 shrink-0 text-[var(--navy)]" />
              {text}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
