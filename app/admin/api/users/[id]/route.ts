import type { NextRequest } from 'next/server';

import { adminJson } from '@/lib/admin/api';
import { getUser } from '@/lib/admin/data/users';

export async function GET(_request: NextRequest, ctx: RouteContext<'/admin/api/users/[id]'>) {
  const { id } = await ctx.params;
  return adminJson(() => getUser(id));
}
