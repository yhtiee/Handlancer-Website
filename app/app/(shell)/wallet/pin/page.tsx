import type { Metadata } from 'next';

import { PinForm } from './form';

export const metadata: Metadata = { title: 'Transfer PIN' };

export default function PinPage() {
  return <PinForm />;
}
