import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

import { adminEnv } from '@/lib/admin/env';
import type { Database } from '@/lib/admin/types';

/**
 * Two clients, two jobs — never swap them.
 *
 * `sessionClient` holds the signed-in person's Supabase Auth session in cookies.
 * It uses the anon key, so it can prove WHO is asking and nothing more.
 *
 * `serviceClient` uses the service role key and bypasses RLS. It is only reached
 * through lib/admin/auth.ts after `requireAdmin()` has checked the caller is on
 * the `admin_users` allowlist. Never import it from a Client Component (the
 * `server-only` import above makes that a build error).
 */

export async function sessionClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(adminEnv.url, adminEnv.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies. proxy.ts refreshes the
          // session on every /admin request, so this is safe to ignore there;
          // Server Actions (sign-in / sign-out) can write and do.
        }
      },
    },
  });
}

let service: ReturnType<typeof createClient<Database>> | undefined;

export function serviceClient() {
  service ??= createClient<Database>(adminEnv.url, adminEnv.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return service;
}
