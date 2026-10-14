'use client';

/**
 * Browse artisans. Ported from mobile (user)/providers.tsx: real providers only,
 * searched and filtered in Postgres. ?service= arrives from a trade link.
 */
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { LoadMore } from '@/components/app/controls';
import { DiscoveryBar } from '@/components/app/discovery-bar';
import { ProviderFilterDialog } from '@/components/app/filters';
import { ProviderRow } from '@/components/app/rows';
import { ButtonLink, EmptyState, ListSkeleton, PageHeader } from '@/components/app/ui';
import { Categories } from '@/lib/app/constants/categories';
import {
  PROVIDER_SORT_LABELS,
  countActiveProviderFilters,
  emptyProviderFilters,
  type ProviderFilters,
} from '@/lib/app/domain/provider-filters';
import { routes } from '@/lib/app/domain/routes';
import { useDebouncedValue } from '@/lib/app/hooks/use-debounced-value';
import { useInfiniteList } from '@/lib/app/hooks/use-infinite-list';
import { useProviders, useProvidersCount } from '@/lib/app/queries/use-providers';

export function ProvidersView() {
  const params = useSearchParams();
  const preset = params.get('service');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ProviderFilters>(() =>
    preset && Categories.some((c) => c.id === preset) ? { ...emptyProviderFilters, services: [preset] } : emptyProviderFilters,
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const debounced = useDebouncedValue(search);
  const query = useProviders(debounced, filters);
  const { items: providers, onEndReached, loadingMore } = useInfiniteList(query);
  const { data: total } = useProvidersCount(debounced, filters);
  const active = countActiveProviderFilters(filters);

  return (
    <>
      <PageHeader
        title="Artisans"
        description="Verified tradespeople near you. Open one to see their finished work, then ask for a quote."
        actions={
          <ButtonLink href={routes.postJob} icon="add">
            Post a job instead
          </ButtonLink>
        }
      />

      <div className="space-y-4">
        <DiscoveryBar
          search={search}
          onSearch={setSearch}
          placeholder="Search a name, trade or area"
          activeFilters={active}
          onOpenFilters={() => setSheetOpen(true)}
          sort={filters.sort}
          sortLabels={PROVIDER_SORT_LABELS}
          onSort={(sort) => setFilters((f) => ({ ...f, sort }))}
          total={total}
          noun={['artisan', 'artisans']}
        />

        <section className="card enter overflow-hidden">
          {query.isLoading ? (
            <ListSkeleton rows={6} />
          ) : providers.length === 0 ? (
            <EmptyState title={active || debounced ? 'No artisans match' : 'No artisans yet'}>
              {active || debounced ? 'Try fewer filters, or post the job and let artisans come to you.' : 'Tradespeople near you will show up here as they join.'}
            </EmptyState>
          ) : (
            <div className="divide-y divide-[var(--rule)]">
              {providers.map((p) => (
                <ProviderRow key={p.id} provider={p} />
              ))}
            </div>
          )}
          <LoadMore hasMore={!!query.hasNextPage} loading={loadingMore} onLoad={onEndReached} />
        </section>
      </div>

      <ProviderFilterDialog open={sheetOpen} onClose={() => setSheetOpen(false)} value={filters} onApply={setFilters} search={debounced} />
    </>
  );
}
