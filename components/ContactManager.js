'use client';
import { useEffect, useState } from 'react';

const empty = { email: '', phone: '', address: '', hours: '', facebook: '', instagram: '', about: '' };

export default function ContactManager() {
  const [form, setForm] = useState(empty);
  const [msgs, setMsgs] = useState([]);
  const [msg, setMsg] = useState('');

  async function load() {
    const [s, m] = await Promise.all([
      fetch('/api/admin/settings').then((r) => r.json()),
      fetch('/api/admin/messages').then((r) => r.json()).catch(() => ({ items: [] })),
    ]);
    if (s.info) setForm({ ...empty, ...s.info });
    setMsgs(m.items || []);
    if (m.needsMigration) setMsg('Run supabase/migration_v2.sql in Supabase SQL Editor to enable the inbox.');
  }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setMsg('Saving…');
    const res = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const j = await res.json();
    setMsg(j.ok ? 'Contact page updated.' : 'Error: ' + j.error);
  }

  async function del(id) {
    if (!confirm('Delete this message?')) return;
    await fetch('/api/admin/messages?id=' + id, { method: 'DELETE' });
    load();
  }

  const field = (k, ph) => (
    <input className="border rounded-xl px-3 py-2.5 text-sm" placeholder={ph} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
  );

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <form onSubmit={save} className="bg-white rounded-2xl shadow-soft p-6 flex flex-col gap-3">
        <p className="font-display font-bold text-lg">Contact page ✉️</p>
        <textarea className="border rounded-xl px-3 py-2.5 text-sm" rows={3} placeholder="Short intro line" value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} />
        {field('email', 'Email')}
        {field('phone', 'Phone (optional)')}
        {field('address', 'Address e.g. Merul Badda, Dhaka')}
        {field('hours', 'Hours e.g. Sat-Thu, 10am-6pm')}
        {field('facebook', 'Facebook URL (optional)')}
        {field('instagram', 'Instagram URL (optional)')}
        <button className="py-3 rounded-xl bg-fresh text-white font-bold">Save contact info</button>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <p className="font-display font-bold">Inbox ({msgs.length})</p>
        <div className="flex flex-col gap-2 mt-3 max-h-[600px] overflow-auto">
          {msgs.map((m) => (
            <div key={m.id} className="border rounded-xl p-3">
              <p className="font-semibold text-sm">{m.name} <span className="font-normal text-stone-500">{m.email}</span></p>
              <p className="text-sm text-stone-600 mt-1 whitespace-pre-wrap">{m.message}</p>
              <button onClick={() => del(m.id)} className="text-xs font-bold px-3 py-1.5 rounded-full border text-red-600 mt-2">Delete</button>
            </div>
          ))}
          {msgs.length === 0 && <p className="text-sm text-stone-500">No messages yet.</p>}
        </div>
      </div>
    </div>
  );
}
