import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';

import { ArtisansView } from '@/app/admin/(console)/artisans/view';
import { PageHeader } from '@/components/admin/ui';
import { listArtisans } from '@/lib/admin/data/artisans';
import { makeQueryClient } from '@/lib/admin/query/client';
import { adminKeys, parseFilters } from '@/lib/admin/query/keys';

export const metadata: Metadata = { title: 'Artisans' };

/** The review queue. Prefetches the URL's tab; ArtisansView takes over on the client. */
export default async function ArtisansPage({ searchParams }: PageProps<'/admin/artisans'>) {
  const filters = parseFilters(await searchParams);
  const queryClient = makeQueryClient();
  void queryClient.prefetchQuery({
    queryKey: adminKeys.artisans.list(filters),
    queryFn: () => listArtisans(filters),
  });

  return (
    <>
      <PageHeader
        title="Artisans"
        description="Applications to review. Approving makes an artisan discoverable and lets them quote; oldest first."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ArtisansView />
      </HydrationBoundary>
    </>
  );
}
