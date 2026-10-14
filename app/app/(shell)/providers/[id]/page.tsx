import type { Metadata } from 'next';

import { ProviderView } from './provider-view';

export const metadata: Metadata = { title: 'Artisan' };

export default function ProviderPage() {
  return <ProviderView />;
}
