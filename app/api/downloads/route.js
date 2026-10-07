import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { adminSupabase } from '@/lib/supabaseAdmin';
import { isSupabaseConfigured } from '@/lib/supabaseServer';

export async function POST(req) {
  const { id } = await req.json();
  // Service-role client: anonymous visitors may count downloads (no RLS update right),
  // but raw gallery data stays protected — this route only increments a number.
  const sb = adminSupabase();
  if (!isSupabaseConfigured() || !sb) return NextResponse.json({ ok: true, demo: true });
  try {
    const { data } = await sb.from('media_gallery').select('download_count').eq('id', id).single();
    if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });
    await sb.from('media_gallery').update({ download_count: (data.download_count || 0) + 1 }).eq('id', id);
    revalidatePath('/');
  } catch (e) {
    return NextResponse.json({ error: 'count failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
