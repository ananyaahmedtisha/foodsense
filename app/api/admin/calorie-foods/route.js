import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabaseAdmin';

function rowOf(b) {
  return {
    food_id: b.food_id || ('BD' + String(Date.now()).slice(-6)),
    category: b.category || 'Other',
    name: b.name,
    bn: b.bn || [],
    terms: b.terms || '',
    serving: b.serving || '1 serving',
    grams: Number(b.grams) || 0,
    kcal: Number(b.kcal) || 0,
    protein: Number(b.protein) || 0,
    carbs: Number(b.carbs) || 0,
    fat: Number(b.fat) || 0,
    fiber: Number(b.fiber) || 0,
    note: b.note || '',
    recipe: !!b.recipe,
  };
}

export async function GET() {
  const sb = adminSupabase();
  if (!sb) return NextResponse.json({ items: [], demo: true });
  const { data, error } = await sb.from('calorie_foods').select('*').order('category').order('name');
  if (error) return NextResponse.json({ error: error.message, items: [], needsMigration: true });
  return NextResponse.json({ items: data });
}

export async function POST(req) {
  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });
  const sb = adminSupabase();
  const { error } = await sb.from('calorie_foods').insert(rowOf(body));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PUT(req) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const sb = adminSupabase();
  const { id } = body;
  const patch = {};
  for (const k of ['food_id', 'category', 'name', 'serving', 'note', 'terms']) {
    if (body[k] !== undefined) patch[k] = body[k];
  }
  for (const k of ['grams', 'kcal', 'protein', 'carbs', 'fat', 'fiber']) {
    if (body[k] !== undefined) patch[k] = Number(body[k]) || 0;
  }
  if (body.bn !== undefined) patch.bn = Array.isArray(body.bn) ? body.bn : String(body.bn).split(',').map((s) => s.trim()).filter(Boolean);
  if (body.recipe !== undefined) patch.recipe = !!body.recipe;
  const { error } = await sb.from('calorie_foods').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const sb = adminSupabase();
  const { error } = await sb.from('calorie_foods').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
