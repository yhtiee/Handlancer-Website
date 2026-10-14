'use client';

/**
 * One job, from whoever is looking. Ported from three mobile screens:
 *   (user)/job/[id].tsx          the owner           → ClientJob
 *   (provider)/job/[id].tsx      the hired provider  → HiredJob
 *   (provider)/find-work/[id]    a provider bidding  → BidJob
 *
 * Every view leads with the same thing: the next step, in a sentence, with the
 * one action that takes it (lib/app/domain/job-state.ts — the same sentence
 * the lists show). Then the money, the people, and the brief.
 */
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { EscrowActions, EscrowTimeline, ProviderMilestones } from '@/components/app/escrow';
import { Icon } from '@/components/app/icon';
import { MediaGallery, ProofUploader } from '@/components/app/media';
import { Thumb } from '@/components/app/rows';
import {
  Avatar,
  Button,
  ButtonLink,
  Details,
  EmptyState,
  EscrowTape,
  Money,
  Rating,
  Section,
  Skeleton,
  StatusBadge,
  escrowAmounts,
} from '@/components/app/ui';
import { useAuth } from '@/lib/app/auth';
import { categoryLabel } from '@/lib/app/constants/categories';
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP_DISPLAY, whatsappUrl } from '@/lib/app/constants/support';
import { formatDate, timeAgo } from '@/lib/app/domain/date';
import { buildProviderResponse, categoryLabel as disputeCategoryLabel, type DisputeCategory } from '@/lib/app/domain/dispute-report';
import { jobNextStep, liveQuotes, providerNextStep } from '@/lib/app/domain/job-state';
import { formatMoney } from '@/lib/app/domain/money';
import { categoryPhoto, providerImageFallback } from '@/lib/app/domain/provider-images';
import { canQuote } from '@/lib/app/domain/artisan-status';
import { routes } from '@/lib/app/domain/routes';
import { serviceLabel } from '@/lib/app/domain/trades';
import { useStartConversation } from '@/lib/app/queries/use-chat';
import { useJobDispute } from '@/lib/app/queries/use-disputes';
import { useJob, useUpdateJobStatus } from '@/lib/app/queries/use-jobs';
import { useJobMedia } from '@/lib/app/queries/use-media';
import { useProvider } from '@/lib/app/queries/use-providers';
import { useJobQuotes, useMyQuoteForJob } from '@/lib/app/queries/use-quotes';
import { useMyReviewForJob } from '@/lib/app/queries/use-reviews';
import { useEscrow } from '@/lib/app/queries/use-wallet';
import type { JobWithOwner } from '@/lib/app/services/jobs';

export function JobView() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const me = session?.user.id;
  const { data: job, isLoading } = useJob(id);

  if (isLoading) return <JobSkeleton />;
  if (!job) {
    return (
      <div className="card">
        <EmptyState title="Job not found">It may have been removed, or it isn’t one you can see.</EmptyState>
      </div>
    );
  }

  if (job.owner_id === me) return <ClientJob job={job} />;
  const hired = job.hired_provider_id === me && ['in_progress', 'completed', 'disputed'].includes(job.status);
  return hired ? <HiredJob job={job} /> : <BidJob job={job} />;
}

// ─────────────────────────── Shared chrome ───────────────────────────

