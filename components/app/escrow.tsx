'use client';

/**
 * Escrow on the job screen. Ported from mobile components/escrow/
 * (escrow-section.tsx, escrow-timeline.tsx, provider-milestones.tsx) and
 * components/wallet/pin-confirm-modal.tsx.
 *
 * Every movement of money is behind a confirmation that states the amount, and
 * every release behind the transfer PIN — verified by the same Postgres
 * function that moves the money, never compared here.
 */
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ConfirmDialog, Dialog } from '@/components/app/controls';
import { Icon } from '@/components/app/icon';
import { useOnline } from '@/components/app/pwa';
import { Button, Money } from '@/components/app/ui';
import { formatMoney } from '@/lib/app/domain/money';
import { routes } from '@/lib/app/domain/routes';
import { useJobQuotes } from '@/lib/app/queries/use-quotes';
import {
  useEscrow,
  useFundEscrow,
  useReleaseMaterials,
  useRequestCompletionReview,
  useRequestMaterialsRelease,
} from '@/lib/app/queries/use-wallet';
import { useWalletSecurity } from '@/lib/app/queries/use-wallet-security';
import type { Escrow, Job } from '@/lib/app/services/database.types';

// ─────────────────────────── Shared pieces ───────────────────────────

export type Detail = { label: string; value: React.ReactNode };

export function DetailRows({ details }: { details: Detail[] }) {
  return (
    <dl className="divide-y divide-[var(--rule)] rounded-md bg-[var(--band)]">
      {details.map((d) => (
        <div key={d.label} className="flex items-center justify-between gap-4 px-3.5 py-2.5">
          <dt className="text-[14px] text-[var(--muted)]">{d.label}</dt>
          <dd className="text-right text-[15px] font-semibold text-[var(--ink)]">{d.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** "Done" after a money movement, with the amount. */
export function SuccessDialog({
  open,
  onClose,
  title,
  message,
  amount,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  amount?: number;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title} footer={<Button onClick={onClose}>Done</Button>}>
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-[var(--teal-wash)] text-[var(--navy)]">
          <Icon name="checkmark-circle" size={30} />
        </span>
        {amount != null && <Money amount={amount} className="text-[28px] font-semibold text-[var(--ink)]" />}
        {message && <p className="max-w-[36ch] text-[15px] text-[var(--muted)]">{message}</p>}
      </div>
    </Dialog>
  );
}

/**
 * The last step before money leaves escrow: the amount, then the transfer PIN.
 * With no PIN set yet it sends the person to set one instead of failing at the
 * RPC with a message they cannot act on.
 */
export function PinConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  details,
  confirmLabel = 'Release funds',
  loading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  title: string;
  message?: string;
  details?: Detail[];
  confirmLabel?: string;
  loading?: boolean;
  error?: string | null;
}) {
  const router = useRouter();
  const online = useOnline();
  const { data: security } = useWalletSecurity();
  const [pin, setPin] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Never leave a PIN sitting in state behind a closed dialog.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    setPin('');
    setLocalError(null);
  }

  const hasPin = Boolean(security?.hasPin);
  const locked = Boolean(security?.pinLocked);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      setLocalError('Enter your 4-digit PIN');
      return;
    }
    setLocalError(null);
    onConfirm(pin);
  }

  if (!hasPin && security) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title="Set a transfer PIN first"
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              icon="lock-closed"
              onClick={() => {
                onClose();
                router.push(routes.walletPin());
              }}
            >
              Set a PIN
            </Button>
          </>
        }
      >
        <p className="text-[15px] text-[var(--muted)]">
          You need a transfer PIN before you can release funds. It takes a moment to set up and protects every payment you make.
        </p>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={message}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="pin-confirm" loading={loading} disabled={locked || !online}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <form id="pin-confirm" onSubmit={submit} className="space-y-4">
        {details?.length ? <DetailRows details={details} /> : null}
        <div className="space-y-1.5">
          <label htmlFor="pin" className="text-[14px] font-semibold text-[var(--ink)]">
            Enter your transfer PIN to confirm
          </label>
          <input
            id="pin"
            className="input figure !h-14 text-center !text-[24px] tracking-[0.6em]"
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{4}"
            maxLength={4}
            placeholder="••••"
            autoFocus
            disabled={loading || locked}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4));
              setLocalError(null);
            }}
          />
        </div>
        {locked && <p className="text-[14px] text-[var(--bad)]">Too many incorrect PIN attempts. Try again in a few minutes.</p>}
        {!online && <p className="text-[14px] text-[var(--bad)]">You’re offline. Reconnect to release funds.</p>}
        {(localError || error) && (
          <p role="alert" className="text-[14px] text-[var(--bad)]">
            {localError ?? error}
          </p>
        )}
      </form>
    </Dialog>
  );
}

