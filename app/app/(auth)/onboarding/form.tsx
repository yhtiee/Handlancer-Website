'use client';

/**
 * Ported from mobile src/app/(auth)/role-select.tsx: two choices and a name,
 * then the new role's home.
 */
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Icon } from '@/components/app/icon';
import { Button, ErrorNote, Field } from '@/components/app/ui';
import { useAuth } from '@/lib/app/auth';
import { routes } from '@/lib/app/domain/routes';
import { createProfile } from '@/lib/app/services/auth';
import type { UserRole } from '@/lib/app/services/database.types';

const OPTIONS: { role: UserRole; title: string; desc: string }[] = [
  {
    role: 'user',
    title: 'I need something done',
    desc: 'Post a job, compare quotes, pay through escrow.',
  },
  {
    role: 'provider',
    title: 'I do the work',
    desc: 'Find jobs near you, send quotes, get paid by stage.',
  },
];

export function RoleForm() {
  const router = useRouter();
  const params = useSearchParams();
  const preset = params.get('role');
  const { loading: authLoading, session, profile, refreshProfile } = useAuth();

  const [role, setRole] = useState<UserRole | null>(preset === 'user' || preset === 'provider' ? preset : null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading || loading) return;
    if (!session) router.replace(routes.signIn);
    else if (profile) router.replace(routes.home);
  }, [authLoading, loading, session, profile, router]);

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return setError('Choose how you want to use HandLancer');
    if (!name.trim()) return setError('Enter your name');
    if (!session) return setError('Session expired. Please sign in again.');

    setLoading(true);
    setError(null);
    try {
      await createProfile({
        id: session.user.id,
        role,
        name: name.trim(),
        email: session.user.email ?? null,
        phone: session.user.phone ?? null,
      });
      await refreshProfile();
      // Artisans go straight into their application: nothing they can do
      // as an artisan works until it has been reviewed.
      router.replace(role === 'provider' ? routes.apply : routes.home);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleContinue} noValidate className="enter flex flex-col gap-6">
      <div>
        <h1 className="!text-[clamp(1.9rem,4vw,2.4rem)]">
          How will you use <em>HandLancer?</em>
        </h1>
        <p className="lede mt-2 !text-[17px]">You can switch later in settings.</p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">Choose how you will use HandLancer</legend>
        {OPTIONS.map((opt) => {
          const selected = role === opt.role;
          return (
            <label
              key={opt.role}
              className={`flex cursor-pointer items-center gap-4 rounded-lg border bg-[var(--paper)] p-4 transition-colors duration-150 ${
                selected ? 'border-[var(--navy)] bg-[var(--teal-wash)]' : 'border-[var(--rule-strong)] hover:border-[var(--ink)]'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={opt.role}
                checked={selected}
                onChange={() => {
                  setRole(opt.role);
                  setError(null);
                }}
                className="sr-only"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-semibold text-[var(--ink)]">{opt.title}</span>
                <span className="mt-0.5 block text-[14px] text-[var(--muted)]">{opt.desc}</span>
              </span>
              <span
                aria-hidden="true"
                className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${
                  selected ? 'border-[var(--navy)] bg-[var(--navy)] text-white' : 'border-[var(--rule-strong)]'
                }`}
              >
                {selected && <Icon name="checkmark" size={14} strokeWidth={2.4} />}
              </span>
            </label>
          );
        })}
      </fieldset>

      <Field label="Your name" htmlFor="name">
        <input
          id="name"
          className="input !h-12"
          autoComplete="name"
          autoCapitalize="words"
          placeholder="Tolu Adeyemi"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <ErrorNote>{error}</ErrorNote>

      <Button type="submit" size="lg" block loading={loading}>
        Continue
      </Button>
    </form>
  );
}
