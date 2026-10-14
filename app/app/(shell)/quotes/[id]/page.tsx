import type { Metadata } from 'next';

import { QuoteDetailView } from './quote-detail-view';

export const metadata: Metadata = { title: 'Your quote' };

export default function QuoteDetailPage() {
  return <QuoteDetailView />;
}
