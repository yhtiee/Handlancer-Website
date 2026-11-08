-- HandLancer — settle withdrawals from the admin console.
-- Run once, on the SAME project as the mobile app. Safe to re-run.
--
-- request_withdrawal debits the wallet and leaves a pending transaction, and
-- nothing ever moved it on. Payouts are made by hand for now; this records the
-- result. The status change is what sends the customer's email
-- (on_transaction_email, supabase/email_delivery.sql).

alter table public.transactions
  add column if not exists settled_at timestamptz,
  add column if not exists settled_by uuid;

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

  update transactions
     set status     = case when p_paid then 'success'::txn_status else 'failed'::txn_status end,
         reference  = coalesce(nullif(btrim(coalesce(p_reference, '')), ''), reference),
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
