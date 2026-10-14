'use client';

/**
 * A receipt. Ported from mobile components/wallet/transaction-detail-screen.tsx:
 * amount and outcome first, what the money was, which job and who, and the
 * reference support will ask for.
 */
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { Icon, type IconName } from '@/components/app/icon';
import { Avatar, Button, ButtonLink, Details, EmptyState, PageHeader, Section, Skeleton } from '@/components/app/ui';
import { useAuth } from '@/lib/app/auth';
import { formatDateTime } from '@/lib/app/domain/date';
import { formatMoney } from '@/lib/app/domain/money';
import { routes } from '@/lib/app/domain/routes';
import { useTransaction } from '@/lib/app/queries/use-wallet';
import { useWalletSecurity } from '@/lib/app/queries/use-wallet-security';
import type { TxnStatus, TxnType } from '@/lib/app/services/database.types';

const META: Record<TxnType, { label: string; icon: IconName; credit: boolean; blurb: string }> = {
  fund: { label: 'Wallet top-up', icon: 'arrow-down', credit: true, blurb: 'Money you added to your HandLancer wallet.' },
  withdraw: { label: 'Withdrawal', icon: 'arrow-up', credit: false, blurb: 'A payout from your wallet to your linked bank account.' },
  escrow_hold: { label: 'Into escrow', icon: 'lock-closed', credit: false, blurb: 'Held safely for this job. It is only paid out when you approve the work.' },
  escrow_release: { label: 'Materials released', icon: 'cube', credit: true, blurb: 'The materials portion of the escrow, released to the artisan.' },
  payout: { label: 'Job payout', icon: 'checkmark-circle', credit: true, blurb: 'The final payment for completed work.' },
};

const STATUS_TEXT: Record<TxnStatus, string> = { pending: 'Pending', success: 'Successful', failed: 'Failed' };

export function TransactionView() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { data: txn, isLoading } = useTransaction(id);
  const { data: security } = useWalletSecurity();
  const [copied, setCopied] = useState(false);

  if (isLoading) return <Skeleton className="h-72" />;
  if (!txn) {
    return (
      <div className="card">
        <EmptyState title="Transaction not found" />
      </div>
    );
  }

  const meta = META[txn.type];
  const statusClass = txn.status === 'success' ? 'text-[var(--ok-ink)]' : txn.status === 'failed' ? 'text-[var(--bad)]' : 'text-[var(--warn)]';

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(txn?.reference ?? txn?.id ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked: the reference is selectable text on screen anyway.
    }
  }

  return (
    <div className="mx-auto max-w-[640px]">
      <PageHeader back={{ href: routes.wallet(), label: 'Wallet' }} title={meta.label} />

      <div className="space-y-6">
        <section className="card enter p-6 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--band)] text-[var(--navy)]">
            <Icon name={meta.icon} size={26} />
          </span>
          <p className={`figure mt-3 text-[38px] font-semibold tracking-[-0.03em] ${meta.credit ? 'text-[var(--ok-ink)]' : 'text-[var(--ink)]'}`}>
            {meta.credit ? '+' : '−'}
            {formatMoney(txn.amount)}
          </p>
          <p className={`label mt-1 !text-[11px] ${statusClass}`}>{STATUS_TEXT[txn.status]}</p>
          <p className="mx-auto mt-3 max-w-[40ch] text-[14.5px] text-[var(--muted)]">{meta.blurb}</p>
        </section>

        <Section title="Details">
          <Details
            items={[
              { label: 'Date', value: formatDateTime(txn.created_at) },
              { label: 'Type', value: meta.label },
              { label: 'Status', value: <span className={statusClass}>{STATUS_TEXT[txn.status]}</span> },
              ...(txn.type === 'withdraw' && security?.hasBank ? [{ label: 'Paid to', value: `${security.bankName} · ${security.accountMasked}` }] : []),
            ]}
          />
        </Section>

        {txn.job && (
          <Section title="What it was for" flush>
            <Link href={routes.jobDetail(txn.job.id)} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--band)] md:px-5">
              <span className="grid size-9 place-items-center rounded-full bg-[var(--band)] text-[var(--navy)]">
                <Icon name="briefcase" size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="label block !text-[10.5px]">Job</span>
                <span className="block truncate font-semibold text-[var(--ink)]">{txn.job.title}</span>
              </span>
              <Icon name="chevron-forward" size={15} className="text-[var(--muted)]" />
            </Link>
            {txn.counterparty && (
              <div className="flex items-center gap-3 border-t border-[var(--rule)] px-4 py-3.5 md:px-5">
                <Avatar src={txn.counterparty.avatar_url} name={txn.counterparty.name} size={36} />
                <span className="min-w-0">
                  <span className="label block !text-[10.5px]">{profile?.role === 'provider' ? 'Client' : 'Artisan'}</span>
                  <span className="block truncate font-semibold text-[var(--ink)]">{txn.counterparty.name ?? 'Unnamed'}</span>
                </span>
              </div>
            )}
          </Section>
        )}

        <Section title="Reference">
          <p className="figure select-all break-all text-[15px] text-[var(--ink)]">{txn.reference ?? txn.id}</p>
          <div className="mt-3">
            <Button variant="ghost" icon={copied ? 'checkmark' : 'copy'} onClick={() => void copyReference()}>
              {copied ? 'Copied' : 'Copy reference'}
            </Button>
          </div>
        </Section>

        <ButtonLink href={routes.profileSupport()} variant="quiet" icon="help-circle">
          Contact support about this
        </ButtonLink>
      </div>
    </div>
  );
}
