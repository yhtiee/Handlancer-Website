'use client';

import type { AuthError } from '@supabase/supabase-js';
import Link from 'next/link';
import { useState } from 'react';

import { Button, ErrorNote, Field } from '@/components/app/ui';
import { routes } from '@/lib/app/domain/routes';
import { requestPasswordReset } from '@/lib/app/services/auth';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = email.trim();
    if (!value) return setEmailError('Enter your email');
    if (!/\S+@\S+\.\S+/.test(value)) return setEmailError('Enter a valid email address');

    setLoading(true);
    try {
      await requestPasswordReset(value);
      setSentTo(value);
    } catch (e) {
      setError(
        (e as AuthError).status === 429
          ? 'Too many requests. Wait a minute, then try again.'
          : 'We couldn’t send that just now. Check your connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <div className="enter">
        <h1 className="!text-[clamp(1.9rem,4vw,2.4rem)]">
          Check your <em>email</em>
        </h1>
        <p className="lede mt-2 !text-[17px]">
          If <strong className="font-semibold text-[var(--ink)]">{sentTo}</strong> has a HandLancer account, a reset link is on its way. It works once and expires in 1 hour.
        </p>
        <p className="mt-6 text-[14px] text-[var(--muted)]">
          Nothing after a few minutes? Check your spam folder, or{' '}
          <button type="button" className="font-semibold text-[var(--navy)] hover:underline" onClick={() => setSentTo(null)}>
            try another address
          </button>
          .
        </p>
        <Link href={routes.signIn} className="mt-8 inline-block text-[14px] font-semibold text-[var(--navy)] hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="enter">
      <h1 className="!text-[clamp(1.9rem,4vw,2.4rem)]">
        Forgot your <em>password?</em>
      </h1>
      <p className="lede mt-2 !text-[17px]">Enter your email and we’ll send you a link to choose a new one.</p>

      <form onSubmit={submit} noValidate className="mt-7 flex flex-col gap-5">
        <Field label="Email address" htmlFor="email" error={emailError}>
          <input
            id="email"
            className="input !h-12"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(null);
            }}
            aria-invalid={!!emailError}
          />
        </Field>

        <ErrorNote>{error}</ErrorNote>

        <Button type="submit" size="lg" block loading={loading}>
          Send reset link
        </Button>
      </form>

      <Link href={routes.signIn} className="mt-6 inline-block text-[14px] font-semibold text-[var(--navy)] hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}
