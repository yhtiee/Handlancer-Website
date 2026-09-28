'use client';

import { ListView } from '@/components/admin/list-view';
import { StatusBadge } from '@/components/admin/ui';
import { formatDate, humanize } from '@/lib/admin/format';
import { useDisputes, useListFilters, usePrefetchDetail } from '@/lib/admin/query/hooks';

const BASE = '/admin/disputes';

export function DisputesView() {
  const { filters } = useListFilters();
  const prefetch = usePrefetchDetail('disputes');
  return (
    <ListView
      query={useDisputes(filters)}
      onRowIntent={(row) => prefetch(row.id)}
      toolbar={{
        searchPlaceholder: 'Search reference or category',
        tabs: [
          { value: undefined, label: 'Live' },
          { value: 'open', label: 'Open' },
          { value: 'in_review', label: 'In review' },
          { value: 'resolved', label: 'Resolved' },
          { value: 'rejected', label: 'Rejected' },
        ],
      }}
      rowKey={(d) => d.id}
      rowHref={(d) => `${BASE}/${d.id}`}
      empty={filters.status ? 'No disputes match' : 'No live disputes'}
      emptyHint={filters.status ? 'Try another filter or search.' : 'Tickets opened in the app will appear here, oldest first.'}
      columns={[
        {
          key: 'ref',
          header: 'Reference',
          cell: (d) => <span className="figure font-semibold text-[var(--navy)]">{d.reference ?? '—'}</span>,
        },
        {
          key: 'job',
          header: 'Job',
          cell: (d) => <span className="line-clamp-1 text-[var(--ink)]">{d.jobTitle}</span>,
        },
        {
          key: 'category',
          header: 'Category',
          hideBelow: 'md',
          cell: (d) => <span className="text-[var(--muted)]">{humanize(d.category)}</span>,
        },
        {
          key: 'by',
          header: 'Opened by',
          hideBelow: 'lg',
          cell: (d) => <span className="text-[var(--muted)]">{d.openedBy?.name ?? '—'}</span>,
        },
        { key: 'status', header: 'Status', cell: (d) => <StatusBadge status={d.status} /> },
        {
          key: 'opened',
          header: 'Opened',
          align: 'right',
          hideBelow: 'sm',
          cell: (d) => <span className="text-[var(--muted)]">{formatDate(d.created_at)}</span>,
        },
      ]}
    />
  );
}
