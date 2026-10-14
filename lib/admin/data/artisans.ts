import 'server-only';

import { requireAdmin } from '@/lib/admin/auth';
import { isUuid, pageRange, paged, searchTerm, type ListParams } from '@/lib/admin/data/shared';
import { serviceClient } from '@/lib/admin/supabase';
import type { ProviderStatus } from '@/lib/admin/types';

/*
 * The artisan review queue. An artisan's profile is their application
 * (supabase/artisan_review.sql): they fill it in the app, submit it, and it
 * waits here as `pending` until an admin approves it — which is what makes them
 * discoverable and able to quote — or sends it back with a note.
 */

export const ARTISAN_STATUSES: ProviderStatus[] = ['pending', 'approved', 'rejected', 'suspended', 'draft'];

export async function listArtisans({ page, q, status }: ListParams) {
  await requireAdmin();
  const range = pageRange(page);
  const s = (ARTISAN_STATUSES as string[]).includes(status ?? '') ? (status as ProviderStatus) : 'pending';

  let query = serviceClient()
    .from('profiles')
    .select('id, name, email, phone, location, services, years_experience, avatar_url, work_photos, provider_status, provider_submitted_at, provider_reviewed_at, created_at', {
      count: 'exact',
    })
    .eq('role', 'provider')
    .eq('provider_status', s)
    .is('deleted_at', null)
    .range(range.from, range.to);

  // The queue is first come, first served; everything else is newest first.
  query =
    s === 'pending'
      ? query.order('provider_submitted_at', { ascending: true, nullsFirst: false })
      : query.order(s === 'draft' ? 'created_at' : 'provider_reviewed_at', { ascending: false, nullsFirst: false });

  const term = searchTerm(q);
  if (term) {
    query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,location.ilike.%${term}%,business_name.ilike.%${term}%`);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return paged(data, count, range.page);
}

export async function getArtisan(id: string) {
  await requireAdmin();
  if (!isUuid(id)) return null;
  const db = serviceClient();

  const { data: profile, error } = await db.from('profiles').select('*').eq('id', id).eq('role', 'provider').maybeSingle();
  if (error) throw error;
  if (!profile) return null;

  const [reviewer, jobs, reviews] = await Promise.all([
    profile.provider_reviewed_by
      ? db.from('admin_users').select('email').eq('user_id', profile.provider_reviewed_by).maybeSingle()
      : Promise.resolve({ data: null }),
    db.from('jobs').select('id', { count: 'exact', head: true }).eq('hired_provider_id', id),
    db.from('reviews').select('id', { count: 'exact', head: true }).eq('provider_id', id),
  ]);

  return {
    profile,
    reviewerEmail: (reviewer.data as { email: string } | null)?.email ?? null,
    hiredJobs: jobs.count ?? 0,
    reviews: reviews.count ?? 0,
  };
}

export async function countPendingArtisans(): Promise<number> {
  const { count } = await serviceClient()
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'provider')
    .eq('provider_status', 'pending')
    .is('deleted_at', null);
  return count ?? 0;
}
