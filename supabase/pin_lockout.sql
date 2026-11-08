-- HandLancer — make the transfer PIN limits real.
-- Run once, on the SAME project as the mobile app. Safe to re-run.
--
-- Three holes, one cause each:
--
--   1. The lockout never happened. A wrong PIN updated the attempt counter and
--      then raised an exception, and the exception rolled the update back, so
--      every guess started again from zero.
--   2. A null PIN passed. crypt(NULL, ...) is NULL, `hash <> NULL` is NULL, and
--      IF NULL skips the branch, so a direct API call with p_pin = null moved
--      money with no PIN at all.
--   3. Changing the PIN counted nothing, so the current PIN could be guessed
--      there without limit.
--
-- The fix for (1) has to work inside PostgREST's one-transaction-per-request.
-- A refused PIN no longer raises: the function RETURNS, so the counter commits,
-- and sets response.status so the client still receives an HTTP 400 with
-- { "message": "Incorrect PIN" }. supabase-js surfaces that as `error`, exactly
-- as it did the exception, so app builds already in people's hands keep working.
--
-- Everything that happens before the PIN check only reads, so committing on a
-- refused PIN changes nothing but the counter.
--
-- Return types change from void to json, which Postgres can only do by dropping
-- the function. The transaction keeps that invisible to callers.

begin;

-- ─────────────── The check ───────────────

