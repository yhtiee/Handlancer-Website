import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';

import { UsersView } from '@/app/admin/(console)/users/view';
import { PageHeader } from '@/components/admin/ui';
import { listUsers } from '@/lib/admin/data/users';
import { makeQueryClient } from '@/lib/admin/query/client';
import { adminKeys, parseFilters } from '@/lib/admin/query/keys';

export const metadata: Metadata = { title: 'Users' };

/** Prefetches the list for the URL's filters; UsersView takes over on the client. */
export default async function UsersPage({ searchParams }: PageProps<'/admin/users'>) {
  const filters = parseFilters(await searchParams);
  const queryClient = makeQueryClient();
  void queryClient.prefetchQuery({
    queryKey: adminKeys.users.list(filters),
    queryFn: () => listUsers(filters),
  });

  return (
    <>
      <PageHeader title="Users" description="Clients and providers registered in the app." />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <UsersView />
      </HydrationBoundary>
    </>
  );
}
