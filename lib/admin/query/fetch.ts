import { ApiError } from '@/lib/admin/query/client';

/**
 * The browser's only way to data: GET /admin/api/*. Those handlers run the same
 * server-only data layer the pages prefetch with, behind the same admin check.
 */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`/admin/api${path}`, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });

  // Session expired or access revoked mid-session. QueryProvider watches for
  // this status and sends the admin to sign in, then back here.
  if (res.status === 401) throw new ApiError(401, 'Your session has ended. Sign in again.');

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(res.status, body?.error ?? 'Something went wrong loading this data.');
  }

  return res.json() as Promise<T>;
}
