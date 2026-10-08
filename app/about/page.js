import { Linkedin, Github, Facebook, Instagram, Target, BookOpen, UtensilsCrossed, Users } from 'lucide-react';
import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabaseServer';
import { getAbout } from '@/lib/content';
import { demoTeam } from '@/lib/demoData';

const SOCIALS = [
  { key: 'linkedin', Icon: Linkedin, label: 'LinkedIn' },
  { key: 'github', Icon: Github, label: 'GitHub' },
  { key: 'facebook', Icon: Facebook, label: 'Facebook' },
  { key: 'instagram', Icon: Instagram, label: 'Instagram' },
];

const PILLARS = [
  { Icon: BookOpen, title: 'Science, minus jargon', text: 'Microbiology translated into plain language anyone can act on.' },
  { Icon: UtensilsCrossed, title: 'Everyday habits', text: 'Bite-size kitchen practices for hostel life and tight budgets.' },
  { Icon: Users, title: 'Campus community', text: 'Posters, videos, and surveys built with and for students.' },
];

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
    <div className="py-10">
      {/* Hero */}
      <section className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-fresh">About FoodSense</p>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold mt-2 leading-tight">Making food science simple.</h1>
        <p className="text-stone-600 text-lg mt-4 leading-relaxed">{copy.intro}</p>
      </section>

      {/* Mission */}
      <section className="mt-8 bg-stone-900 text-white rounded-3xl p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-fresh/20" />
        <div className="absolute -right-2 top-16 w-24 h-24 rounded-full bg-amberwarm/20" />
        <div className="relative flex flex-col md:flex-row gap-5 items-start">
          <span className="w-12 h-12 shrink-0 rounded-2xl bg-fresh grid place-items-center">
            <Target size={22} className="text-white" />
          </span>
          <div>
            <h2 className="font-display text-xl font-extrabold">Our mission</h2>
            <p className="text-white/80 mt-2 leading-relaxed">{copy.mission}</p>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="grid md:grid-cols-3 gap-4 mt-6">
        {PILLARS.map(({ Icon, title, text }) => (
          <div key={title} className="bg-white rounded-2xl shadow-soft p-6 border-t-4 border-fresh">
            <span className="w-10 h-10 rounded-xl bg-fresh-light grid place-items-center">
              <Icon size={19} className="text-fresh-dark" />
            </span>
            <p className="font-display font-bold mt-3">{title}</p>
            <p className="text-sm text-stone-500 mt-1 leading-relaxed">{text}</p>
          </div>
        ))}
      </section>

      {/* Team */}
      <section className="mt-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-fresh">Credits</p>
        <h2 className="font-display text-2xl font-extrabold mt-1">{copy.team_title}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {team.map((m) => (
            <article key={m.id} className="bg-white rounded-3xl shadow-soft overflow-hidden flex flex-col">
              <div className="h-1.5 bg-gradient-to-r from-fresh via-labteal to-amberwarm" />
              <div className="p-7 text-center flex flex-col items-center flex-1">
                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-fresh-light bg-gradient-to-br from-fresh to-labteal text-white grid place-items-center text-3xl font-extrabold">
                  {m.image_url ? <img src={m.image_url} alt={m.name} className="w-24 h-24 object-cover" /> : m.name[0]}
                </div>
                <h3 className="font-display font-bold text-lg mt-4">{m.name}</h3>
                <span className="inline-block text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-amberwarm-light text-stone-700 mt-2">{m.role}</span>
                <p className="text-sm text-stone-500 mt-3 leading-relaxed flex-1">{m.bio}</p>
                {SOCIALS.some((s) => m[s.key]) && (
                  <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t w-full">
                    {SOCIALS.filter((s) => m[s.key]).map(({ key, Icon, label }) => (
                      <a
                        key={key}
                        href={m[key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${m.name} on ${label}`}
                        className="w-9 h-9 rounded-full bg-cream grid place-items-center text-stone-500 hover:bg-stone-900 hover:text-white transition"
                      >
                        <Icon size={16} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
