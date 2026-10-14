'use client';

/**
 * Home, per role. The mobile Discover (client) and Find Work (provider)
 * screens, laid out as a dashboard: what needs you first, then money and
 * counts, then the way into new work.
 */
import Link from 'next/link';
import { useState } from 'react';

import { Icon } from '@/components/app/icon';
import { AttentionStrip, OpenJobRow, ProviderJobRow, ProviderRow, Thumb } from '@/components/app/rows';
import {
  ButtonLink,
  EmptyState,
  EscrowTape,
  ListSkeleton,
  Money,
  Section,
  StatTile,
  escrowAmounts,
  escrowStage,
} from '@/components/app/ui';
import { useAuth } from '@/lib/app/auth';
import { canQuote } from '@/lib/app/domain/artisan-status';
import { Categories } from '@/lib/app/constants/categories';
import { timeAgo } from '@/lib/app/domain/date';
import { emptyJobFilters } from '@/lib/app/domain/job-filters';
import { formatMoney } from '@/lib/app/domain/money';
import { providerImageFallback } from '@/lib/app/domain/provider-images';
import { routes } from '@/lib/app/domain/routes';
import { useClientAttention, useProviderMove } from '@/lib/app/hooks/use-attention';
import { useDebouncedValue } from '@/lib/app/hooks/use-debounced-value';
import { useInfiniteList } from '@/lib/app/hooks/use-infinite-list';
import { useOpenJobs, useOpenJobsCount } from '@/lib/app/queries/use-discover-jobs';
import { useMyJobs, useMyJobsCount, useProviderJobs, useProviderJobsCount } from '@/lib/app/queries/use-jobs';
import { useProvider, useProviders } from '@/lib/app/queries/use-providers';
import { useJobQuotes, useMyQuotesCount } from '@/lib/app/queries/use-quotes';
import { useEscrow, useWallet } from '@/lib/app/queries/use-wallet';
import type { Job } from '@/lib/app/services/database.types';

/** The trades offered as one-tap starts for a new job (mobile Discover). */
const TRADES = Categories.filter((c) => ['plumbing', 'electrical', 'carpentry', 'ac', 'painting', 'cleaning'].includes(c.id));

export function HomeView() {
  const { profile } = useAuth();
  return profile?.role === 'provider' ? <ProviderHome /> : <ClientHome />;
}

function firstName(name?: string | null) {
  return name?.trim().split(' ')[0] || null;
}

function count(n: number | undefined) {
  return n == null ? '—' : String(n);
}

// ─────────────────────────── Client ───────────────────────────

function ClientHome() {
  const { profile } = useAuth();
  const { data: wallet } = useWallet();
  const activeCount = useMyJobsCount('active').data;
  const openCount = useMyJobsCount('open').data;
  const active = useInfiniteList(useMyJobs('active')).items[0] as Job | undefined;
  const open = useInfiniteList(useMyJobs('open')).items as Job[];
  const attention = useClientAttention();
  const name = firstName(profile?.name);

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="enter">
        <h1 className="!text-[clamp(1.8rem,4vw,2.4rem)]">
          {name ? `${name}, who` : 'Who'} do you need <em>today?</em>
        </h1>
        <p className="lede mt-1.5 !text-[17px]">Post the job once. Compare quotes. Pay only when the work is done.</p>
      </header>

      <PostBar />

      <div className="ruled-grid enter grid-cols-3">
        <StatTile label="Wallet" value={wallet ? formatMoney(wallet.balance, 'NGN', true) : '—'} href={routes.wallet()} />
        <StatTile label="Under way" value={count(activeCount)} href={routes.myJobs} />
        <StatTile label="Open jobs" value={count(openCount)} href={`${routes.myJobs}?tab=open`} />
      </div>

      <AttentionStrip title="Waiting on you" items={attention} />

      <div className={`grid gap-6 ${active ? 'lg:grid-cols-[1.1fr_.9fr]' : ''}`}>
        {active && <LiveJob job={active} />}
        <div className="space-y-6">
          <QuotesWaiting jobs={open} />
          <NearYou compact={!!active} />
        </div>
      </div>
    </div>
  );
}

