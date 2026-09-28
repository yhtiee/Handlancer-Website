'use client';

import { useState } from 'react';

import { formatNaira } from '@/lib/admin/format';
import { useResolveDispute } from '@/lib/admin/query/hooks';

type Outcome = 'refund' | 'release' | 'split';

const OPTIONS: { value: Outcome; title: string; body: string }[] = [
  { value: 'refund', title: 'Refund the client', body: 'Everything held goes back to the client’s wallet.' },
  { value: 'release', title: 'Pay the provider', body: 'Everything held is released to the provider.' },
  { value: 'split', title: 'Split it', body: 'Choose the provider’s share; the rest is refunded.' },
];

/** The waitlist form's error treatments (components/waitlist.tsx). */
const ALERT =
  'rounded-md border border-[var(--bad)]/40 bg-[var(--bad)]/[.06] px-3.5 py-3 text-[13.5px] font-medium text-[var(--bad)]';
const FIELD_ERROR = 'mt-1.5 block text-[12.5px] font-medium text-[var(--bad)]';

/**
 * Two steps on purpose: choose, then confirm with the exact naira amounts in
 * front of you. Settlement moves real money and cannot be undone from here.
 *
 * On success the mutation refetches everything under ['admin'], so this panel
 * is replaced by the Resolution panel and the sidebar count drops, without a
 * page reload.
 */
export function ResolveForm({ disputeId, held }: { disputeId: string; held: number }) {
  const resolve = useResolveDispute();
  const pending = resolve.isPending;
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [split, setSplit] = useState('');
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState(false);

  const splitAmount = Number(split.replace(/[,\s₦]/g, ''));
  const release = outcome === 'release' ? held : outcome === 'split' ? splitAmount : 0;
  const splitValid = Number.isFinite(splitAmount) && splitAmount > 0 && splitAmount < held;
  const noteValid = note.trim().length >= 10;
  const ready = outcome !== null && noteValid && (outcome !== 'split' || splitValid);

  if (resolve.isSuccess) {
    return (
      <p
        role="status"
        className="rounded-md border border-[var(--teal)] bg-[var(--teal-wash)] px-3.5 py-3 font-medium text-[var(--navy)]"
      >
        Dispute settled. Both parties have been notified.
      </p>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!outcome) return;
        resolve.mutate(
          { disputeId, outcome, releaseAmount: outcome === 'split' ? splitAmount : undefined, note },
          // A server-side refusal sends the admin back to edit, not to a dead end.
          { onError: () => setConfirming(false) },
        );
      }}
    >

      <p className="text-[var(--muted)]">
        <span className="figure font-semibold text-[var(--navy)]">{formatNaira(held)}</span> is held in escrow.
      </p>

      <fieldset className="space-y-2" disabled={confirming || pending}>
        <legend className="sr-only">Outcome</legend>
        {OPTIONS.map((o) => {
          const selected = outcome === o.value;
          return (
            <label
              key={o.value}
              // Selected row on --teal-wash: the escrow simulator's "current step".
              className={`flex cursor-pointer gap-3 rounded-md border p-3 transition-colors duration-200 ${
                selected ? 'border-[var(--navy)] bg-[var(--teal-wash)]' : 'border-[var(--rule-strong)] hover:border-[var(--ink)]'
              }`}
            >
              <input
                type="radio"
                name="_outcome"
                value={o.value}
                checked={selected}
                onChange={() => setOutcome(o.value)}
                className="mt-1 accent-[var(--navy)]"
              />
              <span>
                <span className="block font-semibold text-[var(--navy)]">{o.title}</span>
                <span className="block text-[13px] text-[var(--muted)]">{o.body}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      {outcome === 'split' && (
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium text-[var(--ink)]">Provider’s share (₦)</span>
          <input
            name="releaseAmount"
            inputMode="numeric"
            value={split}
            onChange={(e) => setSplit(e.target.value)}
            readOnly={confirming || pending}
            placeholder={`Less than ${formatNaira(held)}`}
            className="input figure"
            style={split && !splitValid ? { borderColor: 'var(--bad)' } : undefined}
          />
          {split && !splitValid && (
            <span className={FIELD_ERROR}>Enter an amount above ₦0 and below {formatNaira(held)}.</span>
          )}
        </label>
      )}

      <label className="block">
        <span className="mb-1.5 block text-[14px] font-medium text-[var(--ink)]">Decision note</span>
        <textarea
          name="note"
          required
          minLength={10}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          readOnly={confirming || pending}
          placeholder="What you found and why you decided this. Kept on the ticket with your email."
          className="input"
        />
        {!noteValid && (
          <span className="mt-1.5 block text-[12.5px] text-[var(--muted)]">At least 10 characters.</span>
        )}
      </label>

      {resolve.isError && (
        <p role="alert" className={ALERT}>
          {resolve.error.message}
        </p>
      )}

      {confirming ? (
        <div className="border border-[var(--rule-strong)] bg-[var(--band)] p-4">
          <p className="label !text-[var(--ink)]">Confirm settlement</p>
          <dl className="mt-3 space-y-1.5 text-[13.5px]">
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">To provider</dt>
              <dd className="figure font-semibold text-[var(--ink)]">{formatNaira(release)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">Refund to client</dt>
              <dd className="figure font-semibold text-[var(--ink)]">{formatNaira(held - release)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-[13px] text-[var(--muted)]">Both parties are notified. This cannot be undone.</p>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setConfirming(false)} disabled={pending} className="btn btn-ghost flex-1">
              Back
            </button>
            <button type="submit" disabled={pending} className="btn btn-primary flex-1">
              {pending ? 'Settling…' : 'Confirm'}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" disabled={!ready} onClick={() => setConfirming(true)} className="btn btn-primary w-full">
          Review settlement
        </button>
      )}
    </form>
  );
}
