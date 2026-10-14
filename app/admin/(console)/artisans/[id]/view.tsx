'use client';

import { useState } from 'react';

import { NotFound, QueryError, ViewSkeleton, isNotFound } from '@/components/admin/query-state';
import { Details, Figure, PageHeader, Section, StatusBadge } from '@/components/admin/ui';
import { formatDate, formatDateTime, formatNaira, humanize } from '@/lib/admin/format';
import { useArtisan, useReviewArtisan } from '@/lib/admin/query/hooks';
import type { Profile } from '@/lib/admin/types';
import { serviceLabel } from '@/lib/app/domain/trades';

import { ARTISAN_STATUS_LABEL } from '../view';

/** The waitlist form's error treatment, as the dispute resolve form uses it. */
const ALERT = 'rounded-md border border-[var(--bad)]/40 bg-[var(--bad)]/[.06] px-3.5 py-3 text-[13.5px] font-medium text-[var(--bad)]';

/** Mirrors REVIEW_CRITERIA in lib/artisan-program.ts — what the artisan was told we check. */
function checklist(p: Profile) {
  return [
    { label: 'Clear photo of the person', ok: !!p.avatar_url, hint: 'Check it is a face, not a logo.' },
    { label: 'Reachable phone number', ok: (p.phone ?? '').replace(/\D/g, '').length >= 10, hint: 'Call to confirm if anything looks off.' },
    { label: 'Area and trades', ok: !!p.location?.trim() && !!p.services?.length, hint: 'Do the trades match the work photos?' },
    { label: 'Photos of real work', ok: (p.work_photos?.length ?? 0) > 0, hint: 'Watch for stock or copied photos.' },
    { label: 'Experience in their own words', ok: (p.bio?.trim().length ?? 0) >= 40, hint: 'Specific beats generic.' },
  ];
}

/** wa.me wants E.164 without the plus; a Nigerian 0-prefixed number becomes 234… */
function waNumber(phone: string) {
  const d = phone.replace(/\D/g, '');
  return d.startsWith('0') ? `234${d.slice(1)}` : d;
}

