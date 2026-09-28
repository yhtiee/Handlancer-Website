import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { UserView } from '@/app/admin/(console)/users/[id]/view';
import { getUser } from '@/lib/admin/data/users';
import { makeQueryClient } from '@/lib/admin/query/client';
import { adminKeys, isUuidShape } from '@/lib/admin/query/keys';

export const metadata: Metadata = { title: 'User' };

/**
 * Streams the record rather than awaiting it, so opening it never blocks on
 * the database; UserView shows cached data at once if it has any. A
 * malformed id is a 404 here; an unknown one is handled in the view.
 */
export default async function UserPage({ params }: PageProps<'/admin/users/[id]'>) {
  const { id } = await params;
  if (!isUuidShape(id)) notFound();

  const queryClient = makeQueryClient();
  void queryClient.prefetchQuery({
    queryKey: adminKeys.users.detail(id),
    queryFn: () => getUser(id),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserView id={id} />
    </HydrationBoundary>
  );
}
