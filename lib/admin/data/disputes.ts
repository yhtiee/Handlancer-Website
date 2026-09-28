import 'server-only';

import { requireAdmin } from '@/lib/admin/auth';
import {
  heldAmount,
  isUuid,
  pageRange,
  paged,
  profilesById,
  searchTerm,
  type ListParams,
} from '@/lib/admin/data/shared';
import { serviceClient } from '@/lib/admin/supabase';
import type { DisputeStatus } from '@/lib/admin/types';

export const DISPUTE_STATUSES: DisputeStatus[] = ['open', 'in_review', 'resolved', 'rejected'];

/**
 * Live tickets first, oldest first — the one that has waited longest is the
 * one to pick up next. Settled tickets follow, newest first.
 */
export async function listDisputes({ page, q, status }: ListParams) {
  await requireAdmin();
  const range = pageRange(page);
  const live = !status || status === 'open' || status === 'in_review';

  let query = serviceClient()
    .from('disputes')
    .select('id, job_id, opened_by, reference, category, desired_outcome, status, created_at, resolved_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: live })
    .range(range.from, range.to);

  if (status && DISPUTE_STATUSES.includes(status as DisputeStatus)) {
    query = query.eq('status', status as DisputeStatus);
  } else if (!status) {
    query = query.in('status', ['open', 'in_review']);
  }

  const term = searchTerm(q);
  if (term) query = query.or(`reference.ilike.%${term}%,category.ilike.%${term}%`);

  const { data, count, error } = await query;
  if (error) throw error;

  const jobIds = [...new Set((data ?? []).map((d) => d.job_id))];
  const [{ data: jobs }, people] = await Promise.all([
    jobIds.length
      ? serviceClient().from('jobs').select('id, title').in('id', jobIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    profilesById((data ?? []).map((d) => d.opened_by)),
  ]);
  const titles = new Map((jobs ?? []).map((j) => [j.id, j.title]));

  const rows = (data ?? []).map((d) => ({
    ...d,
    jobTitle: titles.get(d.job_id) ?? 'Deleted job',
    openedBy: people.get(d.opened_by) ?? null,
  }));
  return paged(rows, count, range.page);
}

export async function getDispute(id: string) {
  await requireAdmin();
  if (!isUuid(id)) return null;
  const db = serviceClient();

  const { data: dispute, error } = await db.from('disputes').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!dispute) return null;

  const [job, escrow, quote] = await Promise.all([
    db.from('jobs').select('*').eq('id', dispute.job_id).maybeSingle(),
    db.from('escrows').select('*').eq('job_id', dispute.job_id).maybeSingle(),
    db.from('quotes').select('*').eq('job_id', dispute.job_id).eq('status', 'approved').maybeSingle(),
  ]);

  const people = await profilesById([job.data?.owner_id, job.data?.hired_provider_id]);

  return {
    dispute,
    job: job.data,
    client: job.data ? (people.get(job.data.owner_id) ?? null) : null,
    provider: job.data?.hired_provider_id ? (people.get(job.data.hired_provider_id) ?? null) : null,
    escrow: escrow.data,
    quote: quote.data,
    held: escrow.data ? heldAmount(escrow.data) : 0,
    isLive: dispute.status === 'open' || dispute.status === 'in_review',
  };
}

export type DisputeDetail = NonNullable<Awaited<ReturnType<typeof getDispute>>>;