export function ArtisanView({ id }: { id: string }) {
  const { data, error, refetch } = useArtisan(id);
  const [viewing, setViewing] = useState<string | null>(null);
  if (data === null || isNotFound(error)) return <NotFound what="artisan" href="/admin/artisans" />;
  if (!data) return error ? <QueryError error={error} onRetry={() => refetch()} /> : <ViewSkeleton />;

  const { profile: p, reviewerEmail, hiredJobs, reviews } = data;
  const status = p.provider_status ?? 'draft';
  const checks = checklist(p);

  return (
    <>
      <PageHeader
        back={{ href: `/admin/artisans${status === 'pending' ? '' : `?status=${status}`}`, label: 'Artisans' }}
        title={
          <span className="flex items-center gap-3">
            {p.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL.
              <img src={p.avatar_url} alt="" className="size-12 shrink-0 rounded-full object-cover ring-1 ring-[var(--rule-strong)]" />
            ) : (
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--paper)] text-[18px] font-bold uppercase text-[var(--navy)] ring-1 ring-[var(--rule-strong)]">
                {(p.name ?? '?').charAt(0)}
              </span>
            )}
            <span className="min-w-0">{p.name ?? 'Unnamed'}</span>
          </span>
        }
        meta={
          <>
            <StatusBadge status={status} label={ARTISAN_STATUS_LABEL[status]} />
            {p.provider_submitted_at && <span>Submitted {formatDateTime(p.provider_submitted_at)}</span>}
            <span>Joined {formatDate(p.created_at)}</span>
          </>
        }
        actions={
          p.phone ? (
            <>
              <a href={`tel:${p.phone.replace(/\s/g, '')}`} className="btn btn-ghost">
                Call {p.phone}
              </a>
              <a href={`https://wa.me/${waNumber(p.phone)}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                WhatsApp
              </a>
            </>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        <div className="space-y-4 md:space-y-6 lg:col-span-2">
          <Section title={`Work photos (${p.work_photos?.length ?? 0})`}>
            {p.work_photos?.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {p.work_photos.map((url) => (
                  <button key={url} type="button" onClick={() => setViewing(url)} className="block aspect-square overflow-hidden rounded bg-[var(--band-deep)]">
                    {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL. */}
                    <img src={url} alt="" loading="lazy" className="size-full object-cover transition-transform duration-200 hover:scale-[1.03]" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[var(--muted)]">No work photos submitted.</p>
            )}
          </Section>

          <Section title="Profile">
            {p.bio ? <p className="mb-5 whitespace-pre-wrap text-[var(--ink)]">{p.bio}</p> : <p className="mb-5 text-[var(--muted)]">No description.</p>}
            <Details
              items={[
                { label: 'Phone', value: p.phone },
                { label: 'Email', value: p.email },
                { label: 'Area', value: p.location },
                { label: 'Trades & services', value: p.services?.length ? p.services.map(serviceLabel).join(', ') : '—' },
                { label: 'Experience', value: p.years_experience != null ? `${p.years_experience} yrs` : '—' },
                { label: 'Hourly rate', value: p.hourly_rate ? <Figure>{formatNaira(p.hourly_rate)}</Figure> : 'By quote' },
                { label: 'Business name', value: p.business_name },
                { label: 'Availability', value: humanize(p.availability) },
                { label: 'Rules accepted', value: p.provider_terms_accepted_at ? formatDateTime(p.provider_terms_accepted_at) : 'Not yet' },
                { label: 'Track record', value: `${hiredJobs} jobs · ${reviews} reviews` },
              ]}
            />
            <a href={`/admin/users/${p.id}`} className="ulink mt-5 inline-block text-[13.5px]">
              Wallet, jobs and transactions →
            </a>
          </Section>
        </div>

        <div className="space-y-4 md:space-y-6">
          <Section title="Checklist">
            <ul className="space-y-3">
              {checks.map((c) => (
                <li key={c.label} className="flex gap-2.5">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${c.ok ? 'bg-[var(--teal-wash)] text-[var(--navy)]' : 'bg-[var(--bad)]/10 text-[var(--bad)]'}`}
                  >
                    {c.ok ? '✓' : '!'}
                  </span>
                  <span>
                    <span className="block font-medium text-[var(--ink)]">
                      {c.label}
                      <span className="sr-only">{c.ok ? ' — present' : ' — missing'}</span>
                    </span>
                    <span className="block text-[13px] text-[var(--muted)]">{c.hint}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Decision">
            <DecisionPanel artisanId={p.id} status={status} />
            {p.provider_reviewed_at && (
              <div className="mt-5 border-t border-[var(--rule)] pt-4 text-[13px] text-[var(--muted)]">
                Last decision {formatDateTime(p.provider_reviewed_at)}
                {reviewerEmail ? ` by ${reviewerEmail}` : ''}.
                {p.provider_review_note && <p className="mt-2 whitespace-pre-wrap text-[var(--ink)]">“{p.provider_review_note}”</p>}
              </div>
            )}
          </Section>
        </div>
      </div>

      {viewing && (
        <div role="dialog" aria-modal="true" aria-label="Work photo" className="fixed inset-0 z-50 grid place-items-center bg-[rgba(16,21,27,0.85)] p-4" onClick={() => setViewing(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL. */}
          <img src={viewing} alt="" className="max-h-full max-w-full rounded object-contain" />
          <button type="button" className="btn btn-ghost absolute right-4 top-4 !bg-white" onClick={() => setViewing(null)}>
            Close
          </button>
        </div>
      )}
    </>
  );
}

type Choice = 'approve' | 'request_changes' | 'suspend';

function DecisionPanel({ artisanId, status }: { artisanId: string; status: string }) {
  const review = useReviewArtisan();
  const [choice, setChoice] = useState<Choice | null>(null);
  const [note, setNote] = useState('');

  const options: { value: Choice; title: string; body: string }[] =
    status === 'pending'
      ? [
          { value: 'approve', title: 'Approve', body: 'They become discoverable and can quote right away.' },
          { value: 'request_changes', title: 'Request changes', body: 'Send it back with a note; they can fix it and resubmit.' },
        ]
      : status === 'approved'
        ? [{ value: 'suspend', title: 'Suspend', body: 'Hide them from search and stop new quotes. Jobs under way are unaffected.' }]
        : status === 'rejected' || status === 'suspended'
          ? [{ value: 'approve', title: status === 'suspended' ? 'Reinstate' : 'Approve anyway', body: 'Make them discoverable and able to quote.' }]
          : [];

  if (review.isSuccess) {
    return (
      <p role="status" className="rounded-md border border-[var(--teal)] bg-[var(--teal-wash)] px-3.5 py-3 font-medium text-[var(--navy)]">
        Done. The artisan has been notified in the app.
      </p>
    );
  }
  if (!options.length) {
    return <p className="text-[var(--muted)]">Not submitted yet. It appears under “To review” once the artisan finishes their application.</p>;
  }

  const needsNote = choice === 'request_changes' || choice === 'suspend';
  const ready = choice !== null && (!needsNote || note.trim().length >= 10);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!choice) return;
        review.mutate({ artisanId, decision: choice, note });
      }}
    >
      <fieldset className="space-y-2">
        <legend className="sr-only">Decision</legend>
        {options.map((o) => (
          <label
            key={o.value}
            className={`flex cursor-pointer gap-3 rounded-md border p-3 transition-colors duration-150 ${choice === o.value ? 'border-[var(--navy)] bg-[var(--teal-wash)]' : 'border-[var(--rule-strong)] hover:border-[var(--ink)]'}`}
          >
            <input type="radio" name="decision" value={o.value} checked={choice === o.value} onChange={() => setChoice(o.value)} className="mt-1 accent-[var(--navy)]" />
            <span>
              <span className="block font-semibold text-[var(--ink)]">{o.title}</span>
              <span className="block text-[13px] text-[var(--muted)]">{o.body}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {needsNote && (
        <label className="block">
          <span className="label">Note to the artisan</span>
          <textarea
            className="input mt-1.5"
            placeholder={choice === 'suspend' ? 'Why, and what they can do about it.' : 'What to fix, e.g. “Add photos of your own finished work — these look like stock images.”'}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <span className="mt-1 block text-[12.5px] text-[var(--muted)]">They see this exactly as written.</span>
        </label>
      )}

      {review.isError && <p className={ALERT}>{review.error.message}</p>}

      <button
        type="submit"
        disabled={!ready || review.isPending}
        className={`btn w-full ${choice === 'suspend' ? 'border border-[var(--bad)] text-[var(--bad)]' : choice === 'request_changes' ? 'btn-ghost' : 'btn-primary'}`}
      >
        {review.isPending ? 'Saving…' : choice === 'approve' ? 'Approve artisan' : choice === 'request_changes' ? 'Send back with note' : choice === 'suspend' ? 'Suspend artisan' : 'Choose a decision'}
      </button>
    </form>
  );
}
