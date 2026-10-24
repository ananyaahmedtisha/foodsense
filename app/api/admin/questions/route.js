import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabaseAdmin';
import { isSupabaseConfigured } from '@/lib/supabaseServer';
import { packOptions, unpackQuestion, unpackQuestions } from '@/lib/surveyMeta';

export const dynamic = 'force-dynamic';

// Questions of one survey (admin view, includes correct answers + settings)
export async function GET(req) {
  const surveyId = new URL(req.url).searchParams.get('survey_id');
  if (!surveyId) return NextResponse.json({ error: 'survey_id required' }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ items: [], demo: true });
  const sb = adminSupabase();

  let { data, error } = await sb
    .from('survey_questions')
    .select('*')
    .eq('survey_id', surveyId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  // Projects without migration v9 have no display_order column.
  if (error) {
    const retry = await sb.from('survey_questions').select('*').eq('survey_id', surveyId).order('created_at');
    data = retry.data;
    error = retry.error;
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: unpackQuestions(data) });
}

// Add a question to an existing survey
export async function POST(req) {
  const body = await req.json();
  if (!body.survey_id) return NextResponse.json({ error: 'survey_id required' }, { status: 400 });
  if (!body.question_text?.trim()) return NextResponse.json({ error: 'question_text required' }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, demo: true });

  const sb = adminSupabase();
  const { count } = await sb
    .from('survey_questions')
    .select('id', { count: 'exact', head: true })
    .eq('survey_id', body.survey_id);

  const order = Number.isFinite(Number(body.display_order)) ? Number(body.display_order) : count || 0;
  const options = (Array.isArray(body.options) ? body.options : []).filter((o) => typeof o === 'string');
  const row = {
    survey_id: body.survey_id,
    question_text: body.question_text.trim(),
    question_type: body.question_type || 'multiple_choice',
    options,
    is_required: body.is_required !== false,
    correct_answer: body.correct_answer || '',
    settings: body.settings || {},
    description: body.description || '',
    display_order: order,
  };

  let partial = false;
  let { data, error } = await sb.from('survey_questions').insert(row).select().single();
  if (error) {
    // No v9 columns yet — pack the extras into `options` instead.
    partial = true;
    const retry = await sb
      .from('survey_questions')
      .insert({
        survey_id: row.survey_id,
        question_text: row.question_text,
        question_type: row.question_type,
        options: packOptions(options, { settings: row.settings, description: row.description, display_order: order }),
        is_required: row.is_required,
        correct_answer: row.correct_answer,
      })
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, item: unpackQuestion(data), partial });
}

// Update one question, or re-order a whole list with { order: [ids…] }
export async function PUT(req) {
  const body = await req.json();
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, demo: true });
  const sb = adminSupabase();

  if (Array.isArray(body.order)) {
    let failed = null;
    for (let i = 0; i < body.order.length; i += 1) {
      const { error } = await sb.from('survey_questions').update({ display_order: i }).eq('id', body.order[i]);
      if (error) { failed = error; break; }
    }
    if (!failed) return NextResponse.json({ ok: true });

    // Fallback: store the order inside each question's packed metadata.
    const { data, error } = await sb.from('survey_questions').select('*').in('id', body.order);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const byId = Object.fromEntries((data || []).map((q) => [q.id, unpackQuestion(q)]));
    for (let i = 0; i < body.order.length; i += 1) {
      const q = byId[body.order[i]];
      if (!q) continue;
      const options = packOptions(q.options, { settings: q.settings, description: q.description, display_order: i });
      const { error: e2 } = await sb.from('survey_questions').update({ options }).eq('id', q.id);
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, partial: true });
  }

  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const patch = {};
  if (body.question_text !== undefined) patch.question_text = body.question_text;
  if (body.question_type !== undefined) patch.question_type = body.question_type;
  if (body.options !== undefined) patch.options = (Array.isArray(body.options) ? body.options : []).filter((o) => typeof o === 'string');
  if (body.correct_answer !== undefined) patch.correct_answer = body.correct_answer;
  if (body.is_required !== undefined) patch.is_required = !!body.is_required;
  if (body.settings !== undefined) patch.settings = body.settings || {};
  if (body.description !== undefined) patch.description = body.description;
  if (body.display_order !== undefined) patch.display_order = Number(body.display_order) || 0;

  let partial = false;
  let { error } = await sb.from('survey_questions').update(patch).eq('id', body.id);
  if (error) {
    partial = true;
    const { data: current } = await sb.from('survey_questions').select('*').eq('id', body.id).single();
    const base = unpackQuestion(current || {});
    const merged = {
      options: body.options !== undefined ? patch.options : base.options || [],
      settings: body.settings !== undefined ? patch.settings : base.settings || {},
      description: body.description !== undefined ? patch.description : base.description || '',
      display_order: body.display_order !== undefined ? patch.display_order : base.display_order || 0,
    };
    const safe = {};
    if (body.question_text !== undefined) safe.question_text = body.question_text;
    if (body.question_type !== undefined) safe.question_type = body.question_type;
    if (body.correct_answer !== undefined) safe.correct_answer = body.correct_answer;
    if (body.is_required !== undefined) safe.is_required = !!body.is_required;
    safe.options = packOptions(merged.options, merged);
    const retry = await sb.from('survey_questions').update(safe).eq('id', body.id);
    error = retry.error;
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, partial });
}

// Delete a single question
export async function DELETE(req) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, demo: true });
  const sb = adminSupabase();
  const { error } = await sb.from('survey_questions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
