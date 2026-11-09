-- HandLancer — what a provider's rate is charged per.
-- Run once, on the SAME project as the mobile app, BEFORE deploying the website
-- that writes this column: saving a profile fails until the column exists.
-- Safe to re-run.
--
-- hourly_rate keeps its name and now means "the amount", because the mobile app
-- reads it and its filters and sort use it. Everyone existing stays 'hour',
-- which is what they entered. The allowed values mirror lib/app/domain/rates.ts.

begin;

alter table public.profiles
  add column if not exists rate_unit text not null default 'hour';

alter table public.profiles drop constraint if exists profiles_rate_unit_check;
alter table public.profiles
  add constraint profiles_rate_unit_check
  check (rate_unit in ('hour', 'day', '24_hours', 'week', 'job'));

comment on column public.profiles.hourly_rate is 'The provider''s starting price. Charged per rate_unit, despite the name.';

commit;
