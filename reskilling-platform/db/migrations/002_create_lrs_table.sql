-- 002_create_lrs_table.sql
--
-- Replaces the local xapi_statements.jsonl file with a Postgres table.
-- Per the Unified Platform Architecture Proposal \u00a74.3, this is a change
-- to lrs.py's single _persist() function only -- statement construction
-- in build_statement() does not change at all.
--
-- Core xAPI fields (actor, verb, object, timestamp) are stored as plain
-- columns for indexing and querying; the result/extensions payload is
-- stored as JSONB, matching the JKUAT proposal's "JSONB Document Models"
-- recommendation for telemetry -- but inside the same portable Postgres
-- database as the taxonomy, rather than a separate proprietary store.

create table if not exists xapi_statements (
    id                bigint generated always as identity primary key,
    user_id           uuid references auth.users(id) on delete set null,
    actor_email       text not null,
    verb_id           text not null,
    verb_display      text not null,
    object_id         text not null,
    object_name       text not null,
    result_extensions jsonb,
    recorded_at       timestamptz not null default now()
);

create index if not exists idx_xapi_statements_user on xapi_statements(user_id);
create index if not exists idx_xapi_statements_recorded_at on xapi_statements(recorded_at desc);

-- Row Level Security: a user can only read their own statements.
-- This is the core of Supabase's auth model -- policies, not
-- application-layer filtering, are the actual security boundary.
alter table xapi_statements enable row level security;

create policy "Users can view their own xAPI statements"
    on xapi_statements for select
    using (auth.uid() = user_id);

create policy "Users can insert their own xAPI statements"
    on xapi_statements for insert
    with check (auth.uid() = user_id);

-- Taxonomy tables are public reference data -- readable by anyone,
-- writable only via the service role (i.e. the migration script, not
-- end users through the API).
alter table occupations enable row level security;
alter table skills enable row level security;
alter table occupation_skills enable row level security;

create policy "Taxonomy is publicly readable"
    on occupations for select using (true);
create policy "Skills are publicly readable"
    on skills for select using (true);
create policy "Occupation-skill mappings are publicly readable"
    on occupation_skills for select using (true);
