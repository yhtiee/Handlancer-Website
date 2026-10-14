'use client';

/**
 * Wallet. Ported from mobile components/wallet/wallet-screen.tsx and
 * transaction-row.tsx: the balance and the two things to do with it, what is
 * held in escrow per job, then every movement grouped by month.
 */
import Link from 'next/link';

import { LoadMore } from '@/components/app/controls';
import { Icon, type IconName } from '@/components/app/icon';
import { Thumb } from '@/components/app/rows';
import { ButtonLink, EmptyState, EscrowTape, ListSkeleton, Section, Skeleton, escrowAmounts } from '@/components/app/ui';
import { useAuth } from '@/lib/app/auth';
import { timeAgo } from '@/lib/app/domain/date';
import { formatMoney } from '@/lib/app/domain/money';
import { providerImageFallback } from '@/lib/app/domain/provider-images';
import { routes } from '@/lib/app/domain/routes';
import { useInfiniteList } from '@/lib/app/hooks/use-infinite-list';
import { useMyJobs, useProviderJobs } from '@/lib/app/queries/use-jobs';
import { useProvider } from '@/lib/app/queries/use-providers';
import { useEscrow, useTransactions, useWallet } from '@/lib/app/queries/use-wallet';
import { useWalletSecurity } from '@/lib/app/queries/use-wallet-security';
import type { Job, Transaction, TxnType } from '@/lib/app/services/database.types';

export const TXN_META: Record<TxnType, { label: string; icon: IconName; credit: boolean }> = {
  fund: { label: 'Wallet funded', icon: 'arrow-down', credit: true },
  withdraw: { label: 'Withdrawal', icon: 'arrow-up', credit: false },
  escrow_hold: { label: 'Into escrow', icon: 'lock-closed', credit: false },
  escrow_release: { label: 'Materials released', icon: 'cube', credit: true },
  payout: { label: 'Job payout', icon: 'checkmark', credit: true },
};

type Item = { kind: 'month'; key: string; label: string } | { kind: 'txn'; key: string; txn: Transaction };

/** Interleave month headings ("October", "September 2025") into the list. */
function withMonths(txns: Transaction[]): Item[] {
  const out: Item[] = [];
  const thisYear = new Date().getFullYear();
  let last = '';
  for (const t of txns) {
    const d = new Date(t.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (key !== last) {
      last = key;
      const month = d.toLocaleString('en-NG', { month: 'long' });
      out.push({ kind: 'month', key, label: d.getFullYear() === thisYear ? month : `${month} ${d.getFullYear()}` });
    }
    out.push({ kind: 'txn', key: t.id, txn: t });
  }
  return out;
}

export function WalletView() {
  const { profile } = useAuth();
  const shell = profile?.role === 'provider' ? 'provider' : 'user';
  const { data: wallet, isLoading } = useWallet();
  const query = useTransactions();
  const { items: txns, onEndReached, loadingMore } = useInfiniteList(query);
  const [whole, kobo] = formatMoney(wallet?.balance ?? 0, wallet?.currency ?? 'NGN').split('.');

  return (
    <div className="space-y-6">
      <header className="enter">
        <h1>Wallet</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <section className="card enter p-5 md:p-6">
            <p className="label">Available to spend or withdraw</p>
            {isLoading ? (
              <Skeleton className="mt-3 h-12 w-48" />
            ) : (
              <p className="figure mt-2 text-[44px] font-semibold leading-none tracking-[-0.03em] text-[var(--ink)]">
                {whole}
                {kobo && <span className="text-[24px] text-[var(--muted)]">.{kobo}</span>}
              </p>
            )}
            <div className="mt-5 grid grid-cols-2 gap-2 sm:flex">
              <ButtonLink href={routes.walletFund()} icon="add" size="lg">
                Fund
              </ButtonLink>
              <ButtonLink href={routes.walletWithdraw()} icon="arrow-up" variant="ghost" size="lg">
                Withdraw
              </ButtonLink>
            </div>
          </section>

          <HeldInEscrow shell={shell} />

          <Section title="Transactions" flush>
            {query.isLoading ? (
              <ListSkeleton rows={4} />
            ) : txns.length === 0 ? (
              <EmptyState title="No transactions yet">Fund your wallet or finish a job, and the money shows up here.</EmptyState>
            ) : (
              <ul>
                {withMonths(txns).map((item) =>
                  item.kind === 'month' ? (
                    <li key={item.key} className="label border-b border-[var(--rule)] bg-[var(--band)] px-4 py-2 md:px-5">
                      {item.label}
                    </li>
                  ) : (
                    <li key={item.key} className="border-b border-[var(--rule)] last:border-0">
                      <TransactionRow txn={item.txn} />
                    </li>
                  ),
                )}
              </ul>
            )}
            <LoadMore hasMore={!!query.hasNextPage} loading={loadingMore} onLoad={onEndReached} />
          </Section>
        </div>

        <aside className="space-y-6">
          <PayoutSetup />
        </aside>
      </div>
    </div>
  );
}

function TransactionRow({ txn }: { txn: Transaction }) {
  const m = TXN_META[txn.type];
  return (
    <Link href={routes.walletTransaction(txn.id)} className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-[var(--band)] md:px-5">
      {/* Neutral glyph: direction is told by the sign, not colour (fails contrast at this size). */}
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--band)] text-[var(--ink)]">
        <Icon name={m.icon} size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-[var(--ink)]">{m.label}</span>
        <span className="block text-[13px] text-[var(--muted)]">
          {txn.status === 'pending' ? 'Pending · ' : txn.status === 'failed' ? 'Failed · ' : ''}
          {timeAgo(txn.created_at)}
        </span>
      </span>
      <span className={`figure font-semibold ${m.credit ? 'text-[var(--ok-ink)]' : 'text-[var(--ink)]'} ${txn.status === 'failed' ? 'line-through opacity-60' : ''}`}>
        {m.credit ? '+' : '−'}
        {formatMoney(txn.amount)}
      </span>
      <Icon name="chevron-forward" size={15} className="text-[var(--muted)]" />
    </Link>
  );
}

