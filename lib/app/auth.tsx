'use client';

/**
 * Ported from mobile src/providers/auth-provider.tsx. Same shape — `loading`,
 * `session`, `profile`, `refreshProfile`, `signOut` — so every ported query hook
 * reads it unchanged. Web differences:
 *   - next/navigation instead of expo-router;
 *   - `loading` stays true until the profile belongs to the current session's
 *     user, so the shell never sees "signed in, no profile" for the instant
 *     between a sign-in and its profile fetch (it would bounce to onboarding);
 *   - the query cache is cleared on sign-out, so the next person on a shared
 *     computer never sees the last one's jobs.
 */
import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createContext, use, useCallback, useEffect, useState } from 'react';

import { routes } from '@/lib/app/domain/routes';
import type { Profile } from '@/lib/app/services/database.types';
import { supabase } from '@/lib/app/services/supabase';

type AuthState = {
  /** True until the session and that user's profile have both resolved. */
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  /** Refetch the current user's profile (e.g. after role selection or edit). */
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

/** `undefined` = not resolved yet; `null` = resolved, signed out. */
type Resolved = string | null | undefined;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionFor, setSessionFor] = useState<Resolved>(undefined);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileFor, setProfileFor] = useState<Resolved>(undefined);
  const router = useRouter();
  const queryClient = useQueryClient();

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setProfileFor(null);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data ?? null);
    setProfileFor(userId);
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setSessionFor(data.session?.user.id ?? null);
      void loadProfile(data.session?.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setSessionFor(next?.user.id ?? null);
      // Token refreshes fire this too; only a change of person needs a reload.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // Deferred: awaiting Supabase calls inside this callback can deadlock its auth lock.
        setTimeout(() => void loadProfile(next?.user.id), 0);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const loading = sessionFor === undefined || profileFor !== sessionFor;

  return (
    <AuthContext
      value={{
        loading,
        session,
        profile: loading ? null : profile,
        refreshProfile: () => loadProfile(session?.user.id),
        signOut: async () => {
          await supabase.auth.signOut();
          queryClient.clear();
          router.replace(routes.signIn);
          router.refresh();
        },
      }}
    >
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
