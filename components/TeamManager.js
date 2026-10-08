'use client';
import { useEffect, useState } from 'react';
import UploadField from './UploadField';

const empty = { name: '', role: 'Contributor', bio: '', image_url: '', display_order: 0, linkedin: '', github: '', facebook: '', instagram: '' };

export default function TeamManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');
  const [copy, setCopy] = useState({ intro: '', mission: '', team_title: '' });
  const [copyMsg, setCopyMsg] = useState('');

  async function load() {
    const [t, s] = await Promise.all([
      fetch('/api/admin/team').then((r) => r.json()),
      fetch('/api/admin/settings?key=about').then((r) => r.json()).catch(() => ({})),
    ]);
    setItems(t.items || []);
    if (s.value) setCopy({ intro: s.value.intro || '', mission: s.value.mission || '', team_title: s.value.team_title || '' });
  }
  useEffect(() => { load(); }, []);

  async function saveCopy(e) {
    e.preventDefault();
    setCopyMsg('Saving…');
    const res = await fetch('/api/admin/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'about', value: copy }),
    });
    const j = await res.json();
    setCopyMsg(j.ok ? 'Page text updated.' : 'Error: ' + j.error);
  }

  async function save(e) {
    e.preventDefault();
    setMsg('Saving…');
    const res = await fetch('/api/admin/team', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing ? { ...form, id: editing } : form),
    });
    const j = await res.json();
    if (j.ok) { setMsg('Saved.'); setForm(empty); setEditing(null); load(); }
    else setMsg('Error: ' + j.error);
  }

  function edit(it) {
    setEditing(it.id);
    setForm({ name: it.name, role: it.role, bio: it.bio || '', image_url: it.image_url || '', display_order: it.display_order || 0, linkedin: it.linkedin || '', github: it.github || '', facebook: it.facebook || '', instagram: it.instagram || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function del(id) {
    if (!confirm('Remove this member?')) return;
    await fetch('/api/admin/team?id=' + id, { method: 'DELETE' });
    load();
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={saveCopy} className="bg-white rounded-2xl shadow-soft p-6 flex flex-col gap-3">
        <p className="font-display font-bold text-lg">About page text ✏️</p>
        <label className="text-sm font-semibold">Intro (under the title)
          <textarea className="block w-full border rounded-xl px-3 py-2.5 mt-1 font-normal" rows={2} value={copy.intro} onChange={(e) => setCopy({ ...copy, intro: e.target.value })} />
        </label>
        <label className="text-sm font-semibold">Our mission
          <textarea className="block w-full border rounded-xl px-3 py-2.5 mt-1 font-normal" rows={3} value={copy.mission} onChange={(e) => setCopy({ ...copy, mission: e.target.value })} />
        </label>
        <label className="text-sm font-semibold">Team section heading
          <input className="block w-full border rounded-xl px-3 py-2.5 mt-1 font-normal" value={copy.team_title} onChange={(e) => setCopy({ ...copy, team_title: e.target.value })} />
        </label>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-bold">Save page text</button>
          {copyMsg && <span className="text-sm">{copyMsg}</span>}
        </div>
      </form>
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <form onSubmit={save} className="bg-white rounded-2xl shadow-soft p-6 flex flex-col gap-3">
        <p className="font-display font-bold text-lg">{editing ? 'Edit member' : 'Add member'} 👥</p>
        <UploadField folder="team" value={form.image_url} onUploaded={(u) => setForm((f) => ({ ...f, image_url: u }))} label="Upload headshot photo" />
        <input className="border rounded-xl px-3 py-2.5" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="border rounded-xl px-3 py-2.5" placeholder="Role e.g. Founder, Web Developer" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required />
        <textarea className="border rounded-xl px-3 py-2.5" rows={3} placeholder="Short bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        <input className="border rounded-xl px-3 py-2.5" type="number" placeholder="Display order" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
        <p className="text-sm font-semibold mt-1">Profile links (optional)</p>
        <div className="grid grid-cols-2 gap-2">
          <input className="border rounded-xl px-3 py-2 text-sm" placeholder="LinkedIn URL" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
          <input className="border rounded-xl px-3 py-2 text-sm" placeholder="GitHub URL" value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} />
          <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Facebook URL" value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} />
          <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Instagram URL" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
        </div>
        <div className="flex gap-2">
          <button className="flex-1 py-3 rounded-xl bg-fresh text-white font-bold">{editing ? 'Save changes' : 'Add member'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm(empty); }} className="px-4 py-3 rounded-xl border">Cancel</button>}
        </div>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <p className="font-display font-bold">Contributors ({items.length})</p>
        <div className="flex flex-col gap-2 mt-3">
          {items.map((it) => (
            <div key={it.id} className="border rounded-xl p-3 flex items-center gap-3">
              {it.image_url ? <img src={it.image_url} alt="" className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-cream grid place-items-center font-bold">{it.name[0]}</div>}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{it.name}</p>
                <p className="text-xs text-stone-500">{it.role} • order {it.display_order}</p>
              </div>
              <button onClick={() => edit(it)} className="text-xs font-bold px-3 py-1.5 rounded-full border">Edit</button>
              <button onClick={() => del(it.id)} className="text-xs font-bold px-3 py-1.5 rounded-full border text-red-600">Remove</button>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-stone-500">No members yet.</p>}
        </div>
      </div>
    </div>
    </div>
  );
}
