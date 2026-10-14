import type { Metadata } from 'next';

import { DisputeView } from './dispute-view';

export const metadata: Metadata = { title: 'Report a problem' };

export default function DisputePage() {
  return <DisputeView />;
}
