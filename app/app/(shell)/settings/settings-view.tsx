'use client';

/**
 * Settings. Ported from mobile components/settings/settings-screen.tsx and
 * delete-account-sheet.tsx. Appearance is left out until the web app has a dark
 * theme; push becomes "notifications on this device" (lib/app/notify.ts).
 */
import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';

import { Dialog } from '@/components/app/controls';
import { Button, ButtonLink, ErrorNote, Note, PageHeader, Section } from '@/components/app/ui';
import { useAuth } from '@/lib/app/auth';
import { formatMoney } from '@/lib/app/domain/money';
import { routes } from '@/lib/app/domain/routes';
import { notifyPermission, requestNotifyPermission, type NotifyPermission } from '@/lib/app/notify';
import { useMyJobsCount, useProviderJobsCount } from '@/lib/app/queries/use-jobs';
import { useWallet } from '@/lib/app/queries/use-wallet';
import { useWalletSecurity } from '@/lib/app/queries/use-wallet-security';
import { AccountDeletionBlocked, deleteMyAccount } from '@/lib/app/services/account';

import { SetupLink } from '../wallet/wallet-view';

const CONFIRM_WORD = 'DELETE';

export function SettingsView() {
  const { data: security } = useWalletSecurity();
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="mx-auto max-w-[720px]">
      <PageHeader title="Settings" back={{ href: routes.profile, label: 'Profile' }} />
      <div className="space-y-6">
        <Section title="Wallet security">
          <ul className="space-y-1">
            <SetupLink
              href={routes.walletPin()}
              icon="lock-closed"
              done={!!security?.hasPin}
              title={security?.hasPin ? 'Transfer PIN' : 'Set a transfer PIN'}
              hint={security?.hasPin ? 'Required on every withdrawal and release' : 'Required before you can withdraw'}
            />
            <SetupLink
              href={routes.walletBank()}
              icon="business"
              done={!!security?.hasBank}
              title={security?.hasBank ? 'Payout bank account' : 'Link a bank account'}
              hint={security?.hasBank ? `${security.bankName} · ${security.accountMasked}` : 'Verified with your bank before any payout'}
            />
          </ul>
          <p className="mt-3 text-[13.5px] text-[var(--muted)]">Your PIN is stored encrypted and never kept on this device. Five wrong attempts lock withdrawals for 15 minutes.</p>
        </Section>

        <DeviceNotifications />

        <Section title="Account">
          <button type="button" onClick={() => setDeleting(true)} className="font-semibold text-[var(--bad)] hover:underline">
            Delete account
          </button>
          <p className="mt-1 text-[13.5px] text-[var(--muted)]">Erases your personal details and signs you out for good.</p>
        </Section>
      </div>

      <DeleteAccountDialog open={deleting} onClose={() => setDeleting(false)} />
    </div>
  );
}

/** Live Notification.permission, so the card updates after the browser prompt. */
function usePermission(): NotifyPermission {
  return useSyncExternalStore(
    (cb) => {
      const id = setInterval(cb, 1000);
      return () => clearInterval(id);
    },
    notifyPermission,
    () => 'default',
  );
}

function DeviceNotifications() {
  const permission = usePermission();
  const [asking, setAsking] = useState(false);

  return (
    <Section title="Notifications on this device">
      <p className="text-[15px] text-[var(--ink)]">Get alerts for quotes, hires, messages and payments while HandLancer is open in the background.</p>
      <div className="mt-4">
        {permission === 'granted' ? (
          <Note icon="checkmark-circle">Notifications are enabled on this device.</Note>
        ) : permission === 'denied' ? (
          <Note icon="warning">Notifications are blocked for this site. Allow them in your browser’s site settings, then reload.</Note>
        ) : permission === 'unsupported' ? (
          <Note icon="information-circle">
            This browser can’t show notifications. On iPhone, add HandLancer to your Home Screen first (Share → Add to Home Screen), then open it from there.
          </Note>
        ) : (
          <Button
            variant="ghost"
            icon="notifications"
            loading={asking}
            onClick={async () => {
              setAsking(true);
              await requestNotifyPermission();
              setAsking(false);
            }}
          >
            Enable on this device
          </Button>
        )}
      </div>
    </Section>
  );
}

/**
 * Deleting an account: what goes, what stays with the other side of each job,
 * anything to settle first, and a typed confirmation. The server enforces the
 * same rules (migration 0022); this says them before you hit them.
 */
function DeleteAccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { session, profile } = useAuth();
  const provider = profile?.role === 'provider';
  const { data: wallet } = useWallet();
  const clientActive = useMyJobsCount('active').data ?? 0;
  const providerActive = useProviderJobsCount('active').data ?? 0;
  const active = provider ? providerActive : clientActive;
  const balance = wallet?.balance ?? 0;

  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blocked = balance > 0 || active > 0;
  const confirmed = typed.trim().toUpperCase() === CONFIRM_WORD;

  async function confirm() {
    if (!session?.user.id) return;
    setBusy(true);
    setError(null);
    try {
      await deleteMyAccount(session.user.id);
      onClose();
      router.replace(routes.signIn);
      router.refresh();
    } catch (e) {
      setError(e instanceof AccountDeletionBlocked ? e.message : 'Your account was not deleted. Check your connection and try again.');
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Delete your account?"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Keep my account
          </Button>
          <Button variant="danger" disabled={blocked || !confirmed} loading={busy} onClick={() => void confirm()}>
            Delete my account
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <ul className="list-disc space-y-1.5 pl-5 text-[15px] text-[var(--ink)]">
          <li>Your name, photo, phone, location and bank details are erased, and you’re signed out.</li>
          <li>{provider ? 'Quotes you’ve sent that are still waiting are withdrawn.' : 'Jobs you’ve posted that nobody is working on yet are closed.'}</li>
          <li>Finished jobs, payments and reviews stay on the other person’s side, shown as “Deleted user”.</li>
          <li className="font-semibold">This can’t be undone.</li>
        </ul>

        {blocked ? (
          <div className="space-y-3 rounded-md bg-[var(--band)] p-4">
            <p className="font-semibold text-[var(--ink)]">Settle these first</p>
            {balance > 0 && (
              <div className="flex items-center gap-3">
                <p className="flex-1 text-[14px] text-[var(--muted)]">{formatMoney(balance)} is still in your wallet.</p>
                <ButtonLink href={routes.wallet()} variant="ghost">
                  Go to wallet
                </ButtonLink>
              </div>
            )}
            {active > 0 && (
              <div className="flex items-center gap-3">
                <p className="flex-1 text-[14px] text-[var(--muted)]">{active === 1 ? 'A job is' : `${active} jobs are`} still under way.</p>
                <ButtonLink href={routes.myJobs} variant="ghost">
                  See jobs
                </ButtonLink>
              </div>
            )}
          </div>
        ) : (
          <label className="block space-y-1.5">
            <span className="text-[14px] text-[var(--muted)]">Type {CONFIRM_WORD} to confirm</span>
            <input className="input !h-11 uppercase" autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder={CONFIRM_WORD} value={typed} onChange={(e) => setTyped(e.target.value)} />
          </label>
        )}

        <ErrorNote>{error}</ErrorNote>
      </div>
    </Dialog>
  );
}
