import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthFrame } from '@/components/app/auth-frame';

import { SignInForm } from './form';

export const metadata: Metadata = { title: 'Sign in' };

export default function SignInPage() {
  return (
    <AuthFrame>
      {/* useSearchParams (?next, ?role) needs a Suspense boundary to prerender. */}
      <Suspense>
        <SignInForm />
      </Suspense>
    </AuthFrame>
  );
}