create or replace function public.check_transfer_pin(p_pin text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_sec      wallet_security%rowtype;
  v_attempts int;
begin
  select * into v_sec from wallet_security where user_id = auth.uid() for update;

  if v_sec.transfer_pin_hash is null then
    raise exception 'Set a transfer PIN before releasing funds'
      using hint = 'Wallet > Settings > Transfer PIN';
  end if;
  if v_sec.pin_locked_until is not null and v_sec.pin_locked_until > now() then
    raise exception 'Too many incorrect PIN attempts. Try again later.';
  end if;

  if p_pin is null or v_sec.transfer_pin_hash is distinct from crypt(p_pin, v_sec.transfer_pin_hash) then
    -- A lock that has run its course starts a fresh count, otherwise the first
    -- slip after waiting out a lockout would lock the wallet again.
    v_attempts := case when v_sec.pin_locked_until is not null then 0
                       else coalesce(v_sec.pin_failed_attempts, 0) end + 1;
    update wallet_security
       set pin_failed_attempts = v_attempts,
           pin_locked_until = case when v_attempts >= 5 then now() + interval '15 minutes' end,
           updated_at = now()
     where user_id = auth.uid();
    return false;
  end if;

  update wallet_security
     set pin_failed_attempts = 0, pin_locked_until = null, updated_at = now()
   where user_id = auth.uid();
  return true;
end;
$$;

revoke all on function public.check_transfer_pin(text) from public, anon, authenticated;

create or replace function public.pin_refused(p_message text default 'Incorrect PIN')
returns json
language plpgsql
set search_path = public
as $$
begin
  perform set_config('response.status', '400', true);
  return json_build_object('message', p_message, 'code', 'PIN_REFUSED');
end;
$$;

revoke all on function public.pin_refused(text) from public, anon, authenticated;

-- ─────────────── Release materials ───────────────

drop function if exists public.release_materials(uuid, text);

create function public.release_materials(p_job_id uuid, p_pin text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_provider uuid;
  v_escrow escrows%rowtype;
  v_pwallet wallets%rowtype;
begin
  select owner_id, hired_provider_id into v_owner, v_provider from jobs where id = p_job_id;
  if v_owner <> auth.uid() then raise exception 'Only the job owner can release funds'; end if;

  perform assert_not_disputed(p_job_id);

  -- Before any state is read for update, so a wrong PIN costs nothing else.
  if not check_transfer_pin(p_pin) then return pin_refused(); end if;

  select * into v_escrow from escrows where job_id = p_job_id for update;
  if v_escrow.id is null or v_escrow.status not in ('funded') then
    raise exception 'Escrow is not funded';
  end if;
  if v_escrow.materials_released then raise exception 'Materials already released'; end if;
  if v_escrow.materials_amount <= 0 then raise exception 'This quote has no materials'; end if;

  select * into v_pwallet from wallets where owner_id = v_provider for update;
  if v_pwallet.id is null then raise exception 'Provider wallet not found'; end if;

  update wallets set balance = balance + v_escrow.materials_amount where id = v_pwallet.id;
  insert into transactions (wallet_id, job_id, type, status, amount)
    values (v_pwallet.id, p_job_id, 'escrow_release', 'success', v_escrow.materials_amount);

  -- No notification insert here: `on_wallet_credit` (0004) already raises the
  -- 'escrow_release' notification off the transaction row above.
  update escrows set materials_released = true, status = 'materials_released' where id = v_escrow.id;
  return null;
end;
$$;

revoke all on function public.release_materials(uuid, text) from public, anon;
grant execute on function public.release_materials(uuid, text) to authenticated, service_role;

-- ─────────────── Review and release ───────────────

drop function if exists public.review_and_release(uuid, int, text, text);

create function public.review_and_release(
  p_job_id  uuid,
  p_rating  int,
  p_comment text,
  p_pin     text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner    uuid;
  v_provider uuid;
begin
  select owner_id, hired_provider_id into v_owner, v_provider from jobs where id = p_job_id;
  if v_owner is null then raise exception 'Job not found'; end if;
  if v_owner <> auth.uid() then raise exception 'Only the job owner can release funds'; end if;
  if v_provider is null then raise exception 'No provider hired on this job'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5';
  end if;

  perform assert_not_disputed(p_job_id);
  if not check_transfer_pin(p_pin) then return pin_refused(); end if;

  insert into reviews (job_id, reviewer_id, provider_id, rating, comment)
    values (p_job_id, v_owner, v_provider, p_rating,
            nullif(btrim(coalesce(p_comment, '')), ''))
  on conflict (job_id, reviewer_id) do update
    set rating = excluded.rating, comment = excluded.comment;

  -- auth.uid() still resolves to the calling user inside SECURITY DEFINER, so the
  -- owner check inside release_workmanship passes exactly as a direct call would.
  perform release_workmanship(p_job_id);
  return null;
end;
$$;

revoke all on function public.review_and_release(uuid, int, text, text) from public, anon;
grant execute on function public.review_and_release(uuid, int, text, text) to authenticated, service_role;

-- ─────────────── Withdraw ───────────────

drop function if exists public.request_withdrawal(numeric, text);

create function public.request_withdrawal(p_amount numeric, p_pin text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_wallet wallets%rowtype;
  v_sec    wallet_security%rowtype;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Enter a valid amount'; end if;

  select * into v_sec from wallet_security where user_id = auth.uid() for update;

  if v_sec.account_number is null or v_sec.bank_code is null then
    raise exception 'Add a bank account before withdrawing';
  end if;
  if v_sec.transfer_pin_hash is null then
    raise exception 'Set a transfer PIN before withdrawing';
  end if;

  if not check_transfer_pin(p_pin) then return pin_refused(); end if;

  select * into v_wallet from wallets where owner_id = auth.uid() for update;
  if v_wallet.id is null then raise exception 'Wallet not found'; end if;
  if v_wallet.balance < p_amount then raise exception 'Insufficient balance'; end if;

  update wallets set balance = balance - p_amount where id = v_wallet.id;
  insert into transactions (wallet_id, type, status, amount)
    values (v_wallet.id, 'withdraw', 'pending', p_amount);
  return null;
end;
$$;

revoke all on function public.request_withdrawal(numeric, text) from public, anon;
grant execute on function public.request_withdrawal(numeric, text) to authenticated, service_role;

-- ─────────────── Change PIN ───────────────

drop function if exists public.set_transfer_pin(text, text);

create function public.set_transfer_pin(p_pin text, p_current_pin text default null)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row wallet_security%rowtype;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if p_pin !~ '^[0-9]{4}$' then raise exception 'PIN must be exactly 4 digits'; end if;
  -- Rejects 1111-style repeats and 1234/4321 runs.
  if p_pin ~ '^(.)\1{3}$' or p_pin in ('1234', '2345', '3456', '4567', '5678', '6789', '0123',
                                       '9876', '8765', '7654', '6543', '5432', '4321', '3210') then
    raise exception 'Choose a less predictable PIN';
  end if;

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

-- Replaced by check_transfer_pin. Gone so nothing can call the version that
-- lets a null PIN through.
drop function if exists public.assert_transfer_pin(text);

commit;
