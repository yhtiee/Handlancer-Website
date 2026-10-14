import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PostJobForm } from './form';

export const metadata: Metadata = { title: 'Post a job' };

export default function PostJobPage() {
  return (
    <Suspense>
      <PostJobForm />
    </Suspense>
  );
}
