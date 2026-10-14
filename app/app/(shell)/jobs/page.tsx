import type { Metadata } from 'next';
import { Suspense } from 'react';

import { JobsView } from './jobs-view';

export const metadata: Metadata = { title: 'My jobs' };

export default function JobsPage() {
  return (
    <Suspense>
      <JobsView />
    </Suspense>
  );
}
