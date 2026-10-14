// Ported from Handlancer-Mobile-Application/src/queries/use-discover-jobs.ts @ 8968d5c — keep the diff minimal so later syncs stay easy.
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { emptyJobFilters, serializeFilters, type JobFilters } from '@/lib/app/domain/job-filters';
import { useAuth } from '@/lib/app/auth';
import { queryKeys } from '@/lib/app/queries/keys';
import { countOpenJobs, listOpenJobs } from '@/lib/app/services/jobs';

/**
 * Jobs a provider can apply to (public bids + direct invites), paginated and
 * filtered server-side. Pass an already-debounced search.
 */
export function useOpenJobs(search?: string, filters: JobFilters = emptyJobFilters) {
  const { session, profile } = useAuth();
  const providerId = session?.user.id;
  const mySkills = profile?.services ?? [];

  return useInfiniteQuery({
    queryKey: queryKeys.jobs.discover(search, serializeFilters(filters)),
    queryFn: ({ pageParam }) =>
      listOpenJobs(providerId!, search, pageParam, filters, mySkills),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!providerId,
  });
}

/**
 * Count for the filter sheet's "Show N jobs" button. Separate from the feed so
 * the sheet can preview a filter set the list has not been switched to yet.
 */
export function useOpenJobsCount(search: string | undefined, filters: JobFilters) {
  const { session, profile } = useAuth();
  const providerId = session?.user.id;
  const mySkills = profile?.services ?? [];

  return useQuery({
    queryKey: queryKeys.jobs.discoverCount(search, serializeFilters(filters)),
    queryFn: () => countOpenJobs(providerId!, search, filters, mySkills),
    enabled: !!providerId,
    // Keeps the number on the button from flashing to a spinner on every tweak.
    placeholderData: (prev) => prev,
  });
}
