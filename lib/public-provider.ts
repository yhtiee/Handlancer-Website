import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { cache } from 'react';

import { adminEnv } from '@/lib/admin/env';
import type { Profile } from '@/lib/app/services/database.types';

/**
 * One artisan, as anyone with their link may see them. Reads through the anon
 * key and get_public_provider (supabase/public_provider.sql), so what is public
 * is decided in one place in the database, not by what this file selects.
 */
export type PublicProvider = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  business_name: string | null;
  bio: string | null;
  location: string | null;
  services: string[] | null;
  work_photos: string[] | null;
  rating: number | null;
  hourly_rate: number | null;
  rate_unit: string | null;
  years_experience: number | null;
  availability: Profile['availability'];
  is_verified: boolean | null;
  created_at: string;
  review_count: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Null when there's no such approved artisan. `cache`: metadata and the page share one read. */
export const getPublicProvider = cache(async (id: string): Promise<PublicProvider | null> => {
  if (!UUID.test(id)) return null;
  const client = createClient(adminEnv.url, adminEnv.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.rpc('get_public_provider', { p_id: id });
  if (error) throw new Error(`Could not load artisan: ${error.message}`);
  return (data as PublicProvider | null) ?? null;
});
