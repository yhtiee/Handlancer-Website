import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';

import { WaitlistView } from '@/app/admin/(console)/waitlist/view';
import { PageHeader } from '@/components/admin/ui';
import { listWaitlist } from '@/lib/admin/data/waitlist';
import { makeQueryClient } from '@/lib/admin/query/client';
import { adminKeys, parseFilters } from '@/lib/admin/query/keys';

export const metadata: Metadata = { title: 'Waitlist' };

/** Prefetches the list for the URL's filters; WaitlistView takes over on the client. */
export default async function WaitlistPage({ searchParams }: PageProps<'/admin/waitlist'>) {
  const filters = parseFilters(await searchParams);
  const queryClient = makeQueryClient();
  void queryClient.prefetchQuery({
    queryKey: adminKeys.waitlist.list(filters),
    queryFn: () => listWaitlist(filters),
  });

  return (
    <>
      <PageHeader title="Waitlist" description="Sign-ups from the website's early-access form." />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <WaitlistView />
      </HydrationBoundary>
    </>
  );
}
