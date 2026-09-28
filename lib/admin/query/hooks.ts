'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { resolveDispute, signIn, signOut, type ActionResult, type ResolveInput } from '@/app/admin/actions';
import { parseRangeParams, rangeToSearch, type RangeParams } from '@/lib/admin/analytics/range';
import type { AnalyticsReport } from '@/lib/admin/analytics/types';
import type { getDispute, listDisputes } from '@/lib/admin/data/disputes';
import type { getJob, listJobs } from '@/lib/admin/data/jobs';
import type { Badges, Overview } from '@/lib/admin/data/overview';
import type { listTransactions } from '@/lib/admin/data/transactions';
import type { getUser, listUsers } from '@/lib/admin/data/users';
import type { listWaitlist } from '@/lib/admin/data/waitlist';
import { apiGet } from '@/lib/admin/query/fetch';
import { adminKeys, filtersToSearch, parseFilters, type ListFilters } from '@/lib/admin/query/keys';

/*
 * Every read and write in the console goes through here.
 *
 * Reads: useQuery against /admin/api/*. Pages prefetch the same keys on the
 * server and hand them over in a HydrationBoundary, so the first render has
 * data and these hooks take over from there — background refetch on focus,
 * cached back/forward, previous results kept on screen while a filter loads.
 *
 * Writes: useMutation around the Server Actions in app/admin/actions.ts, which
 * invalidate what they changed.
 */

type Data<F extends (...args: never[]) => unknown> = NonNullable<Awaited<ReturnType<F>>>;

// ─────────────────────────── URL filters ───────────────────────────

/**
 * List filters live in the URL (shareable, survive refresh, work with Back),
 * but change through history.pushState — Next syncs useSearchParams without a
 * server round trip, and TanStack fetches just the data.
 */
export function useListFilters() {
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFilters(new URLSearchParams(searchParams.toString())), [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<ListFilters>) => {
      // Any change other than paging starts again from page 1.
      const next = { ...filters, ...patch, page: patch.page ?? 1 };
      window.history.pushState(null, '', `${window.location.pathname}${filtersToSearch(next)}`);
    },
    [filters],
  );

  return { filters, setFilters };
}

// ─────────────────────────── Queries ───────────────────────────

const subscribeNever = () => () => {};

/**
 * false during the server render and the hydration pass, true on every other
 * render — including a page mounted by client-side navigation.
 */
function useHydrated() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

/**
 * useQuery, hydration-safe.
 *
 * Pages stream their queries unresolved. On a full page load the server
 * renders the skeleton, but by the time the browser hydrates the streamed
 * data has often landed — so a plain useQuery would render rows where the
 * server rendered a skeleton, and React throws a hydration mismatch (#418).
 *
 * Holding data back until hydration is done makes both passes identical; the
 * data appears one render later. Client-side navigations never hydrate, so
 * cached data still renders on the very first frame there.
 */
function useAdminQuery<T>(options: UseQueryOptions<T, Error, T, readonly unknown[]>): UseQueryResult<T> {
  const result = useQuery(options);
  const hydrated = useHydrated();
  if (hydrated) return result;
  return { ...result, data: undefined, error: null, isPlaceholderData: false } as UseQueryResult<T>;
}

export function useOverview() {
  return useAdminQuery({ queryKey: adminKeys.overview(), queryFn: () => apiGet<Overview>('/overview') });
}

/** The sidebar's open-dispute count — polled, so a ticket filed in the app shows up. */
export function useBadges() {
  return useAdminQuery({
    queryKey: adminKeys.badges(),
    queryFn: () => apiGet<Badges>('/badges'),
    refetchInterval: 60_000,
  });
}

const list = <T,>(key: readonly unknown[], path: string, f: ListFilters): UseQueryOptions<T, Error, T, readonly unknown[]> => ({
  queryKey: key,
  queryFn: () => apiGet<T>(`${path}${filtersToSearch(f)}`),
  placeholderData: keepPreviousData,
});

export const useDisputes = (f: ListFilters) =>
  useAdminQuery(list<Data<typeof listDisputes>>(adminKeys.disputes.list(f), '/disputes', f));
export const useJobs = (f: ListFilters) =>
  useAdminQuery(list<Data<typeof listJobs>>(adminKeys.jobs.list(f), '/jobs', f));
export const useUsers = (f: ListFilters) =>
  useAdminQuery(list<Data<typeof listUsers>>(adminKeys.users.list(f), '/users', f));
export const useTransactions = (f: ListFilters) =>
  useAdminQuery(list<Data<typeof listTransactions>>(adminKeys.transactions.list(f), '/transactions', f));
export const useWaitlist = (f: ListFilters) =>
  useAdminQuery(list<Data<typeof listWaitlist>>(adminKeys.waitlist.list(f), '/waitlist', f));

