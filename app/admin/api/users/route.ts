import type { NextRequest } from 'next/server';

import { adminJson } from '@/lib/admin/api';
import { listUsers } from '@/lib/admin/data/users';
import { parseFilters } from '@/lib/admin/query/keys';

export function GET(request: NextRequest) {
  return adminJson(() => listUsers(parseFilters(request.nextUrl.searchParams)));
}
