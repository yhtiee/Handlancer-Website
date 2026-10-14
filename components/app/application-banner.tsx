'use client';

import Link from 'next/link';

import { Icon } from '@/components/app/icon';
import { useAuth } from '@/lib/app/auth';
import { statusCopy } from '@/lib/app/domain/artisan-status';
import { routes } from '@/lib/app/domain/routes';

/**
 * Where an artisan's application stands, on every screen until it is
 * approved — so nobody wonders why they can't quote or can't be found.
 */
export function ApplicationBanner() {
  const { profile } = useAuth();
  const copy = statusCopy(profile);
  if (!copy) return null;

  const tone =
    copy.tone === 'bad'
      ? 'border-[#f3c4c5] bg-[#fdeeee]'
      : copy.tone === 'warn'
        ? 'border-[#f0d9b0] bg-[#fdf7ec]'
        : 'border-[var(--rule)] bg-[var(--teal-wash)]';

  return (
    <section role="status" className={`enter mb-5 flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center ${tone}`}>
      <Icon name={copy.tone === 'info' ? 'time' : 'warning'} size={20} className="hidden shrink-0 text-[var(--navy)] sm:block" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[var(--ink)]">{copy.title}</p>
        <p className="text-[14px] text-[var(--muted)]">{copy.body}</p>
      </div>
      {copy.action ? (
        <Link href={routes.apply} className="btn btn-primary !h-10 shrink-0 !px-4 !text-[14px]">
          {copy.action}
        </Link>
      ) : copy.tone === 'bad' ? (
        <Link href={routes.profileSupport()} className="btn btn-ghost !h-10 shrink-0 !px-4 !text-[14px]">
          Contact support
        </Link>
      ) : null}
    </section>
  );
}
