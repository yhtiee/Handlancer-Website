-- Customer search over artisans' services. Applied as mobile migration 0024_provider_service_search.sql.
--
-- profiles.services holds trade ids ('plumbing') and service names
-- ('Borehole drilling', or anything an artisan typed). Search used to look at
-- name, location and bio only, so a customer typing "borehole" never found the
-- artisan who listed it.
--
-- `services_search` is a generated column: Postgres keeps it in step with
-- `services` on every write, nobody can set it, and the apps just add one
-- `ilike` to their existing search. Trade ids are expanded to the words people
-- actually type ("plumber", "electrician", "air conditioning").

create or replace function public.provider_services_search_text(p_services text[])
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select coalesce(
    string_agg(
      case s
        when 'plumbing'   then 'plumbing plumber'
        when 'electrical' then 'electrical electrician wiring'
        when 'carpentry'  then 'carpentry carpenter furniture'
        when 'painting'   then 'painting painter'
        when 'cleaning'   then 'cleaning cleaner'
        when 'appliance'  then 'appliance repair technician'
        when 'masonry'    then 'masonry mason bricklayer tiler'
        when 'ac'         then 'ac air conditioning cooling'
        when 'auto'       then 'auto repair mechanic car'
        when 'gardening'  then 'gardening gardener'
        when 'moving'     then 'moving haulage movers'
        when 'other'      then ''
        else s
      end,
      ' '
    ),
    ''
  )
  from unnest(coalesce(p_services, '{}'::text[])) as s;
$$;

alter table public.profiles
  add column if not exists services_search text
  generated always as (public.provider_services_search_text(services)) stored;

-- ── Follow-up, applied as 0025_provider_search_labels.sql ──
-- 0025 — expand trade NAMES as well as ids in services_search (0024).
--
-- Profiles saved by the mobile app's SkillsInput hold trades as free text
-- ('Plumbing', 'AC Repair'), not ids ('plumbing'), so 0024's exact id match
-- missed them and "plumber" found nobody. Match case-insensitively on both the
-- id and the label, then recompute the stored column for existing rows.

create or replace function public.provider_services_search_text(p_services text[])
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select coalesce(
    string_agg(
      s || ' ' ||
      case lower(trim(s))
        when 'plumbing'          then 'plumber'
        when 'electrical'        then 'electrician wiring'
        when 'carpentry'         then 'carpenter furniture'
        when 'painting'          then 'painter'
        when 'cleaning'          then 'cleaner'
        when 'appliance'         then 'appliance repair technician'
        when 'appliance repair'  then 'technician'
        when 'masonry'           then 'mason bricklayer tiler'
        when 'ac'                then 'air conditioning cooling'
        when 'ac & cooling'      then 'air conditioning'
        when 'ac repair'         then 'air conditioning cooling'
        when 'auto'              then 'auto repair mechanic car'
        when 'auto repair'       then 'mechanic car'
        when 'gardening'         then 'gardener'
        when 'moving'            then 'haulage movers'
        when 'moving & haulage'  then 'movers'
        when 'tiling'            then 'tiler'
        when 'roofing'           then 'roofer'
        when 'welding'           then 'welder'
        when 'generator repair'  then 'generator mechanic'
        else ''
      end,
      ' '
    ),
    ''
  )
  from unnest(coalesce(p_services, '{}'::text[])) as s;
$$;

-- Stored generated values are not recomputed when the function changes; touch
-- every row that has services so they are. Runs as the migration owner, which
-- the review guard trigger (0023) lets through.
update public.profiles set services = services where services is not null;
