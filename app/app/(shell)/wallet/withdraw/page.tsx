import type { Metadata } from 'next';

import { WithdrawForm } from './form';

export const metadata: Metadata = { title: 'Withdraw' };

export default function WithdrawPage() {
  return <WithdrawForm />;
}
