'use client';

/**
 * Notifications. Ported from mobile components/notifications/: the wording
 * comes from lib/app/domain/notification-copy.ts (shared with the system
 * notifications in lib/app/notify.ts), new rows arrive live, and opening one
 * marks it read.
 */
import { LoadMore } from '@/components/app/controls';
import { Icon } from '@/components/app/icon';
import { Button, EmptyState, ListSkeleton, PageHeader } from '@/components/app/ui';
import { timeAgo } from '@/lib/app/domain/date';
import { describeNotification } from '@/lib/app/domain/notification-copy';
import { useInfiniteList } from '@/lib/app/hooks/use-infinite-list';
import { useMarkAllRead, useMarkNotificationRead, useNotifications } from '@/lib/app/queries/use-notifications';

export function NotificationsView() {
  const query = useNotifications();
  const { items: notifications, onEndReached, loadingMore } = useInfiniteList(query);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeader
        title="Notifications"
        description="Quotes, hires, messages and payments."
        actions={
          hasUnread ? (
            <Button variant="ghost" icon="checkmark" loading={markAll.isPending} onClick={() => markAll.mutate()}>
              Mark all read
            </Button>
          ) : undefined
        }
      />
      <section className="card enter overflow-hidden">
        {query.isLoading ? (
          <ListSkeleton rows={5} />
        ) : notifications.length === 0 ? (
          <EmptyState title="No notifications">Quotes, hires, messages and payments will show up here.</EmptyState>
        ) : (
          <ul className="divide-y divide-[var(--rule)]">
            {notifications.map((n) => {
              const { icon, title, body } = describeNotification(n.type, (n.payload ?? {}) as Record<string, unknown>);
              const unread = !n.read;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => unread && markRead.mutate(n.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors duration-150 md:px-5 ${unread ? 'bg-[var(--teal-wash)] hover:bg-[#dbf2ef]' : 'hover:bg-[var(--band)]'}`}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--paper)] text-[var(--navy)] ring-1 ring-[var(--rule)]">
                      <Icon name={icon} size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[var(--ink)] ${unread ? 'font-bold' : 'font-semibold'}`}>{title}</span>
                      {body && <span className="line-clamp-2 block text-[14px] text-[var(--muted)]">{body}</span>}
                      <span className="mt-0.5 block text-[12.5px] text-[var(--muted)]">{timeAgo(n.created_at)}</span>
                    </span>
                    {unread && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-[var(--navy)]" aria-label="Unread" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <LoadMore hasMore={!!query.hasNextPage} loading={loadingMore} onLoad={onEndReached} />
      </section>
    </div>
  );
}
