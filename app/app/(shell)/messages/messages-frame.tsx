'use client';

/**
 * Messages as an inbox. Desktop: conversations on the left, the open thread on
 * the right, so switching is one click and never loses your place. Phone: the
 * list, then the thread full screen — the mobile app's two screens.
 * Ported from mobile components/chat/chat-list.tsx and conversation-row.tsx.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Avatar, EmptyState, ListSkeleton } from '@/components/app/ui';
import { useAuth } from '@/lib/app/auth';
import { timeAgo } from '@/lib/app/domain/date';
import { routes } from '@/lib/app/domain/routes';
import { useConversations } from '@/lib/app/queries/use-chat';

export function MessagesFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const inThread = pathname !== '/app/messages';

  return (
    <div className="card enter -mx-4 grid h-[calc(100dvh-var(--topbar-h)-env(safe-area-inset-top)-var(--tabbar-h)-env(safe-area-inset-bottom)-40px)] overflow-hidden !border-x-0 md:mx-0 md:h-[calc(100dvh-var(--topbar-h)-env(safe-area-inset-top)-var(--tabbar-h)-env(safe-area-inset-bottom)-64px)] md:!border-x lg:h-[calc(100dvh-128px)] lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className={`min-h-0 flex-col border-r border-[var(--rule)] ${inThread ? 'hidden lg:flex' : 'flex'}`} aria-label="Conversations">
        <div className="flex h-14 shrink-0 items-center border-b border-[var(--rule)] px-4">
          <h1 className="!text-[19px]">Messages</h1>
        </div>
        <ConversationList activeId={inThread ? pathname.split('/').pop() : undefined} />
      </aside>
      <section className={`min-h-0 min-w-0 flex-col ${inThread ? 'flex' : 'hidden lg:flex'}`}>{children}</section>
    </div>
  );
}

function ConversationList({ activeId }: { activeId?: string }) {
  const { session, profile } = useAuth();
  const { data: conversations, isLoading } = useConversations();

  if (isLoading) return <ListSkeleton rows={5} />;
  if (!conversations?.length) {
    return (
      <EmptyState title="No conversations">
        {profile?.role === 'provider'
          ? 'When a client connects with you on a job, chats appear here.'
          : 'Message an artisan from a job’s quotes or their profile to start chatting.'}
      </EmptyState>
    );
  }

  return (
    <ul className="min-h-0 flex-1 divide-y divide-[var(--rule)] overflow-y-auto">
      {conversations.map((c) => {
        // No read receipts in the schema: "the other person spoke last" is the signal (mobile does the same).
        const theirTurn = !!c.lastMessage && c.lastMessage.sender_id !== session?.user.id;
        const active = c.id === activeId;
        return (
          <li key={c.id}>
            <Link
              href={routes.chatThread(c.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-4 py-3 transition-colors duration-150 ${active ? 'bg-[var(--teal-wash)]' : 'hover:bg-[var(--band)]'}`}
            >
              <span className="relative">
                <Avatar src={c.other?.avatar_url} name={c.other?.name} size={44} />
                {theirTurn && <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-[var(--paper)] bg-[var(--teal)]" aria-hidden="true" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className={`min-w-0 flex-1 truncate text-[var(--ink)] ${theirTurn ? 'font-bold' : 'font-semibold'}`}>{c.other?.name ?? 'Conversation'}</span>
                  {c.lastMessage && <span className="shrink-0 text-[12px] text-[var(--muted)]">{timeAgo(c.lastMessage.created_at)}</span>}
                </span>
                <span className={`block truncate text-[13.5px] ${theirTurn ? 'font-medium text-[var(--ink)]' : 'text-[var(--muted)]'}`}>
                  {c.lastMessage?.body ?? (c.jobTitle ? `Re: ${c.jobTitle}` : 'Start the conversation')}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
