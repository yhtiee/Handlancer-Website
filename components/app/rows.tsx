'use client';

/**
 * List rows, ported from mobile components/jobs/job-list-rows.tsx,
 * components/jobs/job-row.tsx and components/providers/provider-row.tsx.
 *
 * Each row loads only its own escrow / quotes / person, and TanStack dedupes
 * them, so a page of twenty rows is twenty small cached reads, not a waterfall.
 * Every row is one link to the job, with at most one action button — the next
 * step from lib/app/domain/job-state.ts, so a row and its job screen always
 * agree about what happens next.
 */
import Link from 'next/link';

import { Icon } from '@/components/app/icon';
import { Avatar, EscrowTape, escrowAmounts } from '@/components/app/ui';
import { categoryLabel } from '@/lib/app/constants/categories';
import { timeAgo } from '@/lib/app/domain/date';
import { jobNextStep, providerNextStep } from '@/lib/app/domain/job-state';
import { formatMoney } from '@/lib/app/domain/money';
import { categoryPhoto, providerImageFallback } from '@/lib/app/domain/provider-images';
import { routes } from '@/lib/app/domain/routes';
import { serviceLabel } from '@/lib/app/domain/trades';
import { useProvider } from '@/lib/app/queries/use-providers';
import { useJobQuotes } from '@/lib/app/queries/use-quotes';
import { useMyReviewForJob } from '@/lib/app/queries/use-reviews';
import { useEscrow } from '@/lib/app/queries/use-wallet';
import type { Escrow, Job, Profile } from '@/lib/app/services/database.types';
import type { QuoteWithJob } from '@/lib/app/services/quotes';

/**
 * A small action inside a row; teal when it moves money. The row's title link
 * is stretched over the whole row (admin table idiom), so this sits above it
 * as its own link rather than a control nested inside another link.
 */
function RowAction({ label, money, href }: { label: string; money?: boolean; href: string }) {
  return (
    <Link
      href={href}
      className={`relative z-10 inline-flex h-8 items-center rounded-full px-3.5 text-[13px] font-semibold transition-colors duration-150 ${
        money ? 'bg-[var(--teal)] text-[#06201d] hover:bg-[#0da294]' : 'bg-[var(--band-deep)] text-[var(--ink)] hover:bg-[var(--rule-strong)]'
      }`}
    >
      {label}
    </Link>
  );
}

/** A square photo: the person doing the job, or the trade's workshop shot. */
export function Thumb({ src, size = 48 }: { src: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- avatar URLs come from Supabase Storage on any host.
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      className="shrink-0 rounded-md bg-[var(--band)] object-cover object-top"
      style={{ width: size, height: size }}
    />
  );
}

