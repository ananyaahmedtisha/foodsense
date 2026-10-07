import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabaseAdmin';

// Questions of one survey (admin view, includes correct answers)
export async function GET(req) {
  const surveyId = new URL(req.url).searchParams.get('survey_id');
  if (!surveyId) return NextResponse.json({ error: 'survey_id required' }, { status: 400 });
  const sb = adminSupabase();
  const { data, error } = await sb.from('survey_questions').select('*').eq('survey_id', surveyId).order('created_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

// Set the correct answer used for auto-scoring
export async function PUT(req) {
  const { id, correct_answer, question_text } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const sb = adminSupabase();
  const patch = {};
  if (correct_answer !== undefined) patch.correct_answer = correct_answer;
  if (question_text !== undefined) patch.question_text = question_text;
  const { error } = await sb.from('survey_questions').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