/** Each live job's escrow, under the face of the person it is held for. */
function HeldInEscrow({ shell }: { shell: 'user' | 'provider' }) {
  const mine = useInfiniteList(useMyJobs('active')).items as Job[];
  const hired = useInfiniteList(useProviderJobs('active')).items as Job[];
  const jobs = (shell === 'user' ? mine : hired).slice(0, 4);
  if (!jobs.length) return null;
  return (
    <Section title={shell === 'user' ? 'Held in escrow' : 'Coming to you'} flush>
      <div className="divide-y divide-[var(--rule)]">
        {jobs.map((j) => (
          <EscrowBlock key={j.id} job={j} shell={shell} />
        ))}
      </div>
    </Section>
  );
}

function EscrowBlock({ job, shell }: { job: Job; shell: 'user' | 'provider' }) {
  const { data: escrow } = useEscrow(job.id);
  const { data: provider } = useProvider(shell === 'user' ? (job.hired_provider_id ?? '') : '');
  if (!escrow || escrow.status === 'pending') return null;
  const { held, released } = escrowAmounts(escrow);
  return (
    <Link href={routes.jobDetail(job.id)} className="block space-y-2.5 px-4 py-3.5 transition-colors duration-150 hover:bg-[var(--band)] md:px-5">
      <div className="flex items-center gap-3">
        {provider && <Thumb src={provider.avatar_url ?? providerImageFallback(provider)} size={36} />}
        <div className="min-w-0 flex-1">
          <p className="figure font-semibold text-[var(--ink)]">
            {formatMoney(held)} {shell === 'user' ? 'in escrow' : 'to come'}
          </p>
          <p className="truncate text-[13px] text-[var(--muted)]">
            {provider?.name ? `With ${provider.name} · ` : ''}
            {job.title}
          </p>
        </div>
      </div>
      <EscrowTape escrow={escrow} size="inline" labelled={false} />
      {released > 0 && <p className="text-[13px] text-[var(--muted)]">{formatMoney(released)} released so far</p>}
    </Link>
  );
}

/** Bank and PIN at a glance: what withdrawing needs, and whether it is done. */
function PayoutSetup() {
  const { data: security, isLoading } = useWalletSecurity();
  return (
    <Section title="Payouts">
      {isLoading ? (
        <Skeleton className="h-24" />
      ) : (
        <ul className="space-y-1">
          <SetupLink
            href={routes.walletBank()}
            icon="business"
            done={!!security?.hasBank}
            title={security?.hasBank ? (security.accountName ?? 'Bank account') : 'Link a bank account'}
            hint={security?.hasBank ? `${security.bankName} · ${security.accountMasked}` : 'We verify it with your bank'}
          />
          <SetupLink
            href={routes.walletPin()}
            icon="lock-closed"
            done={!!security?.hasPin}
            title={security?.hasPin ? 'Transfer PIN set' : 'Set a transfer PIN'}
            hint={security?.hasPin ? 'Change it any time' : 'Asked for on every withdrawal and release'}
          />
        </ul>
      )}
    </Section>
  );
}

export function SetupLink({ href, icon, done, title, hint }: { href: string; icon: IconName; done: boolean; title: string; hint: string }) {
  return (
    <li>
      <Link href={href} className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-[var(--band)]">
        <span className={`grid size-9 shrink-0 place-items-center rounded-full ${done ? 'bg-[var(--teal-wash)] text-[var(--navy)]' : 'bg-[var(--band)] text-[var(--ink)]'}`}>
          <Icon name={done ? 'checkmark-circle' : icon} size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-[var(--ink)]">{title}</span>
          <span className="block truncate text-[13px] text-[var(--muted)]">{hint}</span>
        </span>
        <Icon name="chevron-forward" size={15} className="text-[var(--muted)]" />
      </Link>
    </li>
  );
}
