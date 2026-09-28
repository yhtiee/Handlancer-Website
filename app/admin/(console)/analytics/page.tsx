import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';

import { AnalyticsView } from '@/app/admin/(console)/analytics/view';
import { PageHeader } from '@/components/admin/ui';
import { parseRangeParams } from '@/lib/admin/analytics/range';
import { getAnalytics } from '@/lib/admin/data/analytics';
import { makeQueryClient } from '@/lib/admin/query/client';
import { adminKeys } from '@/lib/admin/query/keys';

export const metadata: Metadata = { title: 'Analytics' };

/** Streams the report for the URL's range; AnalyticsView takes over on the client. */
export default async function AnalyticsPage({ searchParams }: PageProps<'/admin/analytics'>) {
  const params = parseRangeParams(await searchParams);
  const queryClient = makeQueryClient();
  void queryClient.prefetchQuery({
    queryKey: adminKeys.analytics(params),
    queryFn: () => getAnalytics(params),
  });

  return (
    <>
      <PageHeader
        title={
          <>
            How the <em>marketplace</em> is doing
          </>
        }
        description="Money, jobs, people and disputes over any period, compared with the one before. Present it, or take it with you."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AnalyticsView />
      </HydrationBoundary>
    </>
  );
}
