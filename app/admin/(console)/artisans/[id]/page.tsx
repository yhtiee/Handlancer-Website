import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ArtisanView } from '@/app/admin/(console)/artisans/[id]/view';
import { getArtisan } from '@/lib/admin/data/artisans';
import { makeQueryClient } from '@/lib/admin/query/client';
import { adminKeys, isUuidShape } from '@/lib/admin/query/keys';

export const metadata: Metadata = { title: 'Artisan application' };

export default async function ArtisanPage({ params }: PageProps<'/admin/artisans/[id]'>) {
  const { id } = await params;
  if (!isUuidShape(id)) notFound();

  const queryClient = makeQueryClient();
  void queryClient.prefetchQuery({
    queryKey: adminKeys.artisans.detail(id),
    queryFn: () => getArtisan(id),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ArtisanView id={id} />
    </HydrationBoundary>
  );
}
