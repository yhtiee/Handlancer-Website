import { adminJson } from '@/lib/admin/api';
import { getOverview } from '@/lib/admin/data/overview';

export function GET() {
  return adminJson(getOverview);
}
