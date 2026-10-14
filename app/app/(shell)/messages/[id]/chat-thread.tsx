'use client';

/**
 * One conversation. Ported from mobile components/chat/chat-thread.tsx and
 * message-bubble.tsx: newest at the bottom, live via the realtime
 * subscription in useMessages, Enter to send (Shift+Enter for a new line).
 */
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Icon } from '@/components/app/icon';
import { useOnline } from '@/components/app/pwa';
import { Avatar, EmptyState, Skeleton } from '@/components/app/ui';
import { useAuth } from '@/lib/app/auth';
import { routes } from '@/lib/app/domain/routes';
import { useConversation, useMessages, useSendMessage } from '@/lib/app/queries/use-chat';

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function ChatThread() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const online = useOnline();
  const myId = session?.user.id;
  const { data: conversation } = useConversation(id);
  const { data: messages, isLoading } = useMessages(id);
  const send = useSendMessage(id);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Stay pinned to the newest message as they arrive.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages?.length]);

  async function handleSend() {
    const body = text.trim();
    if (!body) return;
    setText('');
    setError(null);
    try {
      await send.mutateAsync(body);
    } catch (e) {
      setText(body); // give it back rather than lose it
      setError(e instanceof Error ? e.message : 'Message not sent.');
    }
    inputRef.current?.focus();
  }

  const other = conversation?.other;

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--rule)] px-3 md:px-4">
        <Link href={routes.messages} className="-ml-1 grid size-9 place-items-center rounded text-[var(--navy)] hover:bg-[var(--band)] lg:hidden" aria-label="All messages">
          <Icon name="chevron-back" size={20} />
        </Link>
        <Avatar src={other?.avatar_url} name={other?.name} size={34} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[var(--ink)]">{other?.name ?? 'Chat'}</p>
          {conversation?.jobTitle && (
            <Link href={routes.jobDetail(conversation.job_id!)} className="block truncate text-[12.5px] text-[var(--muted)] hover:underline">
              Re: {conversation.jobTitle}
            </Link>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--band)] px-3 py-4 md:px-5" aria-live="polite">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="ml-auto h-10 w-1/2" />
          </div>
        ) : !messages?.length ? (
          <EmptyState title="Say hello">
            {conversation?.jobTitle
              ? `Discuss “${conversation.jobTitle}” with ${other?.name ?? 'them'}.`
              : 'Send the first message to start the conversation.'}
          </EmptyState>
        ) : (
          <ol className="space-y-1.5">
            {messages.map((m, i) => {
              const mine = m.sender_id === myId;
              const newDay = i === 0 || dayLabel(messages[i - 1].created_at) !== dayLabel(m.created_at);
              return (
                <li key={m.id}>
                  {newDay && <p className="label my-3 text-center !text-[10.5px]">{dayLabel(m.created_at)}</p>}
                  <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`bubble ${mine ? 'bubble-me' : 'bubble-them'}`}>
                      {m.body}
                      <span className={`ml-2 inline-block translate-y-0.5 text-[11px] ${mine ? 'text-white/70' : 'text-[var(--muted)]'}`}>
                        {new Date(m.created_at).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="shrink-0 border-t border-[var(--rule)] bg-[var(--paper)] p-2.5 md:p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
      >
        {error && <p className="mb-2 px-1 text-[13px] text-[var(--bad)]">{error}</p>}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            aria-label="Message"
            placeholder={online ? 'Message' : 'You’re offline'}
            disabled={!online}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void handleSend();
              }
            }}
            className="max-h-36 min-h-11 flex-1 resize-none rounded-[22px] border border-[var(--rule-strong)] bg-[var(--paper)] px-4 py-2.5 leading-snug outline-none focus:border-[var(--navy)]"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          <button
            type="submit"
            disabled={!text.trim() || !online}
            aria-label="Send"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--teal)] text-[#06201d] transition-opacity duration-150 disabled:opacity-40"
          >
            <Icon name="arrow-up" size={20} strokeWidth={2.2} />
          </button>
        </div>
      </form>
    </>
  );
}
