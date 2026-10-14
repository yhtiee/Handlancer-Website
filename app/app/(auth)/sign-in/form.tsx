'use client';

/**
 * Ported from mobile src/app/(auth)/sign-in.tsx: one form, two modes, the same
 * validation and the same routing after — a new account picks a role next, an
 * existing one goes straight home.
 */
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button, ErrorNote, Field } from '@/components/app/ui';
import { Segmented } from '@/components/app/controls';
import { PasswordInput } from '@/components/app/password-input';
import { useAuth } from '@/lib/app/auth';
import { mustApply } from '@/lib/app/domain/artisan-status';
import { routes } from '@/lib/app/domain/routes';
import { getProfileById, signInWithEmail, signUpWithEmail } from '@/lib/app/services/auth';

type Mode = 'signin' | 'signup';

/** Only same-app paths: `next` must never bounce someone off-site. */
function safeNext(next: string | null) {
  return next && next.startsWith('/app') && !next.startsWith('//') ? next : routes.home;
}

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const role = params.get('role');
  const next = safeNext(params.get('next'));
  const { loading: authLoading, session, profile } = useAuth();

  // Arriving with a role means they are new here; a plain visit is a sign-in.
  const [mode, setMode] = useState<Mode>(role ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Already signed in (a bookmarked sign-in page): skip the form.
  useEffect(() => {
    if (!authLoading && session && !loading) router.replace(!profile ? routes.onboarding : mustApply(profile) ? routes.apply : next);
  }, [authLoading, session, profile, loading, next, router]);

  const onboarding = role ? `${routes.onboarding}?role=${role}` : routes.onboarding;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmError(null);

    let hasError = false;
    const emailVal = email.trim();
    if (!emailVal) {
      setEmailError('Enter your email');
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(emailVal)) {
      setEmailError('Enter a valid email address');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Enter your password');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasError = true;
    }
    if (mode === 'signup' && password && confirm !== password) {
      setConfirmError(confirm ? 'The passwords don’t match' : 'Type your password again');
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { session: created } = await signUpWithEmail(email, password);
        if (!created) {
          setNotice('Account created. Check your inbox to confirm your email, then sign in here.');
          setMode('signin');
          return;
        }
        router.replace(onboarding);
      } else {
        const { user } = await signInWithEmail(email, password);
        const existing = await getProfileById(user.id);
        // An artisan who hasn't finished their application goes straight back to it.
        router.replace(!existing ? onboarding : mustApply(existing) ? routes.apply : next);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
      setLoading(false);
    }
  }

  return (
    <div className="enter">
      <h1 className="!text-[clamp(1.9rem,4vw,2.4rem)]">
        {mode === 'signin' ? (
          <>
            Welcome <em>back</em>
          </>
        ) : (
          <>
            Create your <em>account</em>
          </>
        )}
      </h1>
      <p className="lede mt-2 !text-[17px]">
        {mode === 'signin'
          ? 'Sign in to continue to HandLancer.'
          : role === 'provider'
            ? 'Join free as an artisan. Next you’ll build your profile and send it for review.'
            : 'Sign up to post jobs or offer your services.'}
      </p>

      <div className="mt-7">
        <Segmented<Mode>
          label="Sign in or create an account"
          value={mode}
          onChange={(m) => {
            setMode(m);
            setError(null);
            setEmailError(null);
            setPasswordError(null);
            setConfirm('');
            setConfirmError(null);
          }}
          options={[
            { value: 'signin', label: 'Sign in' },
            { value: 'signup', label: 'Create account' },
          ]}
        />
      </div>

      <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-5">
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
        <Field label="Password" htmlFor="password" error={passwordError}>
          <PasswordInput
            id="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
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
        {mode === 'signup' && (
          <Field label="Confirm password" htmlFor="confirm" error={confirmError}>
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
        )}

        {notice && (
          <p role="status" className="rounded-md bg-[var(--teal-wash)] px-3.5 py-2.5 text-[14px] text-[var(--navy)]">
            {notice}
          </p>
        )}
        <ErrorNote>{error}</ErrorNote>

        <Button type="submit" size="lg" block loading={loading}>
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </Button>
      </form>
    </div>
  );
}
