'use client';

import Link from 'next/link';

import { IconArrowUpRight } from '@/components/admin/icons';
import { QueryError, ViewSkeleton } from '@/components/admin/query-state';
import { DataTable } from '@/components/admin/table';
import { EmptyState, Section, StatTile, StatusBadge } from '@/components/admin/ui';
import type { Overview } from '@/lib/admin/data/overview';
import { formatCount, formatDate, formatNaira, formatNairaCompact, humanize } from '@/lib/admin/format';
import { useOverview, usePrefetchDetail } from '@/lib/admin/query/hooks';

/**
 * The overview's numbers, from useOverview(). Refetches when the tab regains
 * focus and after any settlement, so the escrow figure is never a snapshot
 * from whenever the page was opened.
 */
export function OverviewView() {
  const { data: o, error, refetch } = useOverview();
  const prefetchJob = usePrefetchDetail('jobs');
  if (!o) return error ? <QueryError error={error} onRetry={() => refetch()} /> : <ViewSkeleton />;

  return (
    <>
      {/* Bento on the services-grid idiom: the 1px gaps are the borders. The
          one hero figure sits left; four tiles fill the right. */}
      <div className="ruled-grid enter grid-cols-2 lg:grid-cols-4">
        <div className="col-span-2 flex flex-col justify-between p-5 md:p-7 lg:row-span-2">
          <div>
            <p className="label">Held in escrow</p>
            <p className="figure mt-4 text-[44px] font-medium leading-none text-[var(--navy)] md:text-[56px]">
              {formatNairaCompact(o.escrowHeld)}
            </p>
            <p className="lede mt-3 !text-[16.5px]">
              across <span className="figure not-italic text-[var(--ink)]">{formatCount(o.liveEscrows)}</span> live{' '}
              {o.liveEscrows === 1 ? 'job' : 'jobs'}
            </p>
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-[var(--rule)] pt-5">
            <div>
              <dt className="label !text-[10.5px]">Pending withdrawals</dt>
              <dd className="figure mt-1.5 font-medium text-[var(--ink)]">
                {formatNaira(o.pendingWithdrawalTotal)}
                <span className="ml-1.5 text-[var(--muted)]">· {o.pendingWithdrawalCount}</span>
              </dd>
            </div>
            <div>
              <dt className="label !text-[10.5px]">Waitlist</dt>
              <dd className="mt-1.5 font-medium text-[var(--ink)]">
                {o.waitlist === null ? (
                  <span className="text-[var(--muted)]">Not set up</span>
                ) : (
                  <span className="figure">{formatCount(o.waitlist)}</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <StatTile
          label="Open disputes"
          value={formatCount(o.openDisputes)}
          hint={o.openDisputes > 0 ? 'Escrow frozen until settled' : 'All clear'}
          href="/admin/disputes"
        />
        <StatTile
          label="New sign-ups"
          value={formatCount(o.signupsThisWeek)}
          delta={{ value: o.signupsThisWeek - o.signupsLastWeek, period: 'last week' }}
          href="/admin/users"
        />
        <StatTile label="Clients" value={formatCount(o.clients, true)} href="/admin/users?role=user" />
        <StatTile label="Providers" value={formatCount(o.providers, true)} href="/admin/users?role=provider" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:mt-6 md:gap-6 lg:grid-cols-5">
        <Section title="Needs attention" className="lg:col-span-3" flush action={<ViewAll href="/admin/disputes" />}>
          <DisputeQueue rows={o.recentDisputes} />
        </Section>

        <Section title="Jobs by status" className="lg:col-span-2">
          <JobsByStatus rows={o.jobsByStatus} />
        </Section>
      </div>

      <Section title="Recent jobs" className="mt-4 md:mt-6" flush action={<ViewAll href="/admin/jobs" />}>
        <DataTable
          rows={o.recentJobs}
          rowKey={(j) => j.id}
          rowHref={(j) => `/admin/jobs/${j.id}`}
          onRowIntent={(j) => prefetchJob(j.id)}
          empty="No jobs posted yet"
          columns={[
            {
              key: 'title',
              header: 'Job',
              cell: (j) => <span className="font-semibold text-[var(--navy)]">{j.title}</span>,
            },
            {
              key: 'owner',
              header: 'Client',
              hideBelow: 'md',
              cell: (j) => <span className="text-[var(--muted)]">{j.owner?.name ?? '—'}</span>,
            },
            { key: 'status', header: 'Status', cell: (j) => <StatusBadge status={j.status} /> },
            {
              key: 'budget',
              header: 'Budget',
              align: 'right',
              hideBelow: 'sm',
              cell: (j) => <span className="text-[var(--ink)]">{j.budget ? formatNaira(j.budget) : '—'}</span>,
            },
            {
              key: 'created',
              header: 'Posted',
              align: 'right',
              hideBelow: 'lg',
              cell: (j) => <span className="text-[var(--muted)]">{formatDate(j.created_at)}</span>,
            },
          ]}
        />
      </Section>
    </>
  );
}

/** The site's `.ulink` quiet sibling: mono label that inks on hover. */
function ViewAll({ href }: { href: string }) {
  return (
    <Link href={href} className="label inline-flex items-center gap-1 !text-[10.5px] transition-colors duration-200 hover:!text-[var(--ink)]">
      View all
      <IconArrowUpRight width={13} height={13} />
    </Link>
  );
}

function DisputeQueue({ rows }: { rows: Overview['recentDisputes'] }) {
  if (rows.length === 0) {
    return <EmptyState title="No open disputes">New tickets from the app will appear here, oldest first.</EmptyState>;
  }
  return (
    <ul className="divide-y divide-[var(--rule)]">
      {rows.map((d) => (
        <li key={d.id}>
          <Link
            href={`/admin/disputes/${d.id}`}
            className="flex items-center gap-3 px-4 py-4 transition-colors duration-200 hover:bg-[var(--band)] md:px-5"
          >
            <div className="min-w-0 flex-1">
              <p className="figure text-[13.5px] font-semibold text-[var(--navy)]">{d.reference ?? '—'}</p>
              <p className="mt-0.5 truncate text-[13px] text-[var(--muted)]">
                {humanize(d.category)} · opened {formatDate(d.created_at)}
              </p>
            </div>
            <StatusBadge status={d.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Magnitude across a fixed set of states: one hue (teal fill, never type) on a
 * --band track, labels in ink, counts in the figure face. The list itself is
 * the table view.
 */
function JobsByStatus({ rows }: { rows: Overview['jobsByStatus'] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <ul className="space-y-3.5">
      {rows.map((r) => (
        <li key={r.status}>
          <Link
            href={`/admin/jobs?status=${r.status}`}
            className="group block"
            title={`${humanize(r.status)}: ${formatCount(r.count)} of ${formatCount(total)} jobs`}
          >
            <div className="mb-1.5 flex items-baseline justify-between text-[13.5px]">
              <span className="text-[var(--ink)] transition-colors duration-200 group-hover:text-[var(--navy)]">
                {humanize(r.status)}
              </span>
              <span className="figure font-medium text-[var(--ink)]">{formatCount(r.count)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--band)]">
              <div
                className="h-full rounded-full bg-[var(--teal)] transition-[width] duration-500 ease-out"
                style={{ width: `${r.count === 0 ? 0 : Math.max(2, (r.count / max) * 100)}%` }}
              />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
