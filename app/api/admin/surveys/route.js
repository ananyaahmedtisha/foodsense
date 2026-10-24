import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabaseAdmin';
import { isSupabaseConfigured } from '@/lib/supabaseServer';
import { packOptions } from '@/lib/surveyMeta';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ items: [], demo: true });
  const sb = adminSupabase();
  const { data: surveys } = await sb.from('surveys').select('*').order('created_at', { ascending: false });
  const { data: responses } = await sb.from('survey_responses').select('survey_id');
  const counts = {};
  for (const r of responses || []) counts[r.survey_id] = (counts[r.survey_id] || 0) + 1;
  return NextResponse.json({ items: (surveys || []).map((s) => ({ ...s, responses: counts[s.id] || 0 })) });
}

export async function POST(req) {
  const { title, questions, description } = await req.json();
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, demo: true, id: 's1' });
  const sb = adminSupabase();
  const { data: survey, error } = await sb.from('surveys').insert({ title, description: description || '', is_active: true }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (questions?.length) {
    const rows = questions
      .filter((q) => q.question_text?.trim())
      .map((q, i) => ({
        survey_id: survey.id,
        question_text: q.question_text.trim(),
        question_type: q.question_type || 'multiple_choice',
        options: Array.isArray(q.options) ? q.options : [],
        is_required: q.is_required !== false,
        correct_answer: q.correct_answer || '',
        settings: q.settings || {},
        description: q.description || '',
        display_order: i,
      }));

    if (rows.length) {
      let { error: qError } = await sb.from('survey_questions').insert(rows);
      if (qError) {
        // Projects that haven't run migration v9 yet: keep the extras in `options`.
        const safe = rows.map((r) => ({
          survey_id: r.survey_id,
          question_text: r.question_text,
          question_type: r.question_type,
          options: packOptions(r.options, {
            settings: r.settings,
            description: r.description,
            display_order: r.display_order,
          }),
          is_required: r.is_required,
          correct_answer: r.correct_answer,
        }));
        qError = (await sb.from('survey_questions').insert(safe)).error;
      }
      if (qError) return NextResponse.json({ error: qError.message, id: survey.id }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true, id: survey.id });
}

export async function PUT(req) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, demo: true });
  const sb = adminSupabase();
  const patch = {};
  if (body.title !== undefined) patch.title = body.title;
  if (body.description !== undefined) patch.description = body.description;
  if (body.is_active !== undefined) patch.is_active = body.is_active;
  if (!Object.keys(patch).length) return NextResponse.json({ ok: true });
  const { error } = await sb.from('surveys').update(patch).eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, demo: true });
  const sb = adminSupabase();
  await sb.from('survey_questions').delete().eq('survey_id', id);
  await sb.from('survey_responses').delete().eq('survey_id', id);
  const { error } = await sb.from('surveys').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
