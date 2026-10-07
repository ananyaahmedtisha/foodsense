'use client';
import { useEffect, useMemo, useState } from 'react';
import { Shuffle, MapPin, Wallet, Sparkles, ListOrdered } from 'lucide-react';
import { noodleUpgrades } from '@/lib/demoData';

const GOALS = [
  { id: 'gut', name: 'Happy Gut', emoji: '🥬', desc: 'fibre + freshness', gain: 'Smoother digestion and steady energy for classes.' },
  { id: 'protein', name: 'Protein Power', emoji: '💪', desc: 'stay full longer', gain: 'Keeps you full for 3–4 hours, no mid-class hunger.' },
  { id: 'smart', name: 'Smart & Cheap', emoji: '💰', desc: 'same taste, less cost', gain: 'Same taste with less salt, less sugar, less money.' },
];

const STAPLE_INFO = {
  noodles: { price: '৳25–35', base: 30, blurb: 'Filling but low in protein, high in salt.' },
  rice: { price: 'Free (leftover)', base: 0, blurb: 'Plain carbs — needs protein and greens.' },
  bread: { price: '৳10–15', base: 10, blurb: 'Quick energy but you get hungry fast.' },
};

function guessGoal(text) {
  const t = (text || '').toLowerCase();
  if (/protein|egg|dal|soy|peanut|chicken|fish/.test(t)) return 'protein';
  if (/gut|fibr|doi|yogurt|vegetable|cabbage|shak|greens|banana|cucumber/.test(t)) return 'gut';
  return 'smart';
}

function cleanTitle(t) {
  return String(t || '').replace(/\s*[+＋]\s*৳?\s*\d+\s*$/, '').trim();
}

