'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Plus, Minus, Trash2, RotateCcw, Info, Scale, UtensilsCrossed, Volume2, VolumeX } from 'lucide-react';
import { calorieFoods, calorieCategories } from '@/lib/calorieFoods';
import { sfx, isMuted, setMuted } from '@/lib/sounds';

const KEY = 'foodsense-plate-v1';

function scale(food, portion) {
  const m = (v) => Math.round(v * portion * 10) / 10;
  return { kcal: m(food.kcal), protein: m(food.protein), carbs: m(food.carbs), fat: m(food.fat), fiber: m(food.fiber) };
}

function useCountUp(target, dur = 450) {
  const [val, setVal] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = from.current;
    if (start === target) return;
    let raf;
    const t0 = performance.now();
    function tick(t) {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(start + (target - start) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    }
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); from.current = target; };
  }, [target, dur]);
  return val;
}

function MacroBar({ label, grams, kcalShare, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs"><span className="text-stone-500">{label}</span><span className="font-bold">{grams}g</span></div>
      <div className="h-2 bg-stone-100 rounded-full mt-1 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: Math.min(100, kcalShare) + '%', background: color }} />
      </div>
    </div>
  );
}

export default function CalorieCounter() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [selectedId, setSelectedId] = useState(null);
  const [unit, setUnit] = useState('serv'); // serv | grams
  const [qty, setQty] = useState(1);
  const [plate, setPlate] = useState([]);
  const [goal, setGoal] = useState(2000);
  const [muted, setM] = useState(false);

  useEffect(() => {
    setM(isMuted());
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

  const food = calorieFoods.find((f) => f.id === selectedId) || null;
  const portion = unit === 'serv' ? qty : food ? qty / (food.grams || 100) : 0;
  const cur = food ? scale(food, portion) : null;
  const kcalShown = Math.round(useCountUp(cur?.kcal || 0));

  function pick(id) {
    setSelectedId(id);
    setUnit('serv');
    setQty(1);
    sfx.tap();
  }

  function addToPlate() {
    if (!food) return;
    const p = Math.round(portion * 2) / 2 || 0.5;
    setPlate((pl) => {
      const i = pl.findIndex((x) => x.id === food.id);
      if (i >= 0) {
        const cp = [...pl];
        cp[i] = { ...cp[i], portion: Math.round((cp[i].portion + p) * 2) / 2 };
        return cp;
      }
      return [...pl, { id: food.id, portion: p }];
    });
    sfx.pop();
  }

  const lines = plate.map((p) => ({ ...p, food: calorieFoods.find((f) => f.id === p.id) })).filter((l) => l.food);
  const totals = lines.reduce(
    (s, l) => {
      const v = scale(l.food, l.portion);
      return { kcal: s.kcal + v.kcal, protein: s.protein + v.protein, carbs: s.carbs + v.carbs, fat: s.fat + v.fat, fiber: s.fiber + v.fiber };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
  const pct = goal > 0 ? Math.min(100, Math.round((totals.kcal / goal) * 100)) : 0;
  const macroKcal = cur ? { p: cur.protein * 4, c: cur.carbs * 4, f: cur.fat * 9 } : { p: 0, c: 0, f: 0 };
  const macroTotal = Math.max(1, macroKcal.p + macroKcal.c + macroKcal.f);

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
      {/* Step 1 — pick a food */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-fresh">Step 1 — pick a food</p>
        <div className="relative mt-2">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search in English or Bangla — biryani, ডাল, egg…"
            className="w-full border rounded-2xl pl-10 pr-4 py-3 text-sm bg-white shadow-soft outline-none focus:border-fresh"
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {['All', ...calorieCategories].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold border transition ${cat === c ? 'bg-stone-900 text-white border-stone-900' : 'bg-white hover:border-fresh'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-2.5 mt-4 max-h-[520px] overflow-auto pr-1">
          {results.map((f) => (
            <button
              key={f.id}
              onClick={() => pick(f.id)}
              className={`text-left bg-white rounded-2xl p-3.5 border-2 transition hover:shadow-lift ${selectedId === f.id ? 'border-fresh shadow-soft' : 'border-transparent shadow-soft'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-display font-bold text-[15px] leading-snug">{f.name}</p>
                <span className="font-display font-extrabold text-fresh whitespace-nowrap">{f.kcal}<span className="text-[11px] font-medium text-stone-400"> kcal</span></span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">{f.serving}{f.bn.length > 0 && ` • ${f.bn[0]}`}</p>
            </button>
          ))}
        </div>
        {results.length === 0 && <p className="text-sm text-stone-500 mt-6">No match — try another spelling or browse a category.</p>}
      </div>

      {/* Steps 2–3 — quantity → kcal → plate */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-20">
        <div className="rounded-3xl p-6 text-white bg-gradient-to-br from-stone-900 via-emerald-950 to-teal-900 shadow-lift">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Step 2 — quantity → kcal</p>
            <button
              onClick={() => { const m = !muted; setM(m); setMuted(m); }}
              className="text-white/60 hover:text-white"
              aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
          {!food ? (
            <p className="text-white/70 text-sm mt-4">Select a food on the left to calculate its calories.</p>
          ) : (
            <>
              <p className="font-display font-bold text-xl mt-2">{food.name}</p>
              <p className="text-xs text-white/60">1 serving = {food.serving} ({food.grams}g)</p>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button onClick={() => { setUnit('serv'); setQty(1); }} className={`py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 ${unit === 'serv' ? 'bg-fresh text-white' : 'bg-white/10 text-white/70'}`}>
                  <UtensilsCrossed size={14} /> Servings
                </button>
                <button onClick={() => { setUnit('g'); setQty(food.grams); }} className={`py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 ${unit === 'g' ? 'bg-fresh text-white' : 'bg-white/10 text-white/70'}`}>
                  <Scale size={14} /> Grams
                </button>
              </div>
              {unit === 'serv' ? (
                <>
                  <div className="flex items-center gap-3 mt-4">
                    <button onClick={() => setQty((v) => Math.max(0.5, Math.round((v - 0.5) * 2) / 2))} className="w-9 h-9 rounded-full bg-white/10 grid place-items-center hover:bg-white/20" aria-label="Less"><Minus size={15} /></button>
                    <input
                      type="range" min={0.5} max={5} step={0.5} value={qty}
                      onChange={(e) => setQty(Number(e.target.value))}
                      className="flex-1 accent-green-500"
                    />
                    <button onClick={() => setQty((v) => Math.min(10, Math.round((v + 0.5) * 2) / 2))} className="w-9 h-9 rounded-full bg-white/10 grid place-items-center hover:bg-white/20" aria-label="More"><Plus size={15} /></button>
                  </div>
                  <p className="text-center font-bold mt-1">×{qty} serving{qty !== 1 ? 's' : ''}</p>
                </>
              ) : (
                <div className="flex items-center gap-2 mt-4">
                  {[50, 100, 150, 200].map((g) => (
                    <button key={g} onClick={() => setQty(g)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${qty === g ? 'bg-fresh text-white' : 'bg-white/10 text-white/70'}`}>{g}g</button>
                  ))}
                  <input type="number" min={5} max={2000} value={qty} onChange={(e) => setQty(Math.max(0, Number(e.target.value) || 0))} className="w-20 bg-white/10 rounded-lg px-2 py-1.5 text-sm text-right" />
                </div>
              )}
              <p className="text-center font-display font-extrabold text-6xl mt-4 tabular-nums">{kcalShown}<span className="text-lg text-white/60"> kcal</span></p>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <MacroBar label="Protein" grams={Math.round(cur.protein * 10) / 10} kcalShare={(macroKcal.p / macroTotal) * 100} color="#16A34A" />
                <MacroBar label="Carbs" grams={Math.round(cur.carbs * 10) / 10} kcalShare={(macroKcal.c / macroTotal) * 100} color="#F59E0B" />
                <MacroBar label="Fat" grams={Math.round(cur.fat * 10) / 10} kcalShare={(macroKcal.f / macroTotal) * 100} color="#0D9488" />
              </div>
              <button onClick={addToPlate} className="w-full mt-4 py-3 rounded-xl bg-fresh text-white font-bold hover:bg-fresh-dark transition">Add to my plate →</button>
            </>
          )}
        </div>

        <aside className="bg-white rounded-3xl shadow-soft p-6">
          <div className="flex items-center justify-between">
            <p className="font-display font-bold text-lg">Your plate 🍽️</p>
            {lines.length > 0 && (
              <button onClick={() => setPlate([])} className="text-xs text-stone-400 hover:text-red-600 flex items-center gap-1">
                <RotateCcw size={12} /> Clear
              </button>
            )}
          </div>
          {lines.length === 0 ? (
            <p className="text-sm text-stone-500 mt-2">Nothing yet — calculate a food above, then add it here. Saved on this device.</p>
          ) : (
            <>
              <div className="flex flex-col gap-1.5 mt-3 max-h-44 overflow-auto">
                {lines.map((l) => {
                  const v = scale(l.food, l.portion);
                  return (
                    <div key={l.id} className="bg-cream rounded-xl px-3 py-2 flex items-center gap-2 text-sm">
                      <span className="flex-1 truncate">{l.food.name} <span className="text-stone-400">×{l.portion}</span></span>
                      <span className="font-bold whitespace-nowrap">{v.kcal}</span>
                      <button onClick={() => setPlate((pl) => pl.filter((p) => p.id !== l.id))} aria-label="Remove" className="text-stone-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="font-display font-extrabold text-3xl mt-3">{Math.round(totals.kcal * 10) / 10}<span className="text-sm text-stone-400"> kcal total</span></p>
              <p className="text-xs text-stone-500">P {Math.round(totals.protein * 10) / 10}g • C {Math.round(totals.carbs * 10) / 10}g • F {Math.round(totals.fat * 10) / 10}g • Fibre {Math.round(totals.fiber * 10) / 10}g</p>
              <div className="flex items-center justify-between text-xs text-stone-500 mt-3">
                <span>Daily goal</span>
                <span><input type="number" value={goal} min={500} max={6000} step={50} onChange={(e) => setGoal(Number(e.target.value) || 2000)} className="w-16 border rounded px-1 py-0.5 text-right" /> kcal</span>
              </div>
              <div className="h-2.5 bg-stone-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-fresh transition-all" style={{ width: pct + '%' }} />
              </div>
              <p className="text-xs text-stone-400 mt-1">{pct}% of daily goal</p>
            </>
          )}
          <p className="text-[11px] text-stone-400 mt-3 flex items-start gap-1"><Info size={12} className="mt-0.5 shrink-0" /> Approximate values — oil and recipes change real calories.</p>
        </aside>
      </div>
    </div>
  );
}
