'use client';

/**
 * The sad path. Ported from mobile (user)/job/dispute/[jobId].tsx — two steps
 * on purpose: (1) the three facts support always needs, which files the ticket
 * (the job freezes and the artisan is told, server-side, in one RPC); (2) the
 * hand-off, where the report the app has already written goes to support by
 * email, WhatsApp or the clipboard. Nothing here settles the escrow.
 *
 * Web difference: a mailto: link cannot carry files, so screenshots are
 * attached in the mail app rather than picked here.
 */
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Icon } from '@/components/app/icon';
import { Button, ButtonLink, EmptyState, ErrorNote, PageHeader, Section, Skeleton } from '@/components/app/ui';
import { useAuth } from '@/lib/app/auth';
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP_DISPLAY, whatsappUrl } from '@/lib/app/constants/support';
import {
  DISPUTE_CATEGORIES,
  DISPUTE_OUTCOMES,
  MAX_DESCRIPTION,
  buildDisputeReport,
  buildDisputeSubject,
  type DisputeCategory,
  type DisputeOutcome,
  type DisputeReportInput,
} from '@/lib/app/domain/dispute-report';
import { routes } from '@/lib/app/domain/routes';
import { useJobDispute, useOpenDispute } from '@/lib/app/queries/use-disputes';
import { useJob } from '@/lib/app/queries/use-jobs';
import { useJobMedia } from '@/lib/app/queries/use-media';
import { useProvider } from '@/lib/app/queries/use-providers';
import { useEscrow } from '@/lib/app/queries/use-wallet';

const MIN_DESCRIPTION = 30;

