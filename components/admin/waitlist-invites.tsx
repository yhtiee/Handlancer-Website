'use client';

import { useEffect, useRef, useState } from 'react';

import { useSendWaitlistInvites } from '@/lib/admin/query/hooks';

type Role = 'user' | 'provider';

const AUDIENCE: Record<Role, { plural: string; link: string; button: string }> = {
  user: { plural: 'clients', link: '/app/sign-in?role=user', button: 'Create my account' },
  provider: { plural: 'providers', link: '/app/sign-in?role=provider', button: 'Start my application' },
};

const people = (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`;

/**
 * Tells the waitlist HandLancer is live, one role at a time. Emails can't be
 * recalled, so each send confirms exactly how many people it reaches first.
 */
export function WaitlistInvites({ counts }: { counts: Record<string, number> }) {
  const send = useSendWaitlistInvites();
  const dialog = useRef<HTMLDialogElement>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (role && !el.open) el.showModal();
    if (!role && el.open) el.close();
  }, [role]);

  const count = role ? (counts[role] ?? 0) : 0;

  function confirm() {
    if (!role) return;
    const { plural } = AUDIENCE[role];
    send.mutate(
      { role },
      {
        onSuccess: (r) => {
          setDone(r.count ? `Sending invitations to ${people(r.count)} (${plural}).` : `No ${plural} left to invite.`);
          setRole(null);
        },
      },
    );
  }

  return (
    <div className="mb-5 border border-[var(--rule)] bg-[var(--paper)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-[var(--ink)]">Invite the waitlist</p>
          <p className="text-[13.5px] text-[var(--muted)]">Email people that HandLancer is live, with a sign-up link for their role.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['user', 'provider'] as const).map((r) => {
            const n = counts[r] ?? 0;
            return (
              <button
                key={r}
                type="button"
                className="btn btn-primary"
                disabled={n === 0}
                onClick={() => {
                  send.reset();
                  setDone(null);
                  setRole(r);
                }}
              >
                {n ? `Invite ${AUDIENCE[r].plural} (${n})` : `All ${AUDIENCE[r].plural} invited`}
              </button>
            );
          })}
        </div>
      </div>
      {done && (
        <p role="status" className="mt-3 text-[13.5px] font-medium text-[var(--navy)]">
          {done}
        </p>
      )}

      <dialog
        ref={dialog}
        onClose={() => setRole(null)}
        className="m-auto w-[min(440px,calc(100vw-32px))] border border-[var(--rule-strong)] bg-[var(--paper)] p-0 backdrop:bg-black/40"
      >
        {role && (
          <div className="space-y-4 p-5 text-left">
            <h2 className="!text-[18px]">Invite {AUDIENCE[role].plural}?</h2>
            <p className="text-[14px] text-[var(--ink)]">
              This emails <b>{people(count)}</b> that HandLancer is live, with a “{AUDIENCE[role].button}” button that opens <span className="figure break-all">{AUDIENCE[role].link}</span>.
            </p>
            <p className="text-[13.5px] text-[var(--muted)]">Anyone already invited or with an account is skipped. Emails can’t be recalled once sent.</p>
            {send.error && (
              <p role="alert" className="text-[13.5px] font-medium text-[var(--bad)]">
                {send.error.message}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className="btn btn-ghost" disabled={send.isPending} onClick={() => setRole(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" disabled={send.isPending} onClick={confirm}>
                {send.isPending ? 'Sending…' : `Send to ${people(count)}`}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
