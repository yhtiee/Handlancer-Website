import type { NextRequest } from 'next/server';

import { parseRangeParams } from '@/lib/admin/analytics/range';
import { adminJson } from '@/lib/admin/api';
import { getAnalytics } from '@/lib/admin/data/analytics';

export function GET(request: NextRequest) {
  return adminJson(() => getAnalytics(parseRangeParams(request.nextUrl.searchParams)));
}
