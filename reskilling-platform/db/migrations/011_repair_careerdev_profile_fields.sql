-- Makes the CareerDev profile contract safe for databases created before
-- migration 006 was introduced. All statements are idempotent.

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
