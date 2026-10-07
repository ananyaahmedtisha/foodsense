import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabaseAdmin';
import { isSupabaseConfigured } from '@/lib/supabaseServer';

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ items: [], demo: true });
  const sb = adminSupabase();
  const { data, error } = await sb.from('posts').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req) {
  const body = await req.json();
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, demo: true });
  const sb = adminSupabase();
  const { error } = await sb.from('posts').insert({
    title: body.title, slug: body.slug, category: body.category,
    excerpt: body.excerpt, content: body.content,
    cover_image_url: body.cover_image_url || null,
    published: body.published ?? true, reading_minutes: body.reading_minutes || 5,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PUT(req) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const sb = adminSupabase();
  const patch = {};
  for (const k of ['title', 'slug', 'category', 'excerpt', 'content', 'cover_image_url', 'published', 'reading_minutes']) {
    if (body[k] !== undefined) patch[k] = body[k];
  }
  const { error } = await sb.from('posts').update(patch).eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const sb = adminSupabase();
  const { error } = await sb.from('posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
