'use client';

/**
 * My jobs. Ported from the mobile Jobs tabs: segments with real counts (each its
 * own paginated list), and above them the newest things waiting on you. The
 * chosen segment lives in the URL (?tab=) so Back and shared links keep it.
 */
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { LoadMore, Segmented } from '@/components/app/controls';
import { AttentionStrip, ClientJobRow, ProviderJobRow, ProviderQuoteRow } from '@/components/app/rows';
import { ButtonLink, EmptyState, ListSkeleton, PageHeader } from '@/components/app/ui';
import { useAuth } from '@/lib/app/auth';
import { routes } from '@/lib/app/domain/routes';
import { useClientAttention, useProviderMove } from '@/lib/app/hooks/use-attention';
import { useInfiniteList } from '@/lib/app/hooks/use-infinite-list';
import { useMyJobs, useMyJobsCount, useProviderJobs, useProviderJobsCount } from '@/lib/app/queries/use-jobs';
import { useMyQuotes, useMyQuotesCount } from '@/lib/app/queries/use-quotes';
import type { Job } from '@/lib/app/services/database.types';
import type { UserJobSegment } from '@/lib/app/services/jobs';
import type { QuoteWithJob } from '@/lib/app/services/quotes';

export function JobsView() {
  const { profile } = useAuth();
  return profile?.role === 'provider' ? <ProviderJobs /> : <ClientJobs />;
}

/** `?tab=` as the chosen segment, written back with replace (no history spam). */
function useTab<T extends string>(allowed: readonly T[]) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.get('tab');
  const chosen = allowed.includes(raw as T) ? (raw as T) : null;
  const set = (next: T) => router.replace(`${pathname}?tab=${next}`, { scroll: false });
  return [chosen, set] as const;
}

function ClientJobs() {
  const counts = {
    active: useMyJobsCount('active').data,
    open: useMyJobsCount('open').data,
    completed: useMyJobsCount('completed').data,
  };
  const [chosen, setChosen] = useTab<UserJobSegment>(['active', 'open', 'completed']);
  // Until the client picks, open on whatever has jobs: work under way first.
  const segment: UserJobSegment = chosen ?? (counts.active === 0 && (counts.open ?? 0) > 0 ? 'open' : 'active');

  const query = useMyJobs(segment);
  const { items, onEndReached, loadingMore } = useInfiniteList(query);
  const attention = useClientAttention();

  return (
    <>
      <PageHeader
        title="My jobs"
        description="Everything you’ve posted, where the money stands, and what to do next."
        actions={
          <ButtonLink href={routes.postJob} icon="add">
            Post a job
          </ButtonLink>
        }
      />
      <div className="space-y-6">
        <AttentionStrip title="Waiting on you" items={attention} />

        <section className="card enter overflow-hidden">
          <div className="px-2 md:px-3">
            <Segmented<UserJobSegment>
              label="Job groups"
              value={segment}
              onChange={setChosen}
              options={[
                { value: 'active', label: 'Under way', count: counts.active },
                { value: 'open', label: 'Open', count: counts.open },
                { value: 'completed', label: 'Done', count: counts.completed },
              ]}
            />
          </div>
          {query.isLoading ? (
            <ListSkeleton />
          ) : items.length === 0 ? (
            <EmptyState
              title={segment === 'active' ? 'Nothing under way' : segment === 'open' ? 'No open jobs' : 'Nothing finished yet'}
            >
              {segment === 'active'
                ? 'When you hire someone and pay into escrow, the job shows here.'
                : segment === 'open'
                  ? 'Post a job and artisans nearby send you quotes.'
                  : 'Finished and cancelled jobs are kept here.'}
            </EmptyState>
          ) : (
            <div className="divide-y divide-[var(--rule)]">
              {(items as Job[]).map((job) => (
                <ClientJobRow key={job.id} job={job} />
              ))}
            </div>
          )}
          <LoadMore hasMore={!!query.hasNextPage} loading={loadingMore} onLoad={onEndReached} />
        </section>
      </div>
    </>
  );
}

type ProviderSegment = 'active' | 'quotes' | 'completed';

function ProviderJobs() {
  const counts = {
    active: useProviderJobsCount('active').data,
    quotes: useMyQuotesCount().data,
    completed: useProviderJobsCount('completed').data,
  };
  const [chosen, setChosen] = useTab<ProviderSegment>(['active', 'quotes', 'completed']);
  const segment: ProviderSegment = chosen ?? (counts.active === 0 && (counts.quotes ?? 0) > 0 ? 'quotes' : 'active');

  const jobsQ = useProviderJobs(segment === 'completed' ? 'completed' : 'active');
  const quotesQ = useMyQuotes();
  const jobs = useInfiniteList(jobsQ);
  const quotes = useInfiniteList(quotesQ);
  const list = segment === 'quotes' ? quotes : jobs;
  const query = segment === 'quotes' ? quotesQ : jobsQ;
  const move = useProviderMove();

  return (
    <>
      <PageHeader
        title="My jobs"
        description="Work you’ve been hired for, the quotes you’ve sent, and what you’ve been paid."
        actions={
          <ButtonLink href={routes.findWork} icon="search" variant="ghost">
            Find work
          </ButtonLink>
        }
      />
      <div className="space-y-6">
        <AttentionStrip title="Your move" items={move} />

        <section className="card enter overflow-hidden">
          <div className="px-2 md:px-3">
            <Segmented<ProviderSegment>
              label="Job groups"
              value={segment}
              onChange={setChosen}
              options={[
                { value: 'active', label: 'Under way', count: counts.active },
                { value: 'quotes', label: 'Quotes', count: counts.quotes },
                { value: 'completed', label: 'Paid', count: counts.completed },
              ]}
            />
          </div>
          {query.isLoading ? (
            <ListSkeleton />
          ) : list.items.length === 0 ? (
            <EmptyState title={segment === 'quotes' ? 'No quotes yet' : segment === 'active' ? 'Nothing under way' : 'Nothing paid yet'}>
              {segment === 'quotes'
                ? 'Quote on open jobs near you. Your quotes and where they stand show here.'
                : segment === 'active'
                  ? 'When a client accepts your quote and pays into escrow, the job shows here.'
                  : 'Jobs you finish and get paid for are kept here.'}
            </EmptyState>
          ) : (
            <div className="divide-y divide-[var(--rule)]">
              {segment === 'quotes'
                ? (list.items as QuoteWithJob[]).map((q) => <ProviderQuoteRow key={q.id} quote={q} />)
                : (list.items as Job[]).map((j) => <ProviderJobRow key={j.id} job={j} />)}
            </div>
          )}
          <LoadMore hasMore={!!query.hasNextPage} loading={list.loadingMore} onLoad={list.onEndReached} />
        </section>
      </div>
    </>
  );
}
