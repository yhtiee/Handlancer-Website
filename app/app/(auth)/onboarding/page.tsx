import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthFrame } from '@/components/app/auth-frame';

import { RoleForm } from './form';

export const metadata: Metadata = { title: 'Get started' };

export default function OnboardingPage() {
  return (
    <AuthFrame>
      <Suspense>
        <RoleForm />
      </Suspense>
    </AuthFrame>
  );
}