function JobHeader({ job, photo, backHref, backLabel }: { job: JobWithOwner; photo: string; backHref: string; backLabel: string }) {
  const eyebrow = [categoryLabel(job.category), job.location].filter(Boolean).join(' · ');
  return (
    <header className="enter mb-6 md:mb-8">
      <Link href={backHref} className="label mb-4 inline-flex items-center gap-1 hover:!text-[var(--ink)] lg:hidden">
        <Icon name="chevron-back" size={14} />
        {backLabel}
      </Link>
      <div className="flex items-start gap-4">
        <Thumb src={photo} size={72} />
        <div className="min-w-0">
          <p className="label">{eyebrow}</p>
          <h1 className="mt-1.5 break-words">{job.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-[var(--muted)]">
            <StatusBadge status={job.status} />
            <span>Posted {timeAgo(job.created_at)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

/** The next step: where it stands, in a sentence, and the one thing to do. */
function NextStep({
  eyebrow,
  headline,
  detail,
  tone = 'normal',
  children,
}: {
  eyebrow: string;
  headline: string;
  detail?: string;
  tone?: 'normal' | 'alert';
  children?: React.ReactNode;
}) {
  return (
    <section className={`card enter border-l-[3px] p-5 md:p-6 ${tone === 'alert' ? '!border-l-[var(--bad)]' : '!border-l-[var(--teal)]'}`}>
      <p className="label">{eyebrow}</p>
      <h2 className={`mt-2 !text-[22px] !leading-tight md:!text-[24px] ${tone === 'alert' ? '!text-[var(--bad)]' : ''}`}>{headline}</h2>
      {detail && <p className="mt-1.5 max-w-[60ch] text-[15px] text-[var(--muted)]">{detail}</p>}
      {children && <div className="mt-5">{children}</div>}
    </section>
  );
}

function Brief({ job, title }: { job: JobWithOwner; title: string }) {
  const { data: media } = useJobMedia(job.id);
  return (
    <Section title={title}>
      <Details
        items={[
          { label: 'Budget', value: job.budget != null ? <Money amount={job.budget} /> : 'Open to quotes' },
          { label: 'Where', value: job.location || '—' },
          { label: 'When', value: job.scheduled_for ? formatDate(job.scheduled_for) : 'Flexible' },
          { label: 'Trade', value: categoryLabel(job.category) },
        ]}
      />
      {job.description && <p className="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--ink)]">{job.description}</p>}
      {media && media.length > 0 && (
        <div className="mt-5">
          <MediaGallery media={media} />
        </div>
      )}
    </Section>
  );
}

function MoneyPanel({ held, total, title, heldLabel, paidLabel, note, children }: { held: number; total: number; title: string; heldLabel: string; paidLabel: string; note?: string; children: React.ReactNode }) {
  return (
    <Section title={title}>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <Money amount={held} className="text-[30px] font-semibold text-[var(--ink)]" />
        <span className="text-[14.5px] text-[var(--muted)]">
          {held > 0 ? heldLabel : paidLabel} <Money amount={total} /> agreed{note ? ` · ${note}` : ''}
        </span>
      </p>
      {children}
    </Section>
  );
}

/** Message the other person on this job: reuses the one thread per pair. */
function MessageButton({ otherId, jobId, label }: { otherId: string; jobId: string; label: string }) {
  const router = useRouter();
  const startChat = useStartConversation();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-1.5">
      <Button
        variant="ghost"
        icon="chatbubble"
        block
        loading={startChat.isPending}
        onClick={async () => {
          setError(null);
          try {
            const convo = await startChat.mutateAsync({ providerId: otherId, jobId });
            router.push(routes.chatThread(convo.id));
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not open the chat.');
          }
        }}
      >
        {label}
      </Button>
      {error && <p className="text-[13.5px] text-[var(--bad)]">{error}</p>}
    </div>
  );
}

// ─────────────────────────── Client ───────────────────────────

function ClientJob({ job }: { job: JobWithOwner }) {
  const router = useRouter();
  const { data: provider } = useProvider(job.hired_provider_id ?? '');
  const { data: media } = useJobMedia(job.id);
  const { data: quotes } = useJobQuotes(job.id);
  const { data: myReview } = useMyReviewForJob(job.id);
  const { data: escrow } = useEscrow(job.id);
  const { data: dispute } = useJobDispute(job.id);
  const updateStatus = useUpdateJobStatus(job.id);

  const step = jobNextStep(job, escrow, quotes, provider?.name);
  const live = Boolean(escrow) && escrow!.status !== 'pending';
  const held = escrow ? escrowAmounts(escrow).held : 0;
  const first = provider?.name?.trim().split(' ')[0];
  const firstPhoto = media?.find((m) => m.kind === 'photo');
  const photo = provider ? (provider.avatar_url ?? providerImageFallback(provider)) : (firstPhoto?.url ?? categoryPhoto(job.category ?? 'other'));
  const pending = liveQuotes(quotes);

  // Money actions run here (their confirm and PIN dialogs live in EscrowActions);
  // everything else links to the screen that does it.
  const escrowActs =
    (job.status === 'in_progress' || job.status === 'hiring' || job.status === 'posted') && step.action?.href === routes.jobDetail(job.id);

  return (
    <>
      <JobHeader job={job} photo={photo} backHref={routes.myJobs} backLabel="My jobs" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <NextStep
            eyebrow={step.lane === 'needs' ? 'Waiting on you' : step.lane === 'done' ? 'Done' : 'Right now'}
            headline={step.headline}
            detail={step.detail}
            tone={job.status === 'disputed' ? 'alert' : 'normal'}
          >
            {pending.length > 0 && !provider && (
              <div className="mb-4 flex -space-x-2">
                {pending.slice(0, 5).map((q) => (
                  <span key={q.id} className="rounded-full ring-2 ring-[var(--paper)]">
                    <Avatar src={q.provider?.avatar_url} name={q.provider?.name} size={34} />
                  </span>
                ))}
              </div>
            )}
            {job.status === 'draft' ? (
              <Button size="lg" loading={updateStatus.isPending} onClick={() => updateStatus.mutate('posted')}>
                Post it
              </Button>
            ) : escrowActs ? (
              <EscrowActions job={job} />
            ) : step.action ? (
              <Button size="lg" variant={step.action.money ? 'primary' : 'ghost'} onClick={() => router.push(step.action!.href)}>
                {step.action.label}
              </Button>
            ) : job.status === 'in_progress' ? (
              // Nothing is due, but approving early is still the client's call.
              <EscrowActions job={job} />
            ) : null}
          </NextStep>

          {live && escrow && (
            <MoneyPanel held={held} total={escrow.total} title="The money" heldLabel="still in escrow, of" paidLabel="all paid out, of">
              <div className="mt-4">
                <EscrowTape escrow={escrow} />
              </div>
              <div className="mt-6">
                <EscrowTimeline escrow={escrow} role="client" />
              </div>
            </MoneyPanel>
          )}

          <Brief job={job} title="Your brief" />

          {job.status === 'disputed' ? (
            <section className="card enter space-y-3 p-5">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[var(--bad)]" aria-hidden="true" />
                <h2 className="flex-1">Dispute open</h2>
                {dispute?.reference && <span className="figure text-[13px] text-[var(--muted)]">{dispute.reference}</span>}
              </div>
              <p className="text-[14.5px] text-[var(--muted)]">
                Everything still in escrow is frozen and {first ?? 'the artisan'} has been told. Support settles it from here.
              </p>
              <ButtonLink href={routes.disputeJob(job.id)} variant="ghost">
                Contact support
              </ButtonLink>
            </section>
          ) : (job.status === 'in_progress' || job.status === 'completed') && job.hired_provider_id ? (
            <Link href={routes.disputeJob(job.id)} className="inline-flex items-center gap-2 text-[14px] text-[var(--muted)] hover:text-[var(--ink)]">
              <Icon name="flag" size={16} />
              Something wrong? Open a dispute
            </Link>
          ) : null}
        </div>

        <aside className="space-y-6">
          {provider ? (
            <Section title="Who’s doing it">
              <Link href={routes.providerProfile(provider.id)} className="flex items-center gap-3">
                <Avatar src={provider.avatar_url} name={provider.name} size={52} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--ink)]">{provider.name ?? 'Your artisan'}</p>
                  <p className="truncate text-[13.5px] text-[var(--muted)]">{provider.services?.[0] ? serviceLabel(provider.services[0]) : 'Artisan'}</p>
                  <Rating value={provider.rating} />
                </div>
              </Link>
              <div className="mt-4">
                <MessageButton otherId={provider.id} jobId={job.id} label={`Message ${first ?? 'your artisan'}`} />
              </div>
            </Section>
          ) : pending.length > 0 ? (
            <Section title="Quotes">
              <p className="text-[14.5px] text-[var(--muted)]">
                {pending.length} {pending.length === 1 ? 'quote' : 'quotes'} in, from{' '}
                <Money amount={Math.min(...pending.map((q) => q.total))} className="text-[var(--ink)]" />.
              </p>
              <div className="mt-4">
                <ButtonLink href={routes.jobQuotes(job.id)} block>
                  Compare quotes
                </ButtonLink>
              </div>
            </Section>
          ) : null}

          {job.status === 'completed' && myReview ? (
            <Section title="What you said">
              {myReview.comment && <p className="text-[15px] italic text-[var(--ink)]">“{myReview.comment}”</p>}
              <p className="mt-2 text-[13.5px] text-[var(--muted)]">{myReview.rating} of 5</p>
            </Section>
          ) : job.status === 'completed' && job.hired_provider_id ? (
            <ButtonLink href={routes.reviewJob(job.id)} variant="ghost" icon="star" block>
              Review {first ?? 'your artisan'}
            </ButtonLink>
          ) : null}

        </aside>
      </div>
    </>
  );
}

// ─────────────────────────── Hired provider ───────────────────────────

function HiredJob({ job }: { job: JobWithOwner }) {
  const { data: media } = useJobMedia(job.id);
  const { data: escrow } = useEscrow(job.id);
  const client = job.owner;
  const clientFirst = client?.name?.trim().split(' ')[0];
  const step = providerNextStep(job, escrow, client?.name);
  const live = Boolean(escrow) && escrow!.status !== 'pending';
  const { held, released } = escrow ? escrowAmounts(escrow) : { held: 0, released: 0 };
  const firstPhoto = media?.find((m) => m.kind === 'photo');

  return (
    <>
      <JobHeader job={job} photo={firstPhoto?.url ?? categoryPhoto(job.category ?? 'other')} backHref={routes.myJobs} backLabel="My jobs" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {job.status === 'disputed' ? (
            <ProviderDisputeBanner job={job} />
          ) : (
            <NextStep
              eyebrow={step.lane === 'yours' ? 'Your move' : step.lane === 'done' ? 'Done' : `Waiting on ${clientFirst ?? 'the client'}`}
              headline={step.headline}
              detail={job.status === 'completed' ? 'The money is in your wallet.' : step.detail}
            >
              {job.status === 'in_progress' ? <ProviderMilestones job={job} /> : null}
            </NextStep>
          )}

          {/* Proof: the client pays on these, so they come before the money. */}
          {(job.status === 'in_progress' || (media && media.length > 0)) && (
            <Section title="Your photos">
              <ProofUploader jobId={job.id} media={media ?? []} />
            </Section>
          )}

          {live && escrow && (
            <MoneyPanel
              held={held}
              total={escrow.total}
              title="Your pay"
              heldLabel="still to come, of"
              paidLabel="all paid, of"
              note={released > 0 && held > 0 ? `${formatMoney(released)} already in your wallet` : undefined}
            >
              <div className="mt-4">
                <EscrowTape escrow={escrow} />
              </div>
              <div className="mt-6">
                <EscrowTimeline escrow={escrow} role="provider" />
              </div>
            </MoneyPanel>
          )}

          <Brief job={job} title="What they need" />
        </div>

        <aside className="space-y-6">
          {client && (
            <Section title="The client">
              <div className="flex items-center gap-3">
                <Avatar src={client.avatar_url} name={client.name} size={52} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--ink)]">{client.name ?? 'HandLancer client'}</p>
                  <p className="truncate text-[13.5px] text-[var(--muted)]">{job.location ?? client.location ?? 'Location on request'}</p>
                </div>
              </div>
            </Section>
          )}
        </aside>
      </div>
    </>
  );
}

