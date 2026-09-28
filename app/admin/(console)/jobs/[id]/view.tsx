'use client';

import Link from 'next/link';

import { DataTable } from '@/components/admin/table';
import { NotFound, QueryError, ViewSkeleton, isNotFound } from '@/components/admin/query-state';
import { Details, Figure, PageHeader, PersonLink, Section, StatusBadge } from '@/components/admin/ui';
import { formatDate, formatDateTime, formatNaira, humanize } from '@/lib/admin/format';
import { useJob } from '@/lib/admin/query/hooks';

export function JobView({ id }: { id: string }) {
  const { data, error, refetch } = useJob(id);
  if (data === null || isNotFound(error)) return <NotFound what="job" href="/admin/jobs" />;
  if (!data) return error ? <QueryError error={error} onRetry={() => refetch()} /> : <ViewSkeleton />;

  const { job, escrow, quotes, disputes, transactions } = data;
  const liveDispute = disputes.find((d) => d.status === 'open' || d.status === 'in_review');

  return (
    <>
      <PageHeader
        back={{ href: '/admin/jobs', label: 'Jobs' }}
        title={job.title}
        meta={
          <>
            <StatusBadge status={job.status} />
            <span>
              {humanize(job.category)} · posted {formatDate(job.created_at)}
            </span>
          </>
        }
        actions={
          liveDispute && (
            <Link href={`/admin/disputes/${liveDispute.id}`} className="btn btn-primary">
              Open dispute {liveDispute.reference}
            </Link>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        <div className="space-y-4 md:space-y-6 lg:col-span-2">
          <Section title="Details">
            {job.description && <p className="mb-5 whitespace-pre-wrap text-[var(--ink)]">{job.description}</p>}
            <Details
              items={[
                { label: 'Client', value: <PersonLink person={data.owner} /> },
                { label: 'Provider', value: <PersonLink person={data.provider} fallback="Not hired yet" /> },
                { label: 'Budget', value: job.budget ? <Figure>{formatNaira(job.budget)}</Figure> : '—' },
                { label: 'Location', value: job.location ?? '—' },
                { label: 'Scheduled for', value: formatDateTime(job.scheduled_for) },
                { label: 'Direct hire', value: job.is_direct ? 'Yes' : 'No' },
              ]}
            />
          </Section>

          <Section title={`Quotes (${quotes.length})`} flush>
            <DataTable
              rows={quotes}
              rowKey={(q) => q.id}
              empty="No quotes yet"
              columns={[
                { key: 'provider', header: 'Provider', cell: (q) => <PersonLink person={q.provider} /> },
                { key: 'status', header: 'Status', cell: (q) => <StatusBadge status={q.status} /> },
                {
                  key: 'materials',
                  header: 'Materials',
                  align: 'right',
                  hideBelow: 'md',
                  cell: (q) => formatNaira(q.materials_cost),
                },
                { key: 'total', header: 'Total', align: 'right', cell: (q) => formatNaira(q.total) },
              ]}
            />
          </Section>

          <Section title="Money movements" flush>
            <DataTable
              rows={transactions}
              rowKey={(t) => t.id}
              empty="No money has moved on this job"
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
          <Section title="Escrow">
            {escrow ? (
              <div className="space-y-5">
                <div>
                  <p className="label !text-[10.5px]">Still held</p>
                  <p className="figure mt-2 text-[30px] font-medium leading-none text-[var(--navy)]">
                    {formatNaira(data.held)}
                  </p>
                </div>
                <Details
                  items={[
                    { label: 'Total', value: <Figure>{formatNaira(escrow.total)}</Figure> },
                    { label: 'Status', value: <StatusBadge status={escrow.status} /> },
                    {
                      label: 'Materials',
                      value: (
                        <>
                          <Figure>{formatNaira(escrow.materials_amount)}</Figure>
                          {escrow.materials_released && <span className="text-[var(--muted)]"> · released</span>}
                        </>
                      ),
                    },
                    { label: 'Completion requested', value: formatDate(escrow.completion_requested_at) },
                  ]}
                />
              </div>
            ) : (
              <p className="text-[var(--muted)]">Not funded yet.</p>
            )}
          </Section>

          {disputes.length > 0 && (
            <Section title="Disputes" flush>
              <ul className="divide-y divide-[var(--rule)]">
                {disputes.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/admin/disputes/${d.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors duration-200 hover:bg-[var(--band)] md:px-5"
                    >
                      <span className="figure text-[13.5px] font-semibold text-[var(--navy)]">{d.reference}</span>
                      <StatusBadge status={d.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </aside>
      </div>
    </>
  );
}
