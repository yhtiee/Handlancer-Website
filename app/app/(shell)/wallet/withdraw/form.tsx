'use client';

/**
 * Withdraw to the linked bank. Ported from mobile
 * components/wallet/withdraw-form.tsx: both setup requirements shown together
 * until done, then amount + PIN — the PIN checked inside request_withdrawal,
 * in the same transaction that debits the wallet.
 */
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { SuccessDialog } from '@/components/app/escrow';
import { Icon } from '@/components/app/icon';
import { useOnline } from '@/components/app/pwa';
import { Button, ErrorNote, Field, Money, PageHeader, Section, Skeleton } from '@/components/app/ui';
import { routes } from '@/lib/app/domain/routes';
import { useRequestWithdrawal, useWallet } from '@/lib/app/queries/use-wallet';
import { useWalletSecurity } from '@/lib/app/queries/use-wallet-security';

import { SetupLink } from '../wallet-view';

export function WithdrawForm() {
  const router = useRouter();
  const online = useOnline();
  const { data: wallet } = useWallet();
  const { data: security, isLoading: securityLoading } = useWalletSecurity();
  const withdraw = useRequestWithdrawal();

  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const balance = wallet?.balance ?? 0;
  const hasBank = Boolean(security?.hasBank);
  const hasPin = Boolean(security?.hasPin);
  const ready = hasBank && hasPin;
  // Evaluated by Postgres, which is also what enforces it.
  const locked = Boolean(security?.pinLocked);
  const value = Number(amount.replace(/[^0-9]/g, ''));

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setAmountError(null);
    setPinError(null);
    setSubmissionError(null);
    let invalid = false;
    if (!value) {
      setAmountError('Enter an amount');
      invalid = true;
    } else if (value > balance) {
      setAmountError('Amount exceeds your balance');
      invalid = true;
    }
    if (!/^\d{4}$/.test(pin)) {
      setPinError('Enter your 4-digit PIN');
      invalid = true;
    }
    if (invalid) return;
    try {
      await withdraw.mutateAsync({ amount: value, pin });
      setPin('');
      setDone(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not request withdrawal.';
      if (/pin/i.test(msg)) setPinError(msg);
      else setSubmissionError(msg);
    }
  }

  return (
    <div className="mx-auto max-w-[560px]">
      <PageHeader
        back={{ href: routes.wallet(), label: 'Wallet' }}
        title="Withdraw"
        description={
          <>
            Available: <Money amount={balance} className="font-semibold text-[var(--ink)]" />
          </>
        }
      />

      {securityLoading ? (
        <Skeleton className="h-40" />
      ) : !ready ? (
        <Section title="Before you can withdraw">
          <p className="-mt-1 mb-3 text-[14px] text-[var(--muted)]">These protect your money. You only set them up once.</p>
          <ul className="space-y-1">
            <SetupLink href={routes.walletBank()} icon="business" done={hasBank} title="Link a bank account" hint="We verify it with your bank" />
            <SetupLink href={routes.walletPin()} icon="lock-closed" done={hasPin} title="Set a transfer PIN" hint="Asked for on every withdrawal" />
          </ul>
        </Section>
      ) : (
        <form onSubmit={handleWithdraw} noValidate className="space-y-6">
          <section className="card flex items-start gap-3 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--band)] text-[var(--navy)]">
              <Icon name="business" size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="label !text-[10.5px]">Paying out to</p>
              <p className="mt-0.5 font-semibold text-[var(--ink)]">{security?.accountName}</p>
              <p className="text-[13.5px] text-[var(--muted)]">
                {security?.bankName} · {security?.accountMasked}
              </p>
            </div>
            <button type="button" onClick={() => router.push(routes.walletBank())} className="text-[13.5px] font-semibold text-[var(--navy)] hover:underline">
              Change
            </button>
          </section>

          <Section title="Amount and PIN">
            <div className="space-y-5">
              <Field label="Amount" htmlFor="amount" error={amountError}>
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
                      setAmountError(null);
                    }}
                  />
                </div>
                {balance > 0 && (
                  <button type="button" className="self-start text-[13px] font-semibold text-[var(--navy)] hover:underline" onClick={() => setAmount(balance.toLocaleString('en-NG'))}>
                    Withdraw everything
                  </button>
                )}
              </Field>
              <Field label="Transfer PIN" htmlFor="pin" error={pinError}>
                <input
                  id="pin"
                  className="input figure !h-12 tracking-[0.5em]"
                  type="password"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4));
                    setPinError(null);
                  }}
                />
              </Field>
            </div>
          </Section>

          {locked && <ErrorNote>Too many incorrect PIN attempts. Withdrawals are locked for a short while — try again shortly.</ErrorNote>}
          <p className="text-[13.5px] text-[var(--muted)]">Withdrawals are sent to your linked bank account and usually settle within 24 hours.</p>
          <ErrorNote>{submissionError}</ErrorNote>

          <div className="flex justify-end">
            <Button type="submit" size="lg" icon="arrow-up" disabled={locked || !online} loading={withdraw.isPending}>
              Request withdrawal
            </Button>
          </div>
        </form>
      )}

      <SuccessDialog
        open={done}
        onClose={() => {
          setDone(false);
          router.push(routes.wallet());
        }}
        title="Withdrawal requested"
        message={`Your payout to ${security?.accountName ?? 'your bank'} is being processed and usually settles within 24 hours.`}
        amount={value || undefined}
      />
    </div>
  );
}