/**
 * What the provider sees on a disputed job: what was alleged, and how to send
 * their side. The client's words are shown — RLS already lets the provider
 * read the row, and nobody can answer a case they have not been told.
 */
function ProviderDisputeBanner({ job }: { job: JobWithOwner }) {
  const { data: dispute } = useJobDispute(job.id);
  const { data: escrow } = useEscrow(job.id);
  const { data: media } = useJobMedia(job.id);
  const { data: provider } = useProvider(job.hired_provider_id ?? '');
  const [note, setNote] = useState<string | null>(null);

  const message = () => buildProviderResponse({ job, escrow, provider, dispute, media });
  const subject = `${dispute?.reference ? `[${dispute.reference}] ` : ''}Provider response — ${job.title}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(message());
      setNote('Response copied. Paste it into an email or message to support.');
    } catch {
      setNote(`Could not copy. Email ${SUPPORT_EMAIL} directly.`);
    }
  }

  return (
    <section className="card enter space-y-4 !border-[#f3c4c5] !bg-[#fdf6f6] p-5 md:p-6">
      <div className="flex items-center gap-2">
        <Icon name="shield-checkmark" size={18} className="text-[var(--bad)]" />
        <h2 className="flex-1 !text-[18px]">This job is disputed</h2>
        {dispute?.reference && <span className="figure text-[13px] text-[var(--bad)]">{dispute.reference}</span>}
      </div>
      <p className="text-[14.5px] text-[var(--muted)]">
        The client has raised a problem with this job{dispute ? ` on ${formatDate(dispute.created_at)}` : ''}. Anything still in escrow is on hold until our support team settles it — it has not been cancelled, and it has not been paid.
      </p>
      {dispute?.category && (
        <div className="rounded-md bg-[var(--paper)] p-3">
          <p className="label !text-[10.5px]">Raised as</p>
          <p className="mt-1 font-semibold text-[var(--ink)]">{disputeCategoryLabel(dispute.category as DisputeCategory)}</p>
        </div>
      )}
      {dispute?.reason && (
        <div className="rounded-md bg-[var(--paper)] p-3">
          <p className="label !text-[10.5px]">What the client said</p>
          <p className="mt-1 whitespace-pre-wrap text-[15px] text-[var(--ink)]">{dispute.reason}</p>
        </div>
      )}
      <p className="text-[14.5px] text-[var(--ink)]">
        Send support your side. The more specific you are — dates you attended, what was agreed, receipts for materials, photos of the finished work — the faster this is settled.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <a className="btn btn-primary !h-10" href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message())}`}>
          <Icon name="mail" size={18} />
          Respond by email
        </a>
        <a className="btn btn-ghost !h-10" href={whatsappUrl(message())} target="_blank" rel="noopener noreferrer">
          <Icon name="logo-whatsapp" size={18} />
          Respond on WhatsApp
        </a>
        <button type="button" className="btn !h-10 text-[var(--navy)] hover:bg-[var(--band)]" onClick={copy}>
          <Icon name="copy" size={16} />
          Copy my response
        </button>
      </div>
      {note && <p className="text-[13.5px] text-[var(--muted)]">{note}</p>}
      <p className="text-[13px] text-[var(--muted)]">
        Do not chase the client for payment while this is open — support decides where the money goes, and you will be notified the moment it is settled. WhatsApp: {SUPPORT_WHATSAPP_DISPLAY}.
      </p>
    </section>
  );
}

