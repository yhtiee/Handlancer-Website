import type { Metadata } from 'next';

import { QuotesListView } from './quotes-list-view';

export const metadata: Metadata = { title: 'Your quotes' };

export default function QuotesListPage() {
  return <QuotesListView />;
}
