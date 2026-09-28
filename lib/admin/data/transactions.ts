import 'server-only';

import { requireAdmin } from '@/lib/admin/auth';
import { pageRange, paged, profilesById, searchTerm, type ListParams } from '@/lib/admin/data/shared';
import { serviceClient } from '@/lib/admin/supabase';
import type { TxnStatus, TxnType } from '@/lib/admin/types';

export const TXN_TYPES: TxnType[] = ['fund', 'withdraw', 'escrow_hold', 'escrow_release', 'payout'];
export const TXN_STATUSES: TxnStatus[] = ['pending', 'success', 'failed'];

export type TransactionListParams = ListParams & { type?: string };

export async function listTransactions({ page, q, status, type }: TransactionListParams) {
  await requireAdmin();
  const db = serviceClient();
  const range = pageRange(page);

  let query = db
    .from('transactions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(range.from, range.to);

  if (status && TXN_STATUSES.includes(status as TxnStatus)) query = query.eq('status', status as TxnStatus);
  if (type && TXN_TYPES.includes(type as TxnType)) query = query.eq('type', type as TxnType);

  const term = searchTerm(q);
  if (term) query = query.ilike('reference', `%${term}%`);

  const { data, count, error } = await query;
  if (error) throw error;

  // transaction → wallet → owner, resolved in two hops.
  const walletIds = [...new Set((data ?? []).map((t) => t.wallet_id))];
  const { data: wallets } = walletIds.length
    ? await db.from('wallets').select('id, owner_id').in('id', walletIds)
    : { data: [] as { id: string; owner_id: string }[] };
  const ownerByWallet = new Map((wallets ?? []).map((w) => [w.id, w.owner_id]));
  const people = await profilesById([...ownerByWallet.values()]);

  const rows = (data ?? []).map((t) => {
    const ownerId = ownerByWallet.get(t.wallet_id);
    return { ...t, owner: ownerId ? (people.get(ownerId) ?? null) : null };
  });
  return paged(rows, count, range.page);
}
