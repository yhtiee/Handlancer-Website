import type { NextRequest } from 'next/server';

import { adminJson } from '@/lib/admin/api';
import { listDisputes } from '@/lib/admin/data/disputes';
import { parseFilters } from '@/lib/admin/query/keys';

export function GET(request: NextRequest) {
  return adminJson(() => listDisputes(parseFilters(request.nextUrl.searchParams)));
}
