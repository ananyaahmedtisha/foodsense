'use client';
import { useEffect, useState } from 'react';

const scopes = ['all', 'article', 'poster', 'video'];

export default function CategoryManager() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [scope, setScope] = useState('article');
  const [msg, setMsg] = useState('');

  async function load() {
    const j = await fetch('/api/admin/categories').then((r) => r.json());
    setItems(j.items || []);
    if (j.needsMigration) setMsg('Run supabase/migration_v2.sql in Supabase SQL Editor first.');
  }
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    const res = await fetch('/api/admin/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), scope }) });
    const j = await res.json();
    if (j.ok) { setName(''); load(); } else setMsg('Error: ' + j.error);
  }

  async function rename(it) {
    const v = prompt('Rename segment:', it.name);
    if (!v || v === it.name) return;
    await fetch('/api/admin/categories', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: it.id, name: v }) });
    load();
  }

  async function del(id) {
    if (!confirm('Delete this segment? Articles using it keep their old label.')) return;
    await fetch('/api/admin/categories?id=' + id, { method: 'DELETE' });
    load();
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <form onSubmit={add} className="bg-white rounded-2xl shadow-soft p-6 flex flex-col gap-3">
        <p className="font-display font-bold text-lg">Segments / Types 🏷️</p>
        <p className="text-sm text-stone-500">Used as category chips in Articles, Posters, Videos.</p>
        <input className="border rounded-xl px-3 py-2.5" placeholder="New segment e.g. Gut Health" value={name} onChange={(e) => setName(e.target.value)} required />
        <select className="border rounded-xl px-3 py-2.5 text-sm" value={scope} onChange={(e) => setScope(e.target.value)}>
          {scopes.map((s) => <option key={s} value={s}>{s === 'all' ? 'Everywhere' : s}</option>)}
        </select>
        <button className="py-3 rounded-xl bg-fresh text-white font-bold">Add segment</button>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <p className="font-display font-bold">All segments ({items.length})</p>
        <div className="flex flex-col gap-2 mt-3">
          {items.map((it) => (
            <div key={it.id} className="border rounded-xl p-3 flex items-center gap-3">
              <div className="flex-1">
                <p className="font-semibold text-sm">{it.name}</p>
                <p className="text-xs text-stone-500">{it.scope}</p>
              </div>
              <button onClick={() => rename(it)} className="text-xs font-bold px-3 py-1.5 rounded-full border">Rename</button>
              <button onClick={() => del(it.id)} className="text-xs font-bold px-3 py-1.5 rounded-full border text-red-600">Delete</button>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-stone-500">None yet.</p>}
        </div>
      </div>
    </div>
  );
}
