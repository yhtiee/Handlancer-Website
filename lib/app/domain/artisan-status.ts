import type { Profile, ProviderStatus } from '@/lib/app/services/database.types';

/**
 * Where an artisan's application stands, for every screen that has to say so.
 * Approval is reviewed by a person in the admin console (supabase/artisan_review.sql);
 * until then the artisan can build their profile and browse work, but is not
 * discoverable and cannot quote.
 */

export function providerStatus(profile: Profile | null | undefined): ProviderStatus | null {
  if (profile?.role !== 'provider') return null;
  // Every provider row has a status since migration 0023 (the guard trigger sets
  // 'draft' on insert). A missing one is never approval: treat it as a draft.
  return profile.provider_status ?? 'draft';
}

/** The application is a required step: drafts and sent-back applications go straight to it. */
export function mustApply(profile: Profile | null | undefined): boolean {
  const s = providerStatus(profile);
  return s === 'draft' || s === 'rejected';
}

export function canQuote(profile: Profile | null | undefined): boolean {
  return providerStatus(profile) === 'approved';
}

export type StatusCopy = { title: string; body: string; action?: string; tone: 'info' | 'warn' | 'bad' };

export function statusCopy(profile: Profile | null | undefined): StatusCopy | null {
  switch (providerStatus(profile)) {
    case 'draft':
      return {
        title: 'Finish your application to start quoting',
        body: 'Customers can’t find you and you can’t send quotes until your profile is reviewed.',
        action: 'Continue application',
        tone: 'info',
      };
    case 'pending':
      return {
        title: 'Your application is being reviewed',
        body: 'You can look around and polish your profile meanwhile. We’ll notify you here — and may call you — when it’s done.',
        tone: 'info',
      };
    case 'rejected':
      return {
        title: 'Your application needs changes',
        body: profile?.provider_review_note?.trim() || 'Update your profile and send it again.',
        action: 'Update application',
        tone: 'warn',
      };
    case 'suspended':
      return {
        title: 'Your artisan account is suspended',
        body: profile?.provider_review_note?.trim() || 'Contact support to find out why and what happens next.',
        tone: 'bad',
      };
    default:
      return null;
  }
}
