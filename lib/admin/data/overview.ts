import 'server-only';

import { requireAdmin } from '@/lib/admin/auth';
import { heldAmount, profilesById } from '@/lib/admin/data/shared';
import { serviceClient } from '@/lib/admin/supabase';
import type { JobStatus } from '@/lib/admin/types';

export const JOB_STATUSES: JobStatus[] = [
  'draft',
  'posted',
  'hiring',
  'in_progress',
  'completed',
  'disputed',
  'cancelled',
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Everything the overview needs, in parallel.
 *
 * Counts use `head: true` so no rows cross the wire. The two money totals do
 * read rows (live escrows, pending withdrawals) — both sets are small by nature.
 * If either grows, move the sums into a service-role SQL function.
 */
export async function getOverview() {
  await requireAdmin();
  const db = serviceClient();
  const now = Date.now();
  const weekAgo = new Date(now - WEEK_MS).toISOString();
  const twoWeeksAgo = new Date(now - 2 * WEEK_MS).toISOString();

  const countProfiles = (role: 'user' | 'provider', since?: string, until?: string) => {
    let q = db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', role);
    if (since) q = q.gte('created_at', since);
    if (until) q = q.lt('created_at', until);
    return q;
  };

  const [
    clients,
    providers,
    signupsThisWeek,
    signupsLastWeek,
    openDisputes,
    waitlist,
    escrows,
    withdrawals,
    recentDisputes,
    recentJobs,
    ...statusCounts
  ] = await Promise.all([
    countProfiles('user'),
    countProfiles('provider'),
    db.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
    db
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', twoWeeksAgo)
      .lt('created_at', weekAgo),
    db.from('disputes').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_review']),
    db.from('waitlist').select('id', { count: 'exact', head: true }),
    db
      .from('escrows')
      .select('total, materials_amount, materials_released, workmanship_released')
      .in('status', ['funded', 'materials_released']),
    db.from('transactions').select('amount').eq('type', 'withdraw').eq('status', 'pending'),
    db
      .from('disputes')
      .select('id, job_id, reference, category, status, created_at')
      .in('status', ['open', 'in_review'])
      .order('created_at', { ascending: true })
      .limit(5),
    db
      .from('jobs')
      .select('id, title, status, budget, owner_id, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
    ...JOB_STATUSES.map((s) => db.from('jobs').select('id', { count: 'exact', head: true }).eq('status', s)),
  ]);

  const escrowHeld = (escrows.data ?? []).reduce((sum, e) => sum + heldAmount(e), 0);
  const pendingWithdrawals = withdrawals.data ?? [];
  const owners = await profilesById((recentJobs.data ?? []).map((j) => j.owner_id));

  return {
    clients: clients.count ?? 0,
    providers: providers.count ?? 0,
    signupsThisWeek: signupsThisWeek.count ?? 0,
    signupsLastWeek: signupsLastWeek.count ?? 0,
    openDisputes: openDisputes.count ?? 0,
    // The waitlist table only exists once supabase/waitlist.sql has run.
    waitlist: waitlist.error ? null : (waitlist.count ?? 0),
    escrowHeld,
    liveEscrows: escrows.data?.length ?? 0,
    pendingWithdrawalCount: pendingWithdrawals.length,
    pendingWithdrawalTotal: pendingWithdrawals.reduce((s, t) => s + Number(t.amount), 0),
    jobsByStatus: JOB_STATUSES.map((status, i) => ({ status, count: statusCounts[i].count ?? 0 })),
    recentDisputes: recentDisputes.data ?? [],
    recentJobs: (recentJobs.data ?? []).map((j) => ({ ...j, owner: owners.get(j.owner_id) ?? null })),
  };
}

export type Overview = Awaited<ReturnType<typeof getOverview>>;

/** Sidebar counts. Cheap (head-only) so the shell can poll it. */
export async function getBadges() {
  await requireAdmin();
  const { count } = await serviceClient()
    .from('disputes')
    .select('id', { count: 'exact', head: true })
    .in('status', ['open', 'in_review']);
  return { openDisputes: count ?? 0 };
}

export type Badges = Awaited<ReturnType<typeof getBadges>>;
