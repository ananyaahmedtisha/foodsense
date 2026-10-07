-- FoodSense Supabase schema — run in Supabase Dashboard > SQL Editor
-- Storage: create public bucket named "foodsense-media" after running this.

create extension if not exists "uuid-ossp";

-- Posts
create table if not exists posts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text unique not null,
  category text not null default 'Microbe Safety',
  content text,
  excerpt text,
  cover_image_url text,
  reading_minutes int default 5,
  published boolean default false,
  created_at timestamptz default now()
);

-- Media gallery
do $$ begin
  create type media_type_enum as enum ('poster', 'video');
exception when duplicate_object then null; end $$;

create table if not exists media_gallery (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  media_type text not null default 'poster',
  file_url text,
  thumbnail_url text,
  download_count int default 0,
  created_at timestamptz default now()
);

-- Team
create table if not exists team_members (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  role text not null,
  bio text,
  image_url text,
  display_order int default 0,
  created_at timestamptz default now()
);

-- Surveys
create table if not exists surveys (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists survey_questions (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid references surveys(id) on delete cascade,
  question_text text not null,
  question_type text not null default 'multiple_choice',
  options jsonb default '[]',
  created_at timestamptz default now()
);

create table if not exists survey_responses (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid references surveys(id) on delete cascade,
  answers jsonb default '{}',
  submitted_at timestamptz default now()
);

-- Public read, admin write (enable RLS + anon read)
alter table posts enable row level security;
alter table media_gallery enable row level security;
alter table team_members enable row level security;
alter table surveys enable row level security;
alter table survey_questions enable row level security;
alter table survey_responses enable row level security;

drop policy if exists "public read posts" on posts;
create policy "public read posts" on posts for select to anon, authenticated using (published = true);
drop policy if exists "public read media" on media_gallery;
create policy "public read media" on media_gallery for select to anon, authenticated using (true);
drop policy if exists "public read team" on team_members;
create policy "public read team" on team_members for select to anon, authenticated using (true);
drop policy if exists "public read surveys" on surveys;
create policy "public read surveys" on surveys for select to anon, authenticated using (is_active = true);
drop policy if exists "public read questions" on survey_questions;
create policy "public read questions" on survey_questions for select to anon, authenticated using (true);
drop policy if exists "anon insert responses" on survey_responses;
create policy "anon insert responses" on survey_responses for insert to anon, authenticated with check (true);
