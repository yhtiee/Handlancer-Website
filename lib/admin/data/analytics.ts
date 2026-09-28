import 'server-only';

import { requireAdmin } from '@/lib/admin/auth';
import {
  bucketLabel,
  bucketStart,
  bucketStarts,
  nextBucket,
  resolveRange,
  type RangeParams,
} from '@/lib/admin/analytics/range';
import type { AnalyticsReport, Kpi, Ranked, TimelinePoint } from '@/lib/admin/analytics/types';
import { humanize } from '@/lib/admin/format';
import { serviceClient } from '@/lib/admin/supabase';
import { CATEGORIES } from '@/lib/site';

/*
 * Analytics, aggregated in Node from the ledger and marketplace tables.
 *
 * Reads only the columns each metric needs, paged past PostgREST's 1,000-row
 * limit, up to ROW_CAP per table — past that the report says so (`truncated`)
 * rather than silently under-counting. At the volume where that matters, move
 * these sums into a service-role SQL function; the report shape can stay.
 *
 * Where the numbers come from (and why):
 *   - Money is read from `transactions`, the ledger, not from job budgets:
 *       escrow_hold            → money clients put into escrow ("escrow funded")
 *       escrow_release, payout → money paid to providers
 *       fund, job_id null      → wallet top-ups
 *       fund, job_id set       → dispute refunds (0009 books them as `fund`)
 *       withdraw               → withdrawal requests
 *   - A job is "hired" when its escrow is funded — the hire gate (0007) makes
 *     funding the act of hiring — and "completed" when its final payout lands.
 *     `jobs` has no completed_at, so the payout's timestamp is the completion time.
 */

const ROW_CAP = 50_000;
const PAGE = 1_000;
const HOUR_MS = 3_600_000;

type Page<T> = PromiseLike<{ data: T[] | null; error: unknown }>;

async function fetchAll<T>(page: (from: number, to: number) => Page<T>): Promise<{ rows: T[]; truncated: boolean }> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return { rows, truncated: false };
    if (rows.length >= ROW_CAP) return { rows, truncated: true };
  }
}

/** `.in()` with thousands of ids would overflow the URL; ask in slices. */
async function byIds<T>(ids: string[], load: (slice: string[]) => Page<T>): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += 150) {
    const { data, error } = await load(ids.slice(i, i + 150));
    if (error) throw error;
    out.push(...(data ?? []));
  }
  return out;
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
const ratio = (a: number, b: number) => (b > 0 ? a / b : null);

const CATEGORY_LABEL = new Map<string, string>(CATEGORIES.map((c) => [c.id, c.label]));
const categoryLabel = (id: string | null) => (id ? (CATEGORY_LABEL.get(id) ?? humanize(id)) : 'Uncategorised');

