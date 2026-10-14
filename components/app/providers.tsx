'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { AuthProvider } from '@/lib/app/auth';

/**
 * Everything under /app. Query defaults follow the mobile app's
 * (providers/query-provider.tsx) with one web change: refetch on window focus,
 * because a browser tab sits in the background far longer than a phone app.
 * Realtime (useRealtimeSync) does the rest, so most screens never need it.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 30 * 60_000,
            retry: 1,
            refetchOnWindowFocus: true,
          },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
