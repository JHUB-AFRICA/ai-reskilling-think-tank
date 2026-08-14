-- Evidence is deliberately separate from self-reported course progress.
-- It lets the platform show what supports a claimed skill without treating a
-- clicked link or course completion as proof of professional competence.

create table if not exists skill_evidence (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid not null references auth.users(id) on delete cascade,
    skill_id            text,
    skill_name          text not null,
    evidence_type       text not null check (evidence_type in ('certificate', 'project', 'assessment', 'portfolio', 'note')),
    evidence_url        text,
    description         text,
    assessment_score    numeric(5,2) check (assessment_score is null or assessment_score between 0 and 100),
    verification_status text not null default 'self_reported'
                        check (verification_status in ('self_reported', 'verified_certificate', 'provider_verified', 'mentor_verified')),
    created_at          timestamptz not null default now()
);

create index if not exists idx_skill_evidence_user on skill_evidence (user_id, created_at desc);
alter table skill_evidence enable row level security;

create policy "Users manage their own skill evidence"
    on skill_evidence for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
