'use client';

import { ListView } from '@/components/admin/list-view';
import { StatusBadge } from '@/components/admin/ui';
import { formatDate, formatNaira, humanize } from '@/lib/admin/format';
import { useJobs, useListFilters, usePrefetchDetail } from '@/lib/admin/query/hooks';

const BASE = '/admin/jobs';

export function JobsView() {
  const { filters } = useListFilters();
  const prefetch = usePrefetchDetail('jobs');
  return (
    <ListView
      query={useJobs(filters)}
      onRowIntent={(row) => prefetch(row.id)}
      toolbar={{
        searchPlaceholder: 'Search title, category, location',
        tabs: [
          { value: undefined, label: 'All' },
          { value: 'posted', label: 'Posted' },
          { value: 'hiring', label: 'Hiring' },
          { value: 'in_progress', label: 'In progress' },
          { value: 'completed', label: 'Completed' },
          { value: 'disputed', label: 'Disputed' },
          { value: 'cancelled', label: 'Cancelled' },
        ],
      }}
      rowKey={(j) => j.id}
      rowHref={(j) => `${BASE}/${j.id}`}
      empty="No jobs match"
      emptyHint="Try another filter or search."
      columns={[
        {
          key: 'title',
          header: 'Job',
          cell: (j) => (
            <span className="block min-w-0">
              <span className="line-clamp-1 font-semibold text-[var(--navy)]">{j.title}</span>
              <span className="line-clamp-1 text-[13px] text-[var(--muted)]">
                {humanize(j.category)}
                {j.location ? ` · ${j.location}` : ''}
              </span>
            </span>
          ),
        },
        {
          key: 'client',
          header: 'Client',
          hideBelow: 'md',
          cell: (j) => <span className="text-[var(--muted)]">{j.owner?.name ?? '—'}</span>,
        },
        {
          key: 'provider',
          header: 'Provider',
          hideBelow: 'lg',
          cell: (j) => <span className="text-[var(--muted)]">{j.provider?.name ?? '—'}</span>,
        },
        { key: 'status', header: 'Status', cell: (j) => <StatusBadge status={j.status} /> },
        {
          key: 'budget',
          header: 'Budget',
          align: 'right',
          hideBelow: 'sm',
          cell: (j) => (j.budget ? formatNaira(j.budget) : '—'),
        },
        {
          key: 'posted',
          header: 'Posted',
          align: 'right',
          hideBelow: 'lg',
          cell: (j) => <span className="text-[var(--muted)]">{formatDate(j.created_at)}</span>,
        },
      ]}
    />
  );
}
