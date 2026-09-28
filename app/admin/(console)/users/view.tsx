'use client';

import { ListView } from '@/components/admin/list-view';
import { StatusBadge } from '@/components/admin/ui';
import { formatDate } from '@/lib/admin/format';
import { useUsers, useListFilters, usePrefetchDetail } from '@/lib/admin/query/hooks';

const BASE = '/admin/users';

export function UsersView() {
  const { filters } = useListFilters();
  const prefetch = usePrefetchDetail('users');
  return (
    <ListView
      query={useUsers(filters)}
      onRowIntent={(row) => prefetch(row.id)}
      toolbar={{
        paramKey: 'role',
        searchPlaceholder: 'Search name, email, phone',
        tabs: [
          { value: undefined, label: 'All' },
          { value: 'user', label: 'Clients' },
          { value: 'provider', label: 'Providers' },
        ],
      }}
      rowKey={(u) => u.id}
      rowHref={(u) => `${BASE}/${u.id}`}
      empty="No users match"
      emptyHint="Try another filter or search."
      columns={[
        {
          key: 'name',
          header: 'Name',
          cell: (u) => (
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--paper)] text-[13px] font-bold uppercase text-[var(--navy)] ring-1 ring-[var(--rule-strong)]">
                {(u.name ?? u.email ?? '?').charAt(0)}
              </span>
              <span className="min-w-0">
                <span className="line-clamp-1 font-semibold text-[var(--navy)]">
                  {u.name ?? 'Unnamed'}
                  {u.is_verified && (
                    <span className="ml-1.5 text-[12px] font-normal text-[var(--muted)]">· Verified</span>
                  )}
                </span>
                <span className="line-clamp-1 text-[13px] text-[var(--muted)]">{u.email ?? u.phone ?? '—'}</span>
              </span>
            </span>
          ),
        },
        {
          key: 'role',
          header: 'Role',
          cell: (u) => <StatusBadge status={u.role} label={u.role === 'user' ? 'Client' : 'Provider'} />,
        },
        {
          key: 'location',
          header: 'Location',
          hideBelow: 'lg',
          cell: (u) => <span className="text-[var(--muted)]">{u.location ?? '—'}</span>,
        },
        {
          key: 'rating',
          header: 'Rating',
          align: 'right',
          hideBelow: 'md',
          cell: (u) => (u.role === 'provider' && u.rating ? Number(u.rating).toFixed(1) : '—'),
        },
        {
          key: 'joined',
          header: 'Joined',
          align: 'right',
          hideBelow: 'sm',
          cell: (u) => <span className="text-[var(--muted)]">{formatDate(u.created_at)}</span>,
        },
      ]}
    />
  );
}
