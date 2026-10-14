import type { NextRequest } from 'next/server';

import { adminJson } from '@/lib/admin/api';
import { listArtisans } from '@/lib/admin/data/artisans';
import { parseFilters } from '@/lib/admin/query/keys';

export function GET(request: NextRequest) {
  return adminJson(() => listArtisans(parseFilters(request.nextUrl.searchParams)));
}
