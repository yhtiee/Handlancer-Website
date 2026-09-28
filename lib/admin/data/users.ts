import 'server-only';

import { requireAdmin } from '@/lib/admin/auth';
import { isUuid, pageRange, paged, searchTerm, type ListParams } from '@/lib/admin/data/shared';
import { serviceClient } from '@/lib/admin/supabase';

export type UserListParams = ListParams & { role?: string };

export async function listUsers({ page, q, role }: UserListParams) {
  await requireAdmin();
  const range = pageRange(page);

  let query = serviceClient()
    .from('profiles')
    .select('id, role, name, email, phone, location, is_verified, rating, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(range.from, range.to);

  if (role === 'user' || role === 'provider') query = query.eq('role', role);

  const term = searchTerm(q);
  if (term) {
    query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,business_name.ilike.%${term}%`);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return paged(data, count, range.page);
}

export async function getUser(id: string) {
  await requireAdmin();
  if (!isUuid(id)) return null;
  const db = serviceClient();

  const { data: profile, error } = await db.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!profile) return null;

  const [wallet, security, jobs] = await Promise.all([
    db.from('wallets').select('*').eq('owner_id', id).maybeSingle(),
    // The full account number and PIN hash are deliberately not selected.
    db
      .from('wallet_security')
      .select('bank_name, account_name, bank_verified_at, pin_set_at, pin_locked_until')
      .eq('user_id', id)
      .maybeSingle(),
    db
      .from('jobs')
      .select('id, title, status, budget, created_at')
      .or(`owner_id.eq.${id},hired_provider_id.eq.${id}`)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const transactions = wallet.data
    ? await db
        .from('transactions')
        .select('*')
        .eq('wallet_id', wallet.data.id)
        .order('created_at', { ascending: false })
        .limit(10)
    : { data: [] };

  return {
    profile,
    wallet: wallet.data,
    security: security.data,
    jobs: jobs.data ?? [],
    transactions: transactions.data ?? [],
  };
}
