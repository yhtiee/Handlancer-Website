import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';

import { JobsView } from '@/app/admin/(console)/jobs/view';
import { PageHeader } from '@/components/admin/ui';
import { listJobs } from '@/lib/admin/data/jobs';
import { makeQueryClient } from '@/lib/admin/query/client';
import { adminKeys, parseFilters } from '@/lib/admin/query/keys';

export const metadata: Metadata = { title: 'Jobs' };

/** Prefetches the list for the URL's filters; JobsView takes over on the client. */
export default async function JobsPage({ searchParams }: PageProps<'/admin/jobs'>) {
  const filters = parseFilters(await searchParams);
  const queryClient = makeQueryClient();
  void queryClient.prefetchQuery({
    queryKey: adminKeys.jobs.list(filters),
    queryFn: () => listJobs(filters),
  });

  return (
    <>
      <PageHeader title="Jobs" description="Every job posted in the app, newest first." />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <JobsView />
      </HydrationBoundary>
    </>
  );
}
