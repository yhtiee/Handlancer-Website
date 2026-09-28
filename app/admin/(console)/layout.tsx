import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { AdminShell } from '@/components/admin/shell';
import { requireAdmin } from '@/lib/admin/auth';
import { getBadges } from '@/lib/admin/data/overview';
import { makeQueryClient } from '@/lib/admin/query/client';
import { adminKeys } from '@/lib/admin/query/keys';

/**
 * The authenticated console. `requireAdmin()` here guards the shell, but each
 * page's data call re-checks it too: layouts do not re-render on client
 * navigation, so they are never the only gate.
 *
 * The sidebar's badge count is prefetched so it paints with the shell; after
 * that the shell's useBadges() keeps it current.
 */
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  const queryClient = makeQueryClient();
  void queryClient.prefetchQuery({ queryKey: adminKeys.badges(), queryFn: getBadges });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminShell admin={{ email: admin.email, role: admin.role }}>{children}</AdminShell>
    </HydrationBoundary>
  );
}
