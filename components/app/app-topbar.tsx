'use client';

/**
 * The app's desktop top bar: where you are, a greeting, and the bell.
 * Record crumbs use the real name when the screen has already loaded it (job
 * title, artisan, the person in a chat) — the same query keys the page uses,
 * so this costs no extra request.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Icon } from '@/components/app/icon';
import { BellGlyph, Popover, TopBar, crumbsFor, useGreeting } from '@/components/dashboard/topbar';
import { useAuth } from '@/lib/app/auth';
import { timeAgo } from '@/lib/app/domain/date';
import { describeNotification } from '@/lib/app/domain/notification-copy';
import { routes } from '@/lib/app/domain/routes';
import { useInfiniteList } from '@/lib/app/hooks/use-infinite-list';
import { useConversation } from '@/lib/app/queries/use-chat';
import { useJob } from '@/lib/app/queries/use-jobs';
import { useMarkAllRead, useMarkNotificationRead, useNotifications, useUnreadCount } from '@/lib/app/queries/use-notifications';
import { useProvider } from '@/lib/app/queries/use-providers';
import { useQuote } from '@/lib/app/queries/use-quotes';

const LABELS: Record<string, string> = {
  '/app': 'Home',
  '/app/jobs': 'My jobs',
  '/app/jobs/new': 'Post a job',
  '/app/jobs/:id': 'Job',
  '/app/jobs/:id/quotes': 'Quotes',
  '/app/jobs/:id/quote': 'Send a quote',
  '/app/jobs/:id/review': 'Check the work',
  '/app/jobs/:id/dispute': 'Report a problem',
  '/app/find-work': 'Find work',
  '/app/providers': 'Artisans',
  '/app/providers/:id': 'Artisan',
  '/app/quotes': 'Your quotes',
  '/app/quotes/:id': 'Quote',
  '/app/messages': 'Messages',
  '/app/messages/:id': 'Conversation',
  '/app/wallet': 'Wallet',
  '/app/wallet/fund': 'Add money',
  '/app/wallet/withdraw': 'Withdraw',
  '/app/wallet/bank': 'Bank account',
  '/app/wallet/pin': 'Transfer PIN',
  '/app/wallet/transactions/:id': 'Transaction',
  '/app/notifications': 'Notifications',
  '/app/profile': 'Profile',
  '/app/profile/edit': 'Edit profile',
  '/app/profile/reviews': 'My reviews',
  '/app/settings': 'Settings',
  '/app/support': 'Help & support',
};

/** The id after `section/` in the path, if any. */
function idAfter(pathname: string, section: string): string {
  const m = pathname.match(new RegExp(`^/app/${section}/([0-9a-f-]{8,})`, 'i'));
  return m?.[1] ?? '';
}

export function AppTopBar() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const greeting = useGreeting();

  // Real names for records, from queries the page itself already runs.
  const { data: job } = useJob(idAfter(pathname, 'jobs'));
  const { data: artisan } = useProvider(idAfter(pathname, 'providers'));
  const { data: convo } = useConversation(idAfter(pathname, 'messages'));
  const { data: quote } = useQuote(idAfter(pathname, 'quotes'));

  const crumbs = crumbsFor(pathname, '/app', LABELS, {
    '/app/jobs/:id': job?.title,
    '/app/providers/:id': artisan?.name ?? undefined,
    '/app/messages/:id': convo?.other?.name ?? undefined,
    '/app/quotes/:id': quote?.job?.title,
  });

  const first = profile?.name?.trim().split(' ')[0];

  return (
    <TopBar
      crumbs={crumbs}
      greeting={
        greeting ? (
          <>
            {greeting}
            {first && (
              <>
                , <b className="font-semibold text-[var(--ink)]">{first}</b>
              </>
            )}
          </>
        ) : null
      }
      right={<AppBell />}
    />
  );
}

/** The bell: unread count, the latest few in a panel, read in one tap. */
export function AppBell() {
  const unread = useUnreadCount();
  const query = useNotifications();
  const { items } = useInfiniteList(query);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();
  const latest = items.slice(0, 6);

  return (
    <Popover label={unread ? `Notifications, ${unread} unread` : 'Notifications'} button={() => <BellGlyph count={unread} />}>
      {(close) => (
        <>
          <div className="flex items-center justify-between border-b border-[var(--rule)] px-4 py-3">
            <p className="font-semibold text-[var(--ink)]">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={() => markAll.mutate()} className="text-[13px] font-semibold text-[var(--navy)] hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {query.isLoading ? (
            <p className="px-4 py-6 text-center text-[14px] text-[var(--muted)]">Loading…</p>
          ) : latest.length === 0 ? (
            <p className="px-4 py-8 text-center text-[14px] text-[var(--muted)]">Quotes, hires, messages and payments will show up here.</p>
          ) : (
            <ul className="max-h-[360px] divide-y divide-[var(--rule)] overflow-y-auto">
              {latest.map((n) => {
                const { icon, title, body } = describeNotification(n.type, (n.payload ?? {}) as Record<string, unknown>);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => !n.read && markRead.mutate(n.id)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150 ${n.read ? 'hover:bg-[var(--band)]' : 'bg-[var(--teal-wash)] hover:bg-[#dbf2ef]'}`}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--paper)] text-[var(--navy)] ring-1 ring-[var(--rule)]">
                        <Icon name={icon} size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[14px] text-[var(--ink)] ${n.read ? 'font-medium' : 'font-bold'}`}>{title}</span>
                        {body && <span className="line-clamp-2 block text-[13px] text-[var(--muted)]">{body}</span>}
                        <span className="block text-[12px] text-[var(--muted)]">{timeAgo(n.created_at)}</span>
                      </span>
                      {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--navy)]" aria-label="Unread" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href={routes.profileNotifications()} onClick={close} className="block border-t border-[var(--rule)] px-4 py-3 text-center text-[14px] font-semibold text-[var(--navy)] hover:bg-[var(--band)]">
            See all notifications
          </Link>
        </>
      )}
    </Popover>
  );
}
