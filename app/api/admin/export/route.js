import { adminSupabase } from '@/lib/supabaseAdmin';
import { isSupabaseConfigured } from '@/lib/supabaseServer';

export async function GET() {
  let rows = [{ survey_id: 'demo', answers: '{"q1":"Up to 2 hours"}', submitted_at: new Date().toISOString() }];
  if (isSupabaseConfigured()) {
    const sb = adminSupabase();
    const { data } = await sb.from('survey_responses').select('*').order('submitted_at', { ascending: false }).limit(2000);
    if (data) rows = data;
  }
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = ['id,survey_id,answers,submitted_at', ...rows.map((r) => [r.id, r.survey_id, JSON.stringify(r.answers), r.submitted_at].map(esc).join(','))].join('\n');
  return new Response(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="foodsense-responses.csv"' } });
}
