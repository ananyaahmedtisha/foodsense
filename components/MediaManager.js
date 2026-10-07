'use client';
import { useEffect, useState } from 'react';
import UploadField from './UploadField';

const empty = { title: '', media_type: 'poster', file_url: '', category: '' };

export default function MediaManager() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState('poster');

  async function load() {
    const [m, c] = await Promise.all([
      fetch('/api/admin/media').then((r) => r.json()),
      fetch('/api/admin/categories').then((r) => r.json()).catch(() => ({ items: [] })),
    ]);
    setItems(m.items || []);
    setCats((c.items || []).map((x) => ({ name: x.name, scope: x.scope })));
  }
  useEffect(() => { load(); }, []);

  const scopeCats = cats.filter((c) => c.scope === (form.media_type === 'poster' ? 'poster' : 'video') || c.scope === 'all').map((c) => c.name);
  const shown = items.filter((i) => i.media_type === tab);

  async function save(e) {
    e.preventDefault();
    setMsg('Saving…');
    const res = await fetch('/api/admin/media', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing ? { ...form, id: editing } : { ...form, media_type: tab }),
    });
    const j = await res.json();
    if (j.ok) { setMsg('Saved.'); setForm(empty); setEditing(null); load(); }
    else setMsg('Error: ' + j.error);
  }

  function edit(it) {
    setEditing(it.id);
    setTab(it.media_type);
    setForm({ title: it.title, media_type: it.media_type, file_url: it.file_url || '', category: it.category || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function del(id) {
    if (!confirm('Delete this item?')) return;
    await fetch('/api/admin/media?id=' + id, { method: 'DELETE' });
    load();
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <form onSubmit={save} className="bg-white rounded-2xl shadow-soft p-6 flex flex-col gap-3">
        <p className="font-display font-bold text-lg">{editing ? 'Edit item' : 'New item'} 🖼️</p>
        <div className="flex gap-2">
          {['poster', 'video'].map((t) => (
            <button type="button" key={t} onClick={() => { setForm((f) => ({ ...f, media_type: t, file_url: '', category: '' })); setTab(t); }}
              className={`px-4 py-2 rounded-full text-sm border ${tab === t ? 'bg-stone-900 text-white' : ''}`}>
              {t === 'poster' ? 'Awareness poster' : 'Video'}
            </button>
          ))}
        </div>
        <input className="border rounded-xl px-3 py-2.5" placeholder={tab === 'poster' ? 'Poster title e.g. Danger Zone 4-60C' : 'Video title'} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        {tab === 'poster' ? (
          <>
            <p className="text-sm font-semibold">Poster file (image or PDF) — awareness posters only</p>
            <UploadField folder="posters" accept="image/*,.pdf" value={form.file_url?.startsWith('http') ? (form.file_url.match(/\.(jpg|jpeg|png|webp|gif)/i) ? form.file_url : '') : form.file_url} onUploaded={(u) => setForm((f) => ({ ...f, file_url: u }))} label="Upload poster file" />
            <input className="border rounded-xl px-3 py-2.5 text-sm" placeholder="Or paste file URL instead" value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} required />
          </>
        ) : (
          <>
            <p className="text-sm font-semibold">Video file or external link (YouTube etc.)</p>
            <UploadField folder="videos" accept="video/*" value={form.file_url?.match(/\.(mp4|webm)/i) ? form.file_url : ''} onUploaded={(u) => setForm((f) => ({ ...f, file_url: u }))} label="Upload video file (optional)" />
            <input className="border rounded-xl px-3 py-2.5 text-sm" placeholder="https://… video or YouTube URL" value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} required />
          </>
        )}
        {scopeCats.length > 0 && (
          <select className="border rounded-xl px-3 py-2.5 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">No segment</option>
            {scopeCats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <div className="flex gap-2">
          <button className="flex-1 py-3 rounded-xl bg-fresh text-white font-bold">{editing ? 'Save changes' : 'Add to gallery'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm(empty); }} className="px-4 py-3 rounded-xl border">Cancel</button>}
        </div>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <div className="flex gap-2">
          {['poster', 'video'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-full text-sm border ${tab === t ? 'bg-stone-900 text-white' : ''}`}>{t}s ({items.filter((i) => i.media_type === t).length})</button>
          ))}
        </div>
        <div className="flex flex-col gap-2 mt-3 max-h-[600px] overflow-auto">
          {shown.map((it) => (
            <div key={it.id} className="border rounded-xl p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{it.title}</p>
                <p className="text-xs text-stone-500">{it.category || 'no segment'} • {it.download_count || 0} downloads</p>
              </div>
              <button onClick={() => edit(it)} className="text-xs font-bold px-3 py-1.5 rounded-full border">Edit</button>
              <button onClick={() => del(it.id)} className="text-xs font-bold px-3 py-1.5 rounded-full border text-red-600">Delete</button>
            </div>
          ))}
          {shown.length === 0 && <p className="text-sm text-stone-500">Nothing here yet.</p>}
        </div>
      </div>
    </div>
  );
}
