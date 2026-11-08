// Deliver a product event as an email through Resend.
//
// Secrets: RESEND_API_KEY, EMAIL_HOOK_SECRET, plus the platform's SUPABASE_URL
// and SUPABASE_SERVICE_ROLE_KEY.
//
// Called by Postgres through pg_net (public.dispatch_email, in
// supabase/email_delivery.sql), the same way send-push is. Postgres has no user
// JWT, so verify_jwt is off (deploy with --no-verify-jwt) and the shared
// x-email-secret header authenticates the caller.
//
// Every outcome is answered with 200-range or a logged error and nothing
// retries: an email is best-effort, the in-app notification is the record.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { timingSafeEqual } from 'node:crypto';

import { render } from '../_shared/email/render.ts';
import { BATCH_SIZE, sendBatch, sendEmail } from '../_shared/email/resend.ts';
import { productEmail, SITE_URL } from '../_shared/email/templates.ts';

const SUPPORT_INBOX = 'support@handlancer.com';
/** One chat email per conversation in this window, however many messages land. */
const MESSAGE_QUIET_MINUTES = 30;
/** The waitlist form is public: a ceiling on how much mail it can cause per hour. */
const WAITLIST_HOURLY_CAP = 100;
/** At most one job alert per artisan in this window, however many jobs are posted. */
const JOB_ALERT_QUIET_MINUTES = 60;

/** Emails people can turn off in Settings, and the switch that controls each. */
const OPTIONAL: Record<string, 'messages' | 'activity'> = {
  message: 'messages',
  quote_received: 'activity',
  quote_not_selected: 'activity',
  review: 'activity',
};

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

type Row = {
  user_id: string | null;
  event: string;
  dedupe_key: string | null;
  status: 'sent' | 'failed' | 'skipped';
  provider_id?: string;
  detail?: string;
};

/** The log holds no address: delete_my_account must leave nothing personal behind. */
async function record(row: Row) {
  console.log(`[email] ${row.status} ${row.event}`, row.detail ?? '');
  const { error } = await admin.from('email_log').insert(row);
  if (error) console.error('[email] log failed', error.message);
}

function authorized(req: Request): boolean {
  const expected = Deno.env.get('EMAIL_HOOK_SECRET');
  const given = req.headers.get('x-email-secret');
  if (!expected || !given) return false;
  const a = new TextEncoder().encode(expected);
  const b = new TextEncoder().encode(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function sentSince(event: string, minutes: number, dedupeKey?: string): Promise<number> {
  let query = admin
    .from('email_log')
    .select('id', { count: 'exact', head: true })
    .eq('event', event)
    .eq('status', 'sent')
    .gte('created_at', new Date(Date.now() - minutes * 60_000).toISOString());
  if (dedupeKey) query = query.eq('dedupe_key', dedupeKey);
  const { count } = await query;
  return count ?? 0;
}

/**
 * The address comes from Auth, never from profiles.email: that column is
 * written by the client, so trusting it would let someone point another
 * person's wallet and dispute emails at an address of their choosing.
 */
async function confirmedAddress(userId: string): Promise<string | null> {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user?.email || !data.user.email_confirmed_at) return null;
  return data.user.email;
}

/** Tell every matching artisan about a newly posted job. */
async function sendJobAlerts(jobId: string): Promise<Response> {
  const event = 'job_alert';
  const finish = (status: number, detail: string) => {
    console.log(`[email] ${event} ${detail}`);
    return new Response(detail, { status });
  };
  if (Deno.env.get('JOB_ALERTS_ENABLED') !== 'true') return finish(200, 'job alerts are off');

  const { data: job } = await admin.from('jobs').select('title, location, budget').eq('id', jobId).maybeSingle();
  if (!job) return finish(200, 'job not found');

  const { data: matches, error } = await admin.rpc('job_alert_recipients', { p_job_id: jobId });
  if (error) return finish(500, `recipients failed: ${error.message}`);
  if (!matches?.length) return finish(200, 'no matching artisans');

  const { data: recent } = await admin
    .from('email_log')
    .select('user_id')
    .eq('event', event)
    .eq('status', 'sent')
    .gte('created_at', new Date(Date.now() - JOB_ALERT_QUIET_MINUTES * 60_000).toISOString())
    .in('user_id', matches.map((m: { user_id: string }) => m.user_id));
  const quiet = new Set((recent ?? []).map((r) => r.user_id));
  const due = (matches as { user_id: string; email: string }[]).filter((m) => !quiet.has(m.user_id));
  if (!due.length) return finish(200, 'all matches in quiet window');

  const content = productEmail({ event, appUrl: SITE_URL, data: { ...job, job_id: jobId } })!;
  const rendered = render(content, SITE_URL);

  for (let i = 0; i < due.length; i += BATCH_SIZE) {
    const chunk = due.slice(i, i + BATCH_SIZE);
    const sent = await sendBatch(chunk.map((m) => m.email), rendered, event);
    const { error: logError } = await admin.from('email_log').insert(
      chunk.map((m) => ({
        user_id: m.user_id,
        event,
        dedupe_key: jobId,
        status: sent.ok ? 'sent' : 'failed',
        detail: sent.ok ? null : `${sent.status}: ${sent.detail}`,
      })),
    );
    if (logError) console.error('[email] log failed', logError.message);
  }
  return finish(200, `sent to ${due.length}`);
}

type WaitlistRecipient = { id: string; email: string };

/**
 * One invitation per person, in Resend-sized batches. The database has already
 * marked everyone invited; a batch Resend refuses is unmarked, so it goes back
 * into the count and the next click retries it.
 */
async function sendWaitlistInvites(role: string, recipients: WaitlistRecipient[]) {
  const event = 'waitlist_invite';
  const rendered = render(productEmail({ event, appUrl: SITE_URL, data: { role } })!, SITE_URL);

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const chunk = recipients.slice(i, i + BATCH_SIZE);
    const sent = await sendBatch(chunk.map((r) => r.email), rendered, event);
    if (!sent.ok) {
      const { error } = await admin.from('waitlist').update({ invited_at: null }).in('id', chunk.map((r) => r.id));
      if (error) console.error('[email] could not unmark waitlist batch', error.message);
    }
    await record({
      user_id: null,
      event,
      dedupe_key: role,
      status: sent.ok ? 'sent' : 'failed',
      detail: sent.ok ? `${chunk.length} sent` : `${chunk.length} not sent, ${sent.status}: ${sent.detail}`,
    });
    if (i + BATCH_SIZE < recipients.length) await new Promise((r) => setTimeout(r, 600));
  }
}

