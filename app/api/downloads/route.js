import { NextResponse } from 'next/server';
import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabaseServer';

export async function POST(req) {
  const { id } = await req.json();
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, demo: true });
  try {
    const sb = createServerSupabase();
    const { data } = await sb.from('media_gallery').select('download_count').eq('id', id).single();
    await sb.from('media_gallery').update({ download_count: (data?.download_count || 0) + 1 }).eq('id', id);
  } catch {}
  return NextResponse.json({ ok: true });
}
