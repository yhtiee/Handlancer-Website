import type { NextRequest } from 'next/server';

import { adminJson } from '@/lib/admin/api';
import { listJobs } from '@/lib/admin/data/jobs';
import { parseFilters } from '@/lib/admin/query/keys';

export function GET(request: NextRequest) {
  return adminJson(() => listJobs(parseFilters(request.nextUrl.searchParams)));
}
