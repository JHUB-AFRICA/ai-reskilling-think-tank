-- Verified learning catalogue and learner-owned progress records.
-- This extends 005 instead of replacing it, so existing deployments keep
-- their curated resources while gaining the metadata needed for discovery.

alter table learning_resources
    add column if not exists description text,
    add column if not exists resource_type text not null default 'course'
        check (resource_type in ('course', 'learning_path', 'video', 'article', 'project', 'assessment')),
    add column if not exists difficulty text,
    add column if not exists duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
    add column if not exists language text not null default 'English',
    add column if not exists verification_status text not null default 'verified'
        check (verification_status in ('verified', 'provider_synced', 'discovery')),
    add column if not exists last_verified_at timestamptz,
    add column if not exists skill_name text;

create index if not exists idx_learning_resources_verification
    on learning_resources (verification_status, created_at desc);

create table if not exists user_learning_items (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid not null references auth.users(id) on delete cascade,
    resource_id         bigint not null references learning_resources(id) on delete cascade,
    analysis_id         uuid references career_analyses(id) on delete set null,
    status              text not null default 'saved'
                        check (status in ('saved', 'not_started', 'in_progress', 'completed', 'abandoned')),
    progress_percent    integer not null default 0 check (progress_percent between 0 and 100),
    time_spent_minutes  integer not null default 0 check (time_spent_minutes >= 0),
    notes               text,
    evidence_url        text,
    completion_source   text not null default 'self_reported'
                        check (completion_source in ('self_reported', 'verified_certificate', 'provider_verified', 'project_evidence')),
    started_at          timestamptz,
    completed_at        timestamptz,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    unique (user_id, resource_id)
);

create index if not exists idx_user_learning_items_user
    on user_learning_items (user_id, updated_at desc);

alter table user_learning_items enable row level security;

create policy "Users manage their own learning items"
    on user_learning_items for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Known-good, official-provider starting resources.  Each URL was verified
-- against the provider's public training site on 2026-07-30.  Administrators
-- can add additional resources through future management UI/API work.
insert into learning_resources
    (skill_id, skill_name, title, url, provider, is_free, description,
     resource_type, difficulty, duration_minutes, language,
     verification_status, last_verified_at)
values
    ('SKL_2A1b', 'Data Analysis', 'IBM SkillsBuild Data Analyst learning path',
     'https://skillsbuild.org/adult-learners/explore-learning/data-analyst',
     'IBM SkillsBuild', true,
     'A free data-analytics learning path with foundational material and a credential pathway.',
     'learning_path', 'Beginner', 420, 'English', 'verified', now()),
    ('SKL_2A1b', 'Data Visualization', 'Prepare and visualize data with Microsoft Power BI',
     'https://learn.microsoft.com/en-us/training/paths/prepare-visualize-data-power-bi/',
     'Microsoft Learn', true,
     'Official learning path covering data preparation, transformation and interactive Power BI visuals.',
     'learning_path', 'Beginner', null, 'English', 'verified', now()),
    ('SKL_2A1b', 'Power BI', 'Get started building with Power BI',
     'https://learn.microsoft.com/en-us/training/modules/introduction-power-bi/',
     'Microsoft Learn', true,
     'Beginner module introducing Power BI reports, services and core building blocks.',
     'course', 'Beginner', 21, 'English', 'verified', now()),
    ('SKL_2A1b', 'Cloud Computing', 'AWS Skill Builder digital training',
     'https://aws.amazon.com/training/digital/',
     'AWS Skill Builder', true,
     'Official AWS digital training catalogue with free cloud and AI learning resources.',
     'learning_path', 'Beginner', null, 'English', 'verified', now())
on conflict do nothing;