// ─────────────────────────── Timeline ───────────────────────────

type StepState = 'done' | 'active' | 'upcoming';
type Step = { key: string; title: string; detail: string; amount?: number; state: StepState };

/** The escrow lifecycle as a vertical timeline; same steps for both sides, own wording. */
export function EscrowTimeline({ escrow, role }: { escrow: Escrow | null | undefined; role: 'client' | 'provider' }) {
  const steps = buildSteps(escrow, role);
  if (!steps.length) return null;
  return (
    <ol className="space-y-0">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full ${
                  step.state === 'done'
                    ? 'bg-[var(--ink)] text-[var(--paper)]'
                    : step.state === 'active'
                      ? 'border-2 border-[var(--ink)]'
                      : 'border-[1.5px] border-[var(--band-deep)]'
                }`}
              >
                {step.state === 'done' && <Icon name="checkmark" size={14} strokeWidth={2.4} />}
              </span>
              {!last && <span className={`w-[2px] flex-1 ${step.state === 'done' ? 'bg-[var(--ink)]' : 'bg-[var(--rule)]'}`} />}
            </div>
            <div className={`min-w-0 flex-1 ${last ? '' : 'pb-5'}`}>
              <div className="flex items-baseline gap-3">
                <p className={`flex-1 font-semibold ${step.state === 'upcoming' ? 'text-[var(--muted)]' : 'text-[var(--ink)]'}`}>{step.title}</p>
                {step.amount != null && <Money amount={step.amount} className="text-[14px] text-[var(--ink)]" />}
              </div>
              <p className="text-[13.5px] text-[var(--muted)]">{step.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function buildSteps(escrow: Escrow | null | undefined, role: 'client' | 'provider'): Step[] {
  const client = role === 'client';
  const funded = Boolean(escrow) && escrow!.status !== 'pending';
  const steps: Step[] = [];

  steps.push({
    key: 'funded',
    title: funded ? 'Escrow funded' : 'Awaiting escrow payment',
    detail: funded
      ? client
        ? 'Your payment is held safely until you release it'
        : 'The client’s payment is held safely for this job'
      : client
        ? 'Fund escrow to confirm hiring'
        : 'The client has not funded escrow yet',
    amount: escrow?.total,
    state: funded ? 'done' : 'active',
  });

  if (escrow && escrow.materials_amount > 0) {
    const released = escrow.materials_released;
    const requested = Boolean(escrow.materials_requested_at);
    steps.push({
      key: 'materials',
      title: released ? 'Materials released' : 'Materials funds',
      detail: released
        ? client
          ? 'Sent to the artisan'
          : 'Paid into your wallet'
        : requested
          ? client
            ? 'The artisan has requested these funds'
            : 'Requested — waiting for the client'
          : client
            ? 'Release when the artisan needs to buy materials'
            : 'Request when you are ready to buy materials',
      amount: escrow.materials_amount,
      state: released ? 'done' : funded ? 'active' : 'upcoming',
    });
  }

  if (escrow) {
    const submitted = Boolean(escrow.completion_requested_at);
    const paid = escrow.workmanship_released;
    steps.push({
      key: 'work',
      title: paid ? 'Work approved' : submitted ? 'Awaiting your review' : 'Work in progress',
      detail: paid
        ? 'The client approved the finished work'
        : submitted
          ? client
            ? 'Review the work to release the final payment'
            : 'The client is reviewing your work'
          : client
            ? 'The artisan will mark this complete when finished'
            : 'Mark complete when the job is finished',
      state: paid ? 'done' : submitted ? 'active' : 'upcoming',
    });
    const remaining = escrow.total - (escrow.materials_released ? escrow.materials_amount : 0);
    steps.push({
      key: 'final',
      title: paid ? 'Final payment released' : 'Final payment',
      detail: paid ? (client ? 'Job complete' : 'Paid into your wallet') : client ? 'Released when you approve the work' : 'Released once the client approves',
      amount: remaining > 0 ? remaining : undefined,
      state: paid ? 'done' : 'upcoming',
    });
  }
  return steps;
}

// ─────────────────────────── Client actions ───────────────────────────

type ClientPending = 'fund' | 'materials' | null;

/** Pay into escrow, release materials, or go to check-and-pay. Buttons only. */
export function EscrowActions({ job }: { job: Job }) {
  const router = useRouter();
  const online = useOnline();
  const { data: escrow } = useEscrow(job.id);
  const { data: quotes } = useJobQuotes(job.id);
  const approved = quotes?.find((q) => q.status === 'approved');
  const fund = useFundEscrow(job.id);
  const releaseMaterials = useReleaseMaterials(job.id);

  const [confirming, setConfirming] = useState<ClientPending>(null);
  const [success, setSuccess] = useState<{ title: string; message: string; amount?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!approved && !escrow) return null;

  const funded = Boolean(escrow) && escrow!.status !== 'pending';
  const materialsDue = !!escrow && escrow.materials_amount > 0 && !escrow.materials_released && funded;
  const finalDue = !!escrow && funded && !escrow.workmanship_released;

  async function confirmFund() {
    setError(null);
    try {
      await fund.mutateAsync();
      setConfirming(null);
      setSuccess({ title: 'Artisan hired', message: 'Your payment is now held in escrow and work can begin.', amount: approved?.total });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }

  async function confirmMaterials(pin: string) {
    setError(null);
    try {
      await releaseMaterials.mutateAsync(pin);
      setConfirming(null);
      setSuccess({ title: 'Materials released', message: 'The funds are on their way to the artisan’s wallet.', amount: escrow?.materials_amount });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
      {!funded && approved && (
        <div className="space-y-1.5">
          <Button size="lg" icon="lock-closed" disabled={!online} onClick={() => setConfirming('fund')}>
            Pay {formatMoney(approved.total)} into escrow
          </Button>
          <p className="text-[13px] text-[var(--muted)]">The artisan is hired once the money is held.</p>
        </div>
      )}
      {materialsDue && (
        // Teal once the artisan has asked: that is the moment it is holding up work.
        <Button size="lg" variant={escrow!.materials_requested_at ? 'primary' : 'ghost'} disabled={!online} onClick={() => setConfirming('materials')}>
          Release {formatMoney(escrow!.materials_amount)} for materials
        </Button>
      )}
      {finalDue && (
        // Rating and payout are one transaction, so this opens the review screen.
        <Button
          size="lg"
          variant={escrow!.completion_requested_at ? 'primary' : 'ghost'}
          onClick={() => router.push(routes.reviewJob(job.id))}
        >
          {escrow!.completion_requested_at ? 'Check the work and pay' : 'Approve the work and pay'}
        </Button>
      )}

      <ConfirmDialog
        open={confirming === 'fund'}
        onClose={() => setConfirming(null)}
        onConfirm={confirmFund}
        title="Pay into escrow"
        description="This moves money from your wallet into escrow. It is held safely and only released when you approve the work."
        confirmLabel="Pay and hire"
        loading={fund.isPending}
        error={error}
      >
        <DetailRows details={[{ label: 'Amount to hold', value: <Money amount={approved?.total ?? 0} /> }]} />
      </ConfirmDialog>

      <PinConfirmDialog
        open={confirming === 'materials'}
        onClose={() => setConfirming(null)}
        onConfirm={confirmMaterials}
        title="Release materials funds?"
        message="This pays the materials portion to the artisan now. It cannot be reversed from the app."
        loading={releaseMaterials.isPending}
        error={error}
        details={[
          { label: 'Releasing now', value: <Money amount={escrow?.materials_amount ?? 0} /> },
          { label: 'Still in escrow', value: <Money amount={(escrow?.total ?? 0) - (escrow?.materials_amount ?? 0)} /> },
        ]}
      />

      <SuccessDialog open={!!success} onClose={() => setSuccess(null)} title={success?.title ?? ''} message={success?.message} amount={success?.amount} />
    </div>
  );
}

// ─────────────────────────── Provider actions ───────────────────────────

type ProviderPending = 'materials' | 'complete' | null;

/** Ask for materials money, mark it done. Requests only — a provider can never pay themselves. */
export function ProviderMilestones({ job }: { job: Job }) {
  const { data: escrow } = useEscrow(job.id);
  const requestMaterials = useRequestMaterialsRelease(job.id);
  const requestReview = useRequestCompletionReview(job.id);
  const [confirming, setConfirming] = useState<ProviderPending>(null);
  const [success, setSuccess] = useState<{ title: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!escrow || escrow.status === 'pending') return null;

  async function confirm() {
    setError(null);
    try {
      if (confirming === 'materials') {
        await requestMaterials.mutateAsync();
        setConfirming(null);
        setSuccess({ title: 'Request sent', message: 'The client has been notified and can now release the materials funds.' });
      } else if (confirming === 'complete') {
        await requestReview.mutateAsync();
        setConfirming(null);
        setSuccess({ title: 'Sent for review', message: 'The client will review your work and release the final payment to your wallet.' });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }

  const busy = requestMaterials.isPending || requestReview.isPending;
  const canRequestMaterials = escrow.materials_amount > 0 && !escrow.materials_released && !escrow.materials_requested_at;
  const canMarkComplete = !escrow.workmanship_released && !escrow.completion_requested_at;
  const remaining = escrow.total - (escrow.materials_released ? escrow.materials_amount : 0);

  if (!canRequestMaterials && !canMarkComplete) return null;

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-start">
      {canRequestMaterials && (
        <Button size="lg" icon="cube" onClick={() => setConfirming('materials')}>
          Ask for {formatMoney(escrow.materials_amount)} for materials
        </Button>
      )}
      {canMarkComplete && (
        <div className="space-y-1.5">
          {/* While materials are still to ask for, finishing is the second step. */}
          <Button size="lg" icon="checkmark-circle" variant={canRequestMaterials ? 'ghost' : 'primary'} onClick={() => setConfirming('complete')}>
            Mark it done
          </Button>
          <p className="text-[13px] text-[var(--muted)]">Add your after photos first. The client checks them before paying.</p>
        </div>
      )}

      <ConfirmDialog
        open={confirming === 'materials'}
        onClose={() => setConfirming(null)}
        onConfirm={confirm}
        title="Ask for materials money?"
        description="The client is notified and can release this portion early so you can buy materials."
        confirmLabel="Send request"
        loading={busy}
        error={error}
      >
        <DetailRows details={[{ label: 'Materials portion', value: <Money amount={escrow.materials_amount} /> }]} />
      </ConfirmDialog>

      <ConfirmDialog
        open={confirming === 'complete'}
        onClose={() => setConfirming(null)}
        onConfirm={confirm}
        title="Mark it done?"
        description="This tells the client the job is finished so they can review it and release your final payment. Make sure your after photos are uploaded."
        confirmLabel="Mark it done"
        loading={busy}
        error={error}
      >
        <DetailRows details={[{ label: 'Final payment due', value: <Money amount={remaining} /> }]} />
      </ConfirmDialog>

      <SuccessDialog open={!!success} onClose={() => setSuccess(null)} title={success?.title ?? ''} message={success?.message} />
    </div>
  );
}
