import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabaseServer';

export async function POST(req) {
  const { survey_id, answers } = await req.json();
  if (!survey_id) return NextResponse.json({ error: 'missing survey_id' }, { status: 400 });
  if (!isSupabaseConfigured()) {
    console.log('[demo] survey response', survey_id, answers);
    return NextResponse.json({ ok: true, demo: true });
  }
  const sb = createServerSupabase();
  const { error } = await sb.from('survey_responses').insert({ survey_id, answers });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath('/');
  return NextResponse.json({ ok: true });
}
