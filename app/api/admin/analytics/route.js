import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabaseAdmin';
import { isSupabaseConfigured } from '@/lib/supabaseServer';

function scoreQuestion(q, answers) {
  // answers: array of submitted values for this question id
  if (q.question_type === 'multiple_choice' && q.correct_answer) {
    const total = answers.filter((a) => a !== undefined && a !== '').length;
    const correct = answers.filter((a) => a === q.correct_answer).length;
    const dist = {};
    for (const o of q.options || []) dist[o] = 0;
    for (const a of answers) {
      if (typeof a === 'string') dist[a] = (dist[a] || 0) + 1;
    }
    return { total, correct, pct: total ? Math.round((correct / total) * 100) : null, dist };
  }
  if (q.question_type === 'checkbox') {
    const dist = {};
    for (const o of q.options || []) dist[o] = 0;
    let total = 0;
    for (const a of answers) {
      if (Array.isArray(a)) { total += 1; for (const o of a) dist[o] = (dist[o] || 0) + 1; }
    }
    return { total, correct: null, pct: null, dist };
  }
  return { total: answers.filter((a) => String(a || '').trim()).length, correct: null, pct: null, dist: null, samples: answers.filter((a) => String(a || '').trim()).slice(0, 5) };
}

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ demo: true });
  const sb = adminSupabase();

  const [{ data: surveys }, { data: questions }, { data: responses }, { data: media }, { data: settings }] = await Promise.all([
    sb.from('surveys').select('*').order('created_at'),
    sb.from('survey_questions').select('*'),
    sb.from('survey_responses').select('survey_id, answers'),
    sb.from('media_gallery').select('download_count'),
    sb.from('site_settings').select('*'),
  ]);

  const settingsMap = {};
  for (const s of settings || []) settingsMap[s.key] = s.value;
  const impact = { baseline_survey_id: '', endline_survey_id: '', ...(settingsMap.impact || {}) };

  const bySurvey = {};
  for (const s of surveys || []) {
    const qs = (questions || []).filter((q) => q.survey_id === s.id);
    const rs = (responses || []).filter((r) => r.survey_id === s.id);
    const qResults = qs.map((q) => {
      const vals = rs.map((r) => r.answers?.[q.id]);
      return { id: q.id, text: q.question_text, type: q.question_type, options: q.options || [], correct_answer: q.correct_answer || '', ...scoreQuestion(q, vals) };
    });
    bySurvey[s.id] = { id: s.id, title: s.title, is_active: s.is_active, total: rs.length, questions: qResults };
  }

  // Baseline vs endline: match multiple-choice questions by text
  let comparison = [];
  const b = bySurvey[impact.baseline_survey_id];
  const e = bySurvey[impact.endline_survey_id];
  if (b && e) {
    for (const qb of b.questions) {
      if (qb.type !== 'multiple_choice' || !qb.correct_answer || qb.pct === null) continue;
      const qe = e.questions.find((q) => q.text.trim().toLowerCase() === qb.text.trim().toLowerCase() && q.type === 'multiple_choice');
      if (!qe || qe.pct === null) continue;
      const improvement = qb.pct === 0 ? (qe.pct > 0 ? 100 : 0) : Math.round(((qe.pct - qb.pct) / qb.pct) * 100);
      comparison.push({ question: qb.text, baseline_pct: qb.pct, baseline_n: qb.total, endline_pct: qe.pct, endline_n: qe.total, improvement });
    }
  }

  const totalResponses = (responses || []).length;
  const downloads = (media || []).reduce((s, m) => s + (m.download_count || 0), 0);
  return NextResponse.json({
    surveys: bySurvey,
    surveyList: (surveys || []).map((s) => ({ id: s.id, title: s.title, is_active: s.is_active })),
    impact,
    lives_reached: totalResponses + downloads,
    total_responses: totalResponses,
    downloads,
    comparison,
  });
}
