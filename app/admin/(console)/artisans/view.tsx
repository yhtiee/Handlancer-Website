'use client';

import { ListView } from '@/components/admin/list-view';
import { StatusBadge } from '@/components/admin/ui';
import { formatDate } from '@/lib/admin/format';
import { serviceLabel } from '@/lib/app/domain/trades';
import { useArtisans, useListFilters, usePrefetchDetail } from '@/lib/admin/query/hooks';

const BASE = '/admin/artisans';

export const ARTISAN_STATUS_LABEL: Record<string, string> = {
  pending: 'To review',
  approved: 'Approved',
  rejected: 'Changes requested',
  suspended: 'Suspended',
  draft: 'Not submitted',
};

export function ArtisansView() {
  const { filters } = useListFilters();
  const prefetch = usePrefetchDetail('artisans');
  const status = filters.status ?? 'pending';

  return (
    <ListView
      query={useArtisans(filters)}
      onRowIntent={(row) => prefetch(row.id)}
      toolbar={{
        searchPlaceholder: 'Search name, phone, area',
        tabs: [
          { value: undefined, label: 'To review' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Changes requested' },
          { value: 'suspended', label: 'Suspended' },
          { value: 'draft', label: 'Not submitted' },
        ],
      }}
      rowKey={(a) => a.id}
      rowHref={(a) => `${BASE}/${a.id}`}
      empty={status === 'pending' ? 'Nothing to review' : 'No artisans here'}
      emptyHint={status === 'pending' ? 'New applications appear here as artisans submit them.' : 'Try another tab or search.'}
      columns={[
        {
          key: 'name',
          header: 'Artisan',
          cell: (a) => (
            <span className="flex min-w-0 items-center gap-3">
              {a.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL.
                <img src={a.avatar_url} alt="" className="size-9 shrink-0 rounded-full object-cover ring-1 ring-[var(--rule-strong)]" />
              ) : (
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--paper)] text-[13px] font-bold uppercase text-[var(--navy)] ring-1 ring-[var(--rule-strong)]">
                  {(a.name ?? '?').charAt(0)}
                </span>
              )}
              <span className="min-w-0">
                <span className="line-clamp-1 font-semibold text-[var(--navy)]">{a.name ?? 'Unnamed'}</span>
                <span className="line-clamp-1 text-[13px] text-[var(--muted)]">{a.phone ?? a.email ?? '—'}</span>
              </span>
            </span>
          ),
        },
        {
          key: 'trades',
          header: 'Trades',
          hideBelow: 'md',
          cell: (a) => <span className="line-clamp-1 text-[var(--muted)]">{a.services?.length ? a.services.map(serviceLabel).join(', ') : '—'}</span>,
        },
        {
          key: 'location',
          header: 'Area',
          hideBelow: 'lg',
          cell: (a) => <span className="line-clamp-1 text-[var(--muted)]">{a.location ?? '—'}</span>,
        },
        {
          key: 'photos',
          header: 'Work photos',
          align: 'right',
          hideBelow: 'lg',
          cell: (a) => <span className="figure">{a.work_photos?.length ?? 0}</span>,
        },
        {
          key: 'status',
          header: 'Status',
          hideBelow: 'sm',
          cell: (a) => <StatusBadge status={a.provider_status ?? 'draft'} label={ARTISAN_STATUS_LABEL[a.provider_status ?? 'draft']} />,
        },
        {
          key: 'when',
          header: status === 'pending' ? 'Submitted' : status === 'draft' ? 'Joined' : 'Reviewed',
          align: 'right',
          cell: (a) => (
            <span className="text-[var(--muted)]">
              {formatDate(status === 'pending' ? a.provider_submitted_at : status === 'draft' ? a.created_at : a.provider_reviewed_at)}
            </span>
          ),
        },
      ]}
    />
  );
}
