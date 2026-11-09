'use client';

import { useEffect, useRef, useState } from 'react';

import { formatNaira } from '@/lib/admin/format';
import { useRetryWithdrawalPayout, useSettleWithdrawal } from '@/lib/admin/query/hooks';
import type { PayoutState } from '@/lib/admin/types';
import { transferFee } from '@/lib/app/domain/fees';

type Payout = { bank_name: string | null; account_name: string | null; account_number: string | null } | null;

/** What Flutterwave's part in this withdrawal means for whoever is looking at it. */
const STATE_ADVICE: Record<PayoutState, string> = {
  sending: 'Being sent through Flutterwave now. Don’t pay this by hand.',
  submitted: 'Flutterwave has accepted this and it will settle by itself. Don’t pay this by hand.',
  not_sent: 'Flutterwave refused this, so no money left. Fix the cause, then send it again.',
  unknown: 'Flutterwave gave no clear answer, so this may have been paid. Search for this reference in the Flutterwave dashboard before doing anything.',
};

/**
 * A withdrawal waiting on a person. Shows where the money has to go and where
 * Flutterwave has got to, and says what each answer does: "failed" puts it back
 * in the wallet and neither can be undone from here.
 */
export function SettleWithdrawal({
  transactionId,
  amount,
  who,
  payout,
  state,
  note,
  reference: flutterwaveReference,
}: {
  transactionId: string;
  amount: number;
  who: string;
  payout: Payout;
  state?: PayoutState | null;
  note?: string | null;
  reference?: string | null;
}) {
  const settle = useSettleWithdrawal();
  const retry = useRetryWithdrawalPayout();
  const busy = settle.isPending || retry.isPending;
  const canRetry = state === 'not_sent' || state === 'unknown';
  const problem = settle.error ?? retry.error;
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState('');

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  function submit(outcome: 'paid' | 'failed') {
    settle.mutate({ transactionId, outcome, reference }, { onSuccess: () => setOpen(false) });
  }

  const fee = transferFee(amount);
  const rows: [string, string][] = [
    ['Withdrawn', formatNaira(amount)],
    ['Flutterwave fee', formatNaira(fee)],
    ['Send to their bank', formatNaira(amount - fee)],
    ['Bank', payout?.bank_name ?? 'Not on file'],
    ['Account name', payout?.account_name ?? 'Not on file'],
    ['Account number', payout?.account_number ?? 'Not on file'],
  ];

  return (
    <>
      <button type="button" className="btn btn-ghost !px-3 !py-1.5 !text-[13px]" onClick={() => setOpen(true)}>
        {canRetry ? 'Needs attention' : state ? 'With Flutterwave' : 'Settle'}
      </button>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        // It renders inside a table cell: undo the nowrap and figure font that cell passes down.
        className="m-auto max-h-[calc(100dvh-32px)] w-[min(440px,calc(100vw-32px))] overflow-y-auto border border-[var(--rule-strong)] bg-[var(--paper)] p-0 font-[family-name:var(--font-spline)] text-[15px] whitespace-normal backdrop:bg-black/40"
      >
        {open && (
          <div className="space-y-4 p-5 text-left">
            <div>
              <h2 className="!text-[18px]">Settle withdrawal</h2>
              <p className="mt-1 text-[14px] text-[var(--muted)]">{who}</p>
            </div>
            <dl className="divide-y divide-[var(--rule)] border-y border-[var(--rule)] text-[14px]">
              {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-2">
                  <dt className="text-[var(--muted)]">{label}</dt>
                  <dd className="figure text-right font-semibold text-[var(--ink)]">{value}</dd>
                </div>
              ))}
            </dl>
            {state && (
              <div className="space-y-1 rounded-md bg-[var(--band)] px-3.5 py-3 text-[13.5px] text-[var(--ink)]">
                <p>{STATE_ADVICE[state]}</p>
                {note && <p className="text-[var(--muted)]">Flutterwave said: {note}</p>}
                {flutterwaveReference && <p className="figure break-all text-[12.5px] text-[var(--muted)]">{flutterwaveReference}</p>}
              </div>
            )}
            <label className="block space-y-1.5 text-[14px]">
              <span className="text-[var(--muted)]">Bank reference (optional)</span>
              <input className="input w-full" value={reference} onChange={(e) => setReference(e.target.value)} autoComplete="off" />
            </label>
            <p className="text-[13.5px] text-[var(--muted)]">
              <b className="text-[var(--ink)]">Paid</b> means you’ve already sent this from the Flutterwave dashboard. <b className="text-[var(--ink)]">Failed</b> returns it to their wallet. Both email them, and neither can be undone.
            </p>
            {problem && (
              <p role="alert" className="text-[13.5px] font-medium text-[var(--bad)]">
                {problem.message}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setOpen(false)}>
                Cancel
              </button>
              {canRetry && (
                <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => retry.mutate({ transactionId }, { onSuccess: () => setOpen(false) })}>
                  Send through Flutterwave
                </button>
              )}
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => submit('failed')}>
                Failed, refund wallet
              </button>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => submit('paid')}>
                Mark as paid
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
