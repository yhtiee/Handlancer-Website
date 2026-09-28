'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { ApiError, getQueryClient } from '@/lib/admin/query/client';

/** Wraps everything under /admin — the sign-in form's mutation included. */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const router = useRouter();

  // Any query that comes back 401 means the session ended mid-use (expired, or
  // removed from admin_users). Drop the cache and go to sign-in, returning to
  // this exact page afterwards.
  useEffect(() => {
    return queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== 'updated' || event.action.type !== 'error') return;
      const error = event.action.error;
      if (!(error instanceof ApiError) || error.status !== 401) return;
      const here = window.location.pathname + window.location.search;
      queryClient.clear();
      router.replace(`/admin/login?next=${encodeURIComponent(here)}`);
    });
  }, [queryClient, router]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
