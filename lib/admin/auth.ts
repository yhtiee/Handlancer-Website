import 'server-only';

import { AsyncLocalStorage } from 'node:async_hooks';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { serviceClient, sessionClient } from '@/lib/admin/supabase';
import type { AdminRole } from '@/lib/admin/types';

/*
 * The Data Access Layer's front door. proxy.ts only does an optimistic cookie
 * check; THIS is the real one, and every admin page and Server Action calls it
 * before touching data.
 *
 * Two gates:
 *   1. `getClaims()` verifies the session JWT's signature and expiry — the
 *      cookie alone is never trusted. With asymmetric signing keys this is a
 *      local check against Supabase's cached public keys (no network hop per
 *      request); on a legacy HS256 project it falls back to asking the Auth
 *      server, exactly as getUser() did.
 *   2. The user id must be on `admin_users` (supabase/admin_users.sql). A valid
 *      HandLancer app account is NOT an admin account. This is read on every
 *      request, so deleting the row locks the person out immediately — even
 *      though their JWT stays cryptographically valid until it expires.
 */

export type AdminSession = {
  userId: string;
  email: string;
  role: AdminRole;
};

/** Allowlist lookup. Exported for sign-in, which has a user id before it has cookies. */
export async function findAdmin(userId: string) {
  const { data } = await serviceClient()
    .from('admin_users')
    .select('role, email')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

/*
 * React's cache() dedupes getAdmin() within a Server Component render, but a
 * route handler is not a render — there it would run the JWT check and the
 * admin_users query again for every requireAdmin() below it. adminJson()
 * verifies once and runs the handler inside this store; getAdmin() reads it.
 */
const verifiedAdmin = new AsyncLocalStorage<AdminSession>();

/** Runs `fn` with an already-verified admin, so nothing inside re-verifies. */
export function withVerifiedAdmin<T>(admin: AdminSession, fn: () => T): T {
  return verifiedAdmin.run(admin, fn);
}

export const getAdmin = cache(async (): Promise<AdminSession | null> => {
  const known = verifiedAdmin.getStore();
  if (known) return known;

  const supabase = await sessionClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const admin = await findAdmin(userId);
  if (!admin) return null;

  return { userId, email: admin.email || data.claims.email || '', role: admin.role };
});

/** For pages and actions: returns the admin or leaves for the sign-in screen. */
export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) redirect('/admin/login');
  return admin;
}
