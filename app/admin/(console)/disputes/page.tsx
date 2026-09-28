import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';

import { DisputesView } from '@/app/admin/(console)/disputes/view';
import { PageHeader } from '@/components/admin/ui';
import { listDisputes } from '@/lib/admin/data/disputes';
import { makeQueryClient } from '@/lib/admin/query/client';
import { adminKeys, parseFilters } from '@/lib/admin/query/keys';

export const metadata: Metadata = { title: 'Disputes' };

/** Prefetches the list for the URL's filters; DisputesView takes over on the client. */
export default async function DisputesPage({ searchParams }: PageProps<'/admin/disputes'>) {
  const filters = parseFilters(await searchParams);
  const queryClient = makeQueryClient();
  void queryClient.prefetchQuery({
    queryKey: adminKeys.disputes.list(filters),
    queryFn: () => listDisputes(filters),
  });

  return (
    <>
      <PageHeader
        title="Disputes"
        description="Opening a dispute freezes the job's escrow. Settling it here is the only way the money moves."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <DisputesView />
      </HydrationBoundary>
    </>
  );
}
