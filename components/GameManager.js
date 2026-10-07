'use client';
import { useEffect, useState } from 'react';

const empty = { game_key: 'redflag', prompt: '', verdict: 'red', explanation: '', cost: '', emoji: '' };

export default function GameManager() {
  const [tab, setTab] = useState('redflag');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');

  async function load(key) {
    const j = await fetch('/api/admin/games?key=' + (key || tab)).then((r) => r.json());
    setItems(j.items || []);
    if (j.needsMigration) setMsg('Run supabase/migration_v2.sql in Supabase SQL Editor first.');
  }
  useEffect(() => { load(tab); }, [tab]);

  function switchTab(t) {
    setTab(t);
    setForm({ ...empty, game_key: t });
    setEditing(null);
    load(t);
  }

  async function save(e) {
    e.preventDefault();
    const payload = {
      game_key: tab,
      prompt: form.prompt,
      explanation: form.explanation,
      display_order: items.length,
      ...(tab === 'redflag' ? { verdict: form.verdict } : { meta: { cost: form.cost, emoji: form.emoji } }),
    };
    const res = await fetch('/api/admin/games', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing ? { ...payload, id: editing } : payload),
    });
    const j = await res.json();
    if (j.ok) { setMsg('Saved.'); setForm({ ...empty, game_key: tab }); setEditing(null); load(tab); }
    else setMsg('Error: ' + j.error);
  }

  function edit(it) {
    setEditing(it.id);
    setForm({
      game_key: tab, prompt: it.prompt,
      verdict: it.verdict || 'red', explanation: it.explanation || '',
      cost: it.meta?.cost || '', emoji: it.meta?.emoji || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function toggle(it) {
    await fetch('/api/admin/games', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: it.id, is_active: !it.is_active }) });
    load(tab);
  }

  async function del(id) {
    if (!confirm('Delete this card?')) return;
    await fetch('/api/admin/games?id=' + id, { method: 'DELETE' });
    load(tab);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <form onSubmit={save} className="bg-white rounded-2xl shadow-soft p-6 flex flex-col gap-3">
        <div className="flex gap-2">
          <button type="button" onClick={() => switchTab('redflag')} className={`px-4 py-2 rounded-full text-sm border ${tab === 'redflag' ? 'bg-stone-900 text-white' : ''}`}>Red Flag / Green Flag</button>
          <button type="button" onClick={() => switchTab('fuel')} className={`px-4 py-2 rounded-full text-sm border ${tab === 'fuel' ? 'bg-stone-900 text-white' : ''}`}>Budget Bite Builder</button>
        </div>
        <p className="text-xs text-stone-500">
          {tab === 'redflag'
            ? 'Cards rotate automatically every day, so the game stays fresh even without edits.'
            : 'Staple + upgrade cards. Prompt = staple name, Explanation = the upgrade tip.'}
        </p>
        <input className="border rounded-xl px-3 py-2.5" placeholder={tab === 'redflag' ? 'Habit e.g. Defrosting chicken on the counter' : 'Staple e.g. Instant Noodles (৳30)'} value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} required />
        {tab === 'redflag' ? (
          <select className="border rounded-xl px-3 py-2.5 text-sm" value={form.verdict} onChange={(e) => setForm({ ...form, verdict: e.target.value })}>
            <option value="red">Red flag (risky)</option>
            <option value="green">Green flag (safe)</option>
          </select>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded-xl px-3 py-2.5 text-sm" placeholder="Cost e.g. +৳15" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            <input className="border rounded-xl px-3 py-2.5 text-sm" placeholder="Emoji e.g. 🥬" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
          </div>
        )}
        <textarea className="border rounded-xl px-3 py-2.5" rows={4} placeholder="Explanation shown after the tap (plain language)" value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} required />
        <div className="flex gap-2">
          <button className="flex-1 py-3 rounded-xl bg-fresh text-white font-bold">{editing ? 'Save changes' : 'Add card'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({ ...empty, game_key: tab }); }} className="px-4 py-3 rounded-xl border">Cancel</button>}
        </div>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <p className="font-display font-bold">Cards ({items.length})</p>
        <div className="flex flex-col gap-2 mt-3 max-h-[600px] overflow-auto">
          {items.map((it) => (
            <div key={it.id} className="border rounded-xl p-3">
              <p className="font-semibold text-sm">{it.verdict === 'red' ? '🚩 ' : it.verdict === 'green' ? '🟩 ' : ''}{it.prompt}</p>
              <p className="text-xs text-stone-500 truncate">{it.explanation}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => edit(it)} className="text-xs font-bold px-3 py-1.5 rounded-full border">Edit</button>
                <button onClick={() => toggle(it)} className="text-xs font-bold px-3 py-1.5 rounded-full border">{it.is_active ? 'Hide' : 'Show'}</button>
                <button onClick={() => del(it.id)} className="text-xs font-bold px-3 py-1.5 rounded-full border text-red-600">Delete</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-stone-500">No cards yet — add the first one.</p>}
        </div>
      </div>
    </div>
  );
}
