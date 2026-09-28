/**
 * TanStack Query keys for the admin console, plus the one function that turns
 * URL search params into list filters.
 *
 * Pure and dependency-free: imported by server pages (to prefetch), route
 * handlers (to parse), and client hooks (to query). All three MUST build the
 * same key from the same URL, or the server's prefetched data is never found
 * and the client fetches everything twice.
 */

export type ListFilters = {
  q?: string;
  status?: string;
  role?: string;
  type?: string;
  page: number;
};

const FILTER_KEYS = ['q', 'status', 'role', 'type'] as const;

type ParamSource =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

/** Only non-empty values survive, so `{}` and `{ q: '' }` hash to the same key. */
export function parseFilters(source: ParamSource): ListFilters {
  const get = (k: string) => {
    const v = source instanceof URLSearchParams ? source.get(k) : source[k];
    const s = Array.isArray(v) ? v[0] : v;
    return s?.trim() || undefined;
  };

  const filters: ListFilters = { page: Math.max(1, Math.floor(Number(get('page')) || 1)) };
  for (const k of FILTER_KEYS) {
    const v = get(k);
    if (v) filters[k] = v;
  }
  return filters;
}

/** Back to a query string, for the API URL and the address bar. */
export function filtersToSearch(filters: Partial<ListFilters>): string {
  const qs = new URLSearchParams();
  for (const k of FILTER_KEYS) {
    const v = filters[k];
    if (v) qs.set(k, v);
  }
  if (filters.page && filters.page > 1) qs.set('page', String(filters.page));
  const s = qs.toString();
  return s ? `?${s}` : '';
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Every record id is a uuid. Checked before any query runs: a malformed id is
 * a 404 with no database work, and ids reach `.or()` filters as raw strings.
 */
export function isUuidShape(value: string): boolean {
  return UUID.test(value);
}

const all = ['admin'] as const;

export const adminKeys = {
  /** Everything — what a settlement or sign-out invalidates. */
  all,
  overview: () => [...all, 'overview'] as const,
  badges: () => [...all, 'badges'] as const,
  disputes: {
    all: () => [...all, 'disputes'] as const,
    list: (f: ListFilters) => [...all, 'disputes', 'list', f] as const,
    detail: (id: string) => [...all, 'disputes', 'detail', id] as const,
  },
  jobs: {
    all: () => [...all, 'jobs'] as const,
    list: (f: ListFilters) => [...all, 'jobs', 'list', f] as const,
    detail: (id: string) => [...all, 'jobs', 'detail', id] as const,
  },
  users: {
    all: () => [...all, 'users'] as const,
    list: (f: ListFilters) => [...all, 'users', 'list', f] as const,
    detail: (id: string) => [...all, 'users', 'detail', id] as const,
  },
  transactions: {
    all: () => [...all, 'transactions'] as const,
    list: (f: ListFilters) => [...all, 'transactions', 'list', f] as const,
  },
  waitlist: {
    all: () => [...all, 'waitlist'] as const,
    list: (f: ListFilters) => [...all, 'waitlist', 'list', f] as const,
  },
  /** Keyed by the URL's range params (not resolved instants), so a key is stable across the day. */
  analytics: (p: { range: string; interval?: string; from?: string; to?: string }) =>
    [...all, 'analytics', p] as const,
};
