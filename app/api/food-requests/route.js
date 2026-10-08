import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabaseAdmin';

// Public: request a missing food. Admin triages in Admin → Foods.
export async function POST(req) {
  const { food_name, details } = await req.json();
  if (!food_name?.trim()) return NextResponse.json({ error: 'Food name is required' }, { status: 400 });
  const sb = adminSupabase();
  if (!sb) return NextResponse.json({ ok: true, demo: true });
  const { error } = await sb.from('food_requests').insert({
    food_name: food_name.trim().slice(0, 120),
    details: (details || '').trim().slice(0, 1000),
    status: 'pending',
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
