import Link from 'next/link';

const TONES = {
  green: 'from-fresh-light via-cream to-labteal-light',
  amber: 'from-amberwarm-light via-cream to-fresh-light',
  teal: 'from-labteal-light via-cream to-amberwarm-light',
};

// Big gradient banner so every section has a distinct, lively header.
export default function PageHero({ emoji, eyebrow, title, sub, tone = 'green', action }) {
  return (
    <div className={`rise rounded-3xl bg-gradient-to-br ${TONES[tone] || TONES.green} p-8 md:p-10 shadow-soft border border-white/60`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.2em] text-fresh-dark">{eyebrow}</p>}
          <h1 className="font-display text-3xl md:text-4xl font-extrabold mt-2 leading-tight">{title}</h1>
          {sub && <p className="text-stone-600 mt-2 max-w-xl leading-relaxed">{sub}</p>}
          {action && <div className="mt-4">{action}</div>}
        </div>
        {emoji && <span className="text-6xl md:text-7xl shrink-0 drop-shadow-sm">{emoji}</span>}
      </div>
    </div>
  );
}
