'use server';

import {
  insertWaitlistRow,
  toRow,
  validate,
  type WaitlistFields,
  type WaitlistRole,
  type WaitlistState,
} from '@/lib/waitlist';

/*
 * Waitlist submission.
 *
 * Runs server-side so the Supabase key never reaches the browser, and posts
 * straight to PostgREST — a single insert does not justify pulling
 * @supabase/supabase-js into the bundle.
 *
 * Uses the ANON key on purpose, not the service role: RLS then still applies,
 * so even if the key leaks it can only do what the waitlist insert policy
 * allows. See supabase/waitlist.sql.
 */

const URL_ENV = process.env.SUPABASE_URL;
const KEY_ENV = process.env.SUPABASE_ANON_KEY;

function field(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v : '';
}

export async function joinWaitlist(
  _prev: WaitlistState,
  form: FormData,
): Promise<WaitlistState> {
  // Honeypot: a real person never fills this, bots fill everything.
  if (field(form, 'company').trim()) {
    return { status: 'success', message: 'You are on the list.' };
  }

  const roleRaw = field(form, 'role');
  const role: WaitlistRole = roleRaw === 'provider' ? 'provider' : 'user';

  const fields: WaitlistFields = {
    role,
    name: field(form, 'name'),
    email: field(form, 'email'),
    phone: field(form, 'phone'),
    city: field(form, 'city'),
    category: field(form, 'category'),
    years: field(form, 'years'),
    referral: field(form, 'referral'),
  };

  // Echoed back on failure so nothing typed is lost when validation rejects.
  const values: Partial<WaitlistFields> = { ...fields };

  const errors = validate(fields);
  if (Object.keys(errors).length) {
    return { status: 'error', errors, values, message: 'Check the highlighted fields.' };
  }

  if (!URL_ENV || !KEY_ENV) {
    console.error('[waitlist] SUPABASE_URL / SUPABASE_ANON_KEY are not set');
    return {
      status: 'error',
      values,
      message: 'The waitlist is not connected yet. Please try again shortly.',
    };
  }

  const result = await insertWaitlistRow(URL_ENV, KEY_ENV, toRow(fields));

  if (result.kind === 'ok') {
    return {
      status: 'success',
      message:
        role === 'provider'
          ? 'You are on the artisan list. We will reach out before launch in your area.'
          : 'You are on the list. We will email you the moment HandLancer opens in your city.',
    };
  }

  if (result.kind === 'duplicate') {
    return { status: 'success', message: 'You are already on the list — we have you.' };
  }

  console.error('[waitlist] insert failed:', result.detail);
  return { status: 'error', values, message: 'Something went wrong saving that. Please try again.' };
}
