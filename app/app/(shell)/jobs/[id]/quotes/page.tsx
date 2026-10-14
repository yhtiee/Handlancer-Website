import type { Metadata } from 'next';

import { QuotesView } from './quotes-view';

export const metadata: Metadata = { title: 'Compare quotes' };

export default function QuotesPage() {
  return <QuotesView />;
}
