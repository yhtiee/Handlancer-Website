-- HandLancer — forgotten transfer PIN, and PIN refusals that say why.
-- Run once, on the SAME project as the mobile app, AFTER pin_lockout.sql and
-- AFTER redeploying send-email (it needs the pin_reset_code template).
-- Safe to re-run.
--
-- The PIN is what stands between a signed-in session and the wallet, so a reset
-- cannot be weaker than the PIN it replaces. It takes three things: the session,
-- a code sent to the account's confirmed email, and the account password. The
-- password is what stops someone holding an unlocked phone, where the email app
-- is usually signed in too.
--
-- As in pin_lockout.sql, a refused attempt RETURNS rather than raises, so the
-- attempt counter commits. The client still gets an HTTP 400 with a message.
--
-- The pin_changed email and its "wasn't you?" warning need nothing here: the
-- trigger on wallet_security fires when the hash changes.

begin;

-- ─────────────── The rules ───────────────
-- lib/app/domain/pin-rules.ts shows these on the page. Keep the wording in step.

create or replace function public.pin_rule_problem(p_pin text)
returns text
language plpgsql
immutable
set search_path = public
as $$
begin
  if p_pin is null or p_pin !~ '^[0-9]{4}$' then
    return 'Your PIN must be exactly 4 digits.';
  end if;
  if p_pin ~ '^(.)\1{3}$' then
    return 'Your PIN can’t be one digit repeated, like 1111.';
  end if;
  if p_pin in ('0123', '1234', '2345', '3456', '4567', '5678', '6789',
               '9876', '8765', '7654', '6543', '5432', '4321', '3210') then
    return 'Your PIN can’t be digits in order, like 1234 or 4321.';
  end if;
  return null;
end;
$$;

revoke all on function public.pin_rule_problem(text) from public, anon, authenticated;

-- ─────────────── Change PIN ───────────────
-- As in pin_lockout.sql; only the rule check differs.

create or replace function public.set_transfer_pin(p_pin text, p_current_pin text default null)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row     wallet_security%rowtype;
  v_problem text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;

  v_problem := pin_rule_problem(p_pin);
  if v_problem is not null then raise exception '%', v_problem; end if;

  select * into v_row from wallet_security where user_id = auth.uid() for update;

  -- Changing an existing PIN requires proving you know the old one, under the
  -- same attempt limit as spending with it.
  if v_row.transfer_pin_hash is not null and not check_transfer_pin(p_current_pin) then
    return pin_refused('Current PIN is incorrect');
  end if;

  insert into wallet_security (user_id, transfer_pin_hash, pin_set_at,
                               pin_failed_attempts, pin_locked_until)
    values (auth.uid(), crypt(p_pin, gen_salt('bf')), now(), 0, null)
  on conflict (user_id) do update
    set transfer_pin_hash   = excluded.transfer_pin_hash,
        pin_set_at          = now(),
        pin_failed_attempts = 0,
        pin_locked_until    = null,
        updated_at          = now();
  return null;
end;
$$;

revoke all on function public.set_transfer_pin(text, text) from public, anon;
grant execute on function public.set_transfer_pin(text, text) to authenticated, service_role;

-- ─────────────── Reset codes ───────────────
-- RLS on, no policies: only the functions below touch it. One row per person;
-- asking for a new code replaces the old one.

create table if not exists public.wallet_pin_resets (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  code_hash        text,
  expires_at       timestamptz,
  failed_attempts  int not null default 0,
  last_sent_at     timestamptz,
  sends_in_window  int not null default 0,
  window_started_at timestamptz
);
alter table public.wallet_pin_resets enable row level security;
revoke all on table public.wallet_pin_resets from public, anon, authenticated;

-- ─────────────── Ask for a code ───────────────

