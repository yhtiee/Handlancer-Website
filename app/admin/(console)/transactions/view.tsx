'use client';

import Link from 'next/link';

import { ListView } from '@/components/admin/list-view';
import { StatusBadge } from '@/components/admin/ui';
import { formatDateTime, formatNaira, humanize } from '@/lib/admin/format';
import { useTransactions, useListFilters } from '@/lib/admin/query/hooks';

const CREDIT = new Set(['fund', 'escrow_release', 'payout']);

export function TransactionsView() {
  const { filters } = useListFilters();
  return (
    <ListView
      query={useTransactions(filters)}
      toolbar={{
        paramKey: 'type',
        searchPlaceholder: 'Search Flutterwave reference',
        tabs: [
          { value: undefined, label: 'All' },
          { value: 'fund', label: 'Top-ups' },
          { value: 'withdraw', label: 'Withdrawals' },
          { value: 'escrow_hold', label: 'Escrow holds' },
          { value: 'escrow_release', label: 'Releases' },
          { value: 'payout', label: 'Payouts' },
        ],
      }}
      rowKey={(t) => t.id}
      empty="No transactions match"
      emptyHint="Try another filter or search."
      columns={[
        {
          key: 'type',
          header: 'Type',
          cell: (t) => (
            <span className="block min-w-0">
              <span className="font-semibold text-[var(--navy)]">{humanize(t.type)}</span>
              <span className="figure block truncate text-[12px] text-[var(--muted)]">{t.reference ?? '—'}</span>
            </span>
          ),
        },
        {
          key: 'owner',
          header: 'Account',
          hideBelow: 'md',
          cell: (t) =>
            t.owner ? (
              <Link href={`/admin/users/${t.owner.id}`} className="text-[var(--ink)] hover:text-[var(--navy)] hover:underline">
                {t.owner.name ?? t.owner.email ?? 'Unnamed'}
              </Link>
            ) : (
              '—'
            ),
        },
        {
          key: 'job',
          header: 'Job',
          hideBelow: 'lg',
          cell: (t) =>
            t.job_id ? (
              <Link href={`/admin/jobs/${t.job_id}`} className="text-[var(--muted)] hover:text-[var(--navy)] hover:underline">
                View job
              </Link>
            ) : (
              <span className="text-[var(--muted)]">—</span>
            ),
        },
        { key: 'status', header: 'Status', cell: (t) => <StatusBadge status={t.status} /> },
        {
          key: 'amount',
          header: 'Amount',
          align: 'right',
          cell: (t) => (
            <span className="font-semibold text-[var(--ink)]">
              {CREDIT.has(t.type) ? '+' : '−'}
              {formatNaira(t.amount)}
            </span>
          ),
        },
        {
          key: 'when',
          header: 'When',
          align: 'right',
          hideBelow: 'sm',
          cell: (t) => <span className="text-[var(--muted)]">{formatDateTime(t.created_at)}</span>,
        },
      ]}
    />
  );
}
