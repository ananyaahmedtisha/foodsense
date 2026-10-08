'use client';
import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Minus, Trash2, RotateCcw, Info } from 'lucide-react';
import { calorieFoods, calorieCategories } from '@/lib/calorieFoods';

const KEY = 'foodsense-plate-v1';

function scale(food, portion) {
  const m = (v) => Math.round(v * portion * 10) / 10;
  return { kcal: m(food.kcal), protein: m(food.protein), carbs: m(food.carbs), fat: m(food.fat), fiber: m(food.fiber) };
}

export default function CalorieCounter() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [portions, setPortions] = useState({});
  const [plate, setPlate] = useState([]);
  const [goal, setGoal] = useState(2000);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (Array.isArray(saved)) setPlate(saved.filter((p) => calorieFoods.some((f) => f.id === p.id)));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(plate)); } catch {}
  }, [plate]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return calorieFoods.filter((f) => {
      if (cat !== 'All' && f.category !== cat) return false;
      if (!needle) return true;
      return f.name.toLowerCase().includes(needle) || f.terms.includes(needle);
    });
  }, [q, cat]);

  function bump(id, d) {
    setPortions((p) => {
      const cur = p[id] || 1;
      const next = Math.min(10, Math.max(0.5, Math.round((cur + d) * 2) / 2));
      return { ...p, [id]: next };
    });
  }

  function add(id) {
    const portion = portions[id] || 1;
    setPlate((pl) => {
      const i = pl.findIndex((p) => p.id === id);
      if (i >= 0) {
        const cp = [...pl];
        cp[i] = { ...cp[i], portion: Math.round((cp[i].portion + portion) * 2) / 2 };
        return cp;
      }
      return [...pl, { id, portion }];
    });
  }

  const lines = plate.map((p) => ({ ...p, food: calorieFoods.find((f) => f.id === p.id) })).filter((l) => l.food);
  const totals = lines.reduce(
    (s, l) => {
      const v = scale(l.food, l.portion);
      return { kcal: s.kcal + v.kcal, protein: s.protein + v.protein, carbs: s.carbs + v.carbs, fat: s.fat + v.fat, fiber: s.fiber + v.fiber };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
  const round1 = (v) => Math.round(v * 10) / 10;
  const pct = goal > 0 ? Math.min(100, Math.round((totals.kcal / goal) * 100)) : 0;

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
      <div>
        <div className="relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search in English or Bangla — e.g. biryani, ডাল, egg…"
            className="w-full border rounded-2xl pl-10 pr-4 py-3 text-sm bg-white shadow-soft outline-none focus:border-fresh"
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {['All', ...calorieCategories].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold border ${cat === c ? 'bg-stone-900 text-white border-stone-900' : 'bg-white'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-500 mt-3">{results.length} foods • tap +/− for portion, then Add to plate</p>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          {results.map((f) => {
            const portion = portions[f.id] || 1;
            const v = scale(f, portion);
            return (
              <div key={f.id} className="bg-white rounded-2xl shadow-soft p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display font-bold leading-snug">{f.name}</p>
                    {f.bn.length > 0 && <p className="text-xs text-stone-400">{f.bn.join(' • ')}</p>}
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cream border whitespace-nowrap">{f.category}</span>
                </div>
                <p className="text-xs text-stone-500 mt-1">{f.serving} ({f.grams}g){f.recipe ? ' • recipe varies' : ''}</p>
                <p className="font-display font-extrabold text-2xl mt-2">{v.kcal}<span className="text-sm font-medium text-stone-400"> kcal</span></p>
                <p className="text-xs text-stone-500">P {v.protein}g • C {v.carbs}g • F {v.fat}g • Fibre {v.fiber}g</p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center border rounded-full">
                    <button onClick={() => bump(f.id, -0.5)} className="p-2 hover:text-fresh" aria-label="Less"><Minus size={14} /></button>
                    <span className="text-sm font-bold w-10 text-center">×{portion}</span>
                    <button onClick={() => bump(f.id, 0.5)} className="p-2 hover:text-fresh" aria-label="More"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => add(f.id)} className="flex-1 py-2 rounded-full bg-fresh text-white text-sm font-bold">Add to plate</button>
                </div>
              </div>
            );
          })}
        </div>
        {results.length === 0 && <p className="text-sm text-stone-500 mt-6">No match — try another spelling or browse a category.</p>}
      </div>

      <aside className="bg-stone-900 text-white rounded-3xl p-6 lg:sticky lg:top-20">
        <div className="flex items-center justify-between">
          <p className="font-display font-bold text-lg">Your plate 🍽️</p>
          {lines.length > 0 && (
            <button onClick={() => setPlate([])} className="text-xs text-white/60 hover:text-white flex items-center gap-1">
              <RotateCcw size={12} /> Clear
            </button>
          )}
        </div>
        {lines.length === 0 ? (
          <p className="text-sm text-white/60 mt-3">Empty. Add foods from the left — your plate saves on this device.</p>
        ) : (
          <div className="flex flex-col gap-2 mt-3 max-h-56 overflow-auto">
            {lines.map((l) => {
              const v = scale(l.food, l.portion);
              return (
                <div key={l.id} className="bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2 text-sm">
                  <span className="flex-1 truncate">{l.food.name} <span className="text-white/50">×{l.portion}</span></span>
                  <span className="font-bold whitespace-nowrap">{v.kcal}</span>
                  <button onClick={() => setPlate((pl) => pl.filter((p) => p.id !== l.id))} aria-label="Remove" className="text-white/50 hover:text-white">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-white/15">
          <p className="text-4xl font-display font-extrabold">{round1(totals.kcal)}<span className="text-base text-white/60"> kcal</span></p>
          <div className="grid grid-cols-4 gap-1.5 mt-3 text-center text-xs">
            {[['Protein', totals.protein, 'g'], ['Carbs', totals.carbs, 'g'], ['Fat', totals.fat, 'g'], ['Fibre', totals.fiber, 'g']].map(([k, v, u]) => (
              <div key={k} className="bg-white/10 rounded-lg py-1.5">
                <p className="font-bold">{round1(v)}{u}</p>
                <p className="text-white/50 text-[11px]">{k}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Daily goal</span>
              <span><input type="number" value={goal} min={500} max={6000} step={50} onChange={(e) => setGoal(Number(e.target.value) || 2000)} className="w-16 bg-white/10 rounded px-1 py-0.5 text-white text-right" /> kcal</span>
            </div>
            <div className="h-2.5 bg-white/15 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-fresh transition-all" style={{ width: pct + '%' }} />
            </div>
            <p className="text-xs text-white/60 mt-1">{pct}% of daily goal • {pct < 33 ? 'light meal' : pct <= 66 ? 'solid meal' : 'heavy — balance the rest of the day'}</p>
          </div>
        </div>
        <p className="text-[11px] text-white/40 mt-4 flex items-start gap-1"><Info size={12} className="mt-0.5 shrink-0" /> Approximate reference values — oil and recipes change real calories.</p>
      </aside>
    </div>
  );
}
