-- 004_create_profiles_table.sql
--
-- Role-based access control. Three roles, matching the three actors
-- modeled in the Use Case Diagram (docs/architecture_diagrams.md) but
-- never previously implemented in code:
--   job_seeker         -- default for every new signup
--   workforce_analyst  -- aggregate trend views, no personal data access
--   administrator       -- user management, role assignment
--
-- Deliberately NOT self-service: the public signup flow only ever
-- creates job_seeker profiles (enforced by the trigger below, not by
-- client-side trust). Promoting someone to workforce_analyst or
-- administrator requires an existing administrator to do it via
-- PATCH /admin/users/{id}/role -- letting users self-assign roles at
-- signup would be a real privilege-escalation vulnerability, not a
-- hypothetical one.

create table if not exists profiles (
    id         uuid primary key references auth.users(id) on delete cascade,
    email      text not null,
    role       text not null default 'job_seeker'
               check (role in ('job_seeker', 'workforce_analyst', 'administrator')),
    created_at timestamptz not null default now()
);

-- Auto-provision a profile row the moment a user signs up, always as
-- job_seeker regardless of anything the client sends -- this trigger
-- is the actual enforcement point, not application code, so it holds
-- even if a future endpoint has a bug.
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, role)
    values (new.id, new.email, 'job_seeker');
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

alter table profiles enable row level security;

create policy "Users can view their own profile"
    on profiles for select
    using (auth.uid() = id);

-- Administrators can view every profile -- required for the admin
-- user-management dashboard. Implemented as a subquery against this
-- same table rather than a separate role-check function, since RLS
-- policies cannot call back into application code.
create policy "Administrators can view all profiles"
    on profiles for select
    using (
        exists (
            select 1 from profiles p
            where p.id = auth.uid() and p.role = 'administrator'
        )
    );

-- No client-side UPDATE policy is defined at all. Role changes go
-- through PATCH /admin/users/{id}/role, which uses the service-level
-- database connection (db.py), not a client Supabase session -- this
-- is deliberate: there is no RLS policy that could safely allow a
-- user to update their own role column, so the safest answer is no
-- client-writable path exists for this table at all.
