import { QueryClient, defaultShouldDehydrateQuery, isServer } from '@tanstack/react-query';

/**
 * One QueryClient per server request (so no admin's data can leak into
 * another's render), one for the lifetime of the browser tab.
 *
 * How a page stays instant after its first visit:
 *   - Server pages start their prefetch but do NOT await it. The still-pending
 *     query is dehydrated and its promise streamed to the browser, so a
 *     navigation waits for the page shell, never for the database.
 *   - On arrival, if the browser already holds data for that key, TanStack
 *     keeps showing it and swaps in the streamed result when it lands — no
 *     skeleton. Only a key never seen before shows one.
 *   - gcTime keeps visited pages' data around for the whole working session.
 *
 * staleTime > 0 so data the server just sent is not refetched on arrival.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 30 * 60_000,
        refetchOnWindowFocus: true,
        retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
      },
      mutations: { retry: false },
      dehydrate: {
        // Include in-flight queries so their promises stream to the client.
        shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  });
}

let browserClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) return makeQueryClient();
  browserClient ??= makeQueryClient();
  return browserClient;
}

/** A non-2xx from /admin/api. 4xx is never retried — it will not fix itself. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
