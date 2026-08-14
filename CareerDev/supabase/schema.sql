-- Career Development Platform schema
-- Run this in the Supabase SQL Editor after creating your project.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  target_career text,
  experience_level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.career_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  current_career text not null,
  target_career text not null,
  experience_level text not null,
  current_skills text[] not null default '{}',
  goals text,
  readiness_score integer not null default 0 check (readiness_score >= 0 and readiness_score <= 100),
  summary text,
  skill_gaps jsonb not null default '[]'::jsonb,
  learning_recommendations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.career_analyses enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can view their own analyses"
  on public.career_analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own analyses"
  on public.career_analyses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own analyses"
  on public.career_analyses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own analyses"
  on public.career_analyses for delete
  using (auth.uid() = user_id);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();