/** "What needs fixing? [Post]" plus one-tap trades. */
function PostBar() {
  return (
    <section className="enter space-y-3" aria-label="Post a job">
      <Link
        href={routes.postJob}
        className="flex h-14 items-center gap-3 rounded-full border border-[var(--rule-strong)] bg-[var(--paper)] pl-5 pr-1.5 transition-colors duration-150 hover:border-[var(--ink)]"
      >
        <Icon name="search" size={20} className="text-[var(--muted)]" />
        <span className="flex-1 text-[16px] text-[var(--muted)]">What needs fixing?</span>
        <span className="btn btn-primary !h-11 !rounded-full !px-5">Post</span>
      </Link>
      <div className="chip-rail -mx-4 px-4 md:mx-0 md:px-0">
        {TRADES.map((t) => (
          <Link key={t.id} href={routes.postJobIn(t.id)} className="chip">
            <Icon name={t.icon} size={15} className="text-[var(--navy)]" />
            {t.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

/** The job under way: who is doing it, the stage, and what is held — as a tape. */
function LiveJob({ job }: { job: Job }) {
  const { data: provider } = useProvider(job.hired_provider_id ?? '');
  const { data: escrow } = useEscrow(job.id);
  const first = firstName(provider?.name);
  const stage = escrow ? escrowStage(escrow) : null;

  return (
    <Section title="Under way" action={<Link href={routes.jobDetail(job.id)} className="ulink text-[13.5px]">Open job</Link>}>
      <Link href={routes.jobDetail(job.id)} className="flex items-start gap-4">
        {provider && <Thumb src={provider.avatar_url ?? providerImageFallback(provider)} size={64} />}
        <div className="min-w-0">
          <p className="label !text-[10.5px]">{stage ? `Stage ${stage.index} of ${stage.count} · ${stage.label}` : 'In progress'}</p>
          <p className="mt-1.5 text-[19px] font-semibold leading-snug tracking-[-0.02em] text-[var(--navy)]">
            {first ? `${first} is on ` : 'Work has started on '}
            <em>{job.title}</em>
          </p>
        </div>
      </Link>
      {escrow && escrow.status !== 'pending' && (
        <div className="mt-5">
          <p className="mb-2 flex items-baseline gap-2">
            <Money amount={escrowAmounts(escrow).held} className="text-[24px] font-semibold text-[var(--ink)]" />
            <span className="text-[14px] text-[var(--muted)]">
              {escrowAmounts(escrow).held > 0 ? 'held for the next payment' : 'paid out in full'}
            </span>
          </p>
          <EscrowTape escrow={escrow} size="hero" />
        </div>
      )}
    </Section>
  );
}

/** "3 quotes for Kitchen sink leak": the newest open job that has quotes in. */
function QuotesWaiting({ jobs }: { jobs: Job[] }) {
  const candidate = jobs.find((j) => j.status === 'hiring' || j.status === 'posted');
  if (!candidate) return null;
  return <QuotesRow job={candidate} />;
}

function QuotesRow({ job }: { job: Job }) {
  const { data: quotes } = useJobQuotes(job.id);
  const live = (quotes ?? []).filter((q) => q.status === 'submitted' || q.status === 'revised');
  if (!live.length) return null;
  const lowest = Math.min(...live.map((q) => q.total));
  const newest = live.reduce((a, b) => (a.created_at > b.created_at ? a : b));
  return (
    <Link href={routes.jobQuotes(job.id)} className="card enter flex items-center gap-3 p-4 transition-colors duration-150 hover:!bg-[var(--band)]">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--teal-wash)] text-[var(--navy)]">
        <Icon name="document-text" size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-[var(--ink)]">
          {live.length} {live.length === 1 ? 'quote' : 'quotes'} for {job.title}
        </p>
        <p className="truncate text-[13.5px] text-[var(--muted)]">
          From {formatMoney(lowest)} · newest {timeAgo(newest.created_at)}
        </p>
      </div>
      <Icon name="chevron-forward" size={16} className="text-[var(--muted)]" />
    </Link>
  );
}

function NearYou({ compact }: { compact: boolean }) {
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search);
  const query = useProviders(debounced);
  const { items: providers } = useInfiniteList(query);

  return (
    <Section title="Artisans near you" flush action={<Link href={routes.browseProviders} className="ulink text-[13.5px]">Browse all</Link>}>
      <div className="border-b border-[var(--rule)] p-3">
        <label className="relative block">
          <span className="sr-only">Search a service or artisan</span>
          <Icon name="search" size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            className="input pl-9"
            type="search"
            placeholder="Search a service or artisan"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {query.isLoading ? (
        <ListSkeleton rows={3} />
      ) : providers.length === 0 ? (
        <EmptyState title={debounced ? 'No matches' : 'No artisans yet'}>
          {debounced ? 'Try a different name, skill or area.' : 'Tradespeople near you will show up here as they join.'}
        </EmptyState>
      ) : (
        // Real providers only — padding with invented people would make an empty marketplace look full.
        <div className="divide-y divide-[var(--rule)]">
          {providers.slice(0, compact ? 4 : 6).map((p) => (
            <ProviderRow key={p.id} provider={p} />
          ))}
        </div>
      )}
    </Section>
  );
}

// ─────────────────────────── Provider ───────────────────────────

function ProviderHome() {
  const { profile } = useAuth();
  const { data: wallet } = useWallet();
  const activeCount = useProviderJobsCount('active').data;
  const quotesCount = useMyQuotesCount(['submitted', 'revised']).data;
  const move = useProviderMove();
  const underWay = useInfiniteList(useProviderJobs('active')).items as Job[];

  const mySkills = profile?.services ?? [];
  const filters = mySkills.length ? { ...emptyJobFilters, matchesMySkills: true } : emptyJobFilters;
  const feed = useOpenJobs(undefined, filters);
  const { items: jobs } = useInfiniteList(feed);
  const { data: total } = useOpenJobsCount(undefined, filters);
  const area = profile?.location?.split(',')[0]?.trim();
  const name = firstName(profile?.name);

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="enter flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="!text-[clamp(1.8rem,4vw,2.4rem)]">
            {name ? `${name}, here’s` : 'Here’s'} work near <em>{area || 'you'}</em>
          </h1>
          <p className="lede mt-1.5 !text-[17px]">
            {total == null
              ? 'Finding open jobs…'
              : total === 0
                ? 'No open jobs match your skills right now. New ones show up here first.'
                : `${total} open ${total === 1 ? 'job matches' : 'jobs match'} ${mySkills.length ? 'your skills' : 'right now'}.`}
          </p>
        </div>
        <ButtonLink href={routes.findWork} icon="search" variant="primary">
          Find work
        </ButtonLink>
      </header>

      <div className="ruled-grid enter grid-cols-3">
        <StatTile label="Wallet" value={wallet ? formatMoney(wallet.balance, 'NGN', true) : '—'} href={routes.wallet()} />
        <StatTile label="Under way" value={count(activeCount)} href={routes.myJobs} />
        <StatTile label="Quotes out" value={count(quotesCount)} href={`${routes.myJobs}?tab=quotes`} />
      </div>

      <AttentionStrip title="Your move" items={move} />

      {canQuote(profile) && !profile?.services?.length && (
        <Link href={routes.profileEdit()} className="card enter flex items-center gap-3 p-4 hover:!bg-[var(--band)]">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--teal-wash)] text-[var(--navy)]">
            <Icon name="person" size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[var(--ink)]">Add your trades and area</p>
            <p className="text-[13.5px] text-[var(--muted)]">Clients find you by them, and we show you jobs that match.</p>
          </div>
          <Icon name="chevron-forward" size={16} className="text-[var(--muted)]" />
        </Link>
      )}

      <div className={`grid gap-6 ${underWay.length ? 'lg:grid-cols-[1.15fr_.85fr]' : ''}`}>
        <Section title="New jobs for you" flush action={<Link href={routes.findWork} className="ulink text-[13.5px]">See all</Link>}>
          {feed.isLoading ? (
            <ListSkeleton rows={4} />
          ) : jobs.length === 0 ? (
            <EmptyState title="No open jobs yet">New jobs that match your trades will show up here.</EmptyState>
          ) : (
            <div className="divide-y divide-[var(--rule)]">
              {jobs.slice(0, 6).map((j) => (
                <OpenJobRow key={j.id} job={j} />
              ))}
            </div>
          )}
        </Section>

        {underWay.length > 0 && (
          <Section title="Under way" flush action={<Link href={routes.myJobs} className="ulink text-[13.5px]">All jobs</Link>}>
            <div className="divide-y divide-[var(--rule)]">
              {underWay.slice(0, 4).map((j) => (
                <ProviderJobRow key={j.id} job={j} />
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
