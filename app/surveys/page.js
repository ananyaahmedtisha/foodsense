import Link from 'next/link';
import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabaseServer';
import { demoSurveys } from '@/lib/demoData';

export const revalidate = 120;

export default async function SurveysPage() {
  let surveys = demoSurveys;
  if (isSupabaseConfigured()) {
    try {
      const sb = createServerSupabase();
      const { data } = await sb.from('surveys').select('*').eq('is_active', true).order('created_at', { ascending: false });
      if (data?.length) surveys = data;
    } catch {}
  }

  return (
    <div className="py-8">
      <h1 className="font-display text-3xl font-extrabold">Campus Pulse 📋</h1>
      <p className="text-stone-500 mt-1">2-minute forms that measure learning — baseline vs endline (Aug–Nov 2026).</p>
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        {surveys.map((s) => (
          <Link key={s.id} href={`/surveys/${s.id}`} className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-lift transition">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-fresh-light text-fresh-dark">ACTIVE</span>
            <p className="font-display font-bold text-lg mt-2">{s.title}</p>
            <p className="text-sm text-fresh font-semibold mt-2">Take survey →</p>
          </Link>
        ))}
      </div>
      {surveys.length === 0 && <p className="text-stone-500 mt-6">No active surveys right now. Check back after a workshop.</p>}
    </div>
  );
}
