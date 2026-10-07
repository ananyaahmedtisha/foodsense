-- FoodSense migration v4 — run in Supabase Dashboard > SQL Editor
-- Lets the public homepage COUNT survey responses without exposing raw answers.
-- (survey_responses has no public SELECT policy by design; this function only returns numbers.)

create or replace function public.response_count(sid uuid default null)
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*) from public.survey_responses
  where (sid is null or survey_id = sid);
$$;

grant execute on function public.response_count(uuid) to anon, authenticated;
