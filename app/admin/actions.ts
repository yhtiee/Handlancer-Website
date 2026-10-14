'use server';

import { findAdmin, requireAdmin } from '@/lib/admin/auth';
import { getDispute } from '@/lib/admin/data/disputes';
import { serviceClient, sessionClient } from '@/lib/admin/supabase';

/*
 * The console's mutations. Each is the `mutationFn` of a TanStack useMutation
 * hook (lib/admin/query/hooks.ts), which owns navigation and cache
 * invalidation — so these return a result instead of redirecting or calling
 * revalidatePath.
 *
 * Failures come back as `{ error }` rather than a throw: Next replaces thrown
 * messages with a generic one in production, and these messages are meant for
 * the admin to read.
 *
 * Every action re-checks the admin itself. Proxy coverage is an optimisation,
 * not a guarantee: Server Actions are POSTs to whatever route renders them.
 */

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

// ─────────────────────────── Session ───────────────────────────

export async function signIn(input: {
  email: string;
  password: string;
  next?: string;
}): Promise<ActionResult<{ next: string }>> {
  const email = input.email?.trim() ?? '';
  const password = input.password ?? '';
  if (!email || !password) return { ok: false, error: 'Enter your email and password.' };

  // One message for every failure, so the form cannot be used to probe which
  // emails have accounts.
  const denied = { ok: false as const, error: 'That email and password do not match an admin account.' };

  const supabase = await sessionClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return denied;

  // A valid HandLancer app account is not enough — it must be on admin_users.
  if (!(await findAdmin(data.user.id))) {
    await supabase.auth.signOut();
    return denied;
  }

  const next = input.next ?? '';
  const safeNext = next.startsWith('/admin') && !next.startsWith('/admin/login') && !next.startsWith('/admin/api')
    ? next
    : '/admin';
  return { ok: true, next: safeNext };
}

export async function signOut(): Promise<ActionResult> {
  const supabase = await sessionClient();
  await supabase.auth.signOut();
  return { ok: true };
}

// ─────────────────────────── Disputes ───────────────────────────

export type ResolveInput = {
  disputeId: string;
  outcome: 'refund' | 'release' | 'split';
  /** Provider's share, only for `split`. */
  releaseAmount?: number;
  note: string;
};

/**
 * Settles a live dispute through admin_resolve_dispute (0009) — the only path
 * that moves money out of a disputed job. `outcome` picks how the held balance
 * is split; the function itself re-validates the amount inside the same
 * transaction that moves it.
 */
export async function resolveDispute(input: ResolveInput): Promise<ActionResult> {
  const admin = await requireAdmin();
  const note = input.note?.trim() ?? '';

  const detail = await getDispute(input.disputeId);
  if (!detail) return { ok: false, error: 'This dispute no longer exists.' };
  if (!detail.isLive) return { ok: false, error: 'This dispute has already been settled.' };
  if (note.length < 10) return { ok: false, error: 'Add a note (10+ characters) explaining the decision.' };

  let release: number;
  if (input.outcome === 'refund') release = 0;
  else if (input.outcome === 'release') release = detail.held;
  else if (input.outcome === 'split') {
    release = Number(input.releaseAmount);
    if (!Number.isFinite(release) || release <= 0 || release >= detail.held) {
      return {
        ok: false,
        error: `A split pays the provider more than ₦0 and less than the ₦${detail.held.toLocaleString('en-NG')} held.`,
      };
    }
  } else {
    return { ok: false, error: 'Choose how to settle the escrow.' };
  }

  // disputes has no resolved_by column; signing the note keeps an audit trail
  // without a schema change. The note is not shown in the mobile app.
  const signed = `${note}\n— ${admin.email}`;

  const { error } = await serviceClient().rpc('admin_resolve_dispute', {
    p_job_id: detail.dispute.job_id,
    p_release_amount: release,
    p_note: signed,
  });
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

// ─────────────────────────── Artisan review ───────────────────────────

export type ArtisanDecision = 'approve' | 'request_changes' | 'suspend';

export type ReviewArtisanInput = {
  artisanId: string;
  decision: ArtisanDecision;
  /** Shown to the artisan. Required to request changes or suspend. */
  note?: string;
};

const DECISIONS: Record<ArtisanDecision, { status: 'approved' | 'rejected' | 'suspended'; notification: string; from: string[] }> = {
  // Approving a suspended artisan reinstates them; a pending one is the normal case.
  approve: { status: 'approved', notification: 'artisan_approved', from: ['pending', 'rejected', 'suspended'] },
  request_changes: { status: 'rejected', notification: 'artisan_changes_requested', from: ['pending'] },
  suspend: { status: 'suspended', notification: 'artisan_suspended', from: ['approved'] },
};

/**
 * Approve an artisan (they become discoverable and can quote), send their
 * application back with a note, or suspend an approved one. The service role
 * is the only writer the guard trigger in supabase/artisan_review.sql lets
 * change provider_status this way; the artisan is notified in the app (and by
 * push, through the notifications pipeline).
 */
export async function reviewArtisan(input: ReviewArtisanInput): Promise<ActionResult<{ status: string }>> {
  const admin = await requireAdmin();
  const rule = DECISIONS[input.decision];
  if (!rule) return { ok: false, error: 'Choose a decision.' };

  const note = input.note?.trim() ?? '';
  if (input.decision !== 'approve' && note.length < 10) {
    return { ok: false, error: 'Tell the artisan why, in a sentence they can act on (10+ characters).' };
  }

  const db = serviceClient();
  const { data: current, error: readError } = await db
    .from('profiles')
    .select('id, role, provider_status')
    .eq('id', input.artisanId)
    .maybeSingle();
  if (readError) return { ok: false, error: readError.message };
  if (!current || current.role !== 'provider') return { ok: false, error: 'This artisan no longer exists.' };
  if (!rule.from.includes(current.provider_status ?? '')) {
    return { ok: false, error: `This application is ${current.provider_status ?? 'not submitted'} — reload to see its latest state.` };
  }

  const { error } = await db
    .from('profiles')
    .update({
      provider_status: rule.status,
      provider_reviewed_at: new Date().toISOString(),
      provider_reviewed_by: admin.userId,
      provider_review_note: input.decision === 'approve' ? null : note,
    })
    .eq('id', input.artisanId)
    // Only if nobody else decided first.
    .eq('provider_status', current.provider_status!);
  if (error) return { ok: false, error: error.message };

  // Best effort: the decision stands even if the notification fails.
  await db
    .from('notifications')
    .insert({ user_id: input.artisanId, type: rule.notification, payload: input.decision === 'approve' ? {} : { note } })
    .then(({ error: e }) => e && console.error('[admin] artisan notification failed:', e.message));

  return { ok: true, status: rule.status };
}
