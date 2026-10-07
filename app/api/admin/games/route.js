import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabaseAdmin';

export async function GET(req) {
  const key = new URL(req.url).searchParams.get('key');
  const sb = adminSupabase();
  if (!sb) return NextResponse.json({ items: [], demo: true });
  let q = sb.from('game_cards').select('*').order('display_order');
  if (key) q = q.eq('game_key', key);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message, items: [], needsMigration: true }, { status: 200 });
  return NextResponse.json({ items: data });
}

export async function POST(req) {
  const body = await req.json();
  const sb = adminSupabase();
  const { error } = await sb.from('game_cards').insert({
    game_key: body.game_key || 'redflag',
    prompt: body.prompt,
    verdict: body.verdict || null,
    explanation: body.explanation || '',
    meta: body.meta || {},
    display_order: body.display_order || 0,
    is_active: body.is_active ?? true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PUT(req) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const sb = adminSupabase();
  const patch = {};
  for (const k of ['prompt', 'verdict', 'explanation', 'meta', 'display_order', 'is_active', 'game_key']) {
    if (body[k] !== undefined) patch[k] = body[k];
  }
  const { error } = await sb.from('game_cards').update(patch).eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const sb = adminSupabase();
  const { error } = await sb.from('game_cards').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
