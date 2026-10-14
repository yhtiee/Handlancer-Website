'use client';

/**
 * The console's desktop top bar: breadcrumbs, a greeting, and a bell. Admins
 * have no notifications table of their own, so the bell shows the queues that
 * need a person — the same counts as the sidebar badges (useBadges, polled).
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { BellGlyph, Popover, TopBar, crumbsFor, useGreeting } from '@/components/dashboard/topbar';
import { useBadges } from '@/lib/admin/query/hooks';

const LABELS: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/analytics': 'Analytics',
  '/admin/disputes': 'Disputes',
  '/admin/disputes/:id': 'Dispute',
  '/admin/artisans': 'Artisans',
  '/admin/artisans/:id': 'Application',
  '/admin/jobs': 'Jobs',
  '/admin/jobs/:id': 'Job',
  '/admin/users': 'Users',
  '/admin/users/:id': 'User',
  '/admin/transactions': 'Transactions',
  '/admin/waitlist': 'Waitlist',
};

/** "ada.obi@handlancer.com" → "Ada" — admins are auth users with no profile name. */
function nameFromEmail(email: string): string {
  const local = email.split('@')[0]?.split(/[._+-]/)[0] ?? '';
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : '';
}

export function AdminTopBar({ email }: { email: string }) {
  const pathname = usePathname();
  const greeting = useGreeting();
  const name = nameFromEmail(email);
  return (
    <TopBar
      crumbs={crumbsFor(pathname, '/admin', LABELS)}
      greeting={
        greeting ? (
          <>
            {greeting}
            {name && (
              <>
                , <b className="font-semibold text-[var(--ink)]">{name}</b>
              </>
            )}
          </>
        ) : null
      }
      right={<AdminBell />}
    />
  );
}

export function AdminBell() {
  const { data: badges } = useBadges();
  const items = [
    { count: badges?.pendingArtisans ?? 0, href: '/admin/artisans', one: 'artisan application to review', many: 'artisan applications to review' },
    { count: badges?.openDisputes ?? 0, href: '/admin/disputes', one: 'open dispute', many: 'open disputes' },
  ];
  const total = items.reduce((n, i) => n + i.count, 0);

  return (
    <Popover label={total ? `Needs attention, ${total}` : 'Needs attention'} button={() => <BellGlyph count={total} />} width={320}>
      {(close) => (
        <>
          <p className="border-b border-[var(--rule)] px-4 py-3 font-semibold text-[var(--ink)]">Needs attention</p>
          {total === 0 ? (
            <p className="px-4 py-8 text-center text-[14px] text-[var(--muted)]">All clear — nothing waiting on you.</p>
          ) : (
            <ul className="divide-y divide-[var(--rule)]">
              {items
                .filter((i) => i.count > 0)
                .map((i) => (
                  <li key={i.href}>
                    <Link href={i.href} onClick={close} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--band)]">
                      <span className="figure grid min-w-8 place-items-center rounded-full bg-[var(--navy)] px-2 text-[13px] font-semibold leading-7 text-white">{i.count}</span>
                      <span className="flex-1 text-[14px] text-[var(--ink)]">{i.count === 1 ? i.one : i.many}</span>
                      <span aria-hidden="true" className="text-[var(--muted)]">→</span>
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </>
      )}
    </Popover>
  );
}