export function DisputeView() {
  const { id: jobId } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { data: job, isLoading } = useJob(jobId);
  const { data: escrow } = useEscrow(jobId);
  const { data: media } = useJobMedia(jobId);
  const { data: provider } = useProvider(job?.hired_provider_id ?? '');
  const { data: existing } = useJobDispute(jobId);
  const openDispute = useOpenDispute(jobId);

  const [category, setCategory] = useState<DisputeCategory | null>(null);
  const [description, setDescription] = useState('');
  const [outcome, setOutcome] = useState<DisputeOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sentVia, setSentVia] = useState<string | null>(null);

  // A ticket already filed puts the screen straight into the hand-off.
  const live = existing && (existing.status === 'open' || existing.status === 'in_review') ? existing : null;
  const filed = openDispute.data ?? live;
  const step: 'describe' | 'send' = filed ? 'send' : 'describe';

  const reportInput: DisputeReportInput | null = useMemo(
    () =>
      job
        ? {
            job,
            escrow,
            provider,
            reporter: profile,
            media,
            answers: {
              category: (category ?? (filed?.category as DisputeCategory | null) ?? 'other') as DisputeCategory,
              description: description || filed?.reason || '',
              outcome: (outcome ?? (filed?.desired_outcome as DisputeOutcome | null) ?? 'advice') as DisputeOutcome,
            },
            dispute: filed,
            attachmentCount: 0,
          }
        : null,
    [job, escrow, provider, profile, media, filed, category, description, outcome],
  );

  if (isLoading) return <Skeleton className="h-64" />;
  if (!job) {
    return (
      <div className="card">
        <EmptyState title="Job not found" />
      </div>
    );
  }

  async function fileDispute(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!category) return setError('Choose what went wrong.');
    if (description.trim().length < MIN_DESCRIPTION) {
      return setError(`Please describe the problem in a little more detail — at least ${MIN_DESCRIPTION} characters.`);
    }
    if (!outcome) return setError('Tell us what you would like to happen.');
    try {
      await openDispute.mutateAsync({ reason: description.trim(), category, desiredOutcome: outcome });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open the dispute.');
    }
  }

  async function copyReport() {
    if (!reportInput) return;
    try {
      await navigator.clipboard.writeText(buildDisputeReport(reportInput, 'clipboard'));
      setSentVia('clipboard');
    } catch {
      setError(`Could not copy. Email ${SUPPORT_EMAIL} directly.`);
    }
  }

  const report = reportInput ? buildDisputeReport(reportInput, 'email') : '';
  const mailto = reportInput
    ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(buildDisputeSubject(reportInput))}&body=${encodeURIComponent(report)}`
    : '#';

  return (
    <div className="mx-auto max-w-[720px]">
      <PageHeader
        back={{ href: routes.jobDetail(jobId), label: 'Back to job' }}
        title={step === 'describe' ? 'Report a problem' : 'Contact support'}
        description={job.title}
      />

      {step === 'describe' ? (
        <form onSubmit={fileDispute} noValidate className="space-y-6">
          {/* What the button does, before the form: it is not reversible from the app. */}
          <section className="rounded-md border border-[#f0d9b0] bg-[#fdf7ec] p-4">
            <p className="flex items-center gap-2 font-semibold text-[var(--ink)]">
              <Icon name="warning" size={18} className="text-[var(--warn)]" />
              Opening a dispute on “{job.title}” will:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-9 text-[14.5px] text-[var(--muted)]">
              <li>Hold every naira still in escrow — nothing can be released until it is settled</li>
              <li>Notify the artisan that the job is disputed</li>
              <li>Pause the approve-and-review flow for this job</li>
              <li>Hand you a reference to quote to our support team</li>
            </ul>
          </section>

          <Section title="1 · What went wrong?">
            <p className="-mt-1 mb-3 text-[13.5px] text-[var(--muted)]">Pick the closest fit — support uses it to route your case.</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="What went wrong">
              {DISPUTE_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={category === c.value}
                  className="chip"
                  onClick={() => {
                    setCategory(c.value);
                    setError(null);
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {category && <p className="mt-2.5 text-[13.5px] text-[var(--muted)]">{DISPUTE_CATEGORIES.find((c) => c.value === category)?.hint}</p>}
          </Section>

          <Section title="2 · Tell us what happened">
            <p className="-mt-1 mb-3 text-[13.5px] text-[var(--muted)]">
              Dates, what was agreed, what was actually delivered, and anything you already raised with the artisan.
            </p>
            <textarea
              aria-label="What happened"
              className="input min-h-[150px]"
              maxLength={MAX_DESCRIPTION}
              placeholder="e.g. The artisan finished on 18 Sept but two of the sockets do not work and the wall was left unpatched. I messaged him on the 19th and he said he would return — he has not."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (e.target.value.trim().length >= MIN_DESCRIPTION) setError(null);
              }}
            />
            <p className="mt-1.5 text-[13px] text-[var(--muted)]">
              {description.trim().length < MIN_DESCRIPTION
                ? `${MIN_DESCRIPTION - description.trim().length} more characters`
                : description.length > MAX_DESCRIPTION - 200
                  ? `${MAX_DESCRIPTION - description.length} characters left`
                  : 'Thanks — that is enough for support to work with.'}
            </p>
          </Section>

          <Section title="3 · What would you like to happen?">
            <p className="-mt-1 mb-3 text-[13.5px] text-[var(--muted)]">Your preference, not a promise.</p>
            <div className="space-y-2" role="radiogroup" aria-label="What would you like to happen">
              {DISPUTE_OUTCOMES.map((o) => {
                const on = outcome === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      setOutcome(o.value);
                      setError(null);
                    }}
                    className={`flex w-full items-center gap-3 rounded-md border px-3.5 py-3 text-left transition-colors duration-150 ${
                      on ? 'border-[var(--navy)] bg-[var(--teal-wash)]' : 'border-[var(--rule-strong)] hover:border-[var(--ink)]'
                    }`}
                  >
                    <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${on ? 'border-[var(--navy)]' : 'border-[var(--rule-strong)]'}`}>
                      {on && <span className="size-2.5 rounded-full bg-[var(--navy)]" />}
                    </span>
                    <span className="text-[15px] text-[var(--ink)]">{o.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          <ErrorNote>{error}</ErrorNote>

          <div className="flex justify-end">
            <Button type="submit" variant="danger" size="lg" icon="warning" loading={openDispute.isPending}>
              Open dispute
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Confirmation first: the consequential part is already done. */}
          <section className="card enter p-5 md:p-6">
            <p className="label">Dispute open</p>
            <h2 className="mt-2 !text-[22px]">
              Your reference is <span className="figure">{filed?.reference ?? '—'}</span>
            </h2>
            <p className="mt-2 text-[15px] text-[var(--muted)]">
              The escrow is frozen and {provider?.business_name || provider?.name || 'the artisan'} has been notified. Nothing is released until support settles it.
            </p>
            <p className="mt-2 text-[15px] text-[var(--muted)]">
              We have written the report for you — your job reference, the artisan, exactly what is held in escrow, and the photos already on the job are all in it. Pick a channel and it goes across filled in.
            </p>
          </section>

          <Section title="Worth including">
            <p className="text-[14.5px] text-[var(--muted)]">Not required, but a case with evidence is usually settled in a single reply.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[14.5px] text-[var(--muted)]">
              <li>Photos of the problem itself, in good light and wide enough to show context</li>
              <li>Your chat with the artisan — especially anything they agreed to</li>
              <li>The quote or receipt if the amount is what you are disputing</li>
              <li>Full-screen captures, not crops: the timestamps are the point</li>
            </ul>
            <p className="mt-2 text-[13.5px] text-[var(--muted)]">A link can’t carry attachments — add them in your mail app, or send them into the WhatsApp chat right after the message.</p>
          </Section>

          <Section title="Send it to support">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <a className="btn btn-primary !h-11" href={mailto} onClick={() => setSentVia('email')}>
                <Icon name="mail" size={18} />
                Email support
              </a>
              <a
                className="btn btn-ghost !h-11"
                href={reportInput ? whatsappUrl(buildDisputeReport(reportInput, 'whatsapp')) : '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setSentVia('whatsapp')}
              >
                <Icon name="logo-whatsapp" size={18} />
                Send on WhatsApp
              </a>
              <button type="button" className="btn !h-11 text-[var(--navy)] hover:bg-[var(--band)]" onClick={() => void copyReport()}>
                <Icon name="copy" size={16} />
                Copy the report
              </button>
            </div>
            <p className="mt-3 text-[13.5px] text-[var(--muted)]">
              Email goes to {SUPPORT_EMAIL} with the report filled in. WhatsApp opens a chat with {SUPPORT_WHATSAPP_DISPLAY}, message pre-written.
            </p>
            {sentVia && (
              <p role="status" className="mt-3 rounded-md bg-[var(--teal-wash)] px-3.5 py-2.5 text-[14px] text-[var(--navy)]">
                {sentVia === 'clipboard'
                  ? 'Report copied. Paste it into an email or message to support.'
                  : 'Check that the message actually sent — nothing reaches support until it leaves your outbox.'}
              </p>
            )}
            <details className="mt-4">
              <summary className="cursor-pointer text-[14px] font-semibold text-[var(--navy)]">Preview what will be sent</summary>
              <pre className="log mt-3 whitespace-pre-wrap p-4">{report}</pre>
            </details>
          </Section>

          <p className="text-[14px] text-[var(--muted)]">
            Support aims to reply within one business day. You will get a notification here the moment the dispute is settled, and the escrow moves only then.
          </p>

          <ErrorNote>{error}</ErrorNote>

          <ButtonLink href={routes.jobDetail(jobId)} variant="ghost">
            Back to the job
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
