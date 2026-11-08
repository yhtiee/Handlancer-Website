-- HandLancer — product emails.
-- Run once, on the SAME project as the mobile app, after the send-email Edge
-- Function is deployed. Safe to re-run. See supabase/EMAIL_SETUP.md.
--
-- Mirrors push delivery (mobile migration 0016): Postgres posts each event to
-- an Edge Function through pg_net, after commit. The URL and shared secret live
-- in Vault as email_hook_url and email_hook_secret, and until both are set
-- every trigger here quietly does nothing.
--
-- A delivery problem must never roll back the thing that caused it — a payment,
-- a hire, a sign-up — so every path swallows its own errors.

-- ─────────────── Delivery log ───────────────
-- No policies: RLS on, service role only. Deliberately holds no email address,
-- so account deletion leaves nothing personal behind here.

create table if not exists public.email_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,
  event       text not null,
  dedupe_key  text,
  status      text not null check (status in ('sent', 'failed', 'skipped')),
  provider_id text,
  detail      text,
  created_at  timestamptz not null default now()
);
alter table public.email_log enable row level security;
create index if not exists email_log_throttle_idx on public.email_log (event, dedupe_key, created_at desc);

-- ─────────────── Preferences ───────────────
-- Only for email people can reasonably do without. Account, money, dispute and
-- application emails are not optional. No row means everything is on.