// ─────────────────────────── Provider bidding ───────────────────────────

function BidJob({ job }: { job: JobWithOwner }) {
  const { data: myQuote } = useMyQuoteForJob(job.id);
  const { profile } = useAuth();
  const approved = canQuote(profile);
  const canApply = job.status === 'posted' || job.status === 'hiring';
  const owner = job.owner;

  return (
    <>
      <JobHeader job={job} photo={categoryPhoto(job.category ?? 'other')} backHref={routes.findWork} backLabel="Find work" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {myQuote ? (
            <NextStep
              eyebrow="Your quote"
              headline={
                myQuote.status === 'approved'
                  ? 'Accepted — waiting for payment'
                  : myQuote.status === 'rejected'
                    ? 'Not chosen this time'
                    : `Sent ${formatMoney(myQuote.total)} · waiting for the client`
              }
              detail={myQuote.status === 'approved' ? 'Don’t start until the money is in escrow. You’ll get a notification.' : undefined}
            >
              {myQuote.status !== 'approved' && canApply && (
                <ButtonLink href={routes.applyToJob(job.id)} variant="ghost" icon="create">
                  Update quote
                </ButtonLink>
              )}
            </NextStep>
          ) : canApply && !approved ? (
            <NextStep
              eyebrow="Open to quotes"
              headline="You can quote once your application is approved"
              detail="Approved artisans can quote on open jobs. Finish or check your application to get there."
            >
              <ButtonLink href={routes.apply} variant="ghost">
                See my application
              </ButtonLink>
            </NextStep>
          ) : canApply ? (
            <NextStep
              eyebrow={job.is_direct ? 'You were invited' : 'Open to quotes'}
              headline={job.budget != null ? `Client budget ${formatMoney(job.budget)}` : 'The client wants your price'}
              detail="Itemise materials and labour. The client sees exactly what each part costs, and pays into escrow before you start."
            >
              <ButtonLink href={routes.applyToJob(job.id)} size="lg" icon="send">
                Send a quote
              </ButtonLink>
            </NextStep>
          ) : (
            <NextStep eyebrow="Closed" headline="This job is no longer accepting quotes." />
          )}

          <Brief job={job} title="What they need" />
        </div>

        <aside className="space-y-6">
          <Section title="Posted by">
            <div className="flex items-center gap-3">
              <Avatar src={owner?.avatar_url} name={owner?.name} size={48} />
              <div className="min-w-0">
                <p className="truncate font-semibold text-[var(--ink)]">{owner?.name ?? 'HandLancer client'}</p>
                {owner?.location && <p className="truncate text-[13.5px] text-[var(--muted)]">{owner.location}</p>}
              </div>
            </div>
          </Section>
        </aside>
      </div>
    </>
  );
}

function JobSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading job" className="space-y-6">
      <div className="flex gap-4">
        <Skeleton className="size-[72px] !rounded-md" />
        <div className="flex-1 space-y-2.5 pt-1">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-7 w-72 max-w-full" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-44" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}
