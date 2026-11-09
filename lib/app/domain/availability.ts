import type { Profile } from '@/lib/app/services/database.types';

export const AVAILABILITY: Record<NonNullable<Profile['availability']>, { label: string; dot: string }> = {
  available: { label: 'Available now', dot: 'bg-[var(--ok)]' },
  on_call: { label: 'On call', dot: 'bg-[var(--ok)]' },
  busy: { label: 'Busy this week', dot: 'bg-[var(--warn)]' },
  offline: { label: 'Not taking work', dot: 'bg-[var(--rule-strong)]' },
};
