/**
 * Waitlist shape + validation, shared by the client form and the server action.
 * Validation runs on the server regardless of what the browser did — the client
 * copy exists only to show errors next to the field before a round trip.
 */

import { CATEGORIES } from '@/lib/site';

export type WaitlistRole = 'user' | 'provider';

export type WaitlistFields = {
  role: WaitlistRole;
  name: string;
  email: string;
  phone: string;
  city: string;
  category: string;
  years: string;
  referral: string;
};

export type WaitlistState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  /** Keyed by field name so the form can render errors inline. */
  errors?: Partial<Record<keyof WaitlistFields, string>>;
  /** Echoed back so a failed submit does not wipe what was typed. */
  values?: Partial<WaitlistFields>;
};

export const EMPTY_STATE: WaitlistState = { status: 'idle' };

const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));

/* Deliberately permissive: one `@`, a dot in the domain, no leading/trailing
   dots. Anything stricter rejects real addresses for no benefit. */
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
/* Nigerian numbers arrive as 0803…, +234 803…, 0803-123-4567 or (0803) 1234567.
   Check the shape, then count actual digits — a character-range check alone
   rejects the parenthesised form, which people really do type. 15 is the E.164
   maximum. */
const PHONE_SHAPE = /^[+(\d][\d\s()+-]*$/;

function phoneLooksValid(raw: string): boolean {
  if (!PHONE_SHAPE.test(raw)) return false;
  const digits = raw.replace(/\D/g, '').length;
  return digits >= 7 && digits <= 15;
}

export function validate(f: WaitlistFields): Partial<Record<keyof WaitlistFields, string>> {
  const e: Partial<Record<keyof WaitlistFields, string>> = {};

  const name = f.name.trim();
  if (name.length < 2) e.name = 'Tell us what to call you.';
  else if (name.length > 80) e.name = 'That name is too long.';

  const email = f.email.trim();
  if (!email) e.email = 'We need an email to let you in.';
  else if (email.length > 160 || !EMAIL.test(email)) e.email = 'That does not look like an email address.';

  const phone = f.phone.trim();
  if (phone && !phoneLooksValid(phone)) e.phone = 'That does not look like a phone number.';

  const city = f.city.trim();
  if (!city) e.city = 'Which city should we launch in for you?';
  else if (city.length > 80) e.city = 'That is too long.';

  if (!f.category) {
    e.category = f.role === 'provider' ? 'Pick your main trade.' : 'Pick what you need help with.';
  } else if (!CATEGORY_IDS.has(f.category)) {
    e.category = 'Pick one from the list.';
  }

  if (f.role === 'provider' && f.years.trim()) {
    const n = Number(f.years);
    if (!Number.isInteger(n) || n < 0 || n > 60) e.years = 'Enter a number between 0 and 60.';
  }

  return e;
}

export type SubmitResult =
  | { kind: 'ok' }
  | { kind: 'duplicate' }
  | { kind: 'failed'; detail: string };

/**
 * Inserts one row via PostgREST. Kept here rather than inline in the action so
 * it can be exercised against a mock server; a single insert does not justify
 * pulling @supabase/supabase-js into the build.
 */
export async function insertWaitlistRow(
  baseUrl: string,
  anonKey: string,
  row: ReturnType<typeof toRow>,
): Promise<SubmitResult> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl.replace(/\/$/, '')}/rest/v1/waitlist`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
      cache: 'no-store',
    });
  } catch (err) {
    return { kind: 'failed', detail: `network: ${String(err)}` };
  }

  if (res.ok) return { kind: 'ok' };

  const body = await res.text().catch(() => '');
  // 23505 = unique_violation on (lower(email), role) — already signed up.
  if (res.status === 409 || body.includes('23505')) return { kind: 'duplicate' };

  return { kind: 'failed', detail: `${res.status} ${body.slice(0, 300)}` };
}

/** Maps the validated form onto the `waitlist` table's columns. */
export function toRow(f: WaitlistFields) {
  const years = f.role === 'provider' && f.years.trim() ? Number(f.years) : null;
  return {
    role: f.role,
    name: f.name.trim(),
    email: f.email.trim().toLowerCase(),
    phone: f.phone.trim() || null,
    city: f.city.trim(),
    category: f.category,
    years_experience: years,
    referral: f.referral.trim() || null,
  };
}
