'use client';

/**
 * Top up the wallet. Ported from mobile components/wallet/fund-form.tsx.
 *
 * Web difference: Flutterwave's hosted checkout opens in a new tab instead of
 * an in-app browser, and this page waits for the money. The webhook credits the
 * wallet server-side and realtime (useRealtimeSync) refreshes the balance here,
 * so the page notices on its own — no redirect back is needed. The tab is
 * opened synchronously on click and pointed at the link once it arrives;
 * opening it after the await would be blocked as a pop-up.
 */
import { useState } from 'react';

import { Icon } from '@/components/app/icon';
import { useOnline } from '@/components/app/pwa';
import { Button, ButtonLink, Field, Note, PageHeader, Section } from '@/components/app/ui';
import { formatMoney } from '@/lib/app/domain/money';
import { routes } from '@/lib/app/domain/routes';
import { useInitTopUp, useRefreshWallet, useWallet } from '@/lib/app/queries/use-wallet';

const PRESETS = [5000, 10000, 25000, 50000];

export function FundForm() {
  const online = useOnline();
  const topUp = useInitTopUp();
  const refreshWallet = useRefreshWallet();
  const { data: wallet } = useWallet();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [waitingFrom, setWaitingFrom] = useState<number | null>(null);

  const value = Number(amount.replace(/[^0-9]/g, ''));
  const balance = wallet?.balance ?? 0;
  const arrived = waitingFrom != null && balance > waitingFrom;

  async function handleFund(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!value || value < 100) return setError('Enter an amount of at least ₦100');

    const tab = window.open('', '_blank');
    try {
      const { link } = await topUp.mutateAsync(value);
      if (tab) {
        tab.opener = null;
        tab.location.href = link;
      } else {
        // Pop-ups blocked: go there in this tab; realtime catches up on return.
        window.location.href = link;
        return;
      }
      setWaitingFrom(balance);
    } catch (e) {
      tab?.close();
      setError(e instanceof Error ? e.message : 'Could not start payment.');
    }
  }

  if (waitingFrom != null) {
    return (
      <div className="mx-auto max-w-[560px]">
        <PageHeader back={{ href: routes.wallet(), label: 'Wallet' }} title={arrived ? 'Money received' : 'Finish paying in the new tab'} />
        <section className="card enter space-y-4 p-6 text-center">
          <span className={`mx-auto grid size-14 place-items-center rounded-full ${arrived ? 'bg-[var(--teal-wash)] text-[var(--navy)]' : 'bg-[var(--band)] text-[var(--muted)]'}`}>
            {arrived ? <Icon name="checkmark-circle" size={30} /> : <span className="spinner !size-6" aria-hidden="true" />}
          </span>
          {arrived ? (
            <p className="text-[15px] text-[var(--muted)]">
              Your balance is now <b className="figure text-[var(--ink)]">{formatMoney(balance)}</b>.
            </p>
          ) : (
            <p className="text-[15px] text-[var(--muted)]">
              Pay <b className="figure text-[var(--ink)]">{formatMoney(value)}</b> with Flutterwave in the tab that just opened. This page updates by itself when the money lands — usually within a minute.
            </p>
          )}
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <ButtonLink href={routes.wallet()} variant={arrived ? 'primary' : 'ghost'}>
              Back to wallet
            </ButtonLink>
            {!arrived && (
              <Button variant="quiet" icon="refresh" onClick={() => refreshWallet()}>
                Check now
              </Button>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <form onSubmit={handleFund} noValidate className="mx-auto max-w-[560px]">
      <PageHeader back={{ href: routes.wallet(), label: 'Wallet' }} title="Add money" description="Top up securely with Flutterwave — card, bank transfer or USSD." />
      <div className="space-y-6">
        <Section title="How much?">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={value === p}
                onClick={() => {
                  setAmount(p.toLocaleString('en-NG'));
                  setError(null);
                }}
                className={`figure h-12 rounded-md border text-[15px] font-semibold transition-colors duration-150 ${
                  value === p ? 'border-[var(--navy)] bg-[var(--teal-wash)] text-[var(--navy)]' : 'border-[var(--rule-strong)] text-[var(--ink)] hover:border-[var(--ink)]'
                }`}
              >
                {formatMoney(p)}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Field label="Amount" htmlFor="amount" error={error}>
              <div className="relative">
                <span className="figure pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[var(--muted)]">₦</span>
                <input
                  id="amount"
                  className="input figure !h-14 pl-8 !text-[22px]"
                  inputMode="numeric"
                  placeholder="0"
                  autoFocus
                  value={amount}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^0-9]/g, '');
                    setAmount(digits ? Number(digits).toLocaleString('en-NG') : '');
                    setError(null);
                  }}
                />
              </div>
            </Field>
          </div>
        </Section>
        <Note icon="lock-closed">You’ll finish paying on Flutterwave’s secure page in a new tab. HandLancer never sees your card details.</Note>
        <div className="flex justify-end">
          <Button type="submit" size="lg" icon="card" loading={topUp.isPending} disabled={!online}>
            Continue to payment
          </Button>
        </div>
      </div>
    </form>
  );
}
