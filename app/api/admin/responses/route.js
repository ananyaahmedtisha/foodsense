import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabaseAdmin';
import { isSupabaseConfigured } from '@/lib/supabaseServer';
import { unpackQuestions } from '@/lib/surveyMeta';
export const dynamic = 'force-dynamic';

// All submissions for one survey, newest first, paginated.
// GET /api/admin/responses?survey_id=…&page=1&limit=25
export async function GET(req) {
  const url = new URL(req.url);
  const surveyId = url.searchParams.get('survey_id');
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(200, Math.max(5, Number(url.searchParams.get('limit')) || 25));

  if (!surveyId) return NextResponse.json({ error: 'survey_id required' }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ demo: true, items: [], total: 0, page, limit });

  const sb = adminSupabase();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const [qRes, rRes] = await Promise.all([
    sb.from('survey_questions').select('*').eq('survey_id', surveyId).order('created_at'),
    sb
      .from('survey_responses')
      .select('id, answers, submitted_at', { count: 'exact' })
      .eq('survey_id', surveyId)
      .order('submitted_at', { ascending: false })
      .range(from, to),
  ]);

  if (rRes.error) return NextResponse.json({ error: rRes.error.message }, { status: 500 });

  return NextResponse.json({
    items: rRes.data || [],
    total: rRes.count || 0,
    page,
    limit,
    questions: unpackQuestions(qRes.data),
  });
}

// Delete a single submission
export async function DELETE(req) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, demo: true });
  const sb = adminSupabase();
  const { error } = await sb.from('survey_responses').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
