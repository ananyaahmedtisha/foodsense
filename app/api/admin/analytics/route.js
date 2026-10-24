import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabaseAdmin';
import { isSupabaseConfigured } from '@/lib/supabaseServer';
import { normalizeType, optionsOf, scaleValues } from '@/lib/surveyTypes';
import { unpackQuestions } from '@/lib/surveyMeta';
export const dynamic = 'force-dynamic';

function meaningful(a) {
  if (a === undefined || a === null || a === '') return false;
  if (Array.isArray(a)) return a.length > 0;
  return String(a).trim() !== '';
}

function scoreQuestion(q, raw) {
  const type = normalizeType(q.question_type);
  const answers = (raw || []).filter(meaningful);
  const base = { total: answers.length, correct: null, pct: null, dist: null, samples: null, average: null };

  if (type === 'multiple_choice' || type === 'dropdown') {
    const dist = {};
    for (const o of optionsOf(q)) dist[o] = 0;
    for (const a of answers) if (typeof a === 'string') dist[a] = (dist[a] || 0) + 1;
    const correct = q.correct_answer ? answers.filter((a) => a === q.correct_answer).length : null;
    const pct = q.correct_answer && answers.length ? Math.round((correct / answers.length) * 100) : null;
    return { ...base, correct, pct, dist };
  }

  if (type === 'checkbox') {
    const dist = {};
    for (const o of optionsOf(q)) dist[o] = 0;
    for (const a of answers) {
      const arr = Array.isArray(a) ? a : [a];
      for (const o of arr) dist[o] = (dist[o] || 0) + 1;
    }
    return { ...base, dist };
  }

  if (type === 'linear_scale' || type === 'rating') {
    const dist = {};
    for (const v of scaleValues(q)) dist[String(v)] = 0;
    let sum = 0;
    for (const a of answers) {
      const key = String(a);
      dist[key] = (dist[key] || 0) + 1;
      const n = Number(a);
      if (Number.isFinite(n)) sum += n;
    }
    const average = answers.length ? Number((sum / answers.length).toFixed(2)) : null;
    return { ...base, dist, average };
  }

  if (type === 'number') {
    const nums = answers.map(Number).filter((n) => Number.isFinite(n));
    const average = nums.length ? Number((nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(2)) : null;
    return {
      ...base,
      average,
      min: nums.length ? Math.min(...nums) : null,
      max: nums.length ? Math.max(...nums) : null,
      samples: answers.map((a) => String(a)).sort((a, b) => Number(a) - Number(b)),
    };
  }

  // short answer, paragraph, date, time, email, phone, url
  return { ...base, samples: answers.map((a) => String(a)) };
}

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ demo: true });
  const sb = adminSupabase();

  const [{ data: surveys }, { data: questions }, { data: responses }, { data: media }, { data: settings }] = await Promise.all([
    sb.from('surveys').select('*').order('created_at'),
    sb.from('survey_questions').select('*').order('created_at'),
    sb.from('survey_responses').select('survey_id, answers, submitted_at').order('submitted_at', { ascending: false }).limit(10000),
    sb.from('media_gallery').select('media_type,download_count'),
    sb.from('site_settings').select('*'),
  ]);

  const settingsMap = {};
  for (const s of settings || []) settingsMap[s.key] = s.value;
  const impact = { baseline_survey_id: '', endline_survey_id: '', ...(settingsMap.impact || {}) };

  const bySurvey = {};
  for (const s of surveys || []) {
    const qs = unpackQuestions((questions || []).filter((q) => q.survey_id === s.id));
    const rs = (responses || []).filter((r) => r.survey_id === s.id);
    const qResults = qs.map((q) => {
      const vals = rs.map((r) => r.answers?.[q.id]);
      return {
        id: q.id,
        text: q.question_text,
        description: q.description || '',
        type: normalizeType(q.question_type),
        options: q.options || [],
        settings: q.settings || {},
        correct_answer: q.correct_answer || '',
        ...scoreQuestion(q, vals),
      };
    });

    // Responses per day (last 30 days, filled) for the trend chart.
    const byDay = {};
    for (const r of rs) {
      const d = new Date(r.submitted_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      byDay[key] = (byDay[key] || 0) + 1;
    }
    const timeline = Object.entries(byDay)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, 14)
      .map(([date, count]) => ({ date, count }))
      .reverse();

    bySurvey[s.id] = {
      id: s.id,
      title: s.title,
      description: s.description || '',
      is_active: s.is_active,
      total: rs.length,
      latest: rs[0]?.submitted_at || null,
      questions: qResults,
      timeline,
    };
  }

  // Baseline vs endline: match scored choice questions by text
  const comparison = [];
  const b = bySurvey[impact.baseline_survey_id];
  const e = bySurvey[impact.endline_survey_id];
  if (b && e) {
    for (const qb of b.questions) {
      if (!['multiple_choice', 'dropdown'].includes(qb.type) || !qb.correct_answer || qb.pct === null) continue;
      const qe = e.questions.find(
        (q) => q.text.trim().toLowerCase() === qb.text.trim().toLowerCase() && ['multiple_choice', 'dropdown'].includes(q.type)
      );
      if (!qe || qe.pct === null) continue;
      const improvement = qb.pct === 0 ? (qe.pct > 0 ? 100 : 0) : Math.round(((qe.pct - qb.pct) / qb.pct) * 100);
      comparison.push({ question: qb.text, baseline_pct: qb.pct, baseline_n: qb.total, endline_pct: qe.pct, endline_n: qe.total, improvement });
    }
  }

  const totalResponses = (responses || []).length;
  const downloads = (media || []).filter((m) => m.media_type !== 'video').reduce((s, m) => s + (m.download_count || 0), 0);
  const views = (media || []).filter((m) => m.media_type === 'video').reduce((s, m) => s + (m.download_count || 0), 0);

  return NextResponse.json({
    surveys: bySurvey,
    surveyList: (surveys || []).map((s) => ({ id: s.id, title: s.title, is_active: s.is_active })),
    impact,
    lives_reached: totalResponses + downloads + views,
    total_responses: totalResponses,
    downloads,
    views,
    comparison,
  });
}