// Detail data may be `null`: that is what a server prefetch of an unknown id
// hydrates as. (The API answers the same case with a 404 instead.)
type Detail<F extends (...args: never[]) => unknown> = Awaited<ReturnType<F>>;

export const useDispute = (id: string) =>
  useAdminQuery({
    queryKey: adminKeys.disputes.detail(id),
    queryFn: () => apiGet<Detail<typeof getDispute>>(`/disputes/${id}`),
  });
export const useJob = (id: string) =>
  useAdminQuery({ queryKey: adminKeys.jobs.detail(id), queryFn: () => apiGet<Detail<typeof getJob>>(`/jobs/${id}`) });
export const useUser = (id: string) =>
  useAdminQuery({ queryKey: adminKeys.users.detail(id), queryFn: () => apiGet<Detail<typeof getUser>>(`/users/${id}`) });

// ─────────────────────────── Analytics ───────────────────────────

/** The analytics range lives in the URL, changed shallowly like list filters. */
export function useAnalyticsRange() {
  const searchParams = useSearchParams();
  const params = useMemo(() => parseRangeParams(new URLSearchParams(searchParams.toString())), [searchParams]);
  const setParams = useCallback((next: RangeParams) => {
    window.history.pushState(null, '', `${window.location.pathname}${rangeToSearch(next)}`);
  }, []);
  return { params, setParams };
}

export function useAnalytics(params: RangeParams) {
  return useAdminQuery({
    queryKey: adminKeys.analytics(params),
    queryFn: () => apiGet<AnalyticsReport>(`/analytics${rangeToSearch(params)}`),
    placeholderData: keepPreviousData,
    // Aggregation is the heaviest read in the console; a minute is fresh enough.
    staleTime: 60_000,
  });
}

// ─────────────────────────── Intent prefetch ───────────────────────────

/*
 * Hover (or keyboard focus) is a strong signal of the next click and arrives a
 * few hundred milliseconds before it. Starting the fetch then makes even a
 * first visit feel instant. prefetchQuery is a no-op while cached data is
 * fresh, so repeated hovers cost nothing.
 */

const SECTION_QUERIES: Record<string, { key: readonly unknown[]; path: string }> = {
  '/admin': { key: adminKeys.overview(), path: '/overview' },
  // The key a list page builds from an empty URL: parseFilters(…) → { page: 1 }.
  '/admin/disputes': { key: adminKeys.disputes.list({ page: 1 }), path: '/disputes' },
  '/admin/jobs': { key: adminKeys.jobs.list({ page: 1 }), path: '/jobs' },
  '/admin/users': { key: adminKeys.users.list({ page: 1 }), path: '/users' },
  '/admin/transactions': { key: adminKeys.transactions.list({ page: 1 }), path: '/transactions' },
  '/admin/waitlist': { key: adminKeys.waitlist.list({ page: 1 }), path: '/waitlist' },
  '/admin/analytics': { key: adminKeys.analytics({ range: '30d' }), path: '/analytics' },
};

/** For the sidebar: warm a section's default view. */
export function usePrefetchSection() {
  const queryClient = useQueryClient();
  return useCallback(
    (href: string) => {
      const hit = SECTION_QUERIES[href];
      if (hit) void queryClient.prefetchQuery({ queryKey: hit.key, queryFn: () => apiGet(hit.path) });
    },
    [queryClient],
  );
}

/** For list rows: warm the record the row opens. */
export function usePrefetchDetail(resource: 'disputes' | 'jobs' | 'users') {
  const queryClient = useQueryClient();
  return useCallback(
    (id: string) =>
      void queryClient.prefetchQuery({
        queryKey: adminKeys[resource].detail(id),
        queryFn: () => apiGet(`/${resource}/${id}`),
      }),
    [queryClient, resource],
  );
}

// ─────────────────────────── Mutations ───────────────────────────

/** Server Actions return `{ ok: false, error }`; TanStack wants a rejection. */
async function unwrap<T extends ActionResult>(result: Promise<T>): Promise<Extract<T, { ok: true }>> {
  const r = await result;
  if (!r.ok) throw new Error(r.error);
  return r as Extract<T, { ok: true }>;
}

export function useSignIn() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string; next?: string }) => unwrap(signIn(input)),
    onSuccess: ({ next }) => {
      // Nothing cached under a previous session may survive into this one.
      queryClient.clear();
      router.replace(next);
      router.refresh();
    },
  });
}

export function useSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(signOut()),
    onSuccess: () => {
      queryClient.clear();
      router.replace('/admin/login');
      router.refresh();
    },
  });
}

/**
 * Settling moves money on the job, its escrow, both wallets, the dispute and
 * the badge count — so everything under ['admin'] is refetched rather than
 * guessing which lists include this row.
 */
export function useResolveDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ResolveInput) => unwrap(resolveDispute(input)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  });
}
