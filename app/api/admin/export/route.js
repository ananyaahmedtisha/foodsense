import { adminSupabase } from '@/lib/supabaseAdmin';
import { isSupabaseConfigured } from '@/lib/supabaseServer';

const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const fileSafe = (s) => String(s || 'survey').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50) || 'survey';

function cellOf(ans) {
  if (Array.isArray(ans)) return ans.join('; ');
  if (ans === undefined || ans === null) return '';
  return String(ans);
}

// GET /api/admin/export?survey_id=... → one column per question, answer text per cell.
export async function GET(req) {
  const surveyId = new URL(req.url).searchParams.get('survey_id');
  if (!isSupabaseConfigured()) {
    return new Response('submitted,question,answer\n"2026-01-01","demo","demo"', {
      headers: { 'Content-Type': 'text/csv' },
    });
  }
  const sb = adminSupabase();

  let surveys = [];
  if (surveyId) {
    const { data } = await sb.from('surveys').select('*').eq('id', surveyId).single();
    if (data) surveys = [data];
  } else {
    const { data } = await sb.from('surveys').select('*').order('created_at');
    surveys = data || [];
  }

  const { data: questions } = await sb.from('survey_questions').select('*');
  const { data: responses } = await sb
    .from('survey_responses')
    .select('*')
    .order('submitted_at', { ascending: false })
    .limit(5000);

  const lines = [];
  for (const s of surveys) {
    const qs = (questions || []).filter((q) => q.survey_id === s.id);
    const rs = (responses || []).filter((r) => r.survey_id === s.id);
    lines.push(`# ${s.title} (${rs.length} responses)`);
    lines.push(['Submitted', ...qs.map((q) => q.question_text)].map(esc).join(','));
    for (const r of rs) {
      lines.push([new Date(r.submitted_at).toLocaleString(), ...qs.map((q) => cellOf(r.answers?.[q.id]))].map(esc).join(','));
    }
    lines.push('');
  }

  const name = surveys.length === 1 ? fileSafe(surveys[0].title) : 'foodsense-responses';
  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${name}.csv"`,
    },
  });
}
