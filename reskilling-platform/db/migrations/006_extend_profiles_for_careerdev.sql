-- 006_extend_profiles_for_careerdev.sql
--
-- CareerDev (a separate frontend being integrated into this platform)
-- defines its own profiles table with different columns than
-- 004_create_profiles_table.sql: full_name, target_career,
-- experience_level, updated_at. Rather than maintain two competing
-- "profiles" concepts on the same table name, this migration unifies
-- them: the role-based-access columns from 004 stay exactly as they
-- were (role, email), and CareerDev's onboarding fields are added
-- alongside. Nothing from 004 is removed or renamed.

alter table profiles
    add column if not exists full_name text,
    add column if not exists target_career text,
    add column if not exists experience_level text,
    add column if not exists updated_at timestamptz not null default now();

create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
    before update on profiles
    for each row execute function public.handle_updated_at();

-- 004 defined no client-writable UPDATE policy at all (role changes
-- were deliberately admin-only, via the service connection). These
-- new columns are different: full_name/target_career/experience_level
-- are the user's own onboarding data, updated via PATCH /me/profile
-- using the FastAPI service's database connection (not a direct
-- client Supabase write), so no new RLS UPDATE policy is added here
-- either -- consistent with the existing pattern.
