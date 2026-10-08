import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabaseAdmin';

export async function GET() {
  const sb = adminSupabase();
  if (!sb) return NextResponse.json({ items: [], demo: true });
  const { data, error } = await sb.from('food_requests').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: error.message, items: [], needsMigration: true });
  return NextResponse.json({ items: data });
}

export async function PUT(req) {
  const { id, status } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const sb = adminSupabase();
  const { error } = await sb.from('food_requests').update({ status: status || 'added' }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const sb = adminSupabase();
  const { error } = await sb.from('food_requests').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
