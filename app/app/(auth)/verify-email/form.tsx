'use client';

/**
 * Step two of signing up. A typed code is the main path, because a link opens
 * in the phone's browser and an installed PWA would never get the session; the
 * button in the email covers everyone else, and this screen moves on by itself
 * if the link is used in another tab.
 */
import type { AuthError } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button, ErrorNote, Field } from '@/components/app/ui';
import { useAuth } from '@/lib/app/auth';
import { onboardingPath, routes } from '@/lib/app/domain/routes';
import { resendConfirmation, verifyEmailCode } from '@/lib/app/services/auth';

const RESEND_SECONDS = 60;

export function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') ?? '';
  const role = params.get('role');
  const onboarding = onboardingPath(role === 'user' || role === 'provider' ? role : null, params.get('next'));
  const { loading: authLoading, session } = useAuth();

  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!authLoading && session) router.replace(onboarding);
    else if (!authLoading && !email) router.replace(routes.signIn);
  }, [authLoading, session, email, onboarding, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (code.length < 6) return setCodeError('Enter the full code from the email');

    setLoading(true);
    try {
      await verifyEmailCode(email, code);
      // The effect above moves on once the session lands; keep the spinner until then.
    } catch (e) {
      setCodeError(
        (e as AuthError).code === 'otp_expired' ? 'That code is wrong or has expired. Check it, or send a new one.' : 'We couldn’t check that code. Try again.',
      );
      setLoading(false);
    }
  }

  async function resend() {
    setError(null);
    setNotice(null);
    setCodeError(null);
    setResending(true);
    try {
      await resendConfirmation(email, onboarding);
      setCode('');
      setCooldown(RESEND_SECONDS);
      setNotice('New code sent. Earlier codes no longer work.');
    } catch (e) {
      setError((e as AuthError).status === 429 ? 'Too many requests. Wait a minute, then try again.' : 'We couldn’t send a new code. Try again.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="enter">
      <h1 className="!text-[clamp(1.9rem,4vw,2.4rem)]">
        Confirm your <em>email</em>
      </h1>
      <p className="lede mt-2 !text-[17px]">
        We sent a code to <strong className="font-semibold text-[var(--ink)]">{email}</strong>. Enter it here, or use the button in the email.
      </p>

      <form onSubmit={submit} noValidate className="mt-7 flex flex-col gap-5">
        <Field label="Confirmation code" htmlFor="code" error={codeError}>
          <input
            id="code"
            className="input !h-14 text-center font-[family-name:var(--font-plex-mono)] !text-[24px] tracking-[0.2em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ''));
              setCodeError(null);
            }}
            aria-invalid={!!codeError}
          />
        </Field>

        {notice && (
          <p role="status" className="rounded-md bg-[var(--teal-wash)] px-3.5 py-2.5 text-[14px] text-[var(--navy)]">
            {notice}
          </p>
        )}
        <ErrorNote>{error}</ErrorNote>

        <Button type="submit" size="lg" block loading={loading}>
          Confirm email
        </Button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[14px]">
        <Button variant="ghost" onClick={() => void resend()} loading={resending} disabled={cooldown > 0}>
          {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
        </Button>
        <Link href={routes.signIn} className="font-semibold text-[var(--navy)] hover:underline">
          Use a different email
        </Link>
      </div>
      <p className="mt-5 text-[13.5px] text-[var(--muted)]">Can’t find it? Check your spam folder.</p>
    </div>
  );
}
