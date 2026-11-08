'use client';

import { useEffect, useRef, useState } from 'react';

import { formatNaira } from '@/lib/admin/format';
import { useSettleWithdrawal } from '@/lib/admin/query/hooks';

type Payout = { bank_name: string | null; account_name: string | null; account_number: string | null } | null;

/**
 * Record what happened to a payout made by hand. Shows where the money has to
 * go, and says what each answer does: "failed" puts it back in the wallet and
 * neither can be undone from here.
 */
export function SettleWithdrawal({ transactionId, amount, who, payout }: { transactionId: string; amount: number; who: string; payout: Payout }) {
  const settle = useSettleWithdrawal();
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

  const rows: [string, string][] = [
    ['Amount', formatNaira(amount)],
    ['Bank', payout?.bank_name ?? 'Not on file'],
    ['Account name', payout?.account_name ?? 'Not on file'],
    ['Account number', payout?.account_number ?? 'Not on file'],
  ];

  return (
    <>
      <button type="button" className="btn btn-ghost !px-3 !py-1.5 !text-[13px]" onClick={() => setOpen(true)}>
        Settle
      </button>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        className="m-auto w-[min(440px,calc(100vw-32px))] border border-[var(--rule-strong)] bg-[var(--paper)] p-0 backdrop:bg-black/40"
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
            <label className="block space-y-1.5 text-[14px]">
              <span className="text-[var(--muted)]">Bank reference (optional)</span>
              <input className="input w-full" value={reference} onChange={(e) => setReference(e.target.value)} autoComplete="off" />
            </label>
            <p className="text-[13.5px] text-[var(--muted)]">
              <b className="text-[var(--ink)]">Paid</b> means you’ve already sent this money. <b className="text-[var(--ink)]">Failed</b> returns it to their wallet. Both email them, and neither can be undone.
            </p>
            {settle.error && (
              <p role="alert" className="text-[13.5px] font-medium text-[var(--bad)]">
                {settle.error.message}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className="btn btn-ghost" disabled={settle.isPending} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-ghost" disabled={settle.isPending} onClick={() => submit('failed')}>
                Failed, refund wallet
              </button>
              <button type="button" className="btn btn-primary" disabled={settle.isPending} onClick={() => submit('paid')}>
                Mark as paid
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
