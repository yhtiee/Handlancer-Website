import type { Rendered } from './render.ts';

const FROM = 'HandLancer <notifications@handlancer.com>';
const REPLY_TO = 'support@handlancer.com';

export type SendResult = { ok: true; id: string } | { ok: false; status: number; detail: string };

/** Resend's limit for one batch request. */
export const BATCH_SIZE = 100;

function message(to: string, email: Rendered, tag: string) {
  return {
    from: FROM,
    to: [to],
    reply_to: REPLY_TO,
    subject: email.subject,
    html: email.html,
    text: email.text,
    tags: [{ name: 'event', value: tag.replace(/[^a-zA-Z0-9_-]/g, '_') }],
  };
}

async function post(path: string, payload: unknown): Promise<SendResult & { body?: unknown }> {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return { ok: false, status: 500, detail: 'RESEND_API_KEY is not set' };

  try {
    const res = await fetch(`https://api.resend.com${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, status: res.status, detail: String(body?.message ?? 'Resend rejected the email') };
    return { ok: true, id: String(body?.id ?? ''), body };
  } catch (e) {
    return { ok: false, status: 502, detail: e instanceof Error ? e.message : String(e) };
  }
}

/** Send one email through Resend. Never throws; the caller decides what a failure means. */
export function sendEmail(to: string, email: Rendered, tag: string): Promise<SendResult> {
  return post('/emails', message(to, email, tag));
}

/** Send up to BATCH_SIZE copies, each addressed to one person. */
export function sendBatch(recipients: string[], email: Rendered, tag: string): Promise<SendResult> {
  return post('/emails/batch', recipients.map((to) => message(to, email, tag)));
}
