import { adminJson } from '@/lib/admin/api';
import { getBadges } from '@/lib/admin/data/overview';

export function GET() {
  return adminJson(getBadges);
}
