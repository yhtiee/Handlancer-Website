import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { LoginForm } from '@/app/admin/login/login-form';
import { BrandLogo } from '@/components/admin/brand-logo';
import { getAdmin } from '@/lib/admin/auth';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: PageProps<'/admin/login'>) {
  if (await getAdmin()) redirect('/admin');

  const { next } = await searchParams;

  return (
    <div className="admin grid min-h-dvh place-items-center px-4 py-10">
      <div className="enter w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          {/* The brand mark and wordmark, as the marketing nav sets them. */}
          <div className="flex items-center gap-3">
            <BrandLogo height={40} priority />
            <span className="text-[26px] font-bold tracking-[-0.03em] text-[var(--navy)]">HandLancer</span>
          </div>
          <p className="kicker mt-5 text-[var(--muted)]">Operations console</p>
        </div>

        <div className="border border-[var(--rule-strong)] bg-[var(--paper)]">
          <div className="border-b border-[var(--rule)] px-6 py-5">
            <h1 className="!text-[24px]">
              Sign in to <em>the ledger</em>
            </h1>
            <p className="mt-1.5 text-[var(--muted)]">Disputes, escrow and payouts, in one place.</p>
          </div>
          <div className="px-6 py-6">
            <LoginForm next={typeof next === 'string' ? next : ''} />
          </div>
        </div>

        <p className="mt-6 text-center text-[13px] text-[var(--muted)]">
          Access is limited to accounts on the admin list.
        </p>
      </div>
    </div>
  );
}