function extraNumber(cost) {
  const m = String(cost || '').match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

function stepsOf(detail) {
  return String(detail || '')
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function demoCards() {
  const out = [];
  for (const s of noodleUpgrades.staples) {
    for (const u of noodleUpgrades.upgrades[s.id] || []) {
      out.push({
        id: `${s.id}-${u.title}`,
        staple: s.name,
        stapleId: s.id,
        goal: guessGoal(u.title + ' ' + u.detail),
        title: cleanTitle(u.title),
        detail: u.detail,
        cost: u.title.match(/[+＋]৳?\d+/)?.[0] || '',
        emoji: s.id === 'noodles' ? '🍜' : s.id === 'rice' ? '🍚' : '🍞',
      });
    }
  }
  return out;
}

export default function BudgetBiteBuilder() {
  const [cards, setCards] = useState(demoCards());
  const [stapleId, setStapleId] = useState('noodles');
  const [goal, setGoal] = useState('protein');
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    fetch('/api/games?key=fuel')
      .then((r) => r.json())
      .then((j) => {
        if (j.items?.length >= 2) {
          setCards(j.items.map((c) => ({
            id: c.id,
            staple: c.prompt,
            stapleId: c.prompt.toLowerCase().includes('rice') ? 'rice' : c.prompt.toLowerCase().includes('bread') ? 'bread' : 'noodles',
            goal: c.meta?.goal || guessGoal(c.prompt + ' ' + c.explanation),
            title: cleanTitle(c.meta?.title || c.prompt),
            detail: c.explanation,
            cost: c.meta?.cost || '',
            emoji: c.meta?.emoji || '🍽️',
          })));
        }
      })
      .catch(() => {});
  }, []);

  const staples = useMemo(() => {
    const map = new Map();
    for (const c of cards) if (!map.has(c.stapleId)) map.set(c.stapleId, c.staple);
    if (!map.size) return noodleUpgrades.staples.map((s) => ({ id: s.id, name: s.name }));
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [cards]);

  const match = useMemo(() => {
    const pool = cards.filter((c) => c.stapleId === stapleId && c.goal === goal);
    const list = pool.length ? pool : cards.filter((c) => c.stapleId === stapleId);
    if (!list.length) return null;
    return list[seed % list.length];
  }, [cards, stapleId, goal, seed]);

  const info = STAPLE_INFO[stapleId] || { price: '~৳30', base: 30, blurb: '' };
  const goalInfo = GOALS.find((g) => g.id === goal) || GOALS[0];
  const extra = match ? extraNumber(match.cost) : 0;
  const total = info.base + extra;

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      <div className="rounded-xl bg-cream border p-4 text-sm leading-relaxed">
        <p><strong>How it works:</strong> hostel staples are cheap but mostly plain carbs and salt. A tiny <strong>৳0–20 add-on</strong> from any Badda shop fixes the missing protein and fibre.</p>
        <p className="mt-1 text-stone-500">Pick your base, pick your goal — get an exact upgrade with its total cost.</p>
      </div>

      <p className="text-sm font-semibold mt-4">Step 1 — pick your base</p>
      <div className="grid grid-cols-3 gap-2 mt-2">
        {staples.map((s) => {
          const si = STAPLE_INFO[s.id] || { price: '~৳30' };
          return (
            <button key={s.id} onClick={() => { setStapleId(s.id); setSeed(0); }}
              className={`rounded-xl border p-3 text-center transition ${stapleId === s.id ? 'bg-stone-900 text-white border-stone-900' : 'bg-cream hover:border-fresh'}`}>
              <span className="text-3xl">{s.id === 'noodles' ? '🍜' : s.id === 'rice' ? '🍚' : s.id === 'bread' ? '🍞' : '🍽️'}</span>
              <span className="block text-xs font-bold mt-1 leading-tight">{s.name}</span>
              <span className={`block text-[11px] mt-0.5 ${stapleId === s.id ? 'text-white/80' : 'text-stone-400'}`}>{si.price}</span>
            </button>
          );
        })}
      </div>
      {info.blurb && <p className="text-xs text-stone-500 mt-2">Your base: {info.blurb}</p>}

      <p className="text-sm font-semibold mt-4">Step 2 — pick your goal</p>
      <div className="grid grid-cols-3 gap-2 mt-2">
        {GOALS.map((g) => (
          <button key={g.id} onClick={() => { setGoal(g.id); setSeed(0); }}
            className={`rounded-xl border p-3 text-center transition ${goal === g.id ? 'bg-fresh text-white border-fresh' : 'bg-white hover:border-fresh'}`}>
            <span className="text-2xl">{g.emoji}</span>
            <span className="block text-xs font-bold mt-1">{g.name}</span>
            <span className={`block text-[11px] ${goal === g.id ? 'text-white/80' : 'text-stone-400'}`}>{g.desc}</span>
          </button>
        ))}
      </div>

      {match && (
        <div key={match.id + seed} className="mt-4 rounded-2xl bg-gradient-to-br from-fresh-light via-cream to-amberwarm-light border p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-fresh-dark">Step 3 — your upgrade</p>
          <div className="flex items-start justify-between gap-2 mt-1">
            <p className="font-display font-bold text-lg leading-snug">{match.emoji} {match.title}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
            <div className="bg-white/70 rounded-xl p-3 flex items-start gap-2">
              <Wallet size={16} className="mt-0.5 shrink-0" />
              <span><strong>You spend:</strong> base {info.price}{extra > 0 ? ` + ৳${extra} add-on = ` : ' = '}<strong>≈ ৳{total} total</strong></span>
            </div>
            <div className="bg-white/70 rounded-xl p-3 flex items-start gap-2">
              <Sparkles size={16} className="mt-0.5 shrink-0" />
              <span><strong>You gain:</strong> {goalInfo.gain}</span>
            </div>
          </div>

          <div className="mt-3">
            <p className="text-sm font-bold flex items-center gap-1"><ListOrdered size={14} /> How to make it</p>
            <ol className="mt-1.5 flex flex-col gap-1.5">
              {stepsOf(match.detail).map((s, i) => (
                <li key={i} className="text-sm text-stone-700 flex gap-2">
                  <span className="w-5 h-5 shrink-0 rounded-full bg-stone-900 text-white text-[11px] font-bold grid place-items-center">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>

          <p className="text-xs text-stone-500 mt-3 flex items-center gap-1"><MapPin size={12} /> Everything available in Badda kitchen markets & hostel shops.</p>
          <button onClick={() => setSeed((s) => s + 1)} className="mt-3 text-sm font-bold text-fresh flex items-center gap-1">
            <Shuffle size={14} /> Show another idea
          </button>
        </div>
      )}
    </div>
  );
}
