-- HandLancer marketing site — pre-launch waitlist.
-- Run once in the Supabase SQL editor (same project as the mobile app is fine).

create table if not exists public.waitlist (
  id               uuid primary key default gen_random_uuid(),
  role             text        not null check (role in ('user', 'provider')),
  name             text        not null check (char_length(name) between 2 and 80),
  email            text        not null check (char_length(email) <= 160),
  phone            text,
  city             text        not null check (char_length(city) <= 80),
  -- Matches an id from src/constants/categories.ts in the mobile app.
  category         text        not null,
  -- Providers only; null for customers.
  years_experience int         check (years_experience between 0 and 60),
  referral         text,
  created_at       timestamptz not null default now()
);

-- Someone may legitimately join as both a customer and a provider, so the
-- uniqueness is on the pair. The action treats 23505 here as "already joined".
create unique index if not exists waitlist_email_role_idx
  on public.waitlist (lower(email), role);

create index if not exists waitlist_created_at_idx
  on public.waitlist (created_at desc);

alter table public.waitlist enable row level security;

-- The site posts with the ANON key, so it needs exactly one privilege: insert.
-- No select policy is defined, which means nobody holding the anon key can read
-- the list back — signups are write-only from the public internet.
drop policy if exists "waitlist: anon may insert" on public.waitlist;
create policy "waitlist: anon may insert"
  on public.waitlist
  for insert
  to anon
  with check (true);

-- Read it from the Supabase dashboard, or with the service role key:
--   select role, count(*) from public.waitlist group by role;
--   select * from public.waitlist order by created_at desc limit 50;
