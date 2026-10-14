import type { Metadata } from 'next';

import { FundForm } from './form';

export const metadata: Metadata = { title: 'Add money' };

export default function FundPage() {
  return <FundForm />;
}
