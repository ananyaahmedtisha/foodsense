'use client';
import { useEffect, useState } from 'react';

const emptyFood = { category: '', name: '', bn: '', terms: '', serving: '1 serving', grams: '', kcal: '', protein: '', carbs: '', fat: '', fiber: '', note: '', recipe: false };

export default function FoodManager() {
  const [foods, setFoods] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(emptyFood);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState('');

  async function load() {
    const [f, r] = await Promise.all([
      fetch('/api/admin/calorie-foods').then((x) => x.json()).catch(() => ({ items: [] })),
      fetch('/api/admin/food-requests').then((x) => x.json()).catch(() => ({ items: [] })),
    ]);
    setFoods(f.items || []);
    setRequests(r.items || []);
    if (f.needsMigration || r.needsMigration) setMsg('Run supabase/migration_v6.sql in Supabase SQL Editor first.');
  }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setMsg('Saving…');
    const res = await fetch('/api/admin/calorie-foods', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing ? { ...form, id: editing } : form),
    });
    const j = await res.json();
    if (j.ok) { setMsg('Saved — live on /calories.'); setForm(emptyFood); setEditing(null); load(); }
    else setMsg('Error: ' + j.error);
  }

  function edit(f) {
    setEditing(f.id);
    setForm({
      category: f.category || '', name: f.name || '', bn: (f.bn || []).join(', '),
      terms: f.terms || '', serving: f.serving || '', grams: f.grams ?? '', kcal: f.kcal ?? '',
      protein: f.protein ?? '', carbs: f.carbs ?? '', fat: f.fat ?? '', fiber: f.fiber ?? '',
      note: f.note || '', recipe: !!f.recipe,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function del(id) {
    if (!confirm('Delete this food from the counter?')) return;
    await fetch('/api/admin/calorie-foods?id=' + id, { method: 'DELETE' });
    load();
  }

  // One-click: prefill the form from a user request, then mark it added on save.
  const [approving, setApproving] = useState(null);
  function approve(r) {
    setApproving(r.id);
    setEditing(null);
    setForm({ ...emptyFood, name: r.food_name, note: r.details || '', serving: '1 serving' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveApproved(e) {
    e.preventDefault();
    await save(e);
    if (approving) {
      await fetch('/api/admin/food-requests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: approving, status: 'added' }) });
      setApproving(null);
      load();
    }
  }

  async function dismiss(id, status) {
    if (status === 'dismissed' && !confirm('Dismiss this request?')) return;
    if (status === 'delete') {
      if (!confirm('Delete this request?')) return;
      await fetch('/api/admin/food-requests?id=' + id, { method: 'DELETE' });
    } else {
      await fetch('/api/admin/food-requests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    }
    load();
  }

  const shown = foods.filter((f) => !filter || f.name.toLowerCase().includes(filter.toLowerCase()));
  const num = (k, ph) => (
    <input className="border rounded-xl px-3 py-2 text-sm" type="number" step="any" min="0" placeholder={ph} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <form onSubmit={approving ? saveApproved : save} className="bg-white rounded-2xl shadow-soft p-6 flex flex-col gap-2.5">
          <p className="font-display font-bold text-lg">{editing ? 'Edit food' : approving ? 'Add requested food' : 'New food'} 🍛</p>
          {approving && <p className="text-xs text-fresh font-bold">Approving a user request — saving marks it as added.</p>}
          <input className="border rounded-xl px-3 py-2.5 text-sm" placeholder="Name — e.g. Chingri bhorta" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Serving — e.g. 1 cup" value={form.serving} onChange={(e) => setForm({ ...form, serving: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {num('grams', 'Grams')} {num('kcal', 'kcal')} {num('protein', 'Protein g')}
            {num('carbs', 'Carbs g')} {num('fat', 'Fat g')} {num('fiber', 'Fibre g')}
          </div>
          <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Bangla names, comma separated (optional)" value={form.bn} onChange={(e) => setForm({ ...form, bn: e.target.value })} />
          <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Search terms (optional)" value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
          <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={form.recipe} onChange={(e) => setForm({ ...form, recipe: e.target.checked })} /> Values vary by recipe</label>
          <div className="flex gap-2">
            <button className="flex-1 py-2.5 rounded-xl bg-fresh text-white text-sm font-bold">{editing ? 'Save changes' : 'Add to counter'}</button>
            {(editing || approving) && <button type="button" onClick={() => { setEditing(null); setApproving(null); setForm(emptyFood); }} className="px-4 py-2.5 rounded-xl border text-sm">Cancel</button>}
          </div>
          {msg && <p className="text-sm">{msg}</p>}
        </form>

        <div className="bg-white rounded-2xl shadow-soft p-6">
          <p className="font-display font-bold">Food requests inbox ({requests.filter((r) => r.status === 'pending').length} pending)</p>
          <div className="flex flex-col gap-2 mt-3 max-h-[420px] overflow-auto">
            {requests.map((r) => (
              <div key={r.id} className={`border rounded-xl p-3 ${r.status === 'pending' ? 'border-fresh/50 bg-fresh-light/20' : ''}`}>
                <p className="font-semibold text-sm">{r.food_name} <span className="font-normal text-xs text-stone-400">• {r.status}</span></p>
                {r.details && <p className="text-xs text-stone-500 mt-0.5">{r.details}</p>}
                <div className="flex gap-2 mt-2">
                  {r.status === 'pending' && <button onClick={() => approve(r)} className="text-xs font-bold px-3 py-1.5 rounded-full bg-fresh text-white">Add →</button>}
                  {r.status === 'pending' && <button onClick={() => dismiss(r.id, 'dismissed')} className="text-xs font-bold px-3 py-1.5 rounded-full border">Dismiss</button>}
                  <button onClick={() => dismiss(r.id, 'delete')} className="text-xs font-bold px-3 py-1.5 rounded-full border text-red-600">Delete</button>
                </div>
              </div>
            ))}
            {requests.length === 0 && <p className="text-sm text-stone-500">No requests yet.</p>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-6">
        <div className="flex items-center gap-3">
          <p className="font-display font-bold">Counter foods ({foods.length})</p>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter…" className="border rounded-xl px-3 py-1.5 text-sm" />
        </div>
        <div className="grid md:grid-cols-2 gap-2 mt-3 max-h-[420px] overflow-auto">
          {shown.map((f) => (
            <div key={f.id} className="border rounded-xl p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{f.name} <span className="font-normal text-stone-400">• {f.kcal} kcal</span></p>
                <p className="text-xs text-stone-500">{f.category} • {f.serving}</p>
              </div>
              <button onClick={() => edit(f)} className="text-xs font-bold px-3 py-1.5 rounded-full border">Edit</button>
              <button onClick={() => del(f.id)} className="text-xs font-bold px-3 py-1.5 rounded-full border text-red-600">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
