-- Persist company skill frameworks, provider connections, and link-health metadata.

alter table learning_resources
    add column if not exists prerequisites text,
    add column if not exists phase text,
    add column if not exists last_link_status text;

create table if not exists company_skill_frameworks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    role_name text not null,
    required_skills text[] not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, role_name)
);

create index if not exists idx_company_skill_frameworks_user on company_skill_frameworks (user_id, role_name);

create table if not exists provider_connections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    provider_name text not null,
    provider_account text,
    access_token text,
    connected_at timestamptz not null default now(),
    last_sync_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, provider_name)
);

create index if not exists idx_provider_connections_user on provider_connections (user_id, provider_name);
