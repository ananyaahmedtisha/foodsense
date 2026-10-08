'use client';
import { useEffect, useState } from 'react';
import { Share2, RotateCcw } from 'lucide-react';
import { flagCards } from '@/lib/demoData';

function rotateDaily(cards) {
  if (!cards || cards.length < 2) return cards;
  const day = Math.floor(Date.now() / 86400000);
  const shift = day % cards.length;
  return [...cards.slice(shift), ...cards.slice(0, shift)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MIN_SESSION = 6;
const MAX_SESSION = 10; // each game serves a fresh random 6–10 cards out of 100+

export default function RedFlagGreenFlag() {
  const [pool, setPool] = useState([]);
  const [cards, setCards] = useState(flagCards.map((c) => ({ prompt: c.habit, verdict: c.verdict, explanation: c.explain })));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);

  function deal(full) {
    const n = MIN_SESSION + Math.floor(Math.random() * (MAX_SESSION - MIN_SESSION + 1));
    return shuffle(full).slice(0, n);
  }

  useEffect(() => {
    fetch('/api/games?key=redflag')
      .then((r) => r.json())
      .then((j) => {
        const full = j.items?.length >= 2
          ? rotateDaily(j.items)
          : flagCards.map((c) => ({ prompt: c.habit, verdict: c.verdict, explanation: c.explain }));
        setPool(full);
        setCards(deal(full));
      })
      .catch(() => {});
  }, []);

  const card = cards[idx];
  if (!card) return <p className="text-sm text-stone-500">No cards yet — admin can add some in Admin → Games.</p>;

  function guess(color) {
    if (revealed) return;
    if (color === card.verdict) setScore((s) => s + 1);
    setRevealed(true);
  }

  function next() {
    if (idx + 1 >= cards.length) setDone(true);
    else { setIdx(idx + 1); setRevealed(false); }
  }

  function reset() {
    // Brand-new random set every replay — 100+ cards means repeats are rare.
    setCards(deal(pool.length >= 2 ? pool : cards));
    setIdx(0); setScore(0); setRevealed(false); setDone(false);
  }

  const iq = Math.round((score / cards.length) * 100);

  if (done) {
    return (
      <div className="anim-pop bg-white rounded-2xl shadow-soft p-8 text-center">
        <p className="text-sm uppercase tracking-widest text-labteal font-bold">Your Food Safety IQ</p>
        <p className="font-display text-6xl font-extrabold mt-2">{iq}<span className="text-2xl">/100</span></p>
        <p className="text-stone-600 mt-2">{score} of {cards.length} correct • {iq >= 80 ? 'Kitchen Pro! Share it.' : iq >= 50 ? 'Solid — review the red flags.' : 'Time to browse the Science Pantry.'}</p>
        <div className="flex gap-3 justify-center mt-6">
          <button onClick={() => { navigator.clipboard?.writeText(`My FoodSense Food Safety IQ is ${iq}/100! Can you beat me?`); alert('Copied! Paste to share.'); }} className="px-4 py-2 rounded-full bg-fresh text-white flex items-center gap-2"><Share2 size={16} /> Share score</button>
          <button onClick={reset} className="px-4 py-2 rounded-full border flex items-center gap-2"><RotateCcw size={16} /> Replay</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 max-w-md mx-auto">
      <div className="flex justify-between text-sm text-stone-500 mb-3"><span>Card {idx + 1}/{cards.length} • fresh set every game</span><span>Score: {score}</span></div>
      <div className={`card-flip ${revealed ? 'flipped' : ''}`}>
        <div className="card-flip-inner relative min-h-[220px]">
          <div className="card-face absolute inset-0 bg-cream border rounded-2xl p-6 grid place-items-center text-center">
            <p className="font-display text-xl font-bold">{card.prompt}</p>
          </div>
          <div className="card-face card-back absolute inset-0 rounded-2xl p-6 text-white grid place-items-center text-center" style={{ background: card.verdict === 'red' ? '#DC2626' : '#16A34A' }}>
            <p className="text-sm leading-relaxed">{card.explanation}</p>
          </div>
        </div>
      </div>
      {!revealed ? (
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button onClick={() => guess('red')} className="py-3 rounded-xl bg-red-600 text-white font-bold">Red Flag</button>
          <button onClick={() => guess('green')} className="py-3 rounded-xl bg-fresh text-white font-bold">Green Flag</button>
        </div>
      ) : (
        <button onClick={next} className="w-full mt-6 py-3 rounded-xl bg-stone-900 text-white font-bold">{idx + 1 >= cards.length ? 'See my IQ' : 'Next card →'}</button>
      )}
    </div>
  );
}
