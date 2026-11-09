'use client';

/**
 * Reset a forgotten transfer PIN: a code sent to the account's email, plus the
 * account password. Nothing is compared here — request_pin_reset and
 * reset_transfer_pin (supabase/pin_reset.sql) do all the checking.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { SuccessDialog } from '@/components/app/escrow';
import { PinInput, PinRules } from '@/components/app/pin-fields';
import { Button, ButtonLink, ErrorNote, Field, Note, PageHeader, Section } from '@/components/app/ui';
import { useAuth } from '@/lib/app/auth';
import { pinProblem } from '@/lib/app/domain/pin-rules';
import { routes } from '@/lib/app/domain/routes';
import { useRequestPinReset, useResetTransferPin, useWalletSecurity } from '@/lib/app/queries/use-wallet-security';

const RESEND_SECONDS = 60;

export function ForgotPinForm() {
  const router = useRouter();
  const { session } = useAuth();
  const { data: security, isLoading } = useWalletSecurity();
  const sendCode = useRequestPinReset();
  const resetPin = useResetTransferPin();

  const [sent, setSent] = useState(false);
  const [wait, setWait] = useState(0);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const email = session?.user.email ?? 'your email';

  async function send() {
    setError(null);
    try {
      await sendCode.mutateAsync();
      setCode('');
      setSent(true);
      setWait(RESEND_SECONDS);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Could not send a code. Please try again.');
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code from your email.');
    if (!password) return setError('Enter your account password.');
    const problem = pinProblem(pin);
    if (problem) return setError(problem);
    if (pin !== confirmPin) return setError('The two PINs do not match.');
    try {
      await resetPin.mutateAsync({ code, password, pin });
      setPassword('');
      setPin('');
      setConfirmPin('');
      setDone(true);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Could not reset your PIN. Please try again.');
    }
  }

  const header = <PageHeader back={{ href: routes.walletPin(), label: 'Transfer PIN' }} title="Forgot your PIN?" />;

  if (security && !security.hasPin) {
    return (
      <div className="mx-auto max-w-[560px]">
        {header}
        <div className="space-y-6">
          <Note icon="lock-closed">You haven’t set a transfer PIN yet, so there’s nothing to reset.</Note>
          <ButtonLink href={routes.walletPin()} size="lg" icon="lock-closed">
            Set a PIN
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (!sent) {
    return (
      <div className="mx-auto max-w-[560px]">
        {header}
        <div className="space-y-6">
          <Note icon="lock-closed">
            To keep your money safe we’ll email a 6-digit code to <b className="font-semibold text-[var(--ink)]">{email}</b>. You’ll also need your account password. Resetting removes any lock from wrong PIN attempts.
          </Note>
          <ErrorNote>{error}</ErrorNote>
          <div className="flex justify-end">
            <Button size="lg" icon="send" disabled={isLoading} loading={sendCode.isPending} onClick={() => void send()}>
              Email me a code
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-[560px]">
      {header}
      <div className="space-y-6">
        <Note icon="lock-closed">
          We sent a code to <b className="font-semibold text-[var(--ink)]">{email}</b>. It works once and expires in 15 minutes. Check your spam folder if you can’t see it.
        </Note>
        <Section title="Confirm it’s you">
          <div className="space-y-5">
            <Field label="Code from your email" htmlFor="code">
              <input
                id="code"
                className="input figure !h-12 max-w-[200px] tracking-[0.3em]"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              />
              <button
                type="button"
                className="self-start text-[13.5px] font-semibold text-[var(--navy)] hover:underline disabled:cursor-default disabled:font-normal disabled:text-[var(--muted)] disabled:no-underline"
                disabled={wait > 0 || sendCode.isPending}
                onClick={() => void send()}
              >
                {wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'}
              </button>
            </Field>
            <Field label="Account password" htmlFor="password">
              <input id="password" className="input !h-12" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Link href={routes.forgotPassword} className="self-start text-[13.5px] font-semibold text-[var(--navy)] hover:underline">
                Forgot your password?
              </Link>
            </Field>
          </div>
        </Section>
        <Section title="Your new PIN">
          <div className="space-y-5">
            <PinInput id="new" label="New PIN" value={pin} onChange={setPin} />
            <PinInput id="confirm" label="Confirm PIN" value={confirmPin} onChange={setConfirmPin} />
            <PinRules pin={pin} confirm={confirmPin} />
          </div>
        </Section>
        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end">
          <Button type="submit" size="lg" icon="lock-closed" loading={resetPin.isPending}>
            Reset PIN
          </Button>
        </div>
      </div>
      <SuccessDialog
        open={done}
        onClose={() => {
          setDone(false);
          router.replace(routes.wallet());
        }}
        title="PIN reset"
        message="Your new PIN works straight away. We’ve emailed you to confirm the change."
      />
    </form>
  );
}
