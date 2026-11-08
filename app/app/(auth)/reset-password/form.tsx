'use client';

/**
 * The landing page of the password-reset email.
 *
 * The one-time token is spent when the form is submitted, not when the page
 * opens: mail scanners fetch links before people do, and spending it on load
 * would leave the real click with "this link has expired". It also makes the
 * link work on any device, unlike a PKCE code tied to the requesting browser.
 */
import type { AuthError } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';

import { Button, ButtonLink, ErrorNote, Field } from '@/components/app/ui';
import { PasswordInput } from '@/components/app/password-input';
import { routes } from '@/lib/app/domain/routes';
import { setNewPassword, verifyEmailLink } from '@/lib/app/services/auth';

export function ResetPasswordForm() {
  const router = useRouter();
  const tokenHash = useSearchParams().get('token_hash');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkDead, setLinkDead] = useState(!tokenHash);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  // The token is single-use. If the password itself is refused, a retry must not spend it again.
  const spent = useRef(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPasswordError(null);
    setConfirmError(null);

    if (password.length < 6) return setPasswordError('Password must be at least 6 characters');
    if (confirm !== password) return setConfirmError(confirm ? 'The passwords don’t match' : 'Type your password again');

    setLoading(true);
    try {
      if (!spent.current) {
        try {
          await verifyEmailLink(tokenHash!, 'recovery');
          spent.current = true;
        } catch {
          setLinkDead(true);
          return;
        }
      }
      await setNewPassword(password);
      setDone(true);
    } catch (e) {
      const err = e as AuthError;
      if (err.code === 'same_password') setPasswordError('That’s your current password. Choose a different one.');
      else if (err.code === 'weak_password') setPasswordError(err.message);
      else setError('Your password wasn’t changed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (linkDead) {
    return (
      <div className="enter">
        <h1 className="!text-[clamp(1.9rem,4vw,2.4rem)]">
          This link has <em>expired</em>
        </h1>
        <p className="lede mt-2 !text-[17px]">Reset links work once and last 1 hour. Request a new one and use the most recent email.</p>
        <div className="mt-7">
          <ButtonLink href={routes.forgotPassword} size="lg" block>
            Send a new link
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="enter">
        <h1 className="!text-[clamp(1.9rem,4vw,2.4rem)]">
          Password <em>changed</em>
        </h1>
        <p className="lede mt-2 !text-[17px]">You’re signed in with your new password.</p>
        <div className="mt-7">
          <Button size="lg" block onClick={() => router.replace(routes.home)}>
            Continue to HandLancer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="enter">
      <h1 className="!text-[clamp(1.9rem,4vw,2.4rem)]">
        Choose a new <em>password</em>
      </h1>
      <p className="lede mt-2 !text-[17px]">You’ll be signed in once it’s saved.</p>

      <form onSubmit={submit} noValidate className="mt-7 flex flex-col gap-5">
        <Field label="New password" htmlFor="password" error={passwordError}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(v) => {
              setPassword(v);
              setPasswordError(null);
              setConfirmError(null);
            }}
            invalid={!!passwordError}
          />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm" error={confirmError}>
          <PasswordInput
            id="confirm"
            autoComplete="new-password"
            placeholder="Type it again"
            value={confirm}
            onChange={(v) => {
              setConfirm(v);
              setConfirmError(null);
            }}
            invalid={!!confirmError}
          />
        </Field>

        <ErrorNote>{error}</ErrorNote>

        <Button type="submit" size="lg" block loading={loading}>
          Save new password
        </Button>
      </form>
    </div>
  );
}
