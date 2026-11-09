-- HandLancer — remind artisans who never sent in their application.
-- Run once after email_delivery.sql, on the SAME project as the mobile app, and
-- after send-email is deployed with the profile_reminder template. Safe to re-run.
--
-- Three emails at most: a day after sign-up, three days later, then a week after
-- that. Stops as soon as the application is sent. Runs once a day, a few at a
-- time, so a backlog can't trip Resend's rate limit.
--
-- To stop them all:  select cron.unschedule('profile-reminders');

-- The artisan turns this off on /app/apply: Settings is out of reach until the
-- application is in (mustApply in lib/app/domain/artisan-status.ts).
alter table public.email_preferences
  add column if not exists application_reminders boolean not null default true;

-- status is 'sent' or 'failed' only: a template that isn't deployed yet logs
-- 'skipped', and shouldn't use up anyone's reminders.
create or replace function public.profile_reminders_due(p_limit int default 5)
returns table (user_id uuid, step int)
language sql
stable
security definer
set search_path = public, auth
as $$
  with history as (
    select l.user_id,
           count(*) filter (where l.status = 'sent')::int      as sent,
           max(l.created_at) filter (where l.status = 'sent')  as last_sent,
           max(l.created_at)                                   as last_try
      from email_log l
     where l.event = 'profile_reminder' and l.status in ('sent', 'failed')
     group by l.user_id
  )
  select p.id, coalesce(h.sent, 0) + 1
    from profiles p
    join auth.users u on u.id = p.id
    left join email_preferences ep on ep.user_id = p.id
    left join history h on h.user_id = p.id
   where p.role = 'provider'
     and p.provider_status = 'draft'
     and p.deleted_at is null
     -- From Auth, never profiles.email, which the client writes.
     and u.email is not null
     and u.email_confirmed_at is not null
     and coalesce(ep.application_reminders, true)
     and p.created_at < now() - interval '1 day'
     and coalesce(h.sent, 0) < 3
     -- A send that failed waits for the next day's run.
     and (h.last_try is null or h.last_try < now() - interval '20 hours')
     and (coalesce(h.sent, 0) = 0
          or (h.sent = 1 and h.last_sent < now() - interval '3 days')
          or (h.sent = 2 and h.last_sent < now() - interval '7 days'))
   order by p.created_at
   limit greatest(p_limit, 0);
$$;

create or replace function public.send_profile_reminders()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_due   record;
  v_count int := 0;
begin
  for v_due in select * from profile_reminders_due() loop
    perform dispatch_email('profile_reminder', v_due.user_id, null, jsonb_build_object('step', v_due.step));
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.profile_reminders_due(int) from public, anon, authenticated;
revoke all on function public.send_profile_reminders() from public, anon, authenticated;

create extension if not exists pg_cron;

-- Daily at 9am Nigerian time (pg_cron runs in UTC). Re-running replaces it.
select cron.schedule('profile-reminders', '0 8 * * *', $$select public.send_profile_reminders()$$);
