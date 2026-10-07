import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabaseAdmin';

// Public contact form → inbox. Admin reads via /api/admin/messages.
export async function POST(req) {
  const { name, email, message } = await req.json();
  if (!name?.trim() || !message?.trim()) return NextResponse.json({ error: 'Name and message required' }, { status: 400 });
  const sb = adminSupabase();
  if (!sb) return NextResponse.json({ ok: true, demo: true });
  const { error } = await sb.from('contact_messages').insert({ name: name.trim(), email: email?.trim() || '', message: message.trim() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
