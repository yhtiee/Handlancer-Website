import type { Metadata } from 'next';

import { QuoteForm } from './form';

export const metadata: Metadata = { title: 'Send a quote' };

export default function QuotePage() {
  return <QuoteForm />;
}
