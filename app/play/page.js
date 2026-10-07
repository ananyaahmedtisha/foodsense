import Link from 'next/link';
import RedFlagGreenFlag from '@/components/RedFlagGreenFlag';
import BudgetBiteBuilder from '@/components/BudgetBiteBuilder';

const games = [
  { key: 'redflag', emoji: '🚩', title: 'Red Flag or Green Flag', desc: 'Swipe kitchen habits. New order daily. Get your Food Safety IQ.' },
  { key: 'fuel', emoji: '🍜', title: 'Budget Bite Builder', desc: 'Pick a cheap staple + a goal. Get a low-cost upgrade with Badda prices.' },
];

export default function PlayPage({ searchParams }) {
  const active = searchParams?.game;
  const current = games.find((g) => g.key === active);

  if (!current) {
    return (
      <div className="py-8">
        <h1 className="font-display text-3xl font-extrabold">Play & Learn 🎮</h1>
        <p className="text-stone-500 mt-1">Choose a game to start. No login needed.</p>
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {games.map((g) => (
            <Link key={g.key} href={`/play?game=${g.key}`} className="bg-white rounded-2xl shadow-soft p-8 text-center hover:shadow-lift hover:-translate-y-0.5 transition">
              <p className="text-6xl">{g.emoji}</p>
              <p className="font-display font-bold text-xl mt-3">{g.title}</p>
              <p className="text-sm text-stone-500 mt-1">{g.desc}</p>
              <span className="inline-block mt-4 px-5 py-2.5 rounded-full bg-fresh text-white text-sm font-bold">Play now →</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-extrabold mt-2">{current.emoji} {current.title}</h1>
      <div className="mt-4">
        {current.key === 'redflag' ? <RedFlagGreenFlag /> : <BudgetBiteBuilder />}
      </div>
    </div>
  );
}
