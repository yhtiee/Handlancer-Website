import type { NextRequest } from 'next/server';

import { adminJson } from '@/lib/admin/api';
import { listTransactions } from '@/lib/admin/data/transactions';
import { parseFilters } from '@/lib/admin/query/keys';

export function GET(request: NextRequest) {
  return adminJson(() => listTransactions(parseFilters(request.nextUrl.searchParams)));
}
