-- FoodSense migration v2 — run in Supabase Dashboard > SQL Editor
-- Adds: dynamic categories, editable games, contact page + messages.
-- Safe to run multiple times (IF NOT EXISTS guards).

create extension if not exists "uuid-ossp";

-- 1) Dynamic categories/segments for articles, posters, videos
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  scope text not null default 'all',
  display_order int default 0,
  created_at timestamptz default now()
);

-- category column for media (posters/videos)
alter table media_gallery add column if not exists category text default '';

-- 2) Editable games: game_key = 'redflag' | 'fuel'
create table if not exists game_cards (
  id uuid primary key default uuid_generate_v4(),
  game_key text not null default 'redflag',
  prompt text not null,
  verdict text,
  explanation text,
  meta jsonb default '{}',
  display_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 3) Contact page content (editable) + inbox
create table if not exists site_settings (
  key text primary key,
  value jsonb default '{}',
  updated_at timestamptz default now()
);

create table if not exists contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  message text not null,
  created_at timestamptz default now()
);

-- 4) RLS
alter table categories enable row level security;
alter table game_cards enable row level security;
alter table site_settings enable row level security;
alter table contact_messages enable row level security;

drop policy if exists "public read categories" on categories;
create policy "public read categories" on categories for select to anon, authenticated using (true);

drop policy if exists "public read active cards" on game_cards;
create policy "public read active cards" on game_cards for select to anon, authenticated using (is_active = true);

drop policy if exists "public read settings" on site_settings;
create policy "public read settings" on site_settings for select to anon, authenticated using (true);

drop policy if exists "anon insert messages" on contact_messages;
create policy "anon insert messages" on contact_messages for insert to anon, authenticated with check (true);

-- 5) Public read of storage files (in case bucket was created as private)
drop policy if exists "public read foodsense-media" on storage.objects;
create policy "public read foodsense-media" on storage.objects for select to anon, authenticated using (bucket_id = 'foodsense-media');

-- 6) Default segments (matches current site)
insert into categories (name, scope, display_order) values
  ('Hostel Storage', 'article', 1),
  ('Label Reading', 'article', 2),
  ('Microbe Safety', 'article', 3),
  ('Nutrition', 'article', 4),
  ('Hand Hygiene', 'poster', 5),
  ('Kitchen Safety', 'poster', 6),
  ('Micro-world', 'video', 7)
on conflict (name) do nothing;

-- 7) Default contact info (admin can edit later)
insert into site_settings (key, value) values
  ('contact', '{"email": "hello@foodsense.example", "phone": "", "address": "Merul Badda, Dhaka", "hours": "Sat-Thu, 10am-6pm", "facebook": "", "instagram": "", "about": "Questions, workshop invites, or poster requests — we reply within 2 days."}')
on conflict (key) do nothing;
