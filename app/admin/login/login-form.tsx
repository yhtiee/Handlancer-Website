'use client';

import { useSignIn } from '@/lib/admin/query/hooks';

/** The waitlist form's alert (components/waitlist.tsx). */
const ALERT =
  'rounded-md border border-[var(--bad)]/40 bg-[var(--bad)]/[.06] px-3.5 py-3 text-[13.5px] font-medium text-[var(--bad)]';

export function LoginForm({ next }: { next: string }) {
  const signIn = useSignIn();
  // Stays "busy" through the redirect that follows a successful sign-in.
  const busy = signIn.isPending || signIn.isSuccess;

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        signIn.mutate({
          email: String(form.get('email') ?? ''),
          password: String(form.get('password') ?? ''),
          next,
        });
      }}
    >
      <label className="block">
        <span className="mb-1.5 block text-[14px] font-medium text-[var(--ink)]">Email</span>
        <input name="email" type="email" autoComplete="username" required autoFocus className="input !h-11" />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[14px] font-medium text-[var(--ink)]">Password</span>
        <input name="password" type="password" autoComplete="current-password" required className="input !h-11" />
      </label>

      {signIn.isError && (
        <p role="alert" className={ALERT}>
          {signIn.error.message}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn btn-primary w-full !py-3 !text-[15px]">
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
