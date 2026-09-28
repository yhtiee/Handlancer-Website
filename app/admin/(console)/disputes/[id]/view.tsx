'use client';

import Link from 'next/link';

import { ResolveForm } from '@/app/admin/(console)/disputes/[id]/resolve-form';
import { NotFound, QueryError, ViewSkeleton, isNotFound } from '@/components/admin/query-state';
import { Details, Figure, PageHeader, PersonLink, Section, StatusBadge } from '@/components/admin/ui';
import { formatDateTime, formatNaira, humanize } from '@/lib/admin/format';
import { useDispute } from '@/lib/admin/query/hooks';

export function DisputeView({ id }: { id: string }) {
  const { data: d, error, refetch } = useDispute(id);
  if (d === null || isNotFound(error)) return <NotFound what="dispute" href="/admin/disputes" />;
  if (!d) return error ? <QueryError error={error} onRetry={() => refetch()} /> : <ViewSkeleton />;

  const { dispute, job, escrow, quote } = d;

  return (
    <>
      <PageHeader
        back={{ href: '/admin/disputes', label: 'Disputes' }}
        title={<span className="figure !tracking-[-0.02em]">{dispute.reference ?? 'Dispute'}</span>}
        meta={
          <>
            <StatusBadge status={dispute.status} />
            <span>Opened {formatDateTime(dispute.created_at)}</span>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        <div className="space-y-4 md:space-y-6 lg:col-span-2">
          <Section title="What the client reported">
            <p className="whitespace-pre-wrap text-[var(--ink)]">{dispute.reason ?? '—'}</p>
            <div className="mt-5 border-t border-[var(--rule)] pt-5">
              <Details
                items={[
                  { label: 'Category', value: humanize(dispute.category) },
                  { label: 'Outcome they want', value: humanize(dispute.desired_outcome) },
                ]}
              />
            </div>
          </Section>

          <Section title="Parties">
            <Details
              items={[
                { label: 'Client (opened the ticket)', value: <PersonLink person={d.client} /> },
                { label: 'Provider', value: <PersonLink person={d.provider} fallback="None hired" /> },
                {
                  label: 'Job',
                  value: job ? (
                    <Link href={`/admin/jobs/${job.id}`} className="ulink">
                      {job.title}
                    </Link>
                  ) : (
                    'Deleted'
                  ),
                },
                { label: 'Job status', value: job ? <StatusBadge status={job.status} /> : '—' },
              ]}
            />
          </Section>

          <Section title="Escrow">
            {escrow ? (
              <Details
                items={[
                  { label: 'Escrow total', value: <Figure>{formatNaira(escrow.total)}</Figure> },
                  { label: 'Approved quote', value: quote ? <Figure>{formatNaira(quote.total)}</Figure> : '—' },
                  {
                    label: 'Materials portion',
                    value: (
                      <>
                        <Figure>{formatNaira(escrow.materials_amount)}</Figure>
                        {escrow.materials_released && <span className="text-[var(--muted)]"> · already released</span>}
                      </>
                    ),
                  },
                  { label: 'Escrow status', value: <StatusBadge status={escrow.status} /> },
                  {
                    label: 'Still held',
                    value: <Figure className="text-[18px] font-semibold text-[var(--navy)]">{formatNaira(d.held)}</Figure>,
                  },
                ]}
              />
            ) : (
              <p className="text-[var(--muted)]">This job has no escrow, so there is nothing to settle.</p>
            )}
          </Section>
        </div>

        <aside className="lg:sticky lg:top-10 lg:self-start">
          {d.isLive ? (
            <Section title="Settle this dispute">
              {escrow && d.held > 0 ? (
                <ResolveForm disputeId={dispute.id} held={d.held} />
              ) : (
                <p className="text-[var(--muted)]">
                  Nothing is left in escrow to settle. Close this ticket from the Supabase dashboard.
                </p>
              )}
            </Section>
          ) : (
            <Section title="Resolution">
              <Details
                items={[
                  { label: 'Settled', value: formatDateTime(dispute.resolved_at) },
                  { label: 'Released to provider', value: <Figure>{formatNaira(dispute.released_amount)}</Figure> },
                  { label: 'Refunded to client', value: <Figure>{formatNaira(dispute.refunded_amount)}</Figure> },
                ]}
              />
              {dispute.resolution && (
                <p className="mt-5 whitespace-pre-wrap border-t border-[var(--rule)] pt-5 text-[var(--ink)]">
                  {dispute.resolution}
                </p>
              )}
            </Section>
          )}
        </aside>
      </div>
    </>
  );
}
