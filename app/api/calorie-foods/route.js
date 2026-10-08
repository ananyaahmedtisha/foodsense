import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabaseServer';
import { calorieFoods } from '@/lib/calorieFoods';

// Public: live foods from Supabase, static file as fallback.
export async function GET() {
  try {
    const sb = createServerSupabase();
    if (sb) {
      const { data, error } = await sb.from('calorie_foods').select('*').order('category').order('name');
      if (!error && data?.length) {
        return NextResponse.json({
          items: data.map((r) => ({
            id: r.food_id, category: r.category, name: r.name,
            bn: r.bn || [], terms: r.terms || '',
            serving: r.serving, grams: Number(r.grams) || 0,
            kcal: Number(r.kcal) || 0, protein: Number(r.protein) || 0,
            carbs: Number(r.carbs) || 0, fat: Number(r.fat) || 0,
            fiber: Number(r.fiber) || 0, note: r.note || '', recipe: !!r.recipe,
          })),
          live: true,
        });
      }
    }
  } catch {}
  return NextResponse.json({ items: calorieFoods, live: false });
}
