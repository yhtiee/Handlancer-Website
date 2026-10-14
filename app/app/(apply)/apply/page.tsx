import type { Metadata } from 'next';

import { SERVICE_OPTIONS } from '@/lib/app/service-options';

import { ApplyFlow } from './apply-flow';

export const metadata: Metadata = { title: 'Your artisan application' };

export default function ApplyPage() {
  return <ApplyFlow services={SERVICE_OPTIONS} />;
}
