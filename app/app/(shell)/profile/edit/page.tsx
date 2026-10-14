import type { Metadata } from 'next';

import { SERVICE_OPTIONS } from '@/lib/app/service-options';

import { EditProfileForm } from './form';

export const metadata: Metadata = { title: 'Edit profile' };

export default function EditProfilePage() {
  return <EditProfileForm services={SERVICE_OPTIONS} />;
}
