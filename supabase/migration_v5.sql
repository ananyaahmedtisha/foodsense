-- FoodSense migration v5 — run in Supabase Dashboard > SQL Editor
-- Adds optional social profile links for team members.

alter table team_members add column if not exists linkedin text default '';
alter table team_members add column if not exists github text default '';
alter table team_members add column if not exists facebook text default '';
alter table team_members add column if not exists instagram text default '';