create table if not exists public.email_preferences (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  job_alerts boolean not null default true,
  messages   boolean not null default true,
  activity   boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.email_preferences enable row level security;

drop policy if exists "email preferences: own row" on public.email_preferences;
create policy "email preferences: own row" on public.email_preferences
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─────────────── Dispatch ───────────────

create or replace function public.dispatch_email(
  p_event   text,
  p_user_id uuid,
  p_email   text default null,
  p_data    jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_secret text;
  v_url    text;
begin
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'email_hook_secret' limit 1;
  select decrypted_secret into v_url    from vault.decrypted_secrets where name = 'email_hook_url' limit 1;
  if v_secret is null or v_url is null then return; end if;

  perform net.http_post(
    url     := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-email-secret', v_secret),
    body    := jsonb_build_object('event', p_event, 'user_id', p_user_id, 'email', p_email, 'data', coalesce(p_data, '{}'::jsonb)),
    timeout_milliseconds := 10000
  );
exception when others then
  raise warning 'dispatch_email(%) failed: %', p_event, sqlerrm;
end;
$$;

-- Only the triggers below may send mail.
revoke all on function public.dispatch_email(text, uuid, text, jsonb) from public, anon, authenticated;

-- ─────────────── Every in-app notification ───────────────
-- quote_received, hired, message, review, escrow_release, payout,
-- materials_requested, completion_requested, dispute_opened, dispute_resolved,
-- artisan_approved, artisan_changes_requested, artisan_suspended.
-- send-email ignores any type it has no template for.

create or replace function public.email_on_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.dispatch_email(new.type, new.user_id, null, coalesce(new.payload, '{}'::jsonb));
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists on_notification_email on public.notifications;
create trigger on_notification_email
  after insert on public.notifications
  for each row execute function public.email_on_notification();

-- ─────────────── Account lifecycle ───────────────

create or replace function public.email_on_profile()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare
  v_email text;
begin
  if tg_op = 'INSERT' then
    perform public.dispatch_email('welcome', new.id, null, jsonb_build_object('role', new.role));
    return new;
  end if;

  if new.provider_status = 'pending' and old.provider_status is distinct from 'pending' then
    perform public.dispatch_email('artisan_application_received', new.id);
    perform public.dispatch_email('admin_artisan_submitted', null, null, jsonb_build_object(
      'artisan_id', new.id, 'name', new.name, 'location', new.location,
      'resubmitted', old.provider_status = 'rejected'));
  end if;

  -- delete_my_account deletes the login right after this update, so the
  -- address has to travel with the event: it will be gone when it arrives.
  if new.deleted_at is not null and old.deleted_at is null then
    select email into v_email from auth.users where id = new.id;
    if v_email is not null then
      perform public.dispatch_email('account_deleted', null, v_email);
    end if;
  end if;

  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists on_profile_email on public.profiles;
create trigger on_profile_email
  after insert or update of provider_status, deleted_at on public.profiles
  for each row execute function public.email_on_profile();

-- ─────────────── Waitlist ───────────────

create or replace function public.email_on_waitlist()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.dispatch_email('waitlist_joined', null, new.email, jsonb_build_object('role', new.role));
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists on_waitlist_email on public.waitlist;
create trigger on_waitlist_email
  after insert on public.waitlist
  for each row execute function public.email_on_waitlist();

-- ─────────────── Money ───────────────
-- escrow_release and payout already arrive as notifications, so aren't here.

create or replace function public.email_on_transaction()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner   uuid;
  v_changed boolean := tg_op = 'INSERT' or new.status is distinct from old.status;
  v_event   text;
begin
  if not v_changed then return new; end if;

  v_event := case
    when new.type = 'fund'        and new.status = 'success' then 'wallet_funded'
    when new.type = 'escrow_hold' and new.status = 'success' then 'escrow_funded'
    when new.type = 'withdraw'    and new.status = 'pending' then 'withdrawal_requested'
    when new.type = 'withdraw'    and new.status = 'success' then 'withdrawal_paid'
    when new.type = 'withdraw'    and new.status = 'failed'  then 'withdrawal_failed'
  end;
  if v_event is null then return new; end if;

  select owner_id into v_owner from public.wallets where id = new.wallet_id;
  if v_owner is not null then
    perform public.dispatch_email(v_event, v_owner, null,
      jsonb_build_object('amount', new.amount, 'job_id', new.job_id, 'reference', new.reference));
  end if;
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists on_transaction_email on public.transactions;
create trigger on_transaction_email
  after insert or update of status on public.transactions
  for each row execute function public.email_on_transaction();

-- ─────────────── Quotes and invitations ───────────────
-- Neither event has an in-app notification to ride on.

create or replace function public.email_on_quote()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'rejected' and old.status is distinct from 'rejected' then
    perform public.dispatch_email('quote_not_selected', new.provider_id, null, jsonb_build_object('job_id', new.job_id));
  end if;
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists on_quote_email on public.quotes;
create trigger on_quote_email
  after update of status on public.quotes
  for each row execute function public.email_on_quote();

create or replace function public.email_on_direct_job()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_direct and new.hired_provider_id is not null and new.status = 'hiring'
     and (tg_op = 'INSERT' or old.status is distinct from 'hiring') then
    perform public.dispatch_email('job_invited', new.hired_provider_id, null,
      jsonb_build_object('job_id', new.id, 'title', new.title));
  end if;
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists on_direct_job_email on public.jobs;
create trigger on_direct_job_email
  after insert or update of status on public.jobs
  for each row execute function public.email_on_direct_job();

-- ─────────────── Wallet security ───────────────
-- Never carries the PIN, its hash or the full account number.

create or replace function public.email_on_wallet_security()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_old_pin  text    := case when tg_op = 'UPDATE' then old.transfer_pin_hash end;
  v_old_acct text    := case when tg_op = 'UPDATE' then old.account_number end;
  v_old_lock timestamptz := case when tg_op = 'UPDATE' then old.pin_locked_until end;
begin
  if new.transfer_pin_hash is not null and new.transfer_pin_hash is distinct from v_old_pin then
    perform public.dispatch_email('pin_changed', new.user_id, null, jsonb_build_object('first', v_old_pin is null));
  end if;

  if new.account_number is not null and new.account_number is distinct from v_old_acct then
    perform public.dispatch_email('bank_changed', new.user_id, null,
      jsonb_build_object('bank_name', new.bank_name, 'last4', right(new.account_number, 4)));
  end if;

  if new.pin_locked_until > now() and new.pin_locked_until is distinct from v_old_lock then
    perform public.dispatch_email('pin_locked', new.user_id);
  end if;

  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists on_wallet_security_email on public.wallet_security;
create trigger on_wallet_security_email
  after insert or update on public.wallet_security
  for each row execute function public.email_on_wallet_security();

-- ─────────────── Disputes ───────────────
-- The provider's side arrives as a dispute_opened notification, without the
-- allegation. The reporter gets a receipt; support gets the reporter's words.

create or replace function public.email_on_dispute()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_title text;
begin
  select title into v_title from public.jobs where id = new.job_id;
  perform public.dispatch_email('dispute_received', new.opened_by, null,
    jsonb_build_object('job_id', new.job_id, 'title', v_title, 'reference', new.reference));
  perform public.dispatch_email('admin_dispute_opened', null, null,
    jsonb_build_object('job_id', new.job_id, 'dispute_id', new.id, 'title', v_title,
      'reference', new.reference, 'category', new.category, 'reason', new.reason));
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists on_dispute_email on public.disputes;
create trigger on_dispute_email
  after insert on public.disputes
  for each row execute function public.email_on_dispute();
