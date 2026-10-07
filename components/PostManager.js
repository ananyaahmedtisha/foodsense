'use client';
import { useEffect, useState } from 'react';
import UploadField from './UploadField';

const empty = { title: '', slug: '', category: '', excerpt: '', content: '', cover_image_url: '', published: true };

export default function PostManager() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');

  async function load() {
    const [p, c] = await Promise.all([
      fetch('/api/admin/posts').then((r) => r.json()),
      fetch('/api/admin/categories').then((r) => r.json()).catch(() => ({ items: [] })),
    ]);
    setItems(p.items || []);
    const names = (c.items || []).filter((x) => x.scope === 'article' || x.scope === 'all').map((x) => x.name);
    setCats(names.length ? names : ['Hostel Storage', 'Label Reading', 'Microbe Safety', 'Nutrition']);
    if (!form.category && names.length) setForm((f) => ({ ...f, category: names[0] }));
  }
  useEffect(() => { load(); }, []);

  function onTitle(v) {
    setForm((f) => ({ ...f, title: v, slug: editing ? f.slug : v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) }));
  }

  async function save(e) {
    e.preventDefault();
    setMsg('Saving…');
    const url = '/api/admin/posts';
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing ? { ...form, id: editing } : form),
    });
    const j = await res.json();
    if (j.ok) { setMsg(editing ? 'Updated.' : 'Published.'); setForm(empty); setEditing(null); load(); }
    else setMsg('Error: ' + (j.error || 'failed'));
  }

  function edit(it) {
    setEditing(it.id);
    setForm({ title: it.title, slug: it.slug, category: it.category, excerpt: it.excerpt || '', content: it.content || '', cover_image_url: it.cover_image_url || '', published: it.published });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function del(id) {
    if (!confirm('Delete this article?')) return;
    await fetch('/api/admin/posts?id=' + id, { method: 'DELETE' });
    load();
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <form onSubmit={save} className="bg-white rounded-2xl shadow-soft p-6 flex flex-col gap-3">
        <p className="font-display font-bold text-lg">{editing ? 'Edit article' : 'New article'} 📝</p>
        <input className="border rounded-xl px-3 py-2.5" placeholder="Title" value={form.title} onChange={(e) => onTitle(e.target.value)} required />
        <div className="flex gap-2 items-center text-sm">
          <span className="text-stone-500">Slug:</span><code className="bg-cream px-2 py-1 rounded">{form.slug || 'auto'}</code>
        </div>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button type="button" key={c} onClick={() => setForm((f) => ({ ...f, category: c }))} className={`px-3 py-1.5 rounded-full text-sm border ${form.category === c ? 'bg-stone-900 text-white' : ''}`}>{c}</button>
          ))}
        </div>
        <p className="text-xs text-stone-400">Manage segments in Admin → Categories.</p>
        <UploadField folder="covers" value={form.cover_image_url} onUploaded={(u) => setForm((f) => ({ ...f, cover_image_url: u }))} label="Attach cover picture (optional)" />
        <input className="border rounded-xl px-3 py-2.5" placeholder="Short excerpt (1 line)" value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} />
        <textarea className="border rounded-xl px-3 py-2.5" rows={7} placeholder="Article body — plain language." value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} required />
        <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} /> Published</label>
        <div className="flex gap-2">
          <button className="flex-1 py-3 rounded-xl bg-fresh text-white font-bold">{editing ? 'Save changes' : 'Publish article'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm(empty); }} className="px-4 py-3 rounded-xl border">Cancel</button>}
        </div>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <p className="font-display font-bold">All articles ({items.length})</p>
        <div className="flex flex-col gap-2 mt-3 max-h-[600px] overflow-auto">
          {items.map((it) => (
            <div key={it.id} className="border rounded-xl p-3 flex items-center gap-3">
              {it.cover_image_url && <img src={it.cover_image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{it.title}</p>
                <p className="text-xs text-stone-500">{it.category} • {it.published ? 'Live' : 'Draft'}</p>
              </div>
              <button onClick={() => edit(it)} className="text-xs font-bold px-3 py-1.5 rounded-full border">Edit</button>
              <button onClick={() => del(it.id)} className="text-xs font-bold px-3 py-1.5 rounded-full border text-red-600">Delete</button>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-stone-500">No articles yet.</p>}
        </div>
      </div>
    </div>
  );
}
