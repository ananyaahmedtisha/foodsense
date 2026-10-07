import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabaseAdmin';
import { getContactInfo } from '@/lib/content';

export async function GET(req) {
  const key = new URL(req.url).searchParams.get('key') || 'contact';
  if (key === 'contact') return NextResponse.json({ info: await getContactInfo() });
  const sb = adminSupabase();
  if (!sb) return NextResponse.json({ value: null, demo: true });
  const { data } = await sb.from('site_settings').select('value').eq('key', key).single();
  return NextResponse.json({ value: data?.value || null });
}

export async function PUT(req) {
  const body = await req.json();
  const sb = adminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 400 });
  // New style: { key, value }. Legacy (contact form): whole body is the value.
  const key = body.key || 'contact';
  const value = body.key ? body.value : body;
  const { error } = await sb.from('site_settings').upsert({ key, value }, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
