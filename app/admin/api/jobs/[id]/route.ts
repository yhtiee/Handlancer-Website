import type { NextRequest } from 'next/server';

import { adminJson } from '@/lib/admin/api';
import { getJob } from '@/lib/admin/data/jobs';

export async function GET(_request: NextRequest, ctx: RouteContext<'/admin/api/jobs/[id]'>) {
  const { id } = await ctx.params;
  return adminJson(() => getJob(id));
}
