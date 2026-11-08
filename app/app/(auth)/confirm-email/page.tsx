import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthFrame } from '@/components/app/auth-frame';

import { ConfirmEmail } from './form';

export const metadata: Metadata = { title: 'Confirm your email' };

export default function ConfirmEmailPage() {
  return (
    <AuthFrame>
      {/* useSearchParams (?token_hash, ?type, ?next) needs a Suspense boundary to prerender. */}
      <Suspense>
        <ConfirmEmail />
      </Suspense>
    </AuthFrame>
  );
}