/** No row means every optional email is on. */
async function optedOut(event: string, userId: string | null): Promise<boolean> {
  const column = OPTIONAL[event];
  if (!column || !userId) return false;
  const { data } = await admin.from('email_preferences').select(column).eq('user_id', userId).maybeSingle();
  return (data as Record<string, boolean> | null)?.[column] === false;
}

Deno.serve(async (req) => {
  if (!authorized(req)) return new Response('unauthorized', { status: 401 });

  let body: { event?: string; user_id?: string | null; email?: string | null; data?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return new Response('bad payload', { status: 400 });
  }

  const event = String(body.event ?? '');
  const userId = body.user_id ?? null;
  const data = { ...(body.data ?? {}) };
  if (!event) return new Response('bad payload', { status: 400 });

  try {
    if (event === 'job_posted') return await sendJobAlerts(String(data.job_id ?? ''));
    if (event === 'waitlist_invite_batch') {
      // Answered straight away: pg_net gives up after 10s, and a long list takes longer.
      EdgeRuntime.waitUntil(sendWaitlistInvites(String(data.role), (data.recipients ?? []) as WaitlistRecipient[]));
      return new Response('accepted', { status: 202 });
    }

    const dedupeKey = event === 'message' ? String(data.conversation_id ?? '') + ':' + String(userId) : null;
    const skip = async (detail: string) => {
      await record({ user_id: userId, event, dedupe_key: dedupeKey, status: 'skipped', detail });
      return new Response('skipped', { status: 200 });
    };

    if (await optedOut(event, userId)) return skip('opted out');

    if (event === 'message' && (await sentSince(event, MESSAGE_QUIET_MINUTES, dedupeKey!)) > 0) {
      return skip('quiet window');
    }
    if (event === 'waitlist_joined' && (await sentSince(event, 60)) >= WAITLIST_HOURLY_CAP) {
      return skip('hourly cap');
    }

    // Some triggers only know the job's id.
    if (data.job_id && !data.title) {
      const { data: job } = await admin.from('jobs').select('title').eq('id', data.job_id).maybeSingle();
      if (job?.title) data.title = job.title;
    }

    let name: string | undefined;
    if (userId) {
      const { data: profile } = await admin.from('profiles').select('name').eq('id', userId).maybeSingle();
      name = profile?.name ?? undefined;
    }

    const content = productEmail({ event, appUrl: SITE_URL, name, data });
    if (!content) return skip('no template');

    const to = event.startsWith('admin_') ? SUPPORT_INBOX : (body.email ?? (userId ? await confirmedAddress(userId) : null));
    if (!to) return skip('no confirmed address');

    const sent = await sendEmail(to, render(content, SITE_URL), event);
    if (!sent.ok) {
      await record({ user_id: userId, event, dedupe_key: dedupeKey, status: 'failed', detail: `${sent.status}: ${sent.detail}` });
      return new Response('send failed', { status: 502 });
    }
    await record({ user_id: userId, event, dedupe_key: dedupeKey, status: 'sent', provider_id: sent.id });
    return new Response('sent', { status: 200 });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    await record({ user_id: userId, event, dedupe_key: null, status: 'failed', detail });
    return new Response('error', { status: 500 });
  }
});
