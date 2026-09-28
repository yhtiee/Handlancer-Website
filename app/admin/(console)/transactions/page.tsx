import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';

import { TransactionsView } from '@/app/admin/(console)/transactions/view';
import { PageHeader } from '@/components/admin/ui';
import { listTransactions } from '@/lib/admin/data/transactions';
import { makeQueryClient } from '@/lib/admin/query/client';
import { adminKeys, parseFilters } from '@/lib/admin/query/keys';

export const metadata: Metadata = { title: 'Transactions' };

/** Prefetches the list for the URL's filters; TransactionsView takes over on the client. */
export default async function TransactionsPage({ searchParams }: PageProps<'/admin/transactions'>) {
  const filters = parseFilters(await searchParams);
  const queryClient = makeQueryClient();
  void queryClient.prefetchQuery({
    queryKey: adminKeys.transactions.list(filters),
    queryFn: () => listTransactions(filters),
  });

  return (
    <>
      <PageHeader title="Transactions" description="The wallet ledger across every account, newest first." />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TransactionsView />
      </HydrationBoundary>
    </>
  );
}
