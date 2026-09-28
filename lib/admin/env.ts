import 'server-only';

/*
 * Admin console configuration. All three are server-only (no NEXT_PUBLIC_):
 * the browser never talks to Supabase directly — sign-in and every query run
 * in Server Components and Server Actions.
 *
 * SUPABASE_URL / SUPABASE_ANON_KEY are shared with the waitlist action and must
 * point at the SAME project as the mobile app. The service role key is what the
 * 0009 settlement functions are granted to; it bypasses RLS entirely, so it is
 * only ever read inside lib/admin/supabase.ts.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. The admin console needs it — see .env.example.`);
  }
  return value;
}

export const adminEnv = {
  get url() {
    return required('SUPABASE_URL');
  },
  get anonKey() {
    return required('SUPABASE_ANON_KEY');
  },
  get serviceRoleKey() {
    return required('SUPABASE_SERVICE_ROLE_KEY');
  },
};
