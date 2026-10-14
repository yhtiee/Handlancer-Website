import type { Metadata } from 'next';

import { BankForm } from './form';

export const metadata: Metadata = { title: 'Bank account' };

export default function BankPage() {
  return <BankForm />;
}
