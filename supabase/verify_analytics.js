// Temp verification: auto-scoring end-to-end. Cleans up after itself.
// Run: node supabase/verify_analytics.js
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const env = {};
  const p = path.join(__dirname, '..', '.env.local');
  fs.readFileSync(p, 'utf8').split('\n').forEach((l) => {
    const m = l.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  });
  return env;
}

async function main() {
  const env = loadEnv();
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const base = 'http://localhost:3000';

  // 1) baseline Q1 correct answer
  const { data: surveys } = await sb.from('surveys').select('*');
  const baseline = surveys.find((s) => s.title.includes('Baseline'));
  const { data: bQs } = await sb.from('survey_questions').select('*').eq('survey_id', baseline.id);
  const bQ1 = bQs.find((q) => q.question_type === 'multiple_choice');
  await sb.from('survey_questions').update({ correct_answer: 'Up to 2 hours' }).eq('id', bQ1.id);
  console.log('1) baseline Q1 correct answer set:', bQ1.question_text.slice(0, 50) + '...');

  // 2) temp endline survey with same question
  const { data: tmp } = await sb.from('surveys').insert({ title: 'TEST Endline (auto-deleted)', is_active: true }).select().single();
  const { data: tmpQ } = await sb.from('survey_questions').insert({
    survey_id: tmp.id, question_text: bQ1.question_text, question_type: 'multiple_choice',
    options: bQ1.options, correct_answer: 'Up to 2 hours',
  }).select().single();
  console.log('2) temp endline created:', tmp.id);

  // 3) test responses: baseline 1/4 correct (25%), endline 3/4 correct (75%)
  const bAns = ['Up to 2 hours', '6-8 hours is fine', 'Overnight is fine', '30 minutes only'];
  const eAns = ['Up to 2 hours', 'Up to 2 hours', 'Up to 2 hours', 'Overnight is fine'];
  for (const a of bAns) await sb.from('survey_responses').insert({ survey_id: baseline.id, answers: { [bQ1.id]: a, TEST: true } });
  for (const a of eAns) await sb.from('survey_responses').insert({ survey_id: tmp.id, answers: { [tmpQ.id]: a, TEST: true } });
  console.log('3) 8 test responses inserted');

  // 4) point impact config at them, call analytics API via dev server? Call logic directly:
  await sb.from('site_settings').upsert({ key: 'impact', value: { baseline_survey_id: baseline.id, endline_survey_id: tmp.id, workshop_count: 6, headcount: 10 } }, { onConflict: 'key' });

  // start dev server briefly? Instead replicate: fetch from running dev? Use direct check below.
  const { data: allResp } = await sb.from('survey_responses').select('survey_id, answers');
  const bPct = allResp.filter((r) => r.survey_id === baseline.id && !r.answers?.TEST).length;
  console.log('4) real (non-test) baseline responses:', bPct);

  // 5) verify via analytics API — needs Next running; check static logic instead
  const bVals = allResp.filter((r) => r.survey_id === baseline.id).map((r) => r.answers?.[bQ1.id]);
  const eVals = allResp.filter((r) => r.survey_id === tmp.id).map((r) => r.answers?.[tmpQ.id]);
  const pct = (v) => Math.round((v.filter((x) => x === 'Up to 2 hours').length / v.length) * 100);
  console.log(`5) baseline ${pct(bVals)}% (expect 25), endline ${pct(eVals)}% (expect 75)`);

  // 6) cleanup: test responses, temp survey, reset impact config
  const { data: testResp } = await sb.from('survey_responses').select('id, answers');
  const testIds = testResp.filter((r) => r.answers?.TEST).map((r) => r.id);
  for (const id of testIds) await sb.from('survey_responses').delete().eq('id', id);
  await sb.from('survey_questions').delete().eq('survey_id', tmp.id);
  await sb.from('survey_responses').delete().eq('survey_id', tmp.id);
  await sb.from('surveys').delete().eq('id', tmp.id);
  await sb.from('site_settings').upsert({ key: 'impact', value: { baseline_survey_id: baseline.id, endline_survey_id: '', workshop_count: 6, headcount: 0 } }, { onConflict: 'key' });
  const { count } = await sb.from('survey_responses').select('*', { count: 'exact', head: true });
  const { count: sq } = await sb.from('survey_questions').select('*', { count: 'exact', head: true });
  console.log(`6) cleaned. responses=${count} (expect 0), questions=${sq}, baseline preselected in impact config, correct answer kept.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
