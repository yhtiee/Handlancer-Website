import type { NextRequest } from 'next/server';

import { adminJson } from '@/lib/admin/api';
import { listWaitlist } from '@/lib/admin/data/waitlist';
import { parseFilters } from '@/lib/admin/query/keys';

export function GET(request: NextRequest) {
  return adminJson(() => listWaitlist(parseFilters(request.nextUrl.searchParams)));
}
