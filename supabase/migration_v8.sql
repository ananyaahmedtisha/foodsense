-- FoodSense migration v8 — run in Supabase Dashboard > SQL Editor
-- Marks whether a survey question must be answered.

alter table survey_questions add column if not exists is_required boolean default true;