create or replace function public.request_pin_reset()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid   uuid := auth.uid();
  v_row   wallet_pin_resets%rowtype;
  v_sends int;
  v_code  text;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;

  if not exists (select 1 from wallet_security where user_id = v_uid and transfer_pin_hash is not null) then
    raise exception 'You have not set a transfer PIN yet.';
  end if;
  -- send-email only writes to confirmed addresses, so this would never arrive.
  if not exists (select 1 from auth.users where id = v_uid and email_confirmed_at is not null) then
    raise exception 'Confirm your email address before resetting your PIN.';
  end if;

  select * into v_row from wallet_pin_resets where user_id = v_uid for update;

  if v_row.last_sent_at > now() - interval '60 seconds' then
    raise exception 'Please wait a minute before asking for another code.';
  end if;

  v_sends := case when v_row.window_started_at > now() - interval '24 hours'
                  then v_row.sends_in_window else 0 end;
  if v_sends >= 5 then
    raise exception 'Too many codes requested today. Try again tomorrow, or contact support.';
  end if;

  v_code := lpad((('x' || encode(gen_random_bytes(4), 'hex'))::bit(32)::bigint % 1000000)::text, 6, '0');

  insert into wallet_pin_resets (user_id, code_hash, expires_at, failed_attempts,
                                 last_sent_at, sends_in_window, window_started_at)
    values (v_uid, crypt(v_code, gen_salt('bf')), now() + interval '15 minutes', 0, now(), 1, now())
  on conflict (user_id) do update
    set code_hash         = excluded.code_hash,
        expires_at        = excluded.expires_at,
        failed_attempts   = 0,
        last_sent_at      = now(),
        sends_in_window   = v_sends + 1,
        window_started_at = case when v_sends = 0 then now() else wallet_pin_resets.window_started_at end;

  perform dispatch_email('pin_reset_code', v_uid, null, jsonb_build_object('code', v_code));
end;
$$;

revoke all on function public.request_pin_reset() from public, anon;
grant execute on function public.request_pin_reset() to authenticated, service_role;

-- ─────────────── Use the code ───────────────

create or replace function public.reset_transfer_pin(p_code text, p_password text, p_pin text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid      uuid := auth.uid();
  v_reset    wallet_pin_resets%rowtype;
  v_password text;
  v_problem  text;
  v_attempts int;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;

  -- Before the code is looked at, so a PIN that breaks the rules costs no attempt.
  v_problem := pin_rule_problem(p_pin);
  if v_problem is not null then raise exception '%', v_problem; end if;

  select * into v_reset from wallet_pin_resets where user_id = v_uid for update;

  if v_reset.code_hash is null or v_reset.expires_at <= now() then
    return pin_refused('That code has expired. Send yourself a new one.');
  end if;

  select encrypted_password into v_password from auth.users where id = v_uid;

  -- coalesce, not IS DISTINCT FROM: crypt(x, NULL) is NULL, and an account with
  -- no password hash must never count as a match. One message for both, so this
  -- can't be used to test a guessed password or code on its own.
  if not (coalesce(v_reset.code_hash = crypt(p_code, v_reset.code_hash), false)
          and coalesce(v_password = crypt(p_password, v_password), false)) then
    v_attempts := v_reset.failed_attempts + 1;
    update wallet_pin_resets
       set failed_attempts = v_attempts,
           code_hash = case when v_attempts >= 5 then null else code_hash end
     where user_id = v_uid;
    return pin_refused(case when v_attempts >= 5
                            then 'Too many wrong tries, so that code has stopped working. Send yourself a new one.'
                            else 'That code or password is incorrect.' end);
  end if;

  update wallet_security
     set transfer_pin_hash   = crypt(p_pin, gen_salt('bf')),
         pin_set_at          = now(),
         pin_failed_attempts = 0,
         pin_locked_until    = null,
         updated_at          = now()
   where user_id = v_uid;

  update wallet_pin_resets
     set code_hash = null, expires_at = null, failed_attempts = 0
   where user_id = v_uid;
  return null;
end;
$$;

revoke all on function public.reset_transfer_pin(text, text, text) from public, anon;
grant execute on function public.reset_transfer_pin(text, text, text) to authenticated, service_role;

commit;
