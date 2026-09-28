import 'server-only';

import { requireAdmin } from '@/lib/admin/auth';
import { JOB_STATUSES } from '@/lib/admin/data/overview';
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
import type { JobStatus } from '@/lib/admin/types';

export async function listJobs({ page, q, status }: ListParams) {
  await requireAdmin();
  const range = pageRange(page);

  let query = serviceClient()
    .from('jobs')
    .select('id, title, category, status, budget, location, owner_id, hired_provider_id, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(range.from, range.to);

  if (status && JOB_STATUSES.includes(status as JobStatus)) query = query.eq('status', status as JobStatus);

  const term = searchTerm(q);
  if (term) query = query.or(`title.ilike.%${term}%,category.ilike.%${term}%,location.ilike.%${term}%`);

  const { data, count, error } = await query;
  if (error) throw error;

  const people = await profilesById((data ?? []).flatMap((j) => [j.owner_id, j.hired_provider_id]));
  const rows = (data ?? []).map((j) => ({
    ...j,
    owner: people.get(j.owner_id) ?? null,
    provider: j.hired_provider_id ? (people.get(j.hired_provider_id) ?? null) : null,
  }));
  return paged(rows, count, range.page);
}

export async function getJob(id: string) {
  await requireAdmin();
  if (!isUuid(id)) return null;
  const db = serviceClient();

  const { data: job, error } = await db.from('jobs').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!job) return null;

  const [quotes, escrow, disputes, transactions] = await Promise.all([
    db.from('quotes').select('*').eq('job_id', id).order('created_at', { ascending: true }),
    db.from('escrows').select('*').eq('job_id', id).maybeSingle(),
    db.from('disputes').select('id, reference, status, category, created_at').eq('job_id', id).order('created_at'),
    db.from('transactions').select('*').eq('job_id', id).order('created_at', { ascending: true }),
  ]);

  const people = await profilesById([
    job.owner_id,
    job.hired_provider_id,
    ...(quotes.data ?? []).map((q) => q.provider_id),
  ]);

  return {
    job,
    owner: people.get(job.owner_id) ?? null,
    provider: job.hired_provider_id ? (people.get(job.hired_provider_id) ?? null) : null,
    quotes: (quotes.data ?? []).map((q) => ({ ...q, provider: people.get(q.provider_id) ?? null })),
    escrow: escrow.data,
    held: escrow.data ? heldAmount(escrow.data) : 0,
    disputes: disputes.data ?? [],
    transactions: transactions.data ?? [],
  };
}
