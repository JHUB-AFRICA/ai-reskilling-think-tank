-- 001_create_taxonomy_tables.sql
--
-- Normalizes the flat skills_taxonomy_v1.csv (occupation x skill grain)
-- into proper third-normal-form relational tables. This is the Phase C
-- migration target referenced in the Unified Platform Architecture
-- Proposal \u00a74 -- the CSV was always "a relational structure acting as
-- the single source of truth" in spirit (per the JKUAT proposal's
-- language); this migration makes that literal.

create table if not exists occupations (
    onet_soc_code   text primary key,
    occupation_title text not null
);

create table if not exists skills (
    skill_id        text primary key,
    skill_name      text not null,
    cluster         text not null,
    domain          text not null,
    source          text not null check (source in ('general', 'technology')),
    onet_element_id text not null
);

-- The join table carrying the occupation-specific importance weight --
-- this is the piece a flat skill list alone cannot represent, and is
-- exactly why the taxonomy was always occupation x skill grain, not a
-- deduplicated skill list (see Skills Taxonomy Document \u00a74).
create table if not exists occupation_skills (
    onet_soc_code text not null references occupations(onet_soc_code) on delete cascade,
    skill_id      text not null references skills(skill_id) on delete cascade,
    importance    numeric(3, 1) not null check (importance between 0 and 5),
    primary key (onet_soc_code, skill_id)
);

create index if not exists idx_occupation_skills_occupation on occupation_skills(onet_soc_code);
create index if not exists idx_occupation_skills_skill on occupation_skills(skill_id);
create index if not exists idx_skills_domain on skills(domain);
