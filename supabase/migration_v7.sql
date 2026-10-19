-- FoodSense migration v7 — run in Supabase Dashboard > SQL Editor
-- Adds a paragraph description for surveys (shown on the form + survey list).

alter table surveys add column if not exists description text default '';
