-- FoodSense migration v3 — run in Supabase Dashboard > SQL Editor
-- Adds: correct answers for auto-scoring + impact config (baseline/endline, headcount).

alter table survey_questions add column if not exists correct_answer text default '';

insert into site_settings (key, value) values
  ('impact', '{"baseline_survey_id": "", "endline_survey_id": "", "workshop_count": 6, "headcount": 0}')
on conflict (key) do nothing;
