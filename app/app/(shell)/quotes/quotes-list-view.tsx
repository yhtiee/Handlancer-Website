'use client';

/**
 * The provider's quotes, by where they stand. Ported from mobile
 * (provider)/quotes/index.tsx — each group filtered and counted in Postgres.
 */
import { useState } from 'react';

import { LoadMore, Segmented } from '@/components/app/controls';
import { ProviderQuoteRow } from '@/components/app/rows';
import { EmptyState, ListSkeleton, PageHeader } from '@/components/app/ui';
import { routes } from '@/lib/app/domain/routes';
import { useInfiniteList } from '@/lib/app/hooks/use-infinite-list';
import { useMyQuotes, useMyQuotesCount } from '@/lib/app/queries/use-quotes';
import type { QuoteStatus } from '@/lib/app/services/database.types';

type Group = 'waiting' | 'accepted' | 'declined';

const STATUSES: Record<Group, QuoteStatus[]> = {
  waiting: ['submitted', 'revised'],
  accepted: ['approved'],
  declined: ['rejected'],
};

const EMPTY: Record<Group, { title: string; description: string }> = {
  waiting: { title: 'Nothing waiting', description: 'Quotes you send show here until the client decides.' },
  accepted: { title: 'None accepted yet', description: 'When a client accepts your quote, it moves here.' },
  declined: { title: 'Nothing declined', description: 'Quotes a client didn’t choose are kept here.' },
};

export function QuotesListView() {
  const [group, setGroup] = useState<Group>('waiting');
  const counts = {
    waiting: useMyQuotesCount(STATUSES.waiting).data,
    accepted: useMyQuotesCount(STATUSES.accepted).data,
    declined: useMyQuotesCount(STATUSES.declined).data,
  };
  const query = useMyQuotes(STATUSES[group]);
  const { items, onEndReached, loadingMore } = useInfiniteList(query);

  return (
    <>
      <PageHeader title="Your quotes" description="Every quote you’ve sent, and where it stands." back={{ href: routes.myJobs, label: 'My jobs' }} />
      <section className="card enter overflow-hidden">
        <div className="px-2 md:px-3">
          <Segmented<Group>
            label="Quote groups"
            value={group}
            onChange={setGroup}
            options={[
              { value: 'waiting', label: 'Waiting', count: counts.waiting },
              { value: 'accepted', label: 'Accepted', count: counts.accepted },
              { value: 'declined', label: 'Not chosen', count: counts.declined },
            ]}
          />
        </div>
        {query.isLoading ? (
          <ListSkeleton />
        ) : items.length === 0 ? (
          <EmptyState title={EMPTY[group].title}>{EMPTY[group].description}</EmptyState>
        ) : (
          <div className="divide-y divide-[var(--rule)]">
            {items.map((q) => (
              <ProviderQuoteRow key={q.id} quote={q} />
            ))}
          </div>
        )}
        <LoadMore hasMore={!!query.hasNextPage} loading={loadingMore} onLoad={onEndReached} />
      </section>
    </>
  );
}
