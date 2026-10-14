'use client';

/**
 * The provider's job feed. Ported from mobile (provider)/(tabs)/(find-work):
 * public jobs plus direct invites (RLS decides which), searched and filtered in
 * Postgres, one per row with the budget aligned right.
 */
import { useState } from 'react';

import { LoadMore } from '@/components/app/controls';
import { DiscoveryBar } from '@/components/app/discovery-bar';
import { JobFilterDialog } from '@/components/app/filters';
import { OpenJobRow } from '@/components/app/rows';
import { ButtonLink, EmptyState, ListSkeleton, PageHeader } from '@/components/app/ui';
import { useAuth } from '@/lib/app/auth';
import { SORT_LABELS, countActiveFilters, emptyJobFilters, type JobFilters } from '@/lib/app/domain/job-filters';
import { routes } from '@/lib/app/domain/routes';
import { useDebouncedValue } from '@/lib/app/hooks/use-debounced-value';
import { useInfiniteList } from '@/lib/app/hooks/use-infinite-list';
import { useOpenJobs, useOpenJobsCount } from '@/lib/app/queries/use-discover-jobs';

export function FindWorkView() {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<JobFilters>(emptyJobFilters);
  const [sheetOpen, setSheetOpen] = useState(false);

  const debounced = useDebouncedValue(search);
  const query = useOpenJobs(debounced, filters);
  const { items: jobs, onEndReached, loadingMore } = useInfiniteList(query);
  const { data: total } = useOpenJobsCount(debounced, filters);
  const active = countActiveFilters(filters);
  const area = profile?.location?.split(',')[0]?.trim();

  return (
    <>
      <PageHeader
        title="Find work"
        description={area ? `Open jobs and invites near ${area}. Quote with an itemised price; the client pays into escrow before you start.` : 'Open jobs and invites. Quote with an itemised price; the client pays into escrow before you start.'}
        actions={
          <ButtonLink href={routes.providerQuotes} variant="ghost" icon="document-text">
            My quotes
          </ButtonLink>
        }
      />

      <div className="space-y-4">
        <DiscoveryBar
          search={search}
          onSearch={setSearch}
          placeholder="Search jobs, e.g. sink, wiring, Lekki"
          activeFilters={active}
          onOpenFilters={() => setSheetOpen(true)}
          sort={filters.sort}
          sortLabels={SORT_LABELS}
          onSort={(sort) => setFilters((f) => ({ ...f, sort }))}
          total={total}
          noun={['job', 'jobs']}
        />

        <section className="card enter overflow-hidden">
          {query.isLoading ? (
            <ListSkeleton rows={6} />
          ) : jobs.length === 0 ? (
            <EmptyState title={active || debounced ? 'No jobs match' : 'No open jobs yet'}>
              {active || debounced ? 'Try fewer filters or a different search.' : 'New jobs near you show up here first.'}
            </EmptyState>
          ) : (
            <div className="divide-y divide-[var(--rule)]">
              {jobs.map((j) => (
                <OpenJobRow key={j.id} job={j} />
              ))}
            </div>
          )}
          <LoadMore hasMore={!!query.hasNextPage} loading={loadingMore} onLoad={onEndReached} />
        </section>
      </div>

      <JobFilterDialog
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        value={filters}
        onApply={setFilters}
        search={debounced}
        hasSkills={!!profile?.services?.length}
      />
    </>
  );
}
