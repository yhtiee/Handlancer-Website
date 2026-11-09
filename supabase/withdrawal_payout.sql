-- HandLancer — send withdrawals through Flutterwave.
-- Run once, on the SAME project as the mobile app, AFTER email_delivery.sql and
-- withdrawal_settlement.sql, and BEFORE deploying the flutterwave-webhook that
-- calls apply_wallet_topup. Safe to re-run.
--
-- request_withdrawal is untouched: it still checks the PIN, debits the wallet and
-- leaves a pending row. A trigger on that row now posts it to the
-- flutterwave-payout Edge Function, after commit, the same way emails go out. So
-- the website and every installed mobile app get this without a client update.
--
-- Until payout_hook_url and payout_hook_secret are in Vault, and PAYOUTS_ENABLED
-- is 'true' on the function, nothing is sent and withdrawals stay manual.
--
-- The one rule all of this exists to keep: a withdrawal is refunded only when
-- Flutterwave says for certain that the money did not go. A timeout proves
-- nothing, so it waits for a person.

begin;

alter table public.transactions
  add column if not exists payout_state        text,
  add column if not exists payout_fee          numeric,
  add column if not exists payout_amount       numeric,
  add column if not exists payout_transfer_id  text,
  add column if not exists payout_note         text,
  add column if not exists payout_attempted_at timestamptz;

-- null      not attempted (or payouts are off): settle by hand
-- sending   claimed; the call to Flutterwave is in progress
-- submitted Flutterwave accepted it; its webhook will finish the job
-- not_sent  Flutterwave refused it, so no money left: fix the cause and retry
-- unknown   no clear answer: check the Flutterwave dashboard before anything else
alter table public.transactions drop constraint if exists transactions_payout_state_check;
alter table public.transactions
  add constraint transactions_payout_state_check
  check (payout_state in ('sending', 'submitted', 'not_sent', 'unknown'));

-- ─────────────── Crediting a top-up ───────────────
-- The webhook used to read the balance, add to it and write it back. Two
-- deliveries at once could both pass, and the unique reference only stopped the
-- second log row, after the wallet had been credited twice. Here the row goes in
-- first, and only the delivery that inserted it credits the wallet.

