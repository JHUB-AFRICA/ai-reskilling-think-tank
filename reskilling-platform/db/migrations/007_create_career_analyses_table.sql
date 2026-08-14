-- 007_create_career_analyses_table.sql
--
-- CareerDev's own schema (supabase/schema.sql in their repo), adopted
-- here largely as-is. This is deliberately a SEPARATE table from
-- gap_analyses (003) rather than a forced merge: gap_analyses stores
-- results from the strict, dropdown-driven /analyze-gap flow (exact
-- O*NET occupation match required); career_analyses stores results
-- from CareerDev's free-text-target wizard, served by the new
-- /me/career-analysis endpoint, which may fall back to Gemini
-- reasoning when the typed target career doesn't match the taxonomy
-- confidently. Keeping these separate avoids distorting either
-- table's meaning to accommodate the other's input shape.

create table if not exists career_analyses (
    id                      uuid primary key default gen_random_uuid(),
    user_id                 uuid not null references auth.users(id) on delete cascade,
    current_career          text not null,
    target_career           text not null,
    experience_level        text not null,
    current_skills          text[] not null default '{}',
    goals                   text,
    readiness_score         integer not null default 0 check (readiness_score >= 0 and readiness_score <= 100),
    summary                 text,
    skill_gaps              jsonb not null default '[]'::jsonb,
    learning_recommendations jsonb not null default '[]'::jsonb,
    matched_taxonomy        boolean not null default false,
    created_at              timestamptz not null default now()
);

create index if not exists idx_career_analyses_user on career_analyses(user_id, created_at desc);

alter table career_analyses enable row level security;

create policy "Users can view their own career analyses"
    on career_analyses for select
    using (auth.uid() = user_id);

create policy "Users can insert their own career analyses"
    on career_analyses for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own career analyses"
    on career_analyses for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own career analyses"
    on career_analyses for delete
    using (auth.uid() = user_id);
