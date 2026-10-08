-- FoodSense migration v6 — run in Supabase Dashboard > SQL Editor
-- Moves the calorie database into Supabase (admin-editable) + user food requests inbox.

create table if not exists calorie_foods (
  id uuid primary key default uuid_generate_v4(),
  food_id text unique not null,
  category text not null default '',
  name text not null,
  bn text[] default '{}',
  terms text default '',
  serving text default '',
  grams numeric default 0,
  kcal numeric default 0,
  protein numeric default 0,
  carbs numeric default 0,
  fat numeric default 0,
  fiber numeric default 0,
  note text default '',
  recipe boolean default false,
  created_at timestamptz default now()
);

create table if not exists food_requests (
  id uuid primary key default uuid_generate_v4(),
  food_name text not null,
  details text default '',
  status text default 'pending',
  created_at timestamptz default now()
);

alter table calorie_foods enable row level security;
alter table food_requests enable row level security;

drop policy if exists "public read calorie foods" on calorie_foods;
create policy "public read calorie foods" on calorie_foods for select to anon, authenticated using (true);

drop policy if exists "anon insert food requests" on food_requests;
create policy "anon insert food requests" on food_requests for insert to anon, authenticated with check (true);
