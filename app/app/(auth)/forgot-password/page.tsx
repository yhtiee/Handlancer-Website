import type { Metadata } from 'next';

import { AuthFrame } from '@/components/app/auth-frame';

import { ForgotPasswordForm } from './form';

export const metadata: Metadata = { title: 'Reset your password' };

export default function ForgotPasswordPage() {
  return (
    <AuthFrame>
      <ForgotPasswordForm />
    </AuthFrame>
  );
}
