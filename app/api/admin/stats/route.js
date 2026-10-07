import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabaseAdmin';
import { isSupabaseConfigured } from '@/lib/supabaseServer';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ responses: 127, downloads: 116, posts: 3, demo: true });
  }
  const sb = adminSupabase();
  const [{ count: responses }, { data: media }, { count: posts }] = await Promise.all([
    sb.from('survey_responses').select('*', { count: 'exact', head: true }),
    sb.from('media_gallery').select('download_count'),
    sb.from('posts').select('*', { count: 'exact', head: true }).eq('published', true),
  ]);
  return NextResponse.json({
    responses: responses ?? 0,
    downloads: media?.reduce((s, m) => s + (m.download_count || 0), 0) ?? 0,
    posts: posts ?? 0,
  });
}
