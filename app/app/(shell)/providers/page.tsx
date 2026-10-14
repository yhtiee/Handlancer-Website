import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ProvidersView } from './providers-view';

export const metadata: Metadata = { title: 'Artisans' };

export default function ProvidersPage() {
  return (
    <Suspense>
      <ProvidersView />
    </Suspense>
  );
}
