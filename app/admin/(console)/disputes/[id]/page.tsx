import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DisputeView } from '@/app/admin/(console)/disputes/[id]/view';
import { getDispute } from '@/lib/admin/data/disputes';
import { makeQueryClient } from '@/lib/admin/query/client';
import { adminKeys, isUuidShape } from '@/lib/admin/query/keys';

export const metadata: Metadata = { title: 'Dispute' };

/**
 * Streams the record rather than awaiting it, so opening it never blocks on
 * the database; DisputeView shows cached data at once if it has any. A
 * malformed id is a 404 here; an unknown one is handled in the view.
 */
export default async function DisputePage({ params }: PageProps<'/admin/disputes/[id]'>) {
  const { id } = await params;
  if (!isUuidShape(id)) notFound();

  const queryClient = makeQueryClient();
  void queryClient.prefetchQuery({
    queryKey: adminKeys.disputes.detail(id),
    queryFn: () => getDispute(id),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DisputeView id={id} />
    </HydrationBoundary>
  );
}
