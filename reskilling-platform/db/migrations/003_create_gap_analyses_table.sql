-- 003_create_gap_analyses_table.sql
--
-- Per-user gap-analysis history. This is what actually justifies
-- Phase C's database beyond the taxonomy migration -- without it,
-- "multi-user" would mean nothing more than shared read-only
-- reference data. Each row is one completed /me/gap-analyses call.

create table if not exists gap_analyses (
    id                 bigint generated always as identity primary key,
    user_id            uuid not null references auth.users(id) on delete cascade,
    occupation_title   text not null,
    readiness_score    numeric(5, 1) not null,
    matched_skill_ids  text[] not null default '{}',
    missing_skill_ids  text[] not null default '{}',
    created_at         timestamptz not null default now()
);

create index if not exists idx_gap_analyses_user on gap_analyses(user_id, created_at desc);

alter table gap_analyses enable row level security;

create policy "Users can view their own gap analyses"
    on gap_analyses for select
    using (auth.uid() = user_id);

create policy "Users can insert their own gap analyses"
    on gap_analyses for insert
    with check (auth.uid() = user_id);
