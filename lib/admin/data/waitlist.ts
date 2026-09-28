import 'server-only';

import { requireAdmin } from '@/lib/admin/auth';
import { pageRange, paged, searchTerm, type ListParams } from '@/lib/admin/data/shared';
import { serviceClient } from '@/lib/admin/supabase';

export type WaitlistListParams = ListParams & { role?: string };

/** Signups from the marketing site's form (supabase/waitlist.sql). */
export async function listWaitlist({ page, q, role }: WaitlistListParams) {
  await requireAdmin();
  const range = pageRange(page);

  let query = serviceClient()
    .from('waitlist')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(range.from, range.to);

  if (role === 'user' || role === 'provider') query = query.eq('role', role);

  const term = searchTerm(q);
  if (term) query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,city.ilike.%${term}%`);

  const { data, count, error } = await query;
  if (error) throw error;
  return paged(data, count, range.page);
}