/** "ikeja, lagos" / "Ikeja " / "IKEJA" → "Ikeja". Free text in the app, so normalise before grouping. */
function placeLabel(raw: string | null): string {
  const first = (raw ?? '').split(',')[0].trim().toLowerCase();
  if (!first) return 'Not given';
  return first.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Top `n` by value, the rest folded into one "Other" row (a 9th category is never a 9th colour). */
function topN(map: Map<string, { value: number; secondary: number }>, n: number): Ranked[] {
  const all = [...map.entries()]
    .map(([label, v]) => ({ label, value: v.value, secondary: v.secondary }))
    .sort((a, b) => b.value - a.value || b.secondary - a.secondary);
  if (all.length <= n) return all;
  const rest = all.slice(n - 1);
  return [
    ...all.slice(0, n - 1),
    { label: `Other (${rest.length})`, value: sum(rest.map((r) => r.value)), secondary: sum(rest.map((r) => r.secondary)) },
  ];
}

export async function getAnalytics(params: RangeParams): Promise<AnalyticsReport> {
  await requireAdmin();
  const db = serviceClient();
  const r = resolveRange(params);
  const now = new Date().toISOString();
  const W0 = r.prevFrom;

  const t = (iso: string) => new Date(iso).getTime();
  const from = t(r.from);
  const to = t(r.to);
  const prevFrom = t(r.prevFrom);
  const inCur = (iso: string | null) => !!iso && t(iso) >= from && t(iso) < to;
  const inPrev = (iso: string | null) => !!iso && t(iso) >= prevFrom && t(iso) < from;

  // ── Load (in parallel) ────────────────────────────────────────────────
  const [profiles, jobs, txns, quotes, disputes, lateResolved, waitlist, clientsToDate, providersToDate, stillOpen] =
    await Promise.all([
      fetchAll((a, b) =>
        db.from('profiles').select('id, role, created_at').gte('created_at', W0).lt('created_at', r.to).order('id').range(a, b),
      ),
      fetchAll((a, b) =>
        db
          .from('jobs')
          .select('id, status, category, location, created_at')
          .gte('created_at', W0)
          .lt('created_at', r.to)
          .order('id')
          .range(a, b),
      ),
      // Up to now, not just to the range end: the funnel follows jobs posted
      // in the range to wherever they are today.
      fetchAll((a, b) =>
        db
          .from('transactions')
          .select('id, wallet_id, job_id, type, status, amount, created_at')
          .gte('created_at', W0)
          .lte('created_at', now)
          .in('status', ['success', 'pending'])
          .order('id')
          .range(a, b),
      ),
      fetchAll((a, b) => db.from('quotes').select('id, job_id').gte('created_at', W0).order('id').range(a, b)),
      fetchAll((a, b) =>
        db
          .from('disputes')
          .select('id, status, category, created_at, resolved_at, refunded_amount, released_amount')
          .gte('created_at', W0)
          .order('id')
          .range(a, b),
      ),
      // Tickets opened before the window but settled inside it.
      fetchAll((a, b) =>
        db
          .from('disputes')
          .select('id, status, category, created_at, resolved_at, refunded_amount, released_amount')
          .lt('created_at', W0)
          .gte('resolved_at', r.from)
          .lt('resolved_at', r.to)
          .order('id')
          .range(a, b),
      ),
      // Optional table (supabase/waitlist.sql) — a missing table is not an error here.
      fetchAll((a, b) =>
        db.from('waitlist').select('id, role, created_at').gte('created_at', W0).lt('created_at', r.to).order('id').range(a, b),
      ).catch(() => ({ rows: [] as { id: string; role: string; created_at: string }[], truncated: false })),
      db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user').lt('created_at', r.to),
      db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'provider').lt('created_at', r.to),
      db.from('disputes').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_review']),
    ]);

  const truncated = [profiles, jobs, txns, quotes, disputes, waitlist].some((x) => x.truncated);
  const tx = txns.rows.map((x) => ({ ...x, amount: Number(x.amount) }));
  const ok = tx.filter((x) => x.status === 'success');
  const holds = ok.filter((x) => x.type === 'escrow_hold');
  const payouts = ok.filter((x) => x.type === 'payout');
  const toProvider = ok.filter((x) => x.type === 'payout' || x.type === 'escrow_release');
  const topUps = ok.filter((x) => x.type === 'fund' && !x.job_id);
  const refunds = ok.filter((x) => x.type === 'fund' && !!x.job_id);
  const withdrawals = tx.filter((x) => x.type === 'withdraw');

  /** First escrow funding per job (a job is funded once; take the earliest to be safe). */
  const fundedAt = new Map<string, number>();
  for (const h of holds) {
    if (!h.job_id) continue;
    const at = t(h.created_at);
    if (!fundedAt.has(h.job_id) || at < fundedAt.get(h.job_id)!) fundedAt.set(h.job_id, at);
  }
  const completedJobs = new Set(payouts.map((p) => p.job_id).filter(Boolean) as string[]);
  const quotedJobs = new Set(quotes.rows.map((q) => q.job_id));

  const allDisputes = new Map([...disputes.rows, ...lateResolved.rows].map((d) => [d.id, d]));

  // ── Per-period numbers (current and previous share one definition) ─────
  function period(inP: (iso: string | null) => boolean) {
    const posted = jobs.rows.filter((j) => inP(j.created_at));
    const hired = posted.filter((j) => fundedAt.has(j.id));
    const fundedInP = new Set(holds.filter((h) => inP(h.created_at)).map((h) => h.job_id).filter(Boolean));
    const opened = [...allDisputes.values()].filter((d) => inP(d.created_at)).length;
    return {
      escrowFunded: sum(holds.filter((h) => inP(h.created_at)).map((h) => h.amount)),
      paidOut: sum(toProvider.filter((p) => inP(p.created_at)).map((p) => p.amount)),
      jobsPosted: posted.length,
      jobsCompleted: new Set(payouts.filter((p) => inP(p.created_at)).map((p) => p.job_id)).size,
      hireRate: ratio(hired.length, posted.length),
      newUsers: profiles.rows.filter((p) => inP(p.created_at)).length,
      disputeRate: ratio(opened, fundedInP.size),
      hoursToHire: median(hired.map((j) => (fundedAt.get(j.id)! - t(j.created_at)) / HOUR_MS)),
    };
  }
  const cur = period(inCur);
  const prev = period(inPrev);

  // ── Timeline ─────────────────────────────────────────────────────────
  const starts = bucketStarts(r.from, r.to, r.interval);
  const index = new Map(starts.map((s, i) => [s, i]));
  const timeline: TimelinePoint[] = starts.map((start) => ({
    start,
    label: bucketLabel(start, r.interval),
    escrowFunded: 0,
    paidOut: 0,
    topUps: 0,
    withdrawals: 0,
    refunds: 0,
    jobsPosted: 0,
    jobsCompleted: 0,
    newClients: 0,
    newProviders: 0,
    disputesOpened: 0,
    waitlistSignups: 0,
  }));
  const bump = (iso: string, field: keyof Omit<TimelinePoint, 'start' | 'label'>, by = 1) => {
    if (!inCur(iso)) return;
    const i = index.get(bucketStart(new Date(iso), r.interval).toISOString());
    if (i !== undefined) timeline[i][field] += by;
  };
  holds.forEach((h) => bump(h.created_at, 'escrowFunded', h.amount));
  toProvider.forEach((p) => bump(p.created_at, 'paidOut', p.amount));
  topUps.forEach((f) => bump(f.created_at, 'topUps', f.amount));
  refunds.forEach((f) => bump(f.created_at, 'refunds', f.amount));
  withdrawals.forEach((w) => bump(w.created_at, 'withdrawals', w.amount));
  jobs.rows.forEach((j) => bump(j.created_at, 'jobsPosted'));
  // Completion = the first payout per job.
  const firstPayout = new Map<string, string>();
  for (const p of payouts) if (p.job_id && (!firstPayout.has(p.job_id) || p.created_at < firstPayout.get(p.job_id)!)) firstPayout.set(p.job_id, p.created_at);
  firstPayout.forEach((at) => bump(at, 'jobsCompleted'));
  profiles.rows.forEach((p) => bump(p.created_at, p.role === 'provider' ? 'newProviders' : 'newClients'));
  allDisputes.forEach((d) => bump(d.created_at, 'disputesOpened'));
  waitlist.rows.forEach((w) => bump(w.created_at, 'waitlistSignups'));

  const spark = (k: keyof Omit<TimelinePoint, 'start' | 'label'>) => timeline.map((p) => p[k]);

  // ── KPIs ─────────────────────────────────────────────────────────────
  const kpis: Kpi[] = [
    {
      key: 'escrowFunded',
      label: 'Escrow funded',
      value: cur.escrowFunded,
      previous: prev.escrowFunded,
      format: 'naira',
      goodWhen: 'up',
      spark: spark('escrowFunded'),
      definition: 'Money clients moved into escrow to hire a provider (escrow_hold ledger entries).',
    },
    {
      key: 'paidOut',
      label: 'Paid to providers',
      value: cur.paidOut,
      previous: prev.paidOut,
      format: 'naira',
      goodWhen: 'up',
      spark: spark('paidOut'),
      definition: 'Materials releases plus final payouts, including provider shares from settled disputes.',
    },
    {
      key: 'jobsPosted',
      label: 'Jobs posted',
      value: cur.jobsPosted,
      previous: prev.jobsPosted,
      format: 'count',
      goodWhen: 'up',
      spark: spark('jobsPosted'),
      definition: 'Jobs created by clients in the period.',
    },
    {
      key: 'jobsCompleted',
      label: 'Jobs completed',
      value: cur.jobsCompleted,
      previous: prev.jobsCompleted,
      format: 'count',
      goodWhen: 'up',
      spark: spark('jobsCompleted'),
      definition: 'Jobs whose final payout was released in the period.',
    },
    {
      key: 'hireRate',
      label: 'Hire rate',
      value: cur.hireRate,
      previous: prev.hireRate,
      format: 'percent',
      goodWhen: 'up',
      definition: 'Share of jobs posted in the period whose escrow has since been funded (the moment of hiring).',
    },
    {
      key: 'newUsers',
      label: 'New sign-ups',
      value: cur.newUsers,
      previous: prev.newUsers,
      format: 'count',
      goodWhen: 'up',
      spark: timeline.map((p) => p.newClients + p.newProviders),
      definition: 'New client and provider profiles created in the app.',
    },
    {
      key: 'disputeRate',
      label: 'Dispute rate',
      value: cur.disputeRate,
      previous: prev.disputeRate,
      format: 'percent',
      goodWhen: 'down',
      definition: 'Disputes opened, divided by jobs whose escrow was funded, in the same period.',
    },
    {
      key: 'hoursToHire',
      label: 'Median time to hire',
      value: cur.hoursToHire,
      previous: prev.hoursToHire,
      format: 'hours',
      goodWhen: 'down',
      definition: 'Median time from a job being posted to its escrow being funded, for jobs posted in the period.',
    },
  ];

  // ── Funnel: jobs posted in the period, followed to today ──────────────
  const postedNow = jobs.rows.filter((j) => inCur(j.created_at));
  const funnel = [
    { label: 'Posted', value: postedNow.length, definition: 'Jobs posted in the period.' },
    {
      label: 'Received a quote',
      value: postedNow.filter((j) => quotedJobs.has(j.id)).length,
      definition: 'Of those, jobs with at least one quote.',
    },
    {
      label: 'Hired (escrow funded)',
      value: postedNow.filter((j) => fundedAt.has(j.id)).length,
      definition: 'Of those, jobs whose client funded escrow to hire.',
    },
    {
      label: 'Completed',
      value: postedNow.filter((j) => completedJobs.has(j.id) || j.status === 'completed').length,
      definition: 'Of those, jobs paid out in full.',
    },
  ];

  // ── Categories: jobs posted + money funded ─────────────────────────────
  const jobCategory = new Map(jobs.rows.map((j) => [j.id, j.category]));
  const missing = [
    ...new Set(holds.filter((h) => inCur(h.created_at) && h.job_id && !jobCategory.has(h.job_id)).map((h) => h.job_id!)),
  ];
  if (missing.length) {
    const older = await byIds(missing, (ids) => db.from('jobs').select('id, category').in('id', ids));
    older.forEach((j) => jobCategory.set(j.id, j.category));
  }
  const cat = new Map<string, { value: number; secondary: number }>();
  const catRow = (k: string) => cat.get(k) ?? (cat.set(k, { value: 0, secondary: 0 }), cat.get(k)!);
  postedNow.forEach((j) => catRow(categoryLabel(j.category)).value++);
  holds
    .filter((h) => inCur(h.created_at) && h.job_id)
    .forEach((h) => (catRow(categoryLabel(jobCategory.get(h.job_id!) ?? null)).secondary += h.amount));

  // ── Locations ─────────────────────────────────────────────────────────
  const loc = new Map<string, { value: number; secondary: number }>();
  postedNow.forEach((j) => {
    const k = placeLabel(j.location);
    const row = loc.get(k) ?? { value: 0, secondary: 0 };
    row.value++;
    loc.set(k, row);
  });

  // ── Disputes ──────────────────────────────────────────────────────────
  const dispList = [...allDisputes.values()];
  const resolvedNow = dispList.filter((d) => inCur(d.resolved_at));
  const outcome = { refund: 0, release: 0, split: 0, rejected: 0 };
  for (const d of resolvedNow) {
    if (d.status === 'rejected') outcome.rejected++;
    else {
      const rel = Number(d.released_amount ?? 0);
      const ref = Number(d.refunded_amount ?? 0);
      if (rel > 0 && ref > 0) outcome.split++;
      else if (rel > 0) outcome.release++;
      else outcome.refund++;
    }
  }
  const dispCat = new Map<string, { value: number; secondary: number }>();
  dispList
    .filter((d) => inCur(d.created_at))
    .forEach((d) => {
      const k = humanize(d.category);
      const row = dispCat.get(k) ?? { value: 0, secondary: 0 };
      row.value++;
      dispCat.set(k, row);
    });

  // ── Top providers by money received ────────────────────────────────────
  const earnedByWallet = new Map<string, { earned: number; jobs: Set<string> }>();
  for (const p of toProvider.filter((x) => inCur(x.created_at))) {
    const row = earnedByWallet.get(p.wallet_id) ?? { earned: 0, jobs: new Set<string>() };
    row.earned += p.amount;
    if (p.type === 'payout' && p.job_id) row.jobs.add(p.job_id);
    earnedByWallet.set(p.wallet_id, row);
  }
  const topWallets = [...earnedByWallet.entries()].sort((a, b) => b[1].earned - a[1].earned).slice(0, 10);
  const wallets = await byIds(
    topWallets.map(([id]) => id),
    (ids) => db.from('wallets').select('id, owner_id').in('id', ids),
  );
  const owners = new Map(wallets.map((w) => [w.id, w.owner_id]));
  const people = await byIds(
    [...new Set(wallets.map((w) => w.owner_id))],
    (ids) => db.from('profiles').select('id, name, email, rating').in('id', ids),
  );
  const personById = new Map(people.map((p) => [p.id, p]));
  const topProviders = topWallets.map(([walletId, v]) => {
    const person = personById.get(owners.get(walletId) ?? '');
    return {
      id: person?.id ?? walletId,
      name: person?.name || person?.email || 'Unknown provider',
      completed: v.jobs.size,
      earned: v.earned,
      rating: person?.rating ? Number(person.rating) : null,
    };
  });

  return {
    range: r,
    interval: r.interval,
    generatedAt: now,
    kpis,
    timeline,
    funnel,
    categories: topN(cat, 8),
    locations: topN(loc, 8),
    disputes: {
      opened: dispList.filter((d) => inCur(d.created_at)).length,
      resolved: resolvedNow.length,
      stillOpen: stillOpen.count ?? 0,
      refunded: sum(resolvedNow.map((d) => Number(d.refunded_amount ?? 0))),
      released: sum(resolvedNow.map((d) => Number(d.released_amount ?? 0))),
      medianHoursToResolve: median(
        resolvedNow.map((d) => (t(d.resolved_at!) - t(d.created_at)) / HOUR_MS),
      ),
      outcomes: [
        { label: 'Refunded to client', value: outcome.refund },
        { label: 'Released to provider', value: outcome.release },
        { label: 'Split', value: outcome.split },
        { label: 'Rejected', value: outcome.rejected },
      ],
      byCategory: topN(dispCat, 6),
    },
    topProviders,
    users: { clientsToDate: clientsToDate.count ?? 0, providersToDate: providersToDate.count ?? 0 },
    partialLast: starts.length > 0 && nextBucket(new Date(starts[starts.length - 1]), r.interval).getTime() > t(now),
    truncated,
  };
}
