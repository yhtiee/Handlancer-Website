import type { Metadata } from 'next';

import { ReviewForm } from './form';

export const metadata: Metadata = { title: 'Check the work' };

export default function ReviewPage() {
  return <ReviewForm />;
}
