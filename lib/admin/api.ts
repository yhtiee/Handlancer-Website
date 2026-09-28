import 'server-only';

import { getAdmin, withVerifiedAdmin } from '@/lib/admin/auth';

/**
 * Wraps every /admin/api route handler.
 *
 * - 401 JSON (never a redirect) when there is no admin session, so the
 *   browser's fetch sees a status it can act on instead of a login page's HTML.
 * - 404 when the data function returns null (unknown or malformed id).
 * - 500 with a generic message otherwise; the real error stays in the logs.
 *
 * The data functions call requireAdmin() themselves as well — this check is
 * what turns "not an admin" into a clean 401 rather than a redirect, and it is
 * handed down (withVerifiedAdmin) so theirs costs nothing.
 */
export async function adminJson<T>(load: () => Promise<T | null>): Promise<Response> {
  const admin = await getAdmin();
  if (!admin) {
    return Response.json({ error: 'Not signed in as an admin.' }, { status: 401 });
  }
  try {
    // Verified once, above; the data function's own requireAdmin() reuses it.
    const data = await withVerifiedAdmin(admin, load);
    if (data === null) return Response.json({ error: 'Not found.' }, { status: 404 });
    return Response.json(data, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('[admin api]', error);
    return Response.json({ error: 'Something went wrong loading this data.' }, { status: 500 });
  }
}
