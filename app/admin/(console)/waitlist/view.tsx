'use client';

import { ListView } from '@/components/admin/list-view';
import { StatusBadge } from '@/components/admin/ui';
import { formatDate } from '@/lib/admin/format';
import { useWaitlist, useListFilters } from '@/lib/admin/query/hooks';
import { CATEGORIES } from '@/lib/site';

const CATEGORY_NAME = new Map<string, string>(CATEGORIES.map((c) => [c.id, c.label]));

export function WaitlistView() {
  const { filters } = useListFilters();
  return (
    <ListView
      query={useWaitlist(filters)}
      toolbar={{
        paramKey: 'role',
        searchPlaceholder: 'Search name, email, city',
        tabs: [
          { value: undefined, label: 'All' },
          { value: 'user', label: 'Clients' },
          { value: 'provider', label: 'Providers' },
        ],
      }}
      rowKey={(w) => w.id}
      empty="No sign-ups match"
      columns={[
        {
          key: 'name',
          header: 'Name',
          cell: (w) => (
            <span className="block min-w-0">
              <span className="line-clamp-1 font-semibold text-[var(--navy)]">{w.name}</span>
              <a href={`mailto:${w.email}`} className="line-clamp-1 text-[13px] text-[var(--muted)] hover:text-[var(--navy)]">
                {w.email}
              </a>
            </span>
          ),
        },
        {
          key: 'role',
          header: 'Joined as',
          cell: (w) => <StatusBadge status={w.role} label={w.role === 'user' ? 'Client' : 'Provider'} />,
        },
        {
          key: 'category',
          header: 'Trade',
          hideBelow: 'md',
          cell: (w) => <span className="text-[var(--muted)]">{CATEGORY_NAME.get(w.category) ?? w.category}</span>,
        },
        { key: 'city', header: 'City', hideBelow: 'sm', cell: (w) => <span className="text-[var(--muted)]">{w.city}</span> },
        {
          key: 'phone',
          header: 'Phone',
          hideBelow: 'lg',
          cell: (w) => <span className="text-[var(--muted)]">{w.phone ?? '—'}</span>,
        },
        {
          key: 'when',
          header: 'Signed up',
          align: 'right',
          hideBelow: 'sm',
          cell: (w) => <span className="text-[var(--muted)]">{formatDate(w.created_at)}</span>,
        },
      ]}
    />
  );
}
