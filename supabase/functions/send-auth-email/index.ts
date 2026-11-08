// Supabase Auth's Send Email hook: every sign-up code, password reset and
// security notice goes through here, rendered in HandLancer's templates and
// sent by Resend instead of Supabase's default mailer.
//
// Secrets: RESEND_API_KEY, SEND_EMAIL_HOOK_SECRET (the "v1,whsec_..." value
// configured on the hook).
//
// verify_jwt is off (deploy with --no-verify-jwt): Auth signs the request with
// the Standard Webhooks scheme instead, and that signature is checked below.

import { Webhook } from 'npm:standardwebhooks@1.0.0';

import { render } from '../_shared/email/render.ts';
import { sendEmail } from '../_shared/email/resend.ts';
import { authEmail, SITE_URL, type AuthAction } from '../_shared/email/templates.ts';

/** Origins a link in an email may point at. Anything else gets production. */
const LINK_ORIGINS = new Set([SITE_URL, 'https://handlancer.com', 'http://localhost:3000']);

type HookPayload = {
  user: { email: string; new_email?: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    token_new?: string;
    token_hash_new?: string;
  };
};

function fail(status: number, message: string) {
  console.error(`[auth-email] ${message}`);
  return Response.json({ error: { http_code: status, message } }, { status });
}

/** Split the redirect the app asked for into an allowed origin and a same-app path. */
function destination(redirectTo: string): { appUrl: string; next?: string } {
  try {
    const url = new URL(redirectTo);
    const appUrl = LINK_ORIGINS.has(url.origin) ? url.origin : SITE_URL;
    const path = url.pathname + url.search;
    return { appUrl, next: path.startsWith('/app/') && !path.startsWith('//') ? path : undefined };
  } catch {
    return { appUrl: SITE_URL };
  }
}

const SUPPORTED = new Set<string>([
  'signup',
  'recovery',
  'invite',
  'magiclink',
  'email_change',
  'reauthentication',
  'password_changed_notification',
  'email_changed_notification',
]);

async function deliver(to: string, input: Parameters<typeof authEmail>[0]) {
  const email = render(authEmail(input), input.appUrl);
  const sent = await sendEmail(to, email, `auth_${input.action}`);
  if (!sent.ok) throw new Error(`Resend ${sent.status}: ${sent.detail}`);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return fail(405, 'Method not allowed');

  const secret = Deno.env.get('SEND_EMAIL_HOOK_SECRET');
  if (!secret) return fail(500, 'SEND_EMAIL_HOOK_SECRET is not set');

  const raw = await req.text();
  let payload: HookPayload;
  try {
    payload = new Webhook(secret.replace(/^v1,whsec_/, '')).verify(raw, Object.fromEntries(req.headers)) as HookPayload;
  } catch {
    return fail(401, 'Invalid signature');
  }

  const { user, email_data: data } = payload;
  const action = data.email_action_type;
  if (!SUPPORTED.has(action)) return fail(400, `Unsupported email action: ${action}`);

  const { appUrl, next } = destination(data.redirect_to);
  const base = { appUrl, next, newEmail: user.new_email };

  try {
    if (action === 'email_change' && data.token_hash_new) {
      // Secure email change: both addresses must approve. Auth pairs the hashes
      // the opposite way round from what the field names suggest.
      await Promise.all([
        deliver(user.email, { ...base, action: 'email_change_current', token: data.token, tokenHash: data.token_hash_new }),
        deliver(user.new_email ?? user.email, { ...base, action: 'email_change_new', token: data.token_new, tokenHash: data.token_hash }),
      ]);
    } else {
      const to = action === 'email_change' ? (user.new_email ?? user.email) : user.email;
      await deliver(to, { ...base, action: action as AuthAction, token: data.token, tokenHash: data.token_hash });
    }
  } catch (e) {
    // A non-2xx surfaces to the person as "couldn't send", which is the truth.
    return fail(502, e instanceof Error ? e.message : String(e));
  }

  return Response.json({});
});
