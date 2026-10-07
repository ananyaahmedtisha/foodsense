'use client';
import { useEffect, useState } from 'react';

const empty = {
  title_a: 'Food science,',
  title_b: 'minus the jargon.',
  description: 'FoodSense turns microbiology into 2-minute habits for hostel life: storage, labels, and cheap nutritious meals.',
};

export default function HomepageManager() {
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState('');

  async function load() {
    const j = await fetch('/api/admin/settings?key=homepage').then((r) => r.json());
    if (j.value) setForm({ ...empty, ...j.value });
  }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setMsg('Saving…');
    const res = await fetch('/api/admin/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'homepage', value: form }),
    });
    const j = await res.json();
    setMsg(j.ok ? 'Homepage updated — refresh the site to see it.' : 'Error: ' + j.error);
  }

  return (
    <form onSubmit={save} className="bg-white rounded-2xl shadow-soft p-6 max-w-2xl flex flex-col gap-3">
      <p className="font-display font-bold text-lg">Homepage hero 🏠</p>
      <label className="text-sm font-semibold">Title — first part (dark)
        <input className="block w-full border rounded-xl px-3 py-2.5 mt-1 font-normal" value={form.title_a} onChange={(e) => setForm({ ...form, title_a: e.target.value })} />
      </label>
      <label className="text-sm font-semibold">Title — second part (green)
        <input className="block w-full border rounded-xl px-3 py-2.5 mt-1 font-normal" value={form.title_b} onChange={(e) => setForm({ ...form, title_b: e.target.value })} />
      </label>
      <label className="text-sm font-semibold">Description
        <textarea className="block w-full border rounded-xl px-3 py-2.5 mt-1 font-normal" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </label>
      <div className="rounded-xl bg-cream border p-4">
        <p className="text-xs text-stone-500 font-bold uppercase">Preview</p>
        <p className="font-display text-2xl font-extrabold mt-1">{form.title_a} <span className="text-fresh">{form.title_b}</span></p>
        <p className="text-sm text-stone-600 mt-1">{form.description}</p>
      </div>
      <button className="py-3 rounded-xl bg-fresh text-white font-bold">Save homepage</button>
      {msg && <p className="text-sm">{msg}</p>}
    </form>
  );
}
