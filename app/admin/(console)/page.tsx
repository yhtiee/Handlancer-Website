import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';

import { OverviewView } from '@/app/admin/(console)/overview-view';
import { PageHeader } from '@/components/admin/ui';
import { getOverview } from '@/lib/admin/data/overview';
import { makeQueryClient } from '@/lib/admin/query/client';
import { adminKeys } from '@/lib/admin/query/keys';

export const metadata: Metadata = { title: 'Overview' };

/** Prefetches the overview; OverviewView keeps it fresh on the client. */
export default async function OverviewPage() {
  const queryClient = makeQueryClient();
  void queryClient.prefetchQuery({ queryKey: adminKeys.overview(), queryFn: getOverview });

  const today = new Intl.DateTimeFormat('en-NG', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  return (
    <>
      <PageHeader
        title={
          <>
            Where the <em>money</em> is
          </>
        }
        description={`What HandLancer is holding, and what needs a person, as of ${today}.`}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <OverviewView />
      </HydrationBoundary>
    </>
  );
}
