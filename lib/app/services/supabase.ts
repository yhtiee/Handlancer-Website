import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/lib/app/services/database.types';

/**
 * Web counterpart of mobile src/services/supabase.ts: the same project and the
 * same public anon key, talking to Supabase directly from the browser exactly as
 * the app does. Row level security is what protects the data, on both.
 *
 * The session lives in cookies (not SecureStore/localStorage) so proxy.ts can
 * refresh it and turn signed-out visitors away from /app before anything renders.
 * createBrowserClient is a singleton in the browser; during server rendering it
 * falls back to an in-memory store and is never asked for data.
 *
 * NOT the admin client: lib/admin/supabase.ts holds the service role and is
 * server-only. Nothing under /app may import it.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. See .env.example — they are the mobile app’s EXPO_PUBLIC_ values.',
  );
}

export const supabase = createBrowserClient<Database>(url, anonKey);
