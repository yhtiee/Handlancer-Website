-- HandLancer — email approved artisans when a matching job is posted.
-- Run once after email_delivery.sql, on the SAME project as the mobile app.
-- Safe to re-run.
--
-- Nothing is sent until the Edge Function secret JOB_ALERTS_ENABLED is 'true':
-- people need the opt-out in Settings to be live first.

-- profiles.services holds free-typed trades ("Aluminium roofing installer"),
-- while jobs.category is a fixed id, so a trade is matched by pattern.
create or replace function public.job_trade_pattern(p_category text)
returns text
language sql
immutable
as $$
  select case p_category
    when 'plumbing'   then 'plumb'
    when 'electrical' then 'electric'
    when 'carpentry'  then 'carpent|furniture'
    when 'painting'   then 'paint'
    when 'cleaning'   then 'clean|fumigat'
    when 'appliance'  then 'appliance|fridge|generator'
    when 'masonry'    then 'mason|brick|tiling|tiler|plaster'
    when 'ac'         then '(^|[^a-z])ac([^a-z]|$)|air.?condition|cooling'
    when 'auto'       then 'auto|mechanic'
    when 'gardening'  then 'garden|landscap'
    when 'moving'     then 'moving|haulage|logistic|driver'
    when 'other'      then '^other$|general|handyman'
  end;
$$;

-- Locations are free text too ("Itu road, Uyo", "85 Itu road by Qua Iboe").
-- Two places are close enough if they share a word that names somewhere.
create or replace function public.location_words(p_location text)
returns text[]
language sql
immutable
as $$
  select coalesce(array_agg(distinct w), '{}')
    from regexp_split_to_table(lower(coalesce(p_location, '')), '[^a-z]+') w
   where length(w) > 1
     and w not in ('road', 'rd', 'street', 'st', 'close', 'avenue', 'ave', 'lane', 'crescent', 'way',
                   'by', 'off', 'at', 'in', 'near', 'the', 'of', 'and', 'state', 'estate', 'junction',
                   'phase', 'layout', 'housing', 'new', 'old', 'nigeria', 'city', 'town');
$$;

create or replace function public.job_alert_recipients(p_job_id uuid)
returns table (user_id uuid, email text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_job     jobs%rowtype;
  v_pattern text;
  v_words   text[];
begin
  select * into v_job from jobs where id = p_job_id and status = 'posted' and not coalesce(is_direct, false);
  if v_job.id is null then return; end if;

  v_pattern := job_trade_pattern(v_job.category);
  if v_pattern is null then return; end if;
  v_words := location_words(v_job.location);

  return query
    select p.id, u.email::text
      from profiles p
      join auth.users u on u.id = p.id
      left join email_preferences ep on ep.user_id = p.id
     where p.role = 'provider'
       and p.provider_status = 'approved'
       and p.deleted_at is null
       and p.id <> v_job.owner_id
       -- From Auth, never profiles.email, which the client writes.
       and u.email is not null
       and u.email_confirmed_at is not null
       and coalesce(ep.job_alerts, true)
       and exists (select 1 from unnest(p.services) s where s ~* v_pattern)
       -- Unknown on either side errs towards telling them.
       and (cardinality(v_words) = 0
            or cardinality(location_words(p.location)) = 0
            or v_words && location_words(p.location))
     limit 200;
end;
$$;

revoke all on function public.job_alert_recipients(uuid) from public, anon, authenticated;
grant execute on function public.job_alert_recipients(uuid) to service_role;

create or replace function public.email_on_public_job()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'posted' and not coalesce(new.is_direct, false)
     and (tg_op = 'INSERT' or old.status is distinct from 'posted') then
    perform public.dispatch_email('job_posted', null, null, jsonb_build_object('job_id', new.id));
  end if;
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists on_public_job_email on public.jobs;
create trigger on_public_job_email
  after insert or update of status on public.jobs
  for each row execute function public.email_on_public_job();
