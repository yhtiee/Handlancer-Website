-- HandLancer — artisan onboarding and review.
-- Run once in the Supabase SQL editor, on the SAME project as the mobile app,
-- BEFORE deploying the website build that reads these columns.
-- (Or copy into Handlancer-Mobile-Application/supabase/migrations as the next
-- numbered migration so it is versioned with the rest of the schema.)
--
-- What it does
--   1. Gives every provider profile a review status: draft → pending →
--      approved | rejected (and suspended, for later). Clients have NULL.
--   2. Existing providers who are already working are grandfathered in as
--      `approved`; empty sign-ups start the application as drafts.
--   3. A guard trigger stops anyone but the server (service role / SECURITY
--      DEFINER functions) from approving themselves, or from editing the
--      fields that are someone else's to set: review outcome, is_verified,
--      rating and role. This also closes an existing gap — "profile self
--      update" allowed any column on your own row, is_verified and rating
--      included.
--   4. Only approved providers can send quotes.
--
-- Discovery (who customers can find) is filtered in the app's queries:
-- `profiles` must stay readable to every signed-in user (names in chats,
-- quotes and reviews), so RLS cannot hide pending artisans there.
-- The mobile app needs the same one-line filter in listProviders/countProviders:
--   .eq('provider_status', 'approved')

-- ─────────────── 1. Columns ───────────────

alter table public.profiles
  add column if not exists provider_status text
    check (provider_status in ('draft', 'pending', 'approved', 'rejected', 'suspended')),
  add column if not exists provider_submitted_at  timestamptz,
  add column if not exists provider_reviewed_at   timestamptz,
  add column if not exists provider_reviewed_by   uuid,
  -- Shown to the artisan when their application is sent back.
  add column if not exists provider_review_note   text,
  add column if not exists provider_terms_accepted_at timestamptz,
  -- Public URLs (job-media bucket, applications/<user id>/...) of past work,
  -- submitted with the application for the reviewer to see.
  add column if not exists work_photos text[] not null default '{}';

-- ─────────────── 2. Existing providers ───────────────
-- Artisans already working (a trade on their profile, or any quote or job)
-- are approved, so nobody live disappears from search. Accounts with nothing
-- filled in — sign-ups that never got going — start the application as drafts.

update public.profiles p
   set provider_status = 'approved',
       provider_reviewed_at = coalesce(p.provider_reviewed_at, now())
 where p.role = 'provider'
   and p.provider_status is null
   and (
     coalesce(array_length(p.services, 1), 0) > 0
     or exists (select 1 from public.quotes q where q.provider_id = p.id)
     or exists (select 1 from public.jobs j where j.hired_provider_id = p.id)
   );

update public.profiles
   set provider_status = 'draft'
 where role = 'provider' and provider_status is null;

create index if not exists profiles_provider_status_idx
  on public.profiles (provider_status, provider_submitted_at)
  where role = 'provider';

-- ─────────────── 3. Guard ───────────────
-- `current_user` is 'authenticated' / 'anon' for a direct client request, and
-- the function owner inside SECURITY DEFINER functions (rating recalculation,
-- delete_my_account) or 'service_role' for the admin console — those pass.

create or replace function public.guard_profile_review_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Every new artisan starts as a draft, whatever the client sent.
    if new.role = 'provider' then
      new.provider_status := 'draft';
    else
      new.provider_status := null;
    end if;
    new.provider_submitted_at := null;
    new.provider_reviewed_at := null;
    new.provider_reviewed_by := null;
    new.provider_review_note := null;
    new.is_verified := false;
    new.rating := 0;
    return new;
  end if;

  -- UPDATE by the profile's owner.
  if new.role is distinct from old.role then
    raise exception 'ROLE_LOCKED' using hint = 'Contact support to change how you use HandLancer.';
  end if;
  if new.is_verified is distinct from old.is_verified
     or new.rating is distinct from old.rating
     or new.provider_reviewed_at is distinct from old.provider_reviewed_at
     or new.provider_reviewed_by is distinct from old.provider_reviewed_by
     or new.provider_review_note is distinct from old.provider_review_note
     or new.provider_submitted_at is distinct from old.provider_submitted_at then
    raise exception 'REVIEW_FIELDS_LOCKED' using hint = 'These fields are set by HandLancer, not by you.';
  end if;

  if new.provider_status is distinct from old.provider_status then
    -- The one move an artisan can make: submit (or resubmit) for review.
    if new.provider_status = 'pending' and old.provider_status in ('draft', 'rejected') then
      if coalesce(trim(new.name), '') = ''
         or coalesce(trim(new.phone), '') = ''
         or coalesce(trim(new.location), '') = ''
         or coalesce(array_length(new.services, 1), 0) = 0
         or new.provider_terms_accepted_at is null then
        raise exception 'APPLICATION_INCOMPLETE'
          using hint = 'Add your name, phone, area and at least one trade, and accept the artisan terms.';
      end if;
      new.provider_submitted_at := now();
    else
      raise exception 'STATUS_LOCKED' using hint = 'Your application is reviewed by HandLancer.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profile_review_fields on public.profiles;
create trigger guard_profile_review_fields
  before insert or update on public.profiles
  for each row execute function public.guard_profile_review_fields();

-- ─────────────── 4. Only approved artisans quote ───────────────
-- Updating an existing quote ("quotes party update") is unaffected; an
-- artisan can only have one if they were approved when they sent it.

drop policy if exists "quotes provider insert" on public.quotes;
create policy "quotes provider insert" on public.quotes
  for insert to authenticated
  with check (
    provider_id = auth.uid()
    and exists (
      select 1 from public.profiles p
       where p.id = auth.uid() and p.role = 'provider' and p.provider_status = 'approved'
    )
  );
