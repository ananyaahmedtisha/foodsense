import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabaseAdmin';
import { isSupabaseConfigured } from '@/lib/supabaseServer';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'video/mp4', 'video/webm'];
const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(req) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 400 });
  const sb = adminSupabase();
  if (!sb) return NextResponse.json({ error: 'Missing service role key' }, { status: 500 });

  const form = await req.formData();
  const file = form.get('file');
  const folder = String(form.get('folder') || 'uploads').replace(/[^a-z0-9_-]/gi, '');
  if (!file || typeof file === 'string') return NextResponse.json({ error: 'No file received' }, { status: 400 });
  if (file.type && !ALLOWED.includes(file.type)) return NextResponse.json({ error: `File type not allowed: ${file.type}` }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File too large (max 12MB)' }, { status: 400 });

  const ext = (file.name?.split('.').pop() || 'bin').toLowerCase().slice(0, 8);
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await sb.storage.from('foodsense-media').upload(path, buf, { contentType: file.type || 'application/octet-stream', upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data } = sb.storage.from('foodsense-media').getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl, path });
}
