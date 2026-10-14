'use client';

/**
 * Connect a payout bank account. Ported from mobile
 * components/wallet/bank-account-screen.tsx: the account holder's name is never
 * typed — it comes back from the bank via Flutterwave and the person confirms
 * it, which stops a payout going to a mistyped or someone else's account.
 */
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { SuccessDialog } from '@/components/app/escrow';
import { Icon } from '@/components/app/icon';
import { Button, ErrorNote, Field, PageHeader, Section, Skeleton } from '@/components/app/ui';
import { routes } from '@/lib/app/domain/routes';
import { useBanks, useSaveBankAccount, useWalletSecurity } from '@/lib/app/queries/use-wallet-security';
import { resolveBankAccount } from '@/lib/app/services/security';

export function BankForm() {
  const router = useRouter();
  const { data: security } = useWalletSecurity();
  const { data: banks, isLoading: banksLoading, error: banksError } = useBanks();
  const save = useSaveBankAccount();

  const [bankQuery, setBankQuery] = useState('');
  const [bankCode, setBankCode] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const selectedBank = banks?.find((b) => b.code === bankCode) ?? null;
  const filtered = useMemo(() => {
    const q = bankQuery.trim().toLowerCase();
    const list = banks ?? [];
    return q ? list.filter((b) => b.name.toLowerCase().includes(q)) : list;
  }, [banks, bankQuery]);
  const canResolve = Boolean(bankCode) && /^\d{10}$/.test(accountNumber);

  async function verify() {
    setError(null);
    setResolvedName(null);
    if (!canResolve || !bankCode) return;
    setResolving(true);
    try {
      const res = await resolveBankAccount(accountNumber, bankCode);
      setResolvedName(res.accountName);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not verify that account.');
    } finally {
      setResolving(false);
    }
  }

  async function confirm() {
    setError(null);
    if (!bankCode) return;
    try {
      await save.mutateAsync({ accountNumber, bankCode });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that account.');
    }
  }

  return (
    <div className="mx-auto max-w-[560px]">
      <PageHeader back={{ href: routes.wallet(), label: 'Wallet' }} title="Bank account" description="Where your withdrawals are paid." />

      <div className="space-y-6">
        {security?.hasBank && (
          <section className="card p-4">
            <p className="flex items-center gap-2 font-semibold text-[var(--ink)]">
              <Icon name="checkmark-circle" size={18} className="text-[var(--ok)]" />
              Current payout account
            </p>
            <p className="mt-2 text-[15px] text-[var(--ink)]">{security.accountName}</p>
            <p className="text-[13.5px] text-[var(--muted)]">
              {security.bankName} · {security.accountMasked}
            </p>
            <p className="mt-2 text-[13px] text-[var(--muted)]">Adding a new account replaces this one.</p>
          </section>
        )}

        <Section title="Choose your bank">
          {banksError && <ErrorNote>Could not load the bank list. Check your connection and try again.</ErrorNote>}
          {selectedBank ? (
            <button
              type="button"
              onClick={() => {
                setBankCode(null);
                setResolvedName(null);
              }}
              className="flex w-full items-center gap-3 rounded-md border border-[var(--navy)] bg-[var(--teal-wash)] px-3.5 py-3 text-left"
            >
              <Icon name="business" size={18} className="text-[var(--navy)]" />
              <span className="flex-1 font-semibold text-[var(--ink)]">{selectedBank.name}</span>
              <span className="text-[13.5px] font-semibold text-[var(--navy)]">Change</span>
            </button>
          ) : banksLoading ? (
            <Skeleton className="h-40" />
          ) : (
            <>
              <label className="relative block">
                <span className="sr-only">Search banks</span>
                <Icon name="search" size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input className="input pl-9" type="search" placeholder="Search banks" value={bankQuery} onChange={(e) => setBankQuery(e.target.value)} />
              </label>
              <ul className="mt-2 max-h-72 divide-y divide-[var(--rule)] overflow-y-auto rounded-md border border-[var(--rule)]">
                {filtered.slice(0, 60).map((b) => (
                  <li key={b.code}>
                    <button
                      type="button"
                      onClick={() => {
                        setBankCode(b.code);
                        setResolvedName(null);
                        setError(null);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-[15px] text-[var(--ink)] hover:bg-[var(--band)]"
                    >
                      {b.name}
                    </button>
                  </li>
                ))}
                {!filtered.length && <li className="px-3.5 py-3 text-[14px] text-[var(--muted)]">No bank matches “{bankQuery}”.</li>}
              </ul>
            </>
          )}
        </Section>

        <Section title="Account number">
          <Field label="10-digit NUBAN" htmlFor="nuban">
            <input
              id="nuban"
              className="input figure !h-12 !text-[18px] tracking-[0.08em]"
              inputMode="numeric"
              maxLength={10}
              placeholder="0123456789"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 10));
                setResolvedName(null);
                setError(null);
              }}
            />
          </Field>
          {resolvedName && (
            <div className="mt-3 flex items-center gap-3 rounded-md bg-[var(--teal-wash)] px-3.5 py-3">
              <Icon name="checkmark-circle" size={20} className="text-[var(--ok)]" />
              <div>
                <p className="text-[12.5px] text-[var(--muted)]">Account verified</p>
                <p className="font-semibold text-[var(--ink)]">{resolvedName}</p>
              </div>
            </div>
          )}
        </Section>

        <ErrorNote>{error}</ErrorNote>

        {resolvedName ? (
          <div className="space-y-2">
            <Button size="lg" block icon="checkmark-circle" loading={save.isPending} onClick={() => void confirm()}>
              Use this account
            </Button>
            <p className="text-[13px] text-[var(--muted)]">
              Withdrawals will be sent to {resolvedName}. Make sure this is you — we cannot recall a transfer once your bank has processed it.
            </p>
          </div>
        ) : (
          <Button size="lg" block icon="search" disabled={!canResolve} loading={resolving} onClick={() => void verify()}>
            Verify account
          </Button>
        )}
      </div>

      <SuccessDialog
        open={saved}
        onClose={() => {
          setSaved(false);
          router.push(routes.wallet());
        }}
        title="Bank account linked"
        message={`Withdrawals will be sent to ${resolvedName ?? 'your account'}.`}
      />
    </div>
  );
}
