'use client';

import { DataTable } from '@/components/admin/table';
import { NotFound, QueryError, ViewSkeleton, isNotFound } from '@/components/admin/query-state';
import { Details, Figure, PageHeader, Section, StatusBadge } from '@/components/admin/ui';
import { formatDate, formatDateTime, formatNaira, humanize } from '@/lib/admin/format';
import { useUser } from '@/lib/admin/query/hooks';

export function UserView({ id }: { id: string }) {
  const { data, error, refetch } = useUser(id);
  if (data === null || isNotFound(error)) return <NotFound what="user" href="/admin/users" />;
  if (!data) return error ? <QueryError error={error} onRetry={() => refetch()} /> : <ViewSkeleton />;

  const { profile: p, wallet, security, jobs, transactions } = data;
  const isProvider = p.role === 'provider';
  const pinLocked = security?.pin_locked_until && new Date(security.pin_locked_until) > new Date();

  return (
    <>
      <PageHeader
        back={{ href: '/admin/users', label: 'Users' }}
        title={
          <span className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--paper)] text-[18px] font-bold uppercase text-[var(--navy)] ring-1 ring-[var(--rule-strong)]">
              {(p.name ?? p.email ?? '?').charAt(0)}
            </span>
            <span className="min-w-0">{p.name ?? 'Unnamed'}</span>
          </span>
        }
        meta={
          <>
            <StatusBadge status={p.role} label={isProvider ? 'Provider' : 'Client'} />
            {p.is_verified && <StatusBadge status="success" label="Verified" />}
            <span>Joined {formatDate(p.created_at)}</span>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        <div className="space-y-4 md:space-y-6 lg:col-span-2">
          <Section title="Profile">
            {p.bio && <p className="mb-5 whitespace-pre-wrap text-[var(--ink)]">{p.bio}</p>}
            <Details
              items={[
                { label: 'Email', value: p.email },
                { label: 'Phone', value: p.phone },
                { label: 'Location', value: p.location },
                ...(isProvider
                  ? [
                      { label: 'Business name', value: p.business_name },
                      { label: 'Availability', value: humanize(p.availability) },
                      { label: 'Rating', value: p.rating ? <Figure>{Number(p.rating).toFixed(1)}</Figure> : '—' },
                      { label: 'Hourly rate', value: p.hourly_rate ? <Figure>{formatNaira(p.hourly_rate)}</Figure> : '—' },
                      { label: 'Experience', value: p.years_experience != null ? `${p.years_experience} yrs` : '—' },
                      { label: 'Services', value: p.services?.length ? p.services.join(', ') : '—' },
                    ]
                  : []),
              ]}
            />
          </Section>

          <Section title="Jobs" flush>
            <DataTable
              rows={jobs}
              rowKey={(j) => j.id}
              rowHref={(j) => `/admin/jobs/${j.id}`}
              empty="No jobs yet"
              columns={[
                { key: 'title', header: 'Job', cell: (j) => <span className="font-semibold text-[var(--navy)]">{j.title}</span> },
                { key: 'status', header: 'Status', cell: (j) => <StatusBadge status={j.status} /> },
                {
                  key: 'budget',
                  header: 'Budget',
                  align: 'right',
                  hideBelow: 'sm',
                  cell: (j) => (j.budget ? formatNaira(j.budget) : '—'),
                },
              ]}
            />
          </Section>

          <Section title="Recent transactions" flush>
            <DataTable
              rows={transactions}
              rowKey={(t) => t.id}
              empty="No transactions yet"
              columns={[
                { key: 'type', header: 'Type', cell: (t) => humanize(t.type) },
                { key: 'status', header: 'Status', cell: (t) => <StatusBadge status={t.status} /> },
                { key: 'amount', header: 'Amount', align: 'right', cell: (t) => formatNaira(t.amount) },
                {
                  key: 'when',
                  header: 'When',
                  align: 'right',
                  hideBelow: 'sm',
                  cell: (t) => <span className="text-[var(--muted)]">{formatDateTime(t.created_at)}</span>,
                },
              ]}
            />
          </Section>
        </div>

        <aside className="space-y-4 md:space-y-6 lg:sticky lg:top-10 lg:self-start">
          <Section title="Wallet">
            <p className="label !text-[10.5px]">Balance</p>
            <p className="figure mt-2 text-[30px] font-medium leading-none text-[var(--navy)]">
              {wallet ? formatNaira(wallet.balance) : '—'}
            </p>
          </Section>

          <Section title="Payout security">
            <Details
              items={[
                { label: 'Transfer PIN', value: security?.pin_set_at ? (pinLocked ? 'Set · locked' : 'Set') : 'Not set' },
                { label: 'Bank', value: security?.bank_name },
                { label: 'Account name', value: security?.account_name },
                { label: 'Bank verified', value: formatDate(security?.bank_verified_at) },
              ]}
            />
          </Section>
        </aside>
      </div>
    </>
  );
}
