-- HandLancer — the shareable artisan page (/artisans/[id]).
-- Run once, on the SAME project as the mobile app, BEFORE deploying the website
-- that links to it: the page can't load until this exists. Safe to re-run.
--
-- `profiles` is readable by signed-in users only, and a shared link has to work
-- for someone with no account. Opening the table to anon would expose every
-- column of every row, so this returns one person, only once approved, and only
-- the fields named here. Phone, email and exact coordinates are deliberately
-- absent: the work is meant to be arranged through escrow.
--
-- Review text stays out too. A client wrote it for people inside the app, and it
-- can mention their home; the page carries the rating and the count.

begin;

create or replace function public.get_public_provider(p_id uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'id',               p.id,
    'name',             p.name,
    'avatar_url',       p.avatar_url,
    'business_name',    p.business_name,
    'bio',              p.bio,
    'location',         p.location,
    'services',         p.services,
    'work_photos',      p.work_photos,
    'rating',           p.rating,
    'hourly_rate',      p.hourly_rate,
    'rate_unit',        p.rate_unit,
    'years_experience', p.years_experience,
    'availability',     p.availability,
    'is_verified',      p.is_verified,
    'created_at',       p.created_at,
    'review_count',     (select count(*) from reviews r where r.provider_id = p.id)
  )
  from profiles p
  where p.id = p_id
    and p.role = 'provider'
    and p.provider_status = 'approved'
    and p.deleted_at is null;
$$;

revoke all on function public.get_public_provider(uuid) from public;
grant execute on function public.get_public_provider(uuid) to anon, authenticated, service_role;

commit;
