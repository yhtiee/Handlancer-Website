import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthFrame } from '@/components/app/auth-frame';

import { VerifyEmailForm } from './form';

export const metadata: Metadata = { title: 'Confirm your email' };

export default function VerifyEmailPage() {
  return (
    <AuthFrame>
      {/* useSearchParams (?email, ?role) needs a Suspense boundary to prerender. */}
      <Suspense>
        <VerifyEmailForm />
      </Suspense>
    </AuthFrame>
  );
}
