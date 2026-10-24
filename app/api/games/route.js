import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabaseAdmin';
import { getGameCards, rotateDaily } from '@/lib/content';
export const dynamic = 'force-dynamic';

// Public: live game cards (active only), daily-rotated. Falls back to demo.
export async function GET(req) {
  const key = new URL(req.url).searchParams.get('key') || 'redflag';
  const cards = rotateDaily(await getGameCards(key));
  return NextResponse.json({ items: cards });
}
