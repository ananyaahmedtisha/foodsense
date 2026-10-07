import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabaseAdmin';

export async function GET() {
  const sb = adminSupabase();
  if (!sb) return NextResponse.json({ items: [], demo: true });
  const { data, error } = await sb.from('categories').select('*').order('display_order');
  if (error) return NextResponse.json({ error: error.message, items: [], needsMigration: true }, { status: 200 });
  return NextResponse.json({ items: data });
}

export async function POST(req) {
  const body = await req.json();
  const sb = adminSupabase();
  const { error } = await sb.from('categories').insert({ name: body.name, scope: body.scope || 'all', display_order: body.display_order || 0 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PUT(req) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const sb = adminSupabase();
  const patch = {};
  for (const k of ['name', 'scope', 'display_order']) if (body[k] !== undefined) patch[k] = body[k];
  const { error } = await sb.from('categories').update(patch).eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const sb = adminSupabase();
  const { error } = await sb.from('categories').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
