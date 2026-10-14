import type { Metadata } from 'next';

import { FindWorkView } from './find-work-view';

export const metadata: Metadata = { title: 'Find work' };

export default function FindWorkPage() {
  return <FindWorkView />;
}
