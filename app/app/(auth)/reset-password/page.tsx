import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthFrame } from '@/components/app/auth-frame';

import { ResetPasswordForm } from './form';

export const metadata: Metadata = { title: 'Choose a new password' };

export default function ResetPasswordPage() {
  return (
    <AuthFrame>
      {/* useSearchParams (?token_hash) needs a Suspense boundary to prerender. */}
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthFrame>
  );
}
