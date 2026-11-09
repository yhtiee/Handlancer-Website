import type { Metadata } from 'next';

import { ForgotPinForm } from './form';

export const metadata: Metadata = { title: 'Reset transfer PIN' };

export default function ForgotPinPage() {
  return <ForgotPinForm />;
}
