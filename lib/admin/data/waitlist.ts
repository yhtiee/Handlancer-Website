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

  const [{ data, count, error }, invites] = await Promise.all([query, serviceClient().rpc('waitlist_invite_counts')]);
  if (error) throw error;

  // Null hides the invite buttons, rather than breaking the list, if the counts can't be read.
  const toInvite = invites.error ? null : Object.fromEntries((invites.data ?? []).map((c) => [c.role, Number(c.n)]));
  return { ...paged(data, count, range.page), toInvite };
}
