import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabaseServer';
import { getAbout } from '@/lib/content';
import { demoTeam } from '@/lib/demoData';

export default async function AboutPage() {
  const copy = await getAbout();
  let team = demoTeam;
  if (isSupabaseConfigured()) {
    try {
      const sb = createServerSupabase();
      const { data } = await sb.from('team_members').select('*').order('display_order');
      if (data?.length) team = data;
    } catch {}
  }

  return (
    <div className="py-8">
      <h1 className="font-display text-3xl font-extrabold">The Team & Credits 💚</h1>
      <p className="text-stone-600 mt-2 max-w-2xl">{copy.intro}</p>
      <div className="bg-white rounded-2xl shadow-soft p-6 mt-6">
        <p className="font-bold">Our mission</p>
        <p className="text-sm text-stone-600 mt-1">{copy.mission}</p>
      </div>
      <h2 className="font-display text-xl font-extrabold mt-8 mb-4">{copy.team_title}</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {team.map((m) => (
          <div key={m.id} className="bg-white rounded-2xl shadow-soft p-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-fresh to-labteal text-white grid place-items-center text-2xl font-extrabold overflow-hidden">
              {m.image_url ? <img src={m.image_url} alt={m.name} className="w-20 h-20 rounded-full object-cover" /> : m.name[0]}
            </div>
            <p className="font-display font-bold mt-3">{m.name}</p>
            <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-amberwarm-light mt-1">{m.role}</span>
            <p className="text-sm text-stone-500 mt-2">{m.bio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
