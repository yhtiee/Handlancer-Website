import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/*
 * Scoped to /admin — the marketing site never pays for this.
 *
 * Two jobs:
 *   1. Keep the admin's Supabase session fresh. Server Components cannot write
 *      cookies, so a refreshed token has to be written here, on the way in.
 *   2. An optimistic bounce to the sign-in screen when there is no session at
 *      all, so a signed-out visitor never renders the console shell.
 *
 * This is NOT the authorization check. lib/admin/auth.ts `requireAdmin()` is,
 * and every admin page and Server Action calls it.
 *
 * Reads process.env directly rather than lib/admin/env.ts: that module is
 * `server-only`, which is resolved for the render graph, not for proxy.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return response; // requireAdmin() surfaces the config error.

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet) {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });

  // getClaims() verifies the JWT (and refreshes it when expired). Nothing may
  // run between createServerClient and this call, or sessions drop at random.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  const { pathname, search } = request.nextUrl;
  const onLogin = pathname === '/admin/login';

  // The console's data endpoints answer in JSON; a redirect would hand fetch()
  // the login page's HTML.
  if (!signedIn && pathname.startsWith('/admin/api/')) {
    return Response.json({ error: 'Not signed in as an admin.' }, { status: 401 });
  }

  if (!signedIn && !onLogin) {
    const login = request.nextUrl.clone();
    login.pathname = '/admin/login';
    login.search = pathname === '/admin' ? '' : `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
