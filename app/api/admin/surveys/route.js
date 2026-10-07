import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabaseAdmin';
import { isSupabaseConfigured } from '@/lib/supabaseServer';

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
  const { title, questions } = await req.json();
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, demo: true, id: 's1' });
  const sb = adminSupabase();
  const { data: survey, error } = await sb.from('surveys').insert({ title, is_active: true }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (questions?.length) {
    const rows = questions
      .filter((q) => q.question_text?.trim())
      .map((q) => ({ survey_id: survey.id, question_text: q.question_text, question_type: q.question_type, options: q.options || [] }));
    if (rows.length) await sb.from('survey_questions').insert(rows);
  }
  return NextResponse.json({ ok: true, id: survey.id });
}

export async function PUT(req) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const sb = adminSupabase();
  const patch = {};
  if (body.title !== undefined) patch.title = body.title;
  if (body.is_active !== undefined) patch.is_active = body.is_active;
  const { error } = await sb.from('surveys').update(patch).eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const sb = adminSupabase();
  await sb.from('survey_questions').delete().eq('survey_id', id);
  await sb.from('survey_responses').delete().eq('survey_id', id);
  const { error } = await sb.from('surveys').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
