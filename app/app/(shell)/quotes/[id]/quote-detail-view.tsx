'use client';

/**
 * One sent quote. Ported from mobile (provider)/quotes/[id].tsx: where it
 * stands in a sentence, what it charges (labour and materials, as escrow pays
 * them), the note, and the one thing to do.
 */
import { useParams } from 'next/navigation';

import { ButtonLink, EmptyState, Money, PageHeader, Section, Skeleton } from '@/components/app/ui';
import { timeAgo } from '@/lib/app/domain/date';
import { routes } from '@/lib/app/domain/routes';
import { useProvider } from '@/lib/app/queries/use-providers';
import { useQuote } from '@/lib/app/queries/use-quotes';
import type { QuoteLineItem } from '@/lib/app/services/database.types';

export function QuoteDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data: quote, isLoading } = useQuote(id);
  const { data: client } = useProvider(quote?.job?.owner_id ?? '');

  if (isLoading) return <Skeleton className="h-64" />;
  if (!quote) {
    return (
      <div className="card">
        <EmptyState title="Quote not found" />
      </div>
    );
  }

  const who = client?.name?.trim().split(' ')[0] ?? 'The client';
  const job = quote.job;
  const jobOpen = job?.status === 'posted' || job?.status === 'hiring';
  const hired = quote.status === 'approved' && (job?.status === 'in_progress' || job?.status === 'completed' || job?.status === 'disputed');
  const state =
    quote.status === 'rejected'
      ? { headline: 'Not chosen', detail: `${who} went with another quote.` }
      : hired
        ? { headline: 'You’re hired', detail: `${who} paid into escrow. The job is under way.` }
        : quote.status === 'approved'
          ? { headline: 'Accepted', detail: `Waiting for ${who} to pay into escrow. Don’t start until they do.` }
          : jobOpen
            ? { headline: `Waiting for ${who} to decide`, detail: 'You can change your quote until they accept one.' }
            : { headline: 'This job is closed', detail: 'The client is no longer taking quotes.' };

  const labour = quote.line_items.filter((i) => i.type === 'labor');
  const materials = quote.line_items.filter((i) => i.type === 'material');

  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeader
        back={{ href: routes.providerQuotes, label: 'Your quotes' }}
        title={job?.title ?? 'Job'}
        description={[client?.name, job?.location, `sent ${timeAgo(quote.created_at)}`].filter(Boolean).join(' · ')}
      />
      <div className="space-y-6">
        <section className="card enter border-l-[3px] !border-l-[var(--teal)] p-5 md:p-6">
          <h2 className="!text-[22px]">{state.headline}</h2>
          <p className="mt-1.5 text-[15px] text-[var(--muted)]">{state.detail}</p>
          {hired ? (
            <div className="mt-4">
              <ButtonLink href={routes.providerJobDetail(quote.job_id)} variant="ghost">
                Go to the job
              </ButtonLink>
            </div>
          ) : jobOpen && quote.status !== 'rejected' && quote.status !== 'approved' ? (
            <div className="mt-4">
              <ButtonLink href={routes.applyToJob(quote.job_id)} variant="ghost" icon="create">
                Change my quote
              </ButtonLink>
            </div>
          ) : null}
        </section>

        <Section title="What it charges">
          <div className="space-y-5">
            <Lines title="Labour" items={labour} total={quote.labor_cost} />
            {materials.length > 0 && <Lines title="Materials" items={materials} total={quote.materials_cost} />}
            <div className="flex items-baseline justify-between border-t-[1.5px] border-[var(--ink)] pt-3">
              <p className="font-semibold text-[var(--ink)]">Total</p>
              <Money amount={quote.total} className="text-[22px] font-semibold text-[var(--ink)]" />
            </div>
            {job?.budget != null && (
              <p className="-mt-3 text-[13.5px] text-[var(--muted)]">
                Their budget was <Money amount={job.budget} />
              </p>
            )}
          </div>
        </Section>

        {quote.message && (
          <Section title="Your note">
            <p className="whitespace-pre-wrap text-[15px] italic text-[var(--ink)]">“{quote.message}”</p>
          </Section>
        )}
      </div>
    </div>
  );
}

function Lines({ title, items, total }: { title: string; items: QuoteLineItem[]; total: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="font-semibold text-[var(--ink)]">{title}</p>
        <Money amount={total} className="font-semibold text-[var(--ink)]" />
      </div>
      <ul className="mt-1.5 divide-y divide-[var(--rule)]">
        {items.map((item, i) => (
          <li key={i} className="flex justify-between gap-3 py-2 text-[14.5px] text-[var(--muted)]">
            <span className="min-w-0">{item.label}</span>
            <Money amount={item.amount} />
          </li>
        ))}
      </ul>
    </div>
  );
}
