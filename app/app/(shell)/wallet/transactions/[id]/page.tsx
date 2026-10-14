import type { Metadata } from 'next';

import { TransactionView } from './transaction-view';

export const metadata: Metadata = { title: 'Transaction' };

export default function TransactionPage() {
  return <TransactionView />;
}
