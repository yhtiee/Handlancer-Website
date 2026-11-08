// Ported from Handlancer-Mobile-Application/src/services/auth.ts @ 8968d5c — keep the diff minimal so later syncs stay easy.
import type { Profile, UserRole } from '@/lib/app/services/database.types';
import { supabase } from '@/lib/app/services/supabase';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Create a new account. With email confirmation on there is no session yet;
 * `next` is the same-app path the link in the confirmation email lands on.
 */
export async function signUpWithEmail(email: string, password: string, next?: string) {
  const { data, error } = await supabase.auth.signUp({
    email: normalizeEmail(email),
    password,
    options: next ? { emailRedirectTo: `${window.location.origin}${next}` } : undefined,
  });
  if (error) throw error;
  return data;
}

export async function resendConfirmation(email: string, next?: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: normalizeEmail(email),
    options: next ? { emailRedirectTo: `${window.location.origin}${next}` } : undefined,
  });
  if (error) throw error;
}

/** Confirm a sign-up with the code from the email, signing the person in. */
export async function verifyEmailCode(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({ email: normalizeEmail(email), token, type: 'signup' });
  if (error) throw error;
  return data;
}

export const EMAIL_LINK_TYPES = ['signup', 'invite', 'magiclink', 'email_change'] as const;
export type EmailLinkType = (typeof EMAIL_LINK_TYPES)[number];

/** Spend the token from a link in an email, signing the person in. */
export async function verifyEmailLink(tokenHash: string, type: EmailLinkType | 'recovery') {
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) throw error;
  return data;
}

/** Answers the same whether or not the address has an account. */
export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
    redirectTo: `${window.location.origin}/app/reset-password`,
  });
  if (error) throw error;
}

export async function setNewPassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });
  if (error) throw error;
  return data;
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

/** Create the profile row for a freshly-signed-up user with their chosen role. */
export async function createProfile(input: {
  id: string;
  role: UserRole;
  name: string;
  email?: string | null;
  phone?: string | null;
}) {
  const { error } = await supabase.from('profiles').insert({
    id: input.id,
    role: input.role,
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
  });
  if (error) throw error;
}
