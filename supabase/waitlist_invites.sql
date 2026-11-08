-- HandLancer — invite the waitlist from the admin console.
-- Run once, on the SAME project as the mobile app, AFTER the send-email function
-- with the waitlist_invite_batch handler is deployed. Safe to re-run.

alter table public.waitlist add column if not exists invited_at timestamptz;

-- Who a click would reach. Someone who already has an account has no use for an
-- invitation to create one.
create or replace function public.waitlist_invite_counts()
returns table (role text, n bigint)
language sql
stable
security definer
set search_path = public, auth
as $$
  select w.role, count(*)
    from public.waitlist w
   where w.invited_at is null
     and not exists (select 1 from auth.users u where lower(u.email) = lower(w.email))
   group by w.role;
$$;

-- Marks people invited in the same statement that picks them, so a double click
-- or two admins at once cannot send anyone a second copy. Hands the whole list
-- to send-email in one event: one email per row through pg_net would arrive all
-- at once and trip Resend's rate limit. send-email clears invited_at again for
-- any batch Resend refuses.
create or replace function public.admin_send_waitlist_invites(p_role text)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_recipients jsonb;
begin
  if p_role is null or p_role not in ('user', 'provider') then
    raise exception 'Choose who to invite.';
  end if;

  with claimed as (
    update public.waitlist w
       set invited_at = now()
     where w.role = p_role
       and w.invited_at is null
       and not exists (select 1 from auth.users u where lower(u.email) = lower(w.email))
    returning w.id, w.email
  )
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'email', email)), '[]'::jsonb)
    into v_recipients
    from claimed;

  if jsonb_array_length(v_recipients) = 0 then
    return 0;
  end if;

  perform public.dispatch_email('waitlist_invite_batch', null, null,
    jsonb_build_object('role', p_role, 'recipients', v_recipients));
  return jsonb_array_length(v_recipients);
end;
$$;

revoke all on function public.waitlist_invite_counts() from public, anon, authenticated;
revoke all on function public.admin_send_waitlist_invites(text) from public, anon, authenticated;
grant execute on function public.waitlist_invite_counts() to service_role;
grant execute on function public.admin_send_waitlist_invites(text) to service_role;