create or replace function public.apply_wallet_topup(p_user uuid, p_amount numeric, p_reference text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet uuid;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'Invalid amount'; end if;

  select id into v_wallet from wallets where owner_id = p_user for update;
  if v_wallet is null then return 'no_wallet'; end if;

  begin
    insert into transactions (wallet_id, type, status, amount, reference)
      values (v_wallet, 'fund', 'success', p_amount, p_reference);
  exception when unique_violation then
    return 'duplicate';
  end;

  update wallets set balance = balance + p_amount where id = v_wallet;
  return 'credited';
end;
$$;

revoke all on function public.apply_wallet_topup(uuid, numeric, text) from public, anon, authenticated;
grant execute on function public.apply_wallet_topup(uuid, numeric, text) to service_role;

-- ─────────────── Handing a withdrawal to the function ───────────────

create or replace function public.dispatch_payout(p_txn_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_secret text;
  v_url    text;
begin
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'payout_hook_secret' limit 1;
  select decrypted_secret into v_url    from vault.decrypted_secrets where name = 'payout_hook_url' limit 1;
  if v_secret is null or v_url is null then return; end if;

  perform net.http_post(
    url     := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-payout-secret', v_secret),
    body    := jsonb_build_object('transaction_id', p_txn_id),
    timeout_milliseconds := 30000
  );
exception when others then
  -- The row stays pending and visible in the console. A failed dispatch must not
  -- undo the withdrawal request that caused it.
  raise warning 'dispatch_payout(%) failed: %', p_txn_id, sqlerrm;
end;
$$;

revoke all on function public.dispatch_payout(uuid) from public, anon, authenticated;

create or replace function public.payout_on_withdrawal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type = 'withdraw' and new.status = 'pending' then
    perform public.dispatch_payout(new.id);
  end if;
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists on_withdrawal_payout on public.transactions;
create trigger on_withdrawal_payout
  after insert on public.transactions
  for each row execute function public.payout_on_withdrawal();

-- ─────────────── What the function calls ───────────────

-- Returns the payout to make, or null if it isn't this caller's to make. The row
-- lock and the state change are what stop one withdrawal being sent twice.
create or replace function public.claim_withdrawal_payout(p_txn_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_txn  transactions%rowtype;
  v_bank wallet_security%rowtype;
  v_ref  text := 'hlw_' || p_txn_id::text;
begin
  select * into v_txn from transactions where id = p_txn_id for update;
  if v_txn.id is null or v_txn.type <> 'withdraw' or v_txn.status <> 'pending' or v_txn.payout_state is not null then
    return null;
  end if;

  select s.* into v_bank
    from wallets w join wallet_security s on s.user_id = w.owner_id
   where w.id = v_txn.wallet_id;

  update transactions
     set payout_state = 'sending', payout_attempted_at = now(), reference = v_ref
   where id = p_txn_id;

  return json_build_object(
    'id', p_txn_id,
    'reference', v_ref,
    'amount', v_txn.amount,
    'bank_code', v_bank.bank_code,
    'account_number', v_bank.account_number
  );
end;
$$;

revoke all on function public.claim_withdrawal_payout(uuid) from public, anon, authenticated;
grant execute on function public.claim_withdrawal_payout(uuid) to service_role;

create or replace function public.mark_withdrawal_payout(
  p_txn_id      uuid,
  p_state       text,
  p_fee         numeric default null,
  p_net         numeric default null,
  p_transfer_id text default null,
  p_note        text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amount numeric;
begin
  update transactions
     set payout_state       = p_state,
         payout_fee         = coalesce(p_fee, payout_fee),
         payout_amount      = coalesce(p_net, payout_amount),
         payout_transfer_id = coalesce(p_transfer_id, payout_transfer_id),
         payout_note        = p_note
   where id = p_txn_id and type = 'withdraw' and status = 'pending'
  returning amount into v_amount;

  if v_amount is not null and p_state in ('not_sent', 'unknown') then
    perform public.dispatch_email('admin_payout_problem', null, null,
      jsonb_build_object('amount', v_amount, 'state', p_state, 'note', p_note));
  end if;
end;
$$;

revoke all on function public.mark_withdrawal_payout(uuid, text, numeric, numeric, text, text) from public, anon, authenticated;
grant execute on function public.mark_withdrawal_payout(uuid, text, numeric, numeric, text, text) to service_role;

-- Flutterwave's final word. Only a pending row changes, so a repeated webhook
-- can't refund twice. The whole amount comes back on failure: when a transfer
-- fails Flutterwave returns both the money and its fee.
create or replace function public.complete_withdrawal_payout(
  p_reference   text,
  p_success     boolean,
  p_transfer_id text default null,
  p_note        text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_txn transactions%rowtype;
begin
  select * into v_txn from transactions
   where id = substring(p_reference from 5)::uuid and p_reference like 'hlw\_%' and type = 'withdraw'
   for update;
  if v_txn.id is null or v_txn.status <> 'pending' then return false; end if;

  update transactions
     set status             = case when p_success then 'success'::txn_status else 'failed'::txn_status end,
         payout_state       = 'submitted',
         payout_transfer_id = coalesce(p_transfer_id, payout_transfer_id),
         payout_note        = p_note,
         settled_at         = now()
   where id = v_txn.id;

  if not p_success then
    update wallets set balance = balance + v_txn.amount where id = v_txn.wallet_id;
  end if;
  return true;
end;
$$;

revoke all on function public.complete_withdrawal_payout(text, boolean, text, text) from public, anon, authenticated;
grant execute on function public.complete_withdrawal_payout(text, boolean, text, text) to service_role;

-- ─────────────── The admin console ───────────────

create or replace function public.admin_retry_withdrawal_payout(p_txn_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_txn transactions%rowtype;
begin
  select * into v_txn from transactions where id = p_txn_id for update;
  if v_txn.id is null or v_txn.type <> 'withdraw' or v_txn.status <> 'pending' then
    raise exception 'This withdrawal is no longer waiting to be paid.';
  end if;
  if v_txn.payout_state is distinct from 'not_sent' and v_txn.payout_state is distinct from 'unknown' then
    raise exception 'This withdrawal can’t be sent again right now.';
  end if;

  -- The reference stays the same, so Flutterwave refuses a true duplicate.
  update transactions set payout_state = null, payout_note = null where id = p_txn_id;
  perform public.dispatch_payout(p_txn_id);
end;
$$;

revoke all on function public.admin_retry_withdrawal_payout(uuid) from public, anon, authenticated;
grant execute on function public.admin_retry_withdrawal_payout(uuid) to service_role;

-- The fee an admin is told to allow for when paying from the Flutterwave
-- dashboard. Mirrors transferFee in lib/app/domain/fees.ts.
create or replace function public.estimated_transfer_fee(p_amount numeric)
returns numeric
language sql
immutable
set search_path = public
as $$
  select round((case when p_amount <= 5000 then 10 when p_amount <= 50000 then 25 else 50 end) * 1.075, 2);
$$;

revoke all on function public.estimated_transfer_fee(numeric) from public, anon, authenticated;

-- As in withdrawal_settlement.sql, plus two things. The guard: settling by hand
-- while Flutterwave has it would pay the same person twice, though after an hour
-- a person may step in, in case the webhook never arrived. And a payment made by
-- hand records what was sent, so the customer's email tells them what arrived.
create or replace function public.admin_settle_withdrawal(
  p_txn_id    uuid,
  p_paid      boolean,
  p_admin     uuid,
  p_reference text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_txn transactions%rowtype;
begin
  -- The row lock is what stops two admins refunding the same withdrawal twice.
  select * into v_txn from transactions where id = p_txn_id for update;
  if v_txn.id is null or v_txn.type <> 'withdraw' then
    raise exception 'This withdrawal no longer exists.';
  end if;
  if v_txn.status <> 'pending' then
    raise exception 'This withdrawal has already been settled.';
  end if;
  if v_txn.payout_state in ('sending', 'submitted') and v_txn.payout_attempted_at > now() - interval '1 hour' then
    raise exception 'Flutterwave is processing this withdrawal. Wait for it to finish.';
  end if;

  update transactions
     set status     = case when p_paid then 'success'::txn_status else 'failed'::txn_status end,
         reference  = coalesce(nullif(btrim(coalesce(p_reference, '')), ''), reference),
         payout_fee    = case when p_paid and payout_amount is null then estimated_transfer_fee(v_txn.amount) else payout_fee end,
         payout_amount = case when p_paid and payout_amount is null then v_txn.amount - estimated_transfer_fee(v_txn.amount) else payout_amount end,
         settled_at = now(),
         settled_by = p_admin
   where id = p_txn_id;

  -- The wallet was debited when the withdrawal was requested.
  if not p_paid then
    update wallets set balance = balance + v_txn.amount where id = v_txn.wallet_id;
  end if;
end;
$$;

revoke all on function public.admin_settle_withdrawal(uuid, boolean, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_settle_withdrawal(uuid, boolean, uuid, text) to service_role;

-- ─────────────── Emails ───────────────
-- As in email_delivery.sql, plus what actually reached the bank.

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
      jsonb_build_object('amount', new.amount, 'job_id', new.job_id, 'reference', new.reference,
                         'received', new.payout_amount, 'fee', new.payout_fee));
  end if;
  return new;
exception when others then
  return new;
end;
$$;

commit;
