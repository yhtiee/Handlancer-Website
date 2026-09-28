-- HandLancer admin console — who may sign in to /admin.
-- Run once in the Supabase SQL editor, on the SAME project as the mobile app.
-- (Or copy into Handlancer-Mobile-Application/supabase/migrations as the next
-- numbered migration so it is versioned with the rest of the schema.)
--
-- Admins are ordinary Supabase Auth users. They are NOT app profiles: do not
-- give them a row in `profiles` (that would create a wallet and list them in
-- discovery). This table is the allowlist the console checks after sign-in —
-- a valid app account alone never gets into /admin.

create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users on delete cascade,
  email      text not null,
  -- 'owner' can manage other admins (future); 'support' works the queues.
  role       text not null default 'support' check (role in ('owner', 'support')),
  created_at timestamptz not null default now()
);

-- RLS on with no policies: only the service role (the console's server) reads
-- it. Neither the anon key in the app bundle nor a signed-in app user can see
-- who the admins are, let alone add themselves.
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;

-- ─────────────── Adding an admin ───────────────
-- 1. Supabase dashboard → Authentication → Users → Add user
--    (email + password, tick "Auto confirm user").
-- 2. Then:
--
--   insert into public.admin_users (user_id, email, role)
--   select id, email, 'owner' from auth.users where email = 'you@handlancer.com';
--
-- Removing access: delete the row. Their session stops working on the next
-- request, since every page re-checks this table.