function Row({
  href,
  leading,
  title,
  amount,
  line,
  attention,
  escrow,
  action,
  dim,
}: {
  href: string;
  leading?: React.ReactNode;
  title: string;
  amount?: string | null;
  line: string;
  attention?: boolean;
  escrow?: Escrow | null;
  action?: React.ReactNode;
  dim?: boolean;
}) {
  return (
    <div className="relative flex gap-3 px-4 py-3.5 transition-colors duration-150 has-[a:hover]:bg-[var(--band)] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-[var(--navy)] md:px-5">
      {leading}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline gap-3">
          <Link
            href={href}
            className={`min-w-0 flex-1 truncate font-semibold outline-none after:absolute after:inset-0 after:content-[''] ${dim ? 'text-[var(--muted)]' : 'text-[var(--ink)]'}`}
          >
            {title}
          </Link>
          {amount && (
            <span className={`figure shrink-0 text-[14px] font-medium ${dim ? 'text-[var(--muted)]' : 'text-[var(--ink)]'}`}>{amount}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {attention && <span className="size-2 shrink-0 rounded-full bg-[var(--teal)]" aria-hidden="true" />}
          <p className={`min-w-0 flex-1 truncate text-[13.5px] ${attention ? 'font-semibold text-[var(--ink)]' : 'text-[var(--muted)]'}`}>
            {line}
          </p>
        </div>
        {escrow && escrow.status !== 'pending' && <EscrowTape escrow={escrow} size="row" labelled={false} />}
        {action && <div className="pt-1">{action}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────── Client ───────────────────────────

export function ClientJobRow({ job }: { job: Job }) {
  const open = job.status === 'draft' || job.status === 'posted' || job.status === 'hiring';
  const { data: escrow } = useEscrow(job.status === 'draft' || job.status === 'posted' ? '' : job.id);
  const { data: quotes } = useJobQuotes(open ? job.id : '');
  const { data: provider } = useProvider(job.hired_provider_id ?? '');
  const reviewable = job.status === 'completed' && !!job.hired_provider_id;
  const { data: review, isLoading: reviewLoading } = useMyReviewForJob(reviewable ? job.id : '');

  const step = jobNextStep(job, escrow, quotes, provider?.name);
  const needs = step.lane === 'needs';

  const amount =
    job.status === 'in_progress' && escrow && escrow.status !== 'pending'
      ? `${formatMoney(escrowAmounts(escrow).held)} held`
      : job.status === 'completed' && escrow
        ? formatMoney(escrow.total)
        : job.budget != null
          ? formatMoney(job.budget)
          : null;

  const line =
    step.lane === 'done'
      ? [job.status === 'completed' ? 'Finished' : 'Cancelled', provider?.name ? `with ${provider.name.split(' ')[0]}` : null, timeAgo(job.created_at)]
          .filter(Boolean)
          .join(' · ')
      : step.lane === 'waiting'
        ? `Posted ${timeAgo(job.created_at)} · no quotes yet`
        : step.headline;

  const action =
    needs && step.action ? (
      <RowAction label={step.action.label} money={step.action.money} href={step.action.href} />
    ) : reviewable && !reviewLoading && !review ? (
      <RowAction label="Leave a review" href={routes.reviewJob(job.id)} />
    ) : null;

  return (
    <Row
      href={routes.jobDetail(job.id)}
      leading={<Thumb src={provider ? (provider.avatar_url ?? providerImageFallback(provider)) : categoryPhoto(job.category ?? 'other')} />}
      title={job.title}
      amount={amount}
      line={line}
      attention={needs}
      escrow={job.status === 'in_progress' ? escrow : null}
      action={action}
      dim={job.status === 'cancelled'}
    />
  );
}

// ─────────────────────────── Provider ───────────────────────────

export function ProviderJobRow({ job }: { job: Job }) {
  const { data: escrow } = useEscrow(job.id);
  const { data: client } = useProvider(job.owner_id);
  const step = providerNextStep(job, escrow, client?.name);
  const yours = step.lane === 'yours';
  const href = routes.providerJobDetail(job.id);

  const amount =
    job.status === 'completed' && escrow
      ? formatMoney(escrow.total)
      : escrow && escrow.status !== 'pending'
        ? `${formatMoney(escrowAmounts(escrow).held)} to come`
        : null;

  const line =
    step.lane === 'done'
      ? [client?.name ? `For ${client.name.split(' ')[0]}` : null, job.location, timeAgo(job.created_at)].filter(Boolean).join(' · ')
      : step.headline;

  return (
    <Row
      href={href}
      leading={<Avatar src={client?.avatar_url} name={client?.name} size={48} />}
      title={job.title}
      amount={amount}
      line={line}
      attention={yours}
      escrow={job.status === 'in_progress' ? escrow : null}
      action={yours && step.action ? <RowAction label={step.action.label} money={step.action.money} href={href} /> : null}
    />
  );
}

export function ProviderQuoteRow({ quote }: { quote: QuoteWithJob }) {
  const line =
    quote.status === 'approved'
      ? 'Accepted · waiting for payment'
      : quote.status === 'rejected'
        ? 'Not chosen'
        : `Sent ${timeAgo(quote.created_at)} · waiting for the client`;
  return (
    <Row
      href={routes.providerQuote(quote.id)}
      title={quote.job?.title ?? 'Job'}
      amount={formatMoney(quote.total)}
      line={line}
      attention={quote.status === 'approved'}
      dim={quote.status === 'rejected'}
    />
  );
}

/**
 * An open job in the provider's feed: what, where, how fresh, and the budget —
 * the number a provider scans for — right-aligned. A direct invite says so.
 */
export function OpenJobRow({ job }: { job: Job }) {
  const invited = job.is_direct && job.hired_provider_id != null;
  const meta = [job.location || categoryLabel(job.category), timeAgo(job.created_at)].filter(Boolean).join(' · ');
  return (
    <Link href={routes.findWorkJob(job.id)} className="flex items-start gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-[var(--band)] md:px-5">
      <Thumb src={categoryPhoto(job.category ?? 'other')} size={44} />
      <div className="min-w-0 flex-1">
        {invited && (
          <p className="mb-0.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--navy)]">
            <Icon name="mail" size={13} />
            Invited to quote
          </p>
        )}
        <p className="line-clamp-2 font-semibold text-[var(--ink)]">{job.title}</p>
        <p className="mt-0.5 truncate text-[13.5px] text-[var(--muted)]">{meta}</p>
      </div>
      {job.budget != null ? (
        <span className="figure shrink-0 text-[15px] font-semibold text-[var(--ink)]">{formatMoney(job.budget)}</span>
      ) : (
        <span className="mt-0.5 shrink-0 text-[13px] text-[var(--muted)]">Open budget</span>
      )}
    </Link>
  );
}

// ─────────────────────────── People ───────────────────────────

/**
 * A provider as a quiet row: portrait, name, trade · area · rating. An unrated
 * provider says "New" — a made-up score would be a claim about a real person.
 */
export function ProviderRow({ provider }: { provider: Profile }) {
  const rating = (provider.rating ?? 0) > 0 ? provider.rating.toFixed(1) : 'New';
  const meta = [provider.services?.[0] && serviceLabel(provider.services[0]), provider.location, rating].filter(Boolean).join(' · ');
  return (
    <Link
      href={routes.providerProfile(provider.id)}
      className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-[var(--band)] md:px-5"
    >
      <Thumb src={provider.avatar_url ?? providerImageFallback(provider)} size={52} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate font-semibold text-[var(--ink)]">
          {provider.name ?? 'Service provider'}
          {provider.is_verified && <Icon name="shield-checkmark" size={15} className="shrink-0 text-[var(--navy)]" aria-label="Verified" />}
        </p>
        <p className="truncate text-[13.5px] text-[var(--muted)]">{meta}</p>
      </div>
      {provider.hourly_rate != null && (
        <span className="hidden shrink-0 text-right sm:block">
          <span className="figure block text-[14px] font-medium text-[var(--ink)]">{formatMoney(provider.hourly_rate)}</span>
          <span className="text-[12px] text-[var(--muted)]">per hour</span>
        </span>
      )}
      <Icon name="chevron-forward" size={16} className="shrink-0 text-[var(--muted)]" />
    </Link>
  );
}

// ─────────────────────────── Attention ───────────────────────────

export type AttentionItem = { key: string; title: string; headline: string; label: string; money?: boolean; href: string };

/**
 * "Waiting on you": the newest things that need a tap. A grid of cards on
 * desktop, a horizontal strip on phones, so the list below stays in view.
 */
export function AttentionStrip({ title, items }: { title: string; items: AttentionItem[] }) {
  if (!items.length) return null;
  return (
    <section aria-label={title} className="enter">
      <p className="label mb-2.5">{title}</p>
      <div className="chip-rail -mx-4 px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:px-0 xl:grid-cols-3">
        {items.map((it) => (
          <Link
            key={it.key}
            href={it.href}
            className="card flex w-[260px] shrink-0 flex-col gap-1.5 p-4 transition-colors duration-150 hover:!border-[var(--rule-strong)] md:w-auto"
          >
            <p className="truncate text-[13px] text-[var(--muted)]">{it.title}</p>
            <p className="line-clamp-2 flex-1 font-semibold text-[var(--ink)]">{it.headline}</p>
            <span
              className={`mt-1.5 inline-flex h-8 self-start items-center rounded-full px-3.5 text-[13px] font-semibold ${
                it.money ? 'bg-[var(--teal)] text-[#06201d]' : 'bg-[var(--band-deep)] text-[var(--ink)]'
              }`}
            >
              {it.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
