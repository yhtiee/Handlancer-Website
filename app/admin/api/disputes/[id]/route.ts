import type { NextRequest } from 'next/server';

import { adminJson } from '@/lib/admin/api';
import { getDispute } from '@/lib/admin/data/disputes';

export async function GET(_request: NextRequest, ctx: RouteContext<'/admin/api/disputes/[id]'>) {
  const { id } = await ctx.params;
  return adminJson(() => getDispute(id));
}
