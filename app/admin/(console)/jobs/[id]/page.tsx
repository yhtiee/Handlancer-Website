import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { JobView } from '@/app/admin/(console)/jobs/[id]/view';
import { getJob } from '@/lib/admin/data/jobs';
import { makeQueryClient } from '@/lib/admin/query/client';
import { adminKeys, isUuidShape } from '@/lib/admin/query/keys';

export const metadata: Metadata = { title: 'Job' };

/**
 * Streams the record rather than awaiting it, so opening it never blocks on
 * the database; JobView shows cached data at once if it has any. A
 * malformed id is a 404 here; an unknown one is handled in the view.
 */
export default async function JobPage({ params }: PageProps<'/admin/jobs/[id]'>) {
  const { id } = await params;
  if (!isUuidShape(id)) notFound();

  const queryClient = makeQueryClient();
  void queryClient.prefetchQuery({
    queryKey: adminKeys.jobs.detail(id),
    queryFn: () => getJob(id),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <JobView id={id} />
    </HydrationBoundary>
  );
}
