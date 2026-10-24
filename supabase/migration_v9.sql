-- FoodSense migration v9 — run in Supabase Dashboard > SQL Editor
-- Survey studio: full question types, help text, ordering, images/PNG export.
-- Also (re)applies the v7 description + v8 mandatory columns, so one run is enough.

alter table surveys add column if not exists description text default '';

alter table survey_questions add column if not exists is_required boolean default true;
alter table survey_questions add column if not exists settings jsonb default '{}';
alter table survey_questions add column if not exists description text default '';
alter table survey_questions add column if not exists display_order integer default 0;

-- Keep existing rows ordered predictably after the new column is added.
update survey_questions
set display_order = ranked.rn
from (
  select id, row_number() over (partition by survey_id order by created_at) - 1 as rn
  from survey_questions
) ranked
where survey_questions.id = ranked.id
  and (survey_questions.display_order is null or survey_questions.display_order = 0);

create index if not exists survey_questions_survey_order
  on survey_questions (survey_id, display_order);

create index if not exists survey_responses_survey_time
  on survey_responses (survey_id, submitted_at desc);
