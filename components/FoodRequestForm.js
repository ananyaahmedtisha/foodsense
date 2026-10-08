'use client';
import { useState } from 'react';
import { Send } from 'lucide-react';

export default function FoodRequestForm() {
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [err, setErr] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  async function send(e) {
    e.preventDefault();
    if (!name.trim()) { setErr('Please type the food name.'); return; }
    setErr('');
    setSending(true);
    setStatus('Sending…');
    try {
      const res = await fetch('/api/food-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food_name: name.trim(), details: details.trim() }),
      });
      const j = await res.json();
      if (j.ok) {
        setStatus('Thanks! Our team will review and add it to the counter.');
        setName('');
        setDetails('');
      } else setStatus('Error: ' + (j.error || 'failed'));
    } catch {
      setStatus('Error: check your connection.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-soft p-6 md:p-8 mt-6 border border-dashed border-fresh/40">
      <p className="font-display font-bold text-lg">Missing a food? Request it 🙋</p>
      <p className="text-sm text-stone-500 mt-1">Type the food name and any details you know (serving, ingredients). We review requests and add them to the counter.</p>
      <form onSubmit={send} className="grid md:grid-cols-[1fr_1fr_auto] gap-2.5 mt-4 items-start">
        <div>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setErr(''); }}
            placeholder="Food name — e.g. Chingri bhorta"
            className="w-full border rounded-xl px-3 py-2.5 text-sm"
          />
          {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
        </div>
        <input
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Details (optional) — serving, ingredients…"
          className="w-full border rounded-xl px-3 py-2.5 text-sm"
        />
        <button disabled={sending} className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-bold flex items-center gap-1.5 disabled:opacity-60">
          <Send size={14} /> {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
      {status && <p className="text-xs mt-2">{status}</p>}
    </div>
  );
}
