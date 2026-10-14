import type { NextRequest } from 'next/server';

import { adminJson } from '@/lib/admin/api';
import { getArtisan } from '@/lib/admin/data/artisans';

export async function GET(_request: NextRequest, ctx: RouteContext<'/admin/api/artisans/[id]'>) {
  const { id } = await ctx.params;
  return adminJson(() => getArtisan(id));
}
